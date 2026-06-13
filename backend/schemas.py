from pydantic import BaseModel, EmailStr
from datetime import date, time


class UtilisateurCreer(BaseModel):
    nom: str
    email: EmailStr
    mot_de_passe: str
    role: str = "etudiant"
    groupe: str | None = None


class UtilisateurLire(BaseModel):
    id: int
    nom: str
    email: str
    role: str
    groupe: str | None = None
    matieres: str | None = None

    class Config:
        from_attributes = True


class ProfilMiseAJour(BaseModel):
    matieres: str | None = None


class SeanceCreer(BaseModel):
    matiere: str
    enseignant: str
    salle: str
    groupe: str
    type_seance: str = "CM"
    date_seance: date
    heure_debut: time
    heure_fin: time


class SeanceLire(SeanceCreer):
    id: int

    class Config:
        from_attributes = True



class TokenReponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
class CoursCreer(BaseModel):
    titre: str
    module: str
    semestre: str
    contenu: str
    enseignant: str


class FaqCreer(BaseModel):
    question: str
    reponse: str
    categorie: str = "general"
class QuestionChat(BaseModel):
    question: str