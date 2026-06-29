"""
Classifieur d'intentions basé sur les embeddings BERT/DistilBERT
=================================================================
Architecture : sentence-transformers/all-MiniLM-L6-v2 (DistilBERT distillé)
               + Régression Logistique sur les embeddings sémantiques.

Remplace l'ancien pipeline TF-IDF + Naive Bayes pour une meilleure
compréhension sémantique (CDC — stack technique IA).
"""

import pickle
import os
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report

from donnees_intentions import donnees

MODELE_PATH    = os.path.join(os.path.dirname(__file__), "modele_intentions.pkl")
NOM_MODELE_BERT = "sentence-transformers/all-MiniLM-L6-v2"


class ClassifieurBERT:
    """
    Classifieur sémantique d'intentions.
    Encode les questions via un modèle BERT/DistilBERT (MiniLM),
    puis prédit l'intention avec une Régression Logistique.
    Compatible avec l'interface sklearn : predict() / predict_proba().
    """

    def __init__(self, nom_modele: str = NOM_MODELE_BERT):
        self.nom_modele = nom_modele
        self._encoder   = None
        self.classifieur = LogisticRegression(max_iter=1000, C=5.0, random_state=42)

    @property
    def encoder(self):
        if self._encoder is None:
            self._encoder = SentenceTransformer(self.nom_modele)
        return self._encoder

    def __getstate__(self):
        state = self.__dict__.copy()
        state["_encoder"] = None
        return state

    def fit(self, textes, labels):
        embeddings = self.encoder.encode(textes, show_progress_bar=True,
                                         convert_to_numpy=True)
        self.classifieur.fit(embeddings, labels)
        return self

    def predict(self, textes):
        embeddings = self.encoder.encode(list(textes), convert_to_numpy=True)
        return self.classifieur.predict(embeddings)

    def predict_proba(self, textes):
        embeddings = self.encoder.encode(list(textes), convert_to_numpy=True)
        return self.classifieur.predict_proba(embeddings)


def entrainer():
    textes = [d[0] for d in donnees]
    labels = [d[1] for d in donnees]

    X_train, X_test, y_train, y_test = train_test_split(
        textes, labels, test_size=0.25, random_state=42, stratify=labels
    )

    print(f"Modèle BERT   : {NOM_MODELE_BERT}")
    print(f"Entraînement  : {len(X_train)} exemples")
    print(f"Test          : {len(X_test)} exemples\n")

    modele = ClassifieurBERT()
    modele.fit(X_train, y_train)

    predictions = modele.predict(X_test)
    accuracy    = accuracy_score(y_test, predictions)
    f1          = f1_score(y_test, predictions, average="weighted")

    print(f"Accuracy : {accuracy:.2%}")
    print(f"F1-Score : {f1:.2%}")
    print("\nDétail par catégorie :")
    print(classification_report(y_test, predictions, zero_division=0))

    print("Réentraînement sur toutes les données...")
    modele.fit(textes, labels)

    with open(MODELE_PATH, "wb") as f:
        pickle.dump(modele, f)
    print(f"Modèle sauvegardé → {MODELE_PATH}")


if __name__ == "__main__":
    entrainer()
