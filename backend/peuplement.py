from datetime import date, time
from database import SessionLocal, engine
import models
import mongo

# ============================================================
# 1. SEANCES (PostgreSQL)
# ============================================================
seances = [
    {"matiere": "Base de Données", "enseignant": "Mme Trabelsi", "salle": "B204",
     "groupe": "L3-INFO-G1", "type_seance": "CM", "date_seance": date(2026, 6, 15),
     "heure_debut": time(8, 30), "heure_fin": time(10, 0)},
    {"matiere": "Algorithmique", "enseignant": "M. Karray", "salle": "A101",
     "groupe": "L3-INFO-G1", "type_seance": "TD", "date_seance": date(2026, 6, 16),
     "heure_debut": time(14, 0), "heure_fin": time(15, 30)},
    {"matiere": "Réseaux", "enseignant": "M. Ben Salah", "salle": "C302",
     "groupe": "L3-INFO-G1", "type_seance": "CM", "date_seance": date(2026, 6, 17),
     "heure_debut": time(10, 15), "heure_fin": time(11, 45)},
    {"matiere": "Systèmes d'Exploitation", "enseignant": "Mme Gharbi", "salle": "B204",
     "groupe": "L3-INFO-G1", "type_seance": "TP", "date_seance": date(2026, 6, 18),
     "heure_debut": time(8, 30), "heure_fin": time(11, 30)},
    {"matiere": "Génie Logiciel", "enseignant": "M. Hamdi", "salle": "A105",
     "groupe": "L3-INFO-G1", "type_seance": "CM", "date_seance": date(2026, 6, 19),
     "heure_debut": time(13, 0), "heure_fin": time(14, 30)},

    # ── L3-INFO-G2 ──────────────────────────────────────────────────────────
    {"matiere": "Réseaux", "enseignant": "M. Ben Salah", "salle": "C303",
     "groupe": "L3-INFO-G2", "type_seance": "CM", "date_seance": date(2026, 6, 15),
     "heure_debut": time(10, 15), "heure_fin": time(11, 45)},
    {"matiere": "Base de Données", "enseignant": "Mme Trabelsi", "salle": "B205",
     "groupe": "L3-INFO-G2", "type_seance": "TD", "date_seance": date(2026, 6, 16),
     "heure_debut": time(8, 30), "heure_fin": time(10, 0)},
    {"matiere": "Algorithmique", "enseignant": "M. Karray", "salle": "Labo1",
     "groupe": "L3-INFO-G2", "type_seance": "TP", "date_seance": date(2026, 6, 17),
     "heure_debut": time(14, 0), "heure_fin": time(15, 30)},
    {"matiere": "Génie Logiciel", "enseignant": "M. Hamdi", "salle": "A106",
     "groupe": "L3-INFO-G2", "type_seance": "CM", "date_seance": date(2026, 6, 18),
     "heure_debut": time(10, 15), "heure_fin": time(11, 45)},
    {"matiere": "Systèmes d'Exploitation", "enseignant": "Mme Gharbi", "salle": "B205",
     "groupe": "L3-INFO-G2", "type_seance": "TD", "date_seance": date(2026, 6, 19),
     "heure_debut": time(8, 30), "heure_fin": time(10, 0)},
]

