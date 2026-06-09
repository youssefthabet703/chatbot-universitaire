import os
import pickle
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_mistralai import ChatMistralAI
from database import SessionLocal
import models

load_dotenv()

# Chemin vers la base vectorielle (dans le dossier chatbot)
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "chatbot", "chroma_db")

# Chemin vers le classifieur d'intentions
MODELE_INTENTIONS = os.path.join(os.path.dirname(__file__), "..", "chatbot", "modele_intentions.pkl")

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectordb = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)
llm = ChatMistralAI(model="mistral-small-latest", temperature=0.2)

# Charger le classifieur d'intentions
with open(MODELE_INTENTIONS, "rb") as f:
    classifieur_intentions = pickle.load(f)

PROMPT_SYSTEME = """Tu es l'assistant virtuel d'une université. Tu réponds aux questions des étudiants concernant les cours, les emplois du temps et les démarches administratives.

Règles importantes :
- Réponds UNIQUEMENT à partir des informations fournies dans le contexte ci-dessous.
- Si l'information n'est pas dans le contexte, dis clairement : "Je ne dispose pas de cette information." Ne l'invente jamais.
- Réponds de manière claire, polie et concise, en français.

Contexte :
{contexte}

Question de l'étudiant : {question}

Réponse :"""


def detecter_intention(question: str) -> str:
    return classifieur_intentions.predict([question])[0]

def chercher_emploi_du_temps():
    db = SessionLocal()
    seances = db.query(models.Seance).all()
    db.close()
    if not seances:
        return ""
    lignes = []
    for s in seances:
        lignes.append(
            f"{s.matiere} ({s.type_seance}) avec {s.enseignant}, "
            f"salle {s.salle}, groupe {s.groupe}, "
            f"le {s.date_seance} de {s.heure_debut} à {s.heure_fin}."
        )
    return "\n".join(lignes)

def repondre(question: str) -> dict:
    intention = detecter_intention(question)

    # Routage selon l'intention
    if intention == "emploi_du_temps":
        contexte = chercher_emploi_du_temps()
    else:
        resultats = vectordb.similarity_search(question, k=3)
        contexte = "\n\n".join([doc.page_content for doc in resultats])

    prompt = PROMPT_SYSTEME.format(contexte=contexte, question=question)
    reponse = llm.invoke(prompt)

    return {"reponse": reponse.content, "intention": intention}