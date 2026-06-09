import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

import rag

# ============================================================
# Jeu de test : (question, intention_attendue, reponse_existe)
# reponse_existe = False => question piège (l'info n'est PAS dans la base)
# ============================================================
jeu_de_test = [
    # Questions avec réponse attendue (FAQ / cours)
    ("Comment m'inscrire à la bibliothèque ?", "faq", True),
    ("Quelle est la date limite pour les bourses ?", "faq", True),
    ("Où se trouve le service de scolarité ?", "faq", True),
    ("Comment accéder au wifi du campus ?", "faq", True),
    ("Résume le cours de réseaux", "cours", True),
    ("Quels sont les prérequis du cours de programmation web ?", "cours", True),
    ("De quoi parle le module de génie logiciel ?", "cours", True),
    ("Quel est le contenu du cours de base de données ?", "cours", True),

    # Questions d'intention (classification)
    ("Quel est mon prochain cours ?", "emploi_du_temps", False),
    ("Quels cours ai-je vendredi ?", "emploi_du_temps", False),
    ("Quelles filières si j'aime l'intelligence artificielle ?", "orientation", True),
    ("Quels débouchés après l'informatique ?", "orientation", True),

    # QUESTIONS PIÈGES : la réponse n'existe PAS dans la base
    ("Quel est le prix du parking de l'université ?", "faq", False),
    ("Qui est le président de l'université ?", "faq", False),
    ("Y a-t-il une piscine sur le campus ?", "faq", False),
    ("Quel est le menu du restaurant universitaire aujourd'hui ?", "faq", False),
    ("Combien coûte un café à la cafétéria ?", "faq", False),
    ("Quelle est la capitale de la France ?", "faq", False),
    ("Donne-moi la recette de la pizza", "faq", False),
    ("Quel temps fait-il aujourd'hui ?", "faq", False),
]


def est_refus(reponse):
    """Détecte si le chatbot a refusé de répondre (anti-hallucination)."""
    indices = ["ne dispose pas", "je ne sais pas", "aucune information",
               "pas d'information", "ne peux pas", "n'ai pas"]
    return any(ind in reponse.lower() for ind in indices)


def evaluer():
    total = len(jeu_de_test)
    intentions_correctes = 0
    pieges_total = 0
    pieges_bien_geres = 0

    print("=" * 60)
    print("ÉVALUATION DU CHATBOT")
    print("=" * 60)

    for question, intention_attendue, reponse_existe in jeu_de_test:
        resultat = rag.repondre(question)
        reponse = resultat["reponse"]
        intention = resultat["intention"]

        # 1. Vérifier l'intention
        intention_ok = (intention == intention_attendue)
        if intention_ok:
            intentions_correctes += 1

        # 2. Vérifier l'anti-hallucination sur les pièges
        if not reponse_existe:
            pieges_total += 1
            if est_refus(reponse):
                pieges_bien_geres += 1

        print(f"\nQ : {question}")
        print(f"   Intention : {intention} (attendu : {intention_attendue}) {'OK' if intention_ok else 'X'}")
        print(f"   Réponse : {reponse[:80]}...")

    print("\n" + "=" * 60)
    print("RÉSULTATS")
    print("=" * 60)
    print(f"Précision des intentions : {intentions_correctes}/{total} = {intentions_correctes/total:.1%}")
    if pieges_total > 0:
        taux_hallucination = 1 - (pieges_bien_geres / pieges_total)
        print(f"Questions pièges bien gérées : {pieges_bien_geres}/{pieges_total}")
        print(f"Taux d'hallucination : {taux_hallucination:.1%}")
    print("=" * 60)


if __name__ == "__main__":
    evaluer()