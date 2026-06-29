"""
Entraînement du classifieur d'intentions (BERT/DistilBERT + Régression Logistique).
La classe ClassifieurBERT est définie dans classifieur.py pour être réutilisable
(notamment par le backend lors du chargement du modèle).
"""

import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report

from donnees_intentions import donnees
from classifieur import ClassifieurBERT, NOM_MODELE_BERT

MODELE_PATH = os.path.join(os.path.dirname(__file__), "modele_intentions.pkl")


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
    accuracy = accuracy_score(y_test, predictions)
    f1 = f1_score(y_test, predictions, average="weighted")

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