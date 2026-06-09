# Assistant Conversationnel Universitaire (RAG)

Plateforme web universitaire avec un assistant conversationnel fonde sur l'architecture RAG. L'etudiant peut consulter son emploi du temps, ses cours, et poser des questions a un chatbot qui repond a partir des donnees reelles, sans inventer.

Projet Integre de Developpement - ESPRIM, 4e annee Data Science (4DS2) - 2025-2026. Realise par Thabet Youssef, encadre par M. Abdelkarim Mars et M. Nafaa Haffar.

## Fonctionnalites
- Authentification securisee (bcrypt, JWT)
- Consultation emploi du temps (PostgreSQL) et cours (MongoDB)
- Assistant RAG repondant a partir des donnees reelles
- Classification d'intentions (emploi du temps, cours, orientation, FAQ)
- Anti-hallucination : refuse d'inventer
- Tableau de bord avec statistiques

## Architecture
Trois couches : React (frontend) / FastAPI (backend) / PostgreSQL + MongoDB + ChromaDB (donnees).

Pipeline : classification d'intention (TF-IDF + Naive Bayes), routage vers PostgreSQL ou ChromaDB, generation par le LLM Mistral avec consigne stricte.

## Technologies
React, Vite, FastAPI, SQLAlchemy, PyMongo, JWT, bcrypt, LangChain, ChromaDB, sentence-transformers, Mistral AI, scikit-learn, PostgreSQL, MongoDB.

## Resultats de l'evaluation
- Exactitude classification : 96,7 pourcent (objectif > 90)
- Score F1 : 96,7 pourcent (objectif > 88)
- Taux d'hallucination : 0 pourcent (objectif < 5)

## Lancement
Backend : cd backend, venv\Scripts\activate, uvicorn main:app --reload --port 8001
Frontend : cd frontend, npm run dev
Interface : http://localhost:5173 - API : http://localhost:8001/docs

## Licence
Projet academique - ESPRIM, Projet Integre de Developpement.
