from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import schemas
from typing import Optional
from datetime import date

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
        mot_de_passe=utilisateur.mot_de_passe,
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