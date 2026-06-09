from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import mongo
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import schemas
from typing import Optional
from datetime import date
import auth
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chatbot IA Universitaire")


@app.get("/")
def accueil():
    return {"message": "L'API du chatbot universitaire fonctionne !"}


@app.post("/utilisateurs", response_model=schemas.UtilisateurLire)
def creer_utilisateur(utilisateur: schemas.UtilisateurCreer, db: Session = Depends(get_db)):
    existe = db.query(models.Utilisateur).filter(models.Utilisateur.email == utilisateur.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    nouvel_utilisateur = models.Utilisateur(
        nom=utilisateur.nom,
        email=utilisateur.email,
        mot_de_passe=auth.chiffrer_mot_de_passe(utilisateur.mot_de_passe),
        role=utilisateur.role,
    )
    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)
    return nouvel_utilisateur


@app.get("/utilisateurs", response_model=list[schemas.UtilisateurLire])
def lister_utilisateurs(db: Session = Depends(get_db)):
    return db.query(models.Utilisateur).all()
@app.post("/seances", response_model=schemas.SeanceLire)
def creer_seance(seance: schemas.SeanceCreer, db: Session = Depends(get_db)):
    nouvelle_seance = models.Seance(**seance.dict())
    db.add(nouvelle_seance)
    db.commit()
    db.refresh(nouvelle_seance)
    return nouvelle_seance


@app.get("/seances", response_model=list[schemas.SeanceLire])
def lister_seances(
    groupe: Optional[str] = None,
    enseignant: Optional[str] = None,
    date_seance: Optional[date] = None,
    db: Session = Depends(get_db),
):
    requete = db.query(models.Seance)
    if groupe:
        requete = requete.filter(models.Seance.groupe == groupe)
    if enseignant:
        requete = requete.filter(models.Seance.enseignant == enseignant)
    if date_seance:
        requete = requete.filter(models.Seance.date_seance == date_seance)
    return requete.all()
@app.post("/connexion", response_model=schemas.TokenReponse)
def connexion(donnees: schemas.ConnexionDemande, db: Session = Depends(get_db)):
    utilisateur = db.query(models.Utilisateur).filter(
        models.Utilisateur.email == donnees.email
    ).first()

    if not utilisateur or not auth.verifier_mot_de_passe(donnees.mot_de_passe, utilisateur.mot_de_passe):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    token = auth.creer_token({"sub": str(utilisateur.id), "role": utilisateur.role})
    return {"access_token": token, "token_type": "bearer"}
def utilisateur_courant(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    donnees = auth.lire_token(token)
    if donnees is None:
        raise HTTPException(status_code=401, detail="Jeton invalide ou expiré")
    utilisateur = db.query(models.Utilisateur).filter(
        models.Utilisateur.id == int(donnees.get("sub"))
    ).first()
    if utilisateur is None:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return utilisateur


@app.get("/moi", response_model=schemas.UtilisateurLire)
def lire_mon_profil(utilisateur: models.Utilisateur = Depends(utilisateur_courant)):
    return utilisateur
@app.post("/token", response_model=schemas.TokenReponse)
def token(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    utilisateur = db.query(models.Utilisateur).filter(
        models.Utilisateur.email == form.username
    ).first()
    if not utilisateur or not auth.verifier_mot_de_passe(form.password, utilisateur.mot_de_passe):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = auth.creer_token({"sub": str(utilisateur.id), "role": utilisateur.role})
    return {"access_token": token, "token_type": "bearer"}
@app.post("/cours")
def creer_cours(cours: schemas.CoursCreer):
    resultat = mongo.collection_cours.insert_one(cours.dict())
    return {"id": str(resultat.inserted_id), "message": "Cours ajouté"}


@app.get("/cours")
def lister_cours():
    cours = []
    for doc in mongo.collection_cours.find():
        doc["_id"] = str(doc["_id"])
        cours.append(doc)
    return cours


@app.post("/faq")
def creer_faq(faq: schemas.FaqCreer):
    resultat = mongo.collection_faq.insert_one(faq.dict())
    return {"id": str(resultat.inserted_id), "message": "FAQ ajoutée"}


@app.get("/faq")
def lister_faq():
    faqs = []
    for doc in mongo.collection_faq.find():
        doc["_id"] = str(doc["_id"])
        faqs.append(doc)
    return faqs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)