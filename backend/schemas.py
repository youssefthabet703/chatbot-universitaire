from pydantic import BaseModel, EmailStr


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