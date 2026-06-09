import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_mistralai import ChatMistralAI

# Charger la clé API depuis le .env du dossier backend
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")

# Charger les embeddings et la base vectorielle
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectordb = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)

# Le modèle de langage Mistral
llm = ChatMistralAI(model="mistral-small-latest", temperature=0.2)

# Le prompt système qui encadre le comportement du chatbot
PROMPT_SYSTEME = """Tu es l'assistant virtuel d'une université. Tu réponds aux questions des étudiants concernant les cours, les emplois du temps et les démarches administratives.

Règles importantes :
- Réponds UNIQUEMENT à partir des informations fournies dans le contexte ci-dessous.
- Si l'information n'est pas dans le contexte, dis clairement : "Je ne dispose pas de cette information." Ne l'invente jamais.
- Réponds de manière claire, polie et concise, en français.

Contexte :
{contexte}

Question de l'étudiant : {question}

Réponse :"""


def repondre(question):
    # 1. Chercher les passages pertinents dans ChromaDB
    resultats = vectordb.similarity_search(question, k=3)
    contexte = "\n\n".join([doc.page_content for doc in resultats])

    # 2. Construire le prompt complet
    prompt = PROMPT_SYSTEME.format(contexte=contexte, question=question)

    # 3. Demander à Mistral de répondre
    reponse = llm.invoke(prompt)
    return reponse.content


if __name__ == "__main__":
    print("=== Chatbot Universitaire (tapez 'quitter' pour sortir) ===\n")
    while True:
        question = input("Votre question : ")
        if question.lower() in ["quitter", "exit", "quit"]:
            break
        reponse = repondre(question)
        print(f"\nChatbot : {reponse}\n")