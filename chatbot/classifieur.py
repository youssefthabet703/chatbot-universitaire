"""
Classifieur d'intentions basé sur les embeddings BERT/DistilBERT
=================================================================
Architecture : sentence-transformers/all-MiniLM-L6-v2 (DistilBERT distillé)
               + Régression Logistique sur les embeddings sémantiques.
"""

import os
from sklearn.linear_model import LogisticRegression
from sentence_transformers import SentenceTransformer

NOM_MODELE_BERT = "sentence-transformers/all-MiniLM-L6-v2"


class ClassifieurBERT:
    """
    Classifieur sémantique d'intentions.
    Encode les questions via un modèle BERT/DistilBERT (MiniLM),
    puis prédit l'intention avec une Régression Logistique.
    Compatible avec l'interface sklearn : predict() / predict_proba().
    """

    def __init__(self, nom_modele: str = NOM_MODELE_BERT):
        self.nom_modele = nom_modele
        self._encoder = None
        self.classifieur = LogisticRegression(max_iter=1000, C=5.0, random_state=42)

    @property
    def encoder(self):
        if self._encoder is None:
            self._encoder = SentenceTransformer(self.nom_modele)
        return self._encoder

    def __getstate__(self):
        state = self.__dict__.copy()
        state["_encoder"] = None
        return state

    def fit(self, textes, labels):
        embeddings = self.encoder.encode(textes, show_progress_bar=True,
                                         convert_to_numpy=True)
        self.classifieur.fit(embeddings, labels)
        return self

    def predict(self, textes):
        embeddings = self.encoder.encode(list(textes), convert_to_numpy=True)
        return self.classifieur.predict(embeddings)

    def predict_proba(self, textes):
        embeddings = self.encoder.encode(list(textes), convert_to_numpy=True)
        return self.classifieur.predict_proba(embeddings)