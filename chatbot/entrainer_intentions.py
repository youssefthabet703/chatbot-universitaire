import pickle
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report

from donnees_intentions import donnees

MODELE_PATH = os.path.join(os.path.dirname(__file__), "modele_intentions.pkl")


def entrainer():
    textes = [d[0] for d in donnees]
    labels = [d[1] for d in donnees]

    # Séparer en entraînement (80%) et test (20%)
    X_train, X_test, y_train, y_test = train_test_split(
        textes, labels, test_size=0.25, random_state=42, stratify=labels
    )

    # Pipeline : TF-IDF (transforme le texte en chiffres) + Naive Bayes (classe)
    modele = Pipeline([
        ("tfidf", TfidfVectorizer()),
        ("nb", MultinomialNB()),
    ])

    modele.fit(X_train, y_train)

    # Évaluation
    predictions = modele.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    f1 = f1_score(y_test, predictions, average="weighted")

    print(f"Accuracy : {accuracy:.2%}")
    print(f"F1-Score : {f1:.2%}")
    print("\nDétail par catégorie :")
    print(classification_report(y_test, predictions, zero_division=0))

    # Réentraîner sur TOUTES les données et sauvegarder
    modele.fit(textes, labels)
    with open(MODELE_PATH, "wb") as f:
        pickle.dump(modele, f)
    print(f"Modèle sauvegardé dans {MODELE_PATH}")


if __name__ == "__main__":
    entrainer()