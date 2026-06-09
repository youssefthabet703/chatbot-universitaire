from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError

# Outil de chiffrement des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Clé secrète pour signer les jetons (à garder confidentielle)
SECRET_KEY = "change-moi-par-une-cle-secrete-longue-et-aleatoire"
ALGORITHM = "HS256"
DUREE_TOKEN_MINUTES = 60


def chiffrer_mot_de_passe(mot_de_passe: str) -> str:
    return pwd_context.hash(mot_de_passe)


def verifier_mot_de_passe(mot_de_passe_clair: str, mot_de_passe_chiffre: str) -> bool:
    return pwd_context.verify(mot_de_passe_clair, mot_de_passe_chiffre)


def creer_token(donnees: dict) -> str:
    a_encoder = donnees.copy()
    expiration = datetime.utcnow() + timedelta(minutes=DUREE_TOKEN_MINUTES)
    a_encoder.update({"exp": expiration})
    return jwt.encode(a_encoder, SECRET_KEY, algorithm=ALGORITHM)


def lire_token(token: str):
    try:
        donnees = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return donnees
    except JWTError:
        return None