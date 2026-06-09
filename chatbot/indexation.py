import sys
import os

# Permet d'importer les fichiers du dossier backend
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

import mongo
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document


# Dossier où ChromaDB stockera les embeddings
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")


def construire_documents():
    documents = []

    # 1. Les cours
    for cours in mongo.collection_cours.find():
        texte = f"Cours : {cours['titre']} (module {cours['module']}, {cours['semestre']}, enseignant {cours['enseignant']}). {cours['contenu']}"
        documents.append(Document(
            page_content=texte,
            metadata={"source": "cours", "titre": cours["titre"], "module": cours["module"]}
        ))

    # 2. Les FAQ
    for faq in mongo.collection_faq.find():
        texte = f"Question : {faq['question']} Réponse : {faq['reponse']}"
        documents.append(Document(
            page_content=texte,
            metadata={"source": "faq", "categorie": faq.get("categorie", "general")}
        ))

    return documents


def indexer():
    print("Lecture des données depuis MongoDB...")
    documents = construire_documents()
    print(f"{len(documents)} documents à indexer.")

    print("Chargement du modèle d'embeddings (peut prendre un moment la 1ère fois)...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    print("Création de la base vectorielle ChromaDB...")
    vectordb = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=CHROMA_DIR
    )

    print(f"Indexation terminée ! {len(documents)} documents stockés dans ChromaDB.")


if __name__ == "__main__":
    indexer()