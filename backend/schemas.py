from pydantic import BaseModel, EmailStr
from datetime import date, time


class UtilisateurCreer(BaseModel):
    nom: str
    email: EmailStr
    mot_de_passe: str
    role: str = "etudiant"


class UtilisateurLire(BaseModel):
    id: int
    nom: str
    email: str
    role: str

    class Config:
        from_attributes = True


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