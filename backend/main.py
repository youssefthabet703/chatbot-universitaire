from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import mongo
import rag
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import schemas
from typing import Optional
from datetime import date, datetime
import auth
from bson import ObjectId
import os
import shutil
import uuid

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chatbot IA Universitaire")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== DÉPENDANCES D'AUTHENTIFICATION =====

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


def verifier_enseignant(utilisateur: models.Utilisateur = Depends(utilisateur_courant)):
    if utilisateur.role not in ("enseignant", "admin"):
        raise HTTPException(status_code=403, detail="Accès réservé aux enseignants")
    return utilisateur


def verifier_admin(utilisateur: models.Utilisateur = Depends(utilisateur_courant)):
    if utilisateur.role != "admin":
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return utilisateur


# ===== ROUTES =====

@app.get("/")
def accueil():
    return {"message": "L'API du chatbot universitaire fonctionne !"}


@app.post("/token", response_model=schemas.TokenReponse)
def token(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    utilisateur = db.query(models.Utilisateur).filter(
        models.Utilisateur.email == form.username
    ).first()
    if not utilisateur or not auth.verifier_mot_de_passe(form.password, utilisateur.mot_de_passe):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    token = auth.creer_token({"sub": str(utilisateur.id), "role": utilisateur.role})
    return {"access_token": token, "token_type": "bearer"}



@app.get("/moi", response_model=schemas.UtilisateurLire)
def lire_mon_profil(utilisateur: models.Utilisateur = Depends(utilisateur_courant)):
    return utilisateur


@app.patch("/moi", response_model=schemas.UtilisateurLire)
def mettre_a_jour_profil(
    donnees: schemas.ProfilMiseAJour,
    utilisateur: models.Utilisateur = Depends(utilisateur_courant),
    db: Session = Depends(get_db),
):
    if donnees.matieres is not None:
        utilisateur.matieres = donnees.matieres
    db.commit()
    db.refresh(utilisateur)
    return utilisateur


@app.post("/utilisateurs", response_model=schemas.UtilisateurLire)
def creer_utilisateur(utilisateur: schemas.UtilisateurCreer, db: Session = Depends(get_db)):
    existe = db.query(models.Utilisateur).filter(models.Utilisateur.email == utilisateur.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    nouvel_utilisateur = models.Utilisateur(
        nom=utilisateur.nom,
        email=utilisateur.email,
        mot_de_passe=auth.chiffrer_mot_de_passe(utilisateur.mot_de_passe),
        role="etudiant",
        groupe=utilisateur.groupe,
    )
    db.add(nouvel_utilisateur)
    db.commit()
    db.refresh(nouvel_utilisateur)
    return nouvel_utilisateur


@app.get("/utilisateurs", response_model=list[schemas.UtilisateurLire])
def lister_utilisateurs(
    _: models.Utilisateur = Depends(verifier_enseignant),
    db: Session = Depends(get_db),
):
    return db.query(models.Utilisateur).all()



@app.get("/etudiants", response_model=list[schemas.UtilisateurLire])
def lister_etudiants(
    _: models.Utilisateur = Depends(verifier_enseignant),
    db: Session = Depends(get_db),
):
    return db.query(models.Utilisateur).filter(models.Utilisateur.role == "etudiant").all()


@app.get("/admin/utilisateurs", response_model=list[schemas.UtilisateurLire])
def lister_tous_utilisateurs(
    _: models.Utilisateur = Depends(verifier_admin),
    db: Session = Depends(get_db),
):
    return db.query(models.Utilisateur).all()


@app.patch("/admin/utilisateurs/{utilisateur_id}/role", response_model=schemas.UtilisateurLire)
def changer_role_utilisateur(
    utilisateur_id: int,
    donnees: schemas.RoleMiseAJour,
    _: models.Utilisateur = Depends(verifier_admin),
    db: Session = Depends(get_db),
):
    if donnees.role not in ("etudiant", "enseignant"):
        raise HTTPException(status_code=400, detail="Rôle invalide : 'etudiant' ou 'enseignant'")
    utilisateur = db.query(models.Utilisateur).filter(models.Utilisateur.id == utilisateur_id).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if utilisateur.role == "admin":
        raise HTTPException(status_code=403, detail="Impossible de modifier le rôle d'un administrateur")
    utilisateur.role = donnees.role
    db.commit()
    db.refresh(utilisateur)
    return utilisateur


@app.delete("/admin/utilisateurs/{utilisateur_id}")
def supprimer_utilisateur(
    utilisateur_id: int,
    _: models.Utilisateur = Depends(verifier_admin),
    db: Session = Depends(get_db),
):
    utilisateur = db.query(models.Utilisateur).filter(models.Utilisateur.id == utilisateur_id).first()
    if not utilisateur:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if utilisateur.role == "admin":
        raise HTTPException(status_code=403, detail="Impossible de supprimer un administrateur")
    db.delete(utilisateur)
    db.commit()
    return {"message": "Utilisateur supprimé"}


def detecter_conflits(db, data: dict, exclude_id: int = None) -> list:
    """Détecte les chevauchements de salle, enseignant et groupe sur un même créneau."""
    # Toutes les séances qui se chevauchent en temps ce jour-là
    requete = db.query(models.Seance).filter(
        models.Seance.date_seance == data["date_seance"],
        models.Seance.heure_debut < data["heure_fin"],
        models.Seance.heure_fin  > data["heure_debut"],
    )
    if exclude_id:
        requete = requete.filter(models.Seance.id != exclude_id)

    conflits = []
    for s in requete.all():
        h = f"{str(s.heure_debut)[:5]}–{str(s.heure_fin)[:5]}"
        if s.salle == data["salle"]:
            conflits.append(
                f"Salle «{s.salle}» déjà occupée par «{s.matiere}» "
                f"(groupe {s.groupe}) de {h}"
            )
        if s.enseignant == data["enseignant"]:
            conflits.append(
                f"Enseignant «{s.enseignant}» déjà affecté à «{s.matiere}» "
                f"(salle {s.salle}) de {h}"
            )
        if s.groupe == data["groupe"]:
            conflits.append(
                f"Groupe «{s.groupe}» a déjà «{s.matiere}» "
                f"(salle {s.salle}) de {h}"
            )
    return list(dict.fromkeys(conflits))  # dédoublonnage


@app.post("/seances", response_model=schemas.SeanceLire)
def creer_seance(
    seance: schemas.SeanceCreer,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(verifier_enseignant),
):
    conflits = detecter_conflits(db, seance.dict())
    if conflits:
        raise HTTPException(status_code=409, detail={"conflits": conflits})
    nouvelle_seance = models.Seance(**seance.dict())
    db.add(nouvelle_seance)
    db.commit()
    db.refresh(nouvelle_seance)
    return nouvelle_seance


@app.put("/seances/{seance_id}", response_model=schemas.SeanceLire)
def modifier_seance(
    seance_id: int,
    donnees: schemas.SeanceCreer,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(verifier_enseignant),
):
    seance = db.query(models.Seance).filter(models.Seance.id == seance_id).first()
    if not seance:
        raise HTTPException(status_code=404, detail="Séance introuvable")
    conflits = detecter_conflits(db, donnees.dict(), exclude_id=seance_id)
    if conflits:
        raise HTTPException(status_code=409, detail={"conflits": conflits})
    for champ, valeur in donnees.dict().items():
        setattr(seance, champ, valeur)
    db.commit()
    db.refresh(seance)
    return seance


@app.delete("/seances/{seance_id}")
def supprimer_seance(
    seance_id: int,
    db: Session = Depends(get_db),
    _: models.Utilisateur = Depends(verifier_enseignant),
):
    seance = db.query(models.Seance).filter(models.Seance.id == seance_id).first()
    if not seance:
        raise HTTPException(status_code=404, detail="Séance introuvable")
    db.delete(seance)
    db.commit()
    return {"message": "Séance supprimée"}


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


@app.post("/cours")
def creer_cours(
    cours: schemas.CoursCreer,
    _: models.Utilisateur = Depends(verifier_enseignant),
):
    data = cours.dict()
    resultat = mongo.collection_cours.insert_one(data)
    cours_id = str(resultat.inserted_id)
    rag.ajouter_document_cours(data, cours_id)
    return {"id": cours_id, "message": "Cours ajouté"}


@app.delete("/cours/{cours_id}")
def supprimer_cours(
    cours_id: str,
    _: models.Utilisateur = Depends(verifier_enseignant),
):
    resultat = mongo.collection_cours.delete_one({"_id": ObjectId(cours_id)})
    if resultat.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    rag.supprimer_document_cours(cours_id)
    return {"message": "Cours supprimé"}


@app.get("/cours")
def lister_cours():
    cours = []
    for doc in mongo.collection_cours.find():
        doc["_id"] = str(doc["_id"])
        cours.append(doc)
    return cours


@app.post("/faq")
def creer_faq(
    faq: schemas.FaqCreer,
    _: models.Utilisateur = Depends(verifier_enseignant),
):
    resultat = mongo.collection_faq.insert_one(faq.dict())
    return {"id": str(resultat.inserted_id), "message": "FAQ ajoutée"}


@app.get("/faq")
def lister_faq():
    faqs = []
    for doc in mongo.collection_faq.find():
        doc["_id"] = str(doc["_id"])
        faqs.append(doc)
    return faqs


@app.post("/cours/{cours_id}/documents")
async def ajouter_document(
    cours_id: str,
    nom: str = Form(...),
    type_doc: str = Form(...),
    url: str = Form(None),
    fichier: UploadFile = File(None),
    enseignant: models.Utilisateur = Depends(verifier_enseignant),
):
    if type_doc == "pdf":
        if not fichier:
            raise HTTPException(status_code=400, detail="Fichier PDF requis")
        ext = os.path.splitext(fichier.filename)[1].lower()
        if ext != ".pdf":
            raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés")
        nom_fichier = f"{uuid.uuid4()}{ext}"
        chemin = os.path.join(UPLOAD_DIR, nom_fichier)
        with open(chemin, "wb") as f:
            shutil.copyfileobj(fichier.file, f)
        doc = {
            "cours_id": cours_id, "nom": nom, "type": "pdf",
            "chemin": nom_fichier, "url": None,
            "date_ajout": datetime.utcnow().isoformat(),
            "enseignant": enseignant.nom,
        }
    elif type_doc == "lien":
        if not url:
            raise HTTPException(status_code=400, detail="URL requise")
        doc = {
            "cours_id": cours_id, "nom": nom, "type": "lien",
            "chemin": None, "url": url,
            "date_ajout": datetime.utcnow().isoformat(),
            "enseignant": enseignant.nom,
        }
    else:
        raise HTTPException(status_code=400, detail="Type invalide : 'pdf' ou 'lien'")

    resultat = mongo.collection_documents.insert_one(doc)
    return {"id": str(resultat.inserted_id), "message": "Document ajouté"}


@app.get("/cours/{cours_id}/documents")
def lister_documents(cours_id: str):
    docs = []
    for doc in mongo.collection_documents.find({"cours_id": cours_id}):
        doc["_id"] = str(doc["_id"])
        docs.append(doc)
    return docs


@app.delete("/documents/{doc_id}")
def supprimer_document(
    doc_id: str,
    _: models.Utilisateur = Depends(verifier_enseignant),
):
    doc = mongo.collection_documents.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document introuvable")
    if doc.get("chemin"):
        chemin = os.path.join(UPLOAD_DIR, doc["chemin"])
        if os.path.exists(chemin):
            os.remove(chemin)
    mongo.collection_documents.delete_one({"_id": ObjectId(doc_id)})
    return {"message": "Document supprimé"}


@app.get("/documents/{doc_id}/telecharger")
def telecharger_document(doc_id: str):
    doc = mongo.collection_documents.find_one({"_id": ObjectId(doc_id)})
    if not doc or doc.get("type") != "pdf":
        raise HTTPException(status_code=404, detail="Document introuvable")
    chemin = os.path.join(UPLOAD_DIR, doc["chemin"])
    if not os.path.exists(chemin):
        raise HTTPException(status_code=404, detail="Fichier introuvable sur le serveur")
    return FileResponse(chemin, filename=doc["nom"] + ".pdf", media_type="application/pdf")


@app.post("/chat")
def chat(
    donnees: schemas.QuestionChat,
    utilisateur: models.Utilisateur = Depends(utilisateur_courant),
):
    resultat = rag.repondre(
        donnees.question,
        utilisateur=utilisateur,
        historique=donnees.historique,
    )
    return resultat
