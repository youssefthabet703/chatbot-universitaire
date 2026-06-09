from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import schemas

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