import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_mistralai import ChatMistralAI

load_dotenv()

# Chemin vers la base vectorielle (dans le dossier chatbot)
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "chatbot", "chroma_db")

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectordb = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)
llm = ChatMistralAI(model="mistral-small-latest", temperature=0.2)

PROMPT_SYSTEME = """Tu es l'assistant virtuel d'une université. Tu réponds aux questions des étudiants concernant les cours, les emplois du temps et les démarches administratives.

Règles importantes :
- Réponds UNIQUEMENT à partir des informations fournies dans le contexte ci-dessous.
- Si l'information n'est pas dans le contexte, dis clairement : "Je ne dispose pas de cette information." Ne l'invente jamais.
- Réponds de manière claire, polie et concise, en français.

Contexte :
{contexte}

Question de l'étudiant : {question}

Réponse :"""


def repondre(question: str) -> str:
    resultats = vectordb.similarity_search(question, k=3)
    contexte = "\n\n".join([doc.page_content for doc in resultats])
    prompt = PROMPT_SYSTEME.format(contexte=contexte, question=question)
    reponse = llm.invoke(prompt)
    return reponse.content