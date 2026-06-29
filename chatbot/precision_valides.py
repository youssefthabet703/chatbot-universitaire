"""
Calcule la précision du classifieur d'intentions sur les questions VALIDES
seules (sans les pièges, sans appeler l'API Mistral — juste le classifieur).
"""
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
import rag
from evaluation import QUESTIONS_VALIDES

ok = 0
total = len(QUESTIONS_VALIDES)
erreurs = []

for question, intention_attendue in QUESTIONS_VALIDES:
    intention, confiance = rag.detecter_intention(question)
    correct = (intention == intention_attendue)
    if correct:
        ok += 1
    else:
        erreurs.append((question, intention_attendue, intention))

print("=" * 60)
print(f"  PRÉCISION SUR LES {total} QUESTIONS VALIDES")
print("=" * 60)
print(f"  Correctes : {ok}/{total}")
print(f"  Précision : {ok/total:.1%}")
print()
if erreurs:
    print("  Erreurs de classification :")
    for q, attendu, predit in erreurs:
        print(f"    ✗ '{q}'")
        print(f"       attendu={attendu}  prédit={predit}")
else:
    print("  Aucune erreur — classification parfaite sur les valides !")
print("=" * 60)