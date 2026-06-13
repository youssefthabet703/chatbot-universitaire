from pymongo import MongoClient

# Connexion au MongoDB local (port par défaut 27017)
client = MongoClient("mongodb://localhost:27017")

# Notre base de données pour le projet
db_mongo = client["chatbot_db"]

# Collections MongoDB
collection_cours       = db_mongo["cours"]
collection_faq         = db_mongo["faq"]
collection_orientation = db_mongo["orientation"]