import os
import pickle
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_mistralai import ChatMistralAI
from database import SessionLocal
import models
import mongo

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


def detecter_intention(question: str) -> tuple:
    intention = classifieur_intentions.predict([question])[0]
    try:
        probas = classifieur_intentions.predict_proba([question])[0]
        confiance = round(float(max(probas)) * 100, 1)
    except AttributeError:
        confiance = None
    return intention, confiance

def chercher_emploi_du_temps(groupe: str = None):
    db = SessionLocal()
    requete = db.query(models.Seance)
    if groupe:
        requete = requete.filter(models.Seance.groupe == groupe)
    seances = requete.all()
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

MOTS_CLES_INTENTION = {
    "orientation": ["orientation", "filière", "spécialité", "master", "licence", "formation", "parcours"],
    "faq_administrative": ["inscription", "bourse", "carte", "bibliothèque", "scolarité", "attestation"],
    "cours": ["cours", "module", "programme", "syllabus", "contenu"],
}

def chercher_faq_mongo(intention: str, question: str) -> str:
    mots = MOTS_CLES_INTENTION.get(intention, [])
    regex = "|".join(mots) if mots else question.split()[0]
    docs = list(mongo.collection_faq.find(
        {"$or": [
            {"question": {"$regex": regex, "$options": "i"}},
            {"reponse":  {"$regex": regex, "$options": "i"}},
            {"categorie": intention},
        ]},
        {"_id": 0, "question": 1, "reponse": 1}
    ).limit(3))
    if not docs:
        return ""
    return "\n\n".join(f"Q: {d['question']}\nR: {d['reponse']}" for d in docs)


def repondre(question: str, utilisateur=None) -> dict:
    intention, confiance = detecter_intention(question)

    if intention == "emploi_du_temps":
        groupe = utilisateur.groupe if utilisateur else None
        contexte = chercher_emploi_du_temps(groupe=groupe)

    elif intention == "orientation":
        # Recherche filtrée sur la base de connaissances des filières
        resultats = vectordb.similarity_search(
            question, k=4,
            filter={"source": "orientation"}
        )
        contexte = "\n\n".join([doc.page_content for doc in resultats])
        # Fallback MongoDB si ChromaDB n'a pas encore été réindexé
        if not contexte:
            faq_contexte = chercher_faq_mongo(intention, question)
            contexte = faq_contexte or ""

    else:
        # Recherche vectorielle générale (cours, FAQ)
        resultats = vectordb.similarity_search(question, k=3)
        contexte = "\n\n".join([doc.page_content for doc in resultats])

        # Complément FAQ MongoDB si résultats trop courts
        if len(contexte) < 200:
            faq_contexte = chercher_faq_mongo(intention, question)
            if faq_contexte:
                contexte = faq_contexte if not contexte else contexte + "\n\n" + faq_contexte

    prompt = PROMPT_SYSTEME.format(contexte=contexte, question=question)
    try:
        reponse = llm.invoke(prompt)
        texte_reponse = reponse.content
    except Exception:
        texte_reponse = "Le service est momentanément indisponible. Veuillez réessayer dans quelques instants."

    return {"reponse": texte_reponse, "intention": intention, "confiance": confiance}