"""
Peuple la collection MongoDB 'orientation' avec les filières de l'université.
Exécuter UNE SEULE FOIS (ou après avoir vidé la collection).
Usage : python chatbot/peupler_orientation.py
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

import mongo

FILIERES = [
    {
        "filiere": "Licence Informatique",
        "niveau": "Licence (Bac+3)",
        "duree": "3 ans",
        "prerequis": "Baccalauréat scientifique ou technique. Bonnes bases en mathématiques et logique. Aucune connaissance préalable en programmation requise.",
        "debouches": "Développeur web, technicien informatique, administrateur systèmes, analyste support, poursuite en master informatique.",
        "competences": "Algorithmique, programmation (Python, Java, C), bases de données relationnelles, réseaux, systèmes d'exploitation, développement web.",
        "poursuite": "Master Data Science, Master Génie Logiciel, Master Réseaux & Sécurité, écoles d'ingénieurs.",
        "points_forts": "Formation généraliste solide, grande polyvalence, forte demande sur le marché du travail.",
    },
    {
        "filiere": "Master Data Science et Intelligence Artificielle",
        "niveau": "Master (Bac+5)",
        "duree": "2 ans",
        "prerequis": "Licence en informatique, mathématiques appliquées ou statistiques. Maîtrise de Python et des mathématiques (algèbre linéaire, probabilités, statistiques).",
        "debouches": "Data scientist, machine learning engineer, data analyst, ingénieur IA, chercheur en apprentissage automatique, consultant data.",
        "competences": "Machine learning, deep learning, Python (scikit-learn, TensorFlow, PyTorch), traitement de données massives (Spark, Hadoop), visualisation (Matplotlib, Tableau), NLP.",
        "poursuite": "Doctorat en informatique, écoles d'ingénieurs, startups IA.",
        "points_forts": "Domaine en plein essor, salaires élevés, applicable à tous les secteurs (santé, finance, industrie).",
    },
    {
        "filiere": "Master Génie Logiciel",
        "niveau": "Master (Bac+5)",
        "duree": "2 ans",
        "prerequis": "Licence en informatique. Bonne maîtrise de la programmation orientée objet et des structures de données.",
        "debouches": "Ingénieur logiciel, architecte logiciel, chef de projet informatique, développeur senior, scrum master, lead developer.",
        "competences": "UML, design patterns, méthodes agiles (Scrum, Kanban), tests logiciels, DevOps (CI/CD, Docker), Java avancé, microservices, Spring Boot.",
        "poursuite": "Doctorat, création d'entreprise tech, postes d'architecte en grandes entreprises.",
        "points_forts": "Forte demande en entreprises, évolution vers des postes d'encadrement, bonne rémunération.",
    },
    {
        "filiere": "Master Réseaux et Télécommunications",
        "niveau": "Master (Bac+5)",
        "duree": "2 ans",
        "prerequis": "Licence en informatique ou télécommunications. Bases solides en réseaux (modèle OSI, TCP/IP) et systèmes.",
        "debouches": "Administrateur réseau, ingénieur télécoms, consultant infrastructure, architecte réseau, responsable NOC.",
        "competences": "Routage et commutation (Cisco, Juniper), réseaux sans fil (WiFi, 4G/5G), virtualisation (VMware, VirtualBox), SDN, VoIP, MPLS.",
        "poursuite": "Certifications Cisco (CCNA, CCNP), master spécialisé, postes d'architecte infrastructure.",
        "points_forts": "Secteur stable avec forte demande, certifications reconnues mondialement, travail sur des infrastructures critiques.",
    },
    {
        "filiere": "Master Cybersécurité",
        "niveau": "Master (Bac+5)",
        "duree": "2 ans",
        "prerequis": "Licence en informatique ou réseaux. Bonne maîtrise des systèmes Linux, des protocoles réseau et de la programmation.",
        "debouches": "Analyste sécurité, pentesteur, RSSI, ingénieur SOC, consultant cybersécurité, répondeur aux incidents (CSIRT).",
        "competences": "Cryptographie, analyse de malware, tests d'intrusion (Kali Linux, Metasploit), gestion des identités, normes ISO 27001, forensics.",
        "poursuite": "Certifications (CEH, OSCP, CISSP), doctorat, agences gouvernementales de sécurité.",
        "points_forts": "Domaine en forte croissance, pénurie mondiale d'experts, salaires très élevés.",
    },
    {
        "filiere": "Master Systèmes d'Information et Management",
        "niveau": "Master (Bac+5)",
        "duree": "2 ans",
        "prerequis": "Licence en informatique, gestion ou systèmes d'information. Intérêt pour la gestion de projet et les systèmes d'entreprise.",
        "debouches": "Chef de projet SI, consultant ERP (SAP, Oracle), analyste fonctionnel, directeur informatique (DSI), business analyst.",
        "competences": "ERP (SAP, Odoo), gestion de projet (MS Project, PMP), BPM, modélisation des processus, gouvernance IT, ITIL.",
        "poursuite": "MBA, certifications PMP / PRINCE2, postes de direction.",
        "points_forts": "Interface entre technique et management, forte valorisation en entreprise, passerelle vers des postes de direction.",
    },
    {
        "filiere": "Master Cloud Computing et DevOps",
        "niveau": "Master (Bac+5)",
        "duree": "2 ans",
        "prerequis": "Licence en informatique. Maîtrise de Linux, de la virtualisation et d'au moins un langage de scripting (Python, Bash).",
        "debouches": "Ingénieur DevOps, architecte cloud, SRE (Site Reliability Engineer), ingénieur infrastructure, consultant AWS/Azure/GCP.",
        "competences": "Docker, Kubernetes, Terraform, Ansible, AWS, Azure, Google Cloud, CI/CD (Jenkins, GitLab CI), monitoring (Prometheus, Grafana).",
        "poursuite": "Certifications cloud (AWS Solutions Architect, Azure Administrator), postes d'architecte.",
        "points_forts": "Forte demande mondiale, télétravail facilité, compétences très valorisées par les startups et grandes entreprises.",
    },
    {
        "filiere": "Licence Mathématiques Appliquées et Informatique",
        "niveau": "Licence (Bac+3)",
        "duree": "3 ans",
        "prerequis": "Baccalauréat scientifique avec bonnes notes en mathématiques. Aptitude pour le raisonnement abstrait.",
        "debouches": "Analyste quantitatif, développeur d'algorithmes, poursuite en master Data Science ou recherche, actuariat.",
        "competences": "Algèbre linéaire, analyse numérique, probabilités, statistiques, R, Python, MATLAB, optimisation.",
        "poursuite": "Master Data Science, Master Mathématiques, écoles d'ingénieurs, doctorat en mathématiques.",
        "points_forts": "Bases scientifiques très solides, grande polyvalence, débouchés dans la finance quantitative et l'IA.",
    },
    {
        "filiere": "Ingéniorat en Informatique (Cycle Ingénieur)",
        "niveau": "Diplôme d'Ingénieur (Bac+5)",
        "duree": "5 ans (prépa 2 ans + cycle ingénieur 3 ans)",
        "prerequis": "Baccalauréat scientifique avec mention. Concours d'entrée sur dossier ou concours national.",
        "debouches": "Ingénieur informatique, chef de projet, architecte système, consultant, entrepreneur tech. Tous secteurs confondus.",
        "competences": "Programmation avancée, génie logiciel, réseaux, IA, systèmes embarqués, gestion de projet, soft skills.",
        "poursuite": "Doctorat, MBA, création d'entreprise, postes de direction technique.",
        "points_forts": "Diplôme le plus valorisé sur le marché, polyvalence maximale, accès aux postes de direction dès les premières années.",
    },
    {
        "filiere": "Master Traitement du Signal et Intelligence Artificielle",
        "niveau": "Master (Bac+5)",
        "duree": "2 ans",
        "prerequis": "Licence en informatique, électronique ou mathématiques. Bases en signal, probabilités et programmation.",
        "debouches": "Ingénieur traitement du signal, chercheur IA, ingénieur vision par ordinateur, développeur NLP, ingénieur audio/vidéo.",
        "competences": "Traitement d'images (OpenCV), traitement audio, deep learning (CNN, RNN, Transformers), MATLAB, Python, traitement de la parole.",
        "poursuite": "Doctorat en informatique ou signal, laboratoires de recherche, entreprises de défense ou médecine.",
        "points_forts": "Très porteur pour la recherche et les applications industrielles (voiture autonome, reconnaissance faciale, médecine).",
    },
    {
        "filiere": "DUT Informatique de Gestion",
        "niveau": "DUT (Bac+2)",
        "duree": "2 ans",
        "prerequis": "Baccalauréat (toutes séries acceptées, scientifique ou économique préféré). Intérêt pour l'informatique et la gestion.",
        "debouches": "Technicien informatique, assistant chef de projet, développeur junior, support utilisateur, gestionnaire de bases de données.",
        "competences": "Bureautique avancée, bases de données (Access, MySQL), développement web basique, gestion de projet élémentaire, comptabilité informatisée.",
        "poursuite": "Licence professionnelle, Licence informatique (passerelle L2 ou L3), poursuite directe en emploi.",
        "points_forts": "Formation courte et pratique, insertion rapide dans l'emploi, bonne passerelle vers des études longues.",
    },
    {
        "filiere": "Licence Professionnelle Développement Web et Mobile",
        "niveau": "Licence Pro (Bac+3)",
        "duree": "1 an après un BTS/DUT ou 3 ans depuis le bac",
        "prerequis": "DUT informatique, BTS SIO ou équivalent. Maîtrise de HTML/CSS et notions de programmation.",
        "debouches": "Développeur web front-end, développeur mobile (iOS/Android), intégrateur web, développeur full-stack junior.",
        "competences": "HTML5, CSS3, JavaScript (React, Vue.js), PHP (Laravel), développement mobile (Flutter, React Native), bases de données MySQL.",
        "poursuite": "Master Génie Logiciel, Master Systèmes d'Information, auto-entrepreneuriat en développement web.",
        "points_forts": "Formation très pratique et opérationnelle, forte demande du marché, possibilité de freelance.",
    },
]

def peupler():
    col = mongo.collection_orientation
    existants = col.count_documents({})
    if existants > 0:
        print(f"La collection 'orientation' contient déjà {existants} documents.")
        rep = input("Vider et repeupler ? (o/N) : ").strip().lower()
        if rep != "o":
            print("Annulé.")
            return
        col.delete_many({})
        print("Collection vidée.")

    resultat = col.insert_many(FILIERES)
    print(f"{len(resultat.inserted_ids)} filières insérées dans MongoDB.")


if __name__ == "__main__":
    peupler()
