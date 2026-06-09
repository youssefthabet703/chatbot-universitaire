from sqlalchemy import Column, Integer, String, Time, Date
from database import Base


class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    id = Column(Integer, primary_key=True, index=True)
    nom = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    mot_de_passe = Column(String, nullable=False)
    role = Column(String, default="etudiant")  # etudiant, enseignant ou admin


class Seance(Base):
    __tablename__ = "seances"

    id = Column(Integer, primary_key=True, index=True)
    matiere = Column(String, nullable=False)
    enseignant = Column(String, nullable=False)
    salle = Column(String, nullable=False)
    groupe = Column(String, nullable=False)
    type_seance = Column(String, default="CM")  # CM, TD ou TP
    date_seance = Column(Date, nullable=False)
    heure_debut = Column(Time, nullable=False)
    heure_fin = Column(Time, nullable=False)