import { useState } from "react";
import toast from "react-hot-toast";
import * as api from "../api";

export default function PanneauEnseignant({ profil, setProfil, token, setSeances }) {
  const [editMatieres, setEditMatieres] = useState(false);
  const [matieresInput, setMatieresInput] = useState(profil.matieres || "");
  const [showForm, setShowForm] = useState(false);
  const [nouvelleSeance, setNouvelleSeance] = useState({
    matiere: "", salle: "", groupe: "", type_seance: "CM",
    date_seance: "", heure_debut: "", heure_fin: "",
  });
  const [conflits, setConflits] = useState([]);

  const sauvegarderMatieres = async () => {
    const id = toast.loading("Enregistrement...");
    try {
      const data = await api.mettreAJourProfil(token, { matieres: matieresInput });
      setProfil(data);
      setEditMatieres(false);
      toast.success("Matières mises à jour !", { id });
    } catch {
      toast.error("Erreur lors de la sauvegarde", { id });
    }
  };

  const ajouterSeance = async () => {
    const { matiere, salle, groupe, date_seance, heure_debut, heure_fin } = nouvelleSeance;
    if (!matiere || !salle || !groupe || !date_seance || !heure_debut || !heure_fin) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const aujourd = new Date().toISOString().slice(0, 10);
    if (date_seance < aujourd) {
      toast.error("Impossible d'ajouter une séance dans le passé.");
      return;
    }
    const id = toast.loading("Ajout en cours...");
    try {
      await api.ajouterSeance(token, { ...nouvelleSeance, enseignant: profil.nom });
      toast.success("Séance ajoutée avec succès !", { id });
      setShowForm(false);
      setConflits([]);
      setNouvelleSeance({ matiere: "", salle: "", groupe: "", type_seance: "CM", date_seance: "", heure_debut: "", heure_fin: "" });
      setSeances(await api.fetchSeances());
    } catch (err) {
      if (err.conflits) {
        toast.dismiss(id);
        setConflits(err.conflits);
      } else {
        toast.error(err.message || "Erreur lors de l'ajout", { id });
      }
    }
  };

  const set = (key, val) => {
    setNouvelleSeance((prev) => ({ ...prev, [key]: val }));
    if (conflits.length) setConflits([]);
  };

  return (
    <div className="panneau-enseignant">
      {/* Matières enseignées */}
      <div className="carte matieres-card">
        <div className="matieres-header">
          <div>
            <span className="matieres-titre">📖 Mes matières enseignées</span>
            {!editMatieres && profil.matieres && (
              <div className="matieres-badges">
                {profil.matieres.split(",").map((m, i) => m.trim() && (
                  <span key={i} className="badge-matiere">{m.trim()}</span>
                ))}
              </div>
            )}
            {!editMatieres && !profil.matieres && (
              <p className="matieres-vide">Aucune matière renseignée</p>
            )}
          </div>
          <button className="btn-edit-matieres"
            onClick={() => { setEditMatieres(!editMatieres); setMatieresInput(profil.matieres || ""); }}>
            {editMatieres ? "Annuler" : "✏️ Modifier"}
          </button>
        </div>
        {editMatieres && (
          <div className="matieres-form">
            <input className="champ" type="text" placeholder="ex : Base de Données, Algorithmique, Réseaux"
              value={matieresInput} onChange={(e) => setMatieresInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sauvegarderMatieres()} />
            <p className="matieres-aide">Séparez les matières par des virgules</p>
            <button className="btn-principal btn-valider" onClick={sauvegarderMatieres}>Enregistrer</button>
          </div>
        )}
      </div>

      {/* Gestion des séances */}
      <div className="panneau-enseignant-header">
        <h2 className="section-titre" style={{ margin: 0 }}>Gestion des séances</h2>
        <button className={`btn-ajouter-seance ${showForm ? "btn-annuler" : ""}`}
          onClick={() => { setShowForm(!showForm); setConflits([]); }}>
          {showForm ? "Annuler" : "+ Nouvelle séance"}
        </button>
      </div>

      {showForm && (
        <div className="carte form-seance">
          <div className="grille-form">
            <div className="champ-groupe">
              <label className="champ-label">Matière *</label>
              <input className="champ" type="text" placeholder="ex : Algorithmique"
                value={nouvelleSeance.matiere} onChange={(e) => set("matiere", e.target.value)} />
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Salle *</label>
              <input className="champ" type="text" placeholder="ex : B204"
                value={nouvelleSeance.salle} onChange={(e) => set("salle", e.target.value)} />
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Groupe *</label>
              <input className="champ" type="text" placeholder="ex : L3-INFO-G1"
                value={nouvelleSeance.groupe} onChange={(e) => set("groupe", e.target.value)} />
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Type</label>
              <select className="champ champ-select" value={nouvelleSeance.type_seance}
                onChange={(e) => set("type_seance", e.target.value)}>
                <option value="CM">CM</option>
                <option value="TD">TD</option>
                <option value="TP">TP</option>
              </select>
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Date *</label>
              <input className="champ" type="date" min={new Date().toISOString().slice(0, 10)}
                value={nouvelleSeance.date_seance} onChange={(e) => set("date_seance", e.target.value)} />
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Heure début *</label>
              <input className="champ" type="time"
                value={nouvelleSeance.heure_debut} onChange={(e) => set("heure_debut", e.target.value)} />
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Heure fin *</label>
              <input className="champ" type="time"
                value={nouvelleSeance.heure_fin} onChange={(e) => set("heure_fin", e.target.value)} />
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Enseignant</label>
              <input className="champ champ-readonly" type="text" value={profil.nom} readOnly />
            </div>
          </div>
          {conflits.length > 0 && (
            <div className="conflits-panel">
              <p className="conflits-titre">⚠️ Conflits détectés — séance non enregistrée</p>
              <ul className="conflits-liste">
                {conflits.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          <div className="form-seance-footer">
            <button className="btn-principal btn-valider" onClick={ajouterSeance}>
              Ajouter la séance
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