# ============================================================
# 2. COURS (MongoDB)
# ============================================================
cours = [
    {"titre": "Introduction aux Bases de Données", "module": "Base de Données", "semestre": "S5",
     "enseignant": "Mme Trabelsi",
     "contenu": "Ce cours présente les concepts fondamentaux des bases de données relationnelles : le modèle relationnel, les clés primaires et étrangères, le langage SQL, la normalisation des tables (1NF, 2NF, 3NF) et les transactions ACID. Les travaux pratiques portent sur PostgreSQL."},
    {"titre": "Structures de Données et Algorithmes", "module": "Algorithmique", "semestre": "S5",
     "enseignant": "M. Karray",
     "contenu": "Étude des structures de données fondamentales : tableaux, listes chaînées, piles, files, arbres et graphes. Analyse de la complexité algorithmique (notation grand O). Algorithmes de tri (tri rapide, tri fusion) et de recherche. Le TP de la semaine 3 porte sur l'implémentation d'une pile."},
    {"titre": "Réseaux Informatiques", "module": "Réseaux", "semestre": "S5",
     "enseignant": "M. Ben Salah",
     "contenu": "Le modèle OSI et le modèle TCP/IP. Adressage IP, routage, protocoles de transport (TCP, UDP). Notions de commutation et de réseaux locaux (Ethernet, Wi-Fi). Prérequis : notions de base en systèmes. La sécurité réseau est abordée en fin de semestre."},
    {"titre": "Systèmes d'Exploitation", "module": "Systèmes d'Exploitation", "semestre": "S5",
     "enseignant": "Mme Gharbi",
     "contenu": "Gestion des processus et des threads, ordonnancement du processeur, gestion de la mémoire (pagination, mémoire virtuelle), systèmes de fichiers et synchronisation. Les TP utilisent le système Linux et la programmation en C."},
    {"titre": "Génie Logiciel", "module": "Génie Logiciel", "semestre": "S5",
     "enseignant": "M. Hamdi",
     "contenu": "Cycle de vie du logiciel, méthodes agiles (Scrum), modélisation UML, tests logiciels et gestion de versions avec Git. Le projet de fin de module consiste à développer une application en équipe en suivant une démarche agile."},
    {"titre": "Programmation Web", "module": "Développement Web", "semestre": "S6",
     "enseignant": "M. Karray",
     "contenu": "Développement web moderne : HTML, CSS, JavaScript, et frameworks front-end comme React. Côté serveur, introduction aux API REST et aux bases de données. Prérequis : Programmation orientée objet et Bases de Données."},
    {"titre": "Langue Française", "module": "Français", "semestre": "S5",
     "enseignant": "M. Ahmed",
     "contenu": "Étude des fondements de la langue française et de l'expression écrite et orale. Maîtrise de la grammaire (classes grammaticales, fonctions syntaxiques, accords), de la conjugaison (modes, temps, concordance) et de l'orthographe lexicale et grammaticale. Enrichissement du vocabulaire et étude des registres de langue. Techniques de la communication écrite professionnelle : rédaction de comptes rendus, de rapports, de lettres et de courriels formels. Analyse et synthèse de documents : résumé, dissertation, commentaire de texte. Initiation à l'expression orale : prise de parole en public, argumentation, présentation de projets et techniques de soutenance. Étude de textes littéraires et de leur contexte. Ce cours vise à développer les compétences linguistiques et communicationnelles essentielles à la réussite académique et à l'insertion professionnelle."},
]

# ============================================================
# 3. FAQ (MongoDB)
# ============================================================
faq = [
    {"question": "Comment s'inscrire à la bibliothèque ?",
     "reponse": "Rendez-vous au guichet d'accueil de la bibliothèque avec votre carte étudiante. L'inscription est gratuite et donne accès au prêt de documents et aux salles de travail.",
     "categorie": "bibliotheque"},
    {"question": "Quelle est la date limite d'inscription aux bourses ?",
     "reponse": "Les demandes de bourses doivent être déposées avant le 31 octobre de chaque année universitaire, via le portail du service social étudiant.",
     "categorie": "bourses"},
    {"question": "Où se trouve le service de scolarité ?",
     "reponse": "Le service de scolarité est situé au rez-de-chaussée du bâtiment administratif A, bureau 012. Il est ouvert du lundi au vendredi de 9h à 16h.",
     "categorie": "scolarite"},
    {"question": "Comment obtenir un certificat de scolarité ?",
     "reponse": "Le certificat de scolarité peut être téléchargé depuis votre espace étudiant en ligne, rubrique « Mes documents », ou retiré au service de scolarité sur présentation de la carte étudiante.",
     "categorie": "scolarite"},
    {"question": "Quand ont lieu les examens du semestre ?",
     "reponse": "Les examens du second semestre se déroulent généralement durant les deux dernières semaines de juin. Le calendrier précis est publié sur le portail étudiant un mois à l'avance.",
     "categorie": "examens"},
    {"question": "Comment justifier une absence ?",
     "reponse": "Toute absence doit être justifiée dans un délai de 48 heures auprès du service de scolarité, en fournissant un justificatif (certificat médical, convocation officielle, etc.).",
     "categorie": "scolarite"},
    {"question": "Comment accéder au Wi-Fi du campus ?",
     "reponse": "Le réseau Wi-Fi du campus est accessible avec vos identifiants étudiants (les mêmes que pour l'espace numérique de travail). Sélectionnez le réseau « Campus-Etudiants » et connectez-vous.",
     "categorie": "informatique"},
    {"question": "Où récupérer mon emploi du temps ?",
     "reponse": "Votre emploi du temps est consultable à tout moment sur le portail étudiant et via l'assistant conversationnel de l'université.",
     "categorie": "scolarite"},
]


def peupler():
    db = SessionLocal()

    # Création des tables si besoin
    models.Base.metadata.create_all(bind=engine)

    # --- Séances ---
    db.query(models.Seance).delete()  # on vide d'abord pour éviter les doublons
    for s in seances:
        db.add(models.Seance(**s))
    db.commit()
    print(f"{len(seances)} séances insérées dans PostgreSQL.")
    db.close()

    # --- Cours ---
    mongo.collection_cours.delete_many({})  # on vide d'abord
    mongo.collection_cours.insert_many(cours)
    print(f"{len(cours)} cours insérés dans MongoDB.")

    # --- FAQ ---
    mongo.collection_faq.delete_many({})  # on vide d'abord
    mongo.collection_faq.insert_many(faq)
    print(f"{len(faq)} FAQ insérées dans MongoDB.")

    print("Peuplement terminé !")


if __name__ == "__main__":
    peupler()