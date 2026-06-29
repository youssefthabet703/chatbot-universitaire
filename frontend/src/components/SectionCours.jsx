import { useState } from "react";
import toast from "react-hot-toast";
import * as api from "../api";
import DocumentsCours from "./DocumentsCours";

export default function SectionCours({ profil, token, cours, setCours }) {
  const [showForm, setShowForm] = useState(false);
  const [nouveauCours, setNouveauCours] = useState({ titre: "", module: "", semestre: "", contenu: "" });
  const [recherche, setRecherche] = useState("");

  const set = (key, val) => setNouveauCours((prev) => ({ ...prev, [key]: val }));

  const ajouterCours = async () => {
    const { titre, module, semestre, contenu } = nouveauCours;
    if (!titre || !module || !semestre || !contenu) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    const id = toast.loading("Ajout en cours...");
    try {
      await api.ajouterCours(token, { ...nouveauCours, enseignant: profil.nom });
      toast.success("Cours ajouté avec succès !", { id });
      setShowForm(false);
      setNouveauCours({ titre: "", module: "", semestre: "", contenu: "" });
      setCours(await api.fetchCours());
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'ajout", { id });
    }
  };

  const supprimerCours = async (coursId, titre) => {
    if (!confirm(`Supprimer « ${titre} » ?`)) return;
    const id = toast.loading("Suppression...");
    try {
      await api.supprimerCours(token, coursId);
      toast.success("Cours supprimé.", { id });
      setCours((prev) => prev.filter((x) => x._id !== coursId));
    } catch {
      toast.error("Erreur lors de la suppression.", { id });
    }
  };

  const terme = recherche.toLowerCase();
  const coursFiltres = cours.filter((c) =>
    c.titre.toLowerCase().includes(terme) ||
    c.module.toLowerCase().includes(terme) ||
    c.enseignant.toLowerCase().includes(terme)
  );

  return (
    <>
      <div className="panneau-enseignant-header" style={{ marginTop: 32, marginBottom: 16 }}>
        <h2 id="cours" className="section-titre" style={{ margin: 0 }}>Mes cours</h2>
        {profil.role === "enseignant" && (
          <button className={`btn-ajouter-seance ${showForm ? "btn-annuler" : ""}`}
            onClick={() => setShowForm(!showForm)}>
            {showForm ? "Annuler" : "+ Nouveau cours"}
          </button>
        )}
      </div>

      {profil.role === "enseignant" && showForm && (
        <div className="carte form-seance" style={{ marginBottom: 24 }}>
          <div className="grille-form">
            <div className="champ-groupe" style={{ gridColumn: "1 / -1" }}>
              <label className="champ-label">Titre *</label>
              <input className="champ" type="text" placeholder="ex : Introduction à l'Intelligence Artificielle"
                value={nouveauCours.titre} onChange={(e) => set("titre", e.target.value)} />
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Matière *</label>
              <input className="champ" type="text" placeholder="ex : Intelligence Artificielle"
                value={nouveauCours.module} onChange={(e) => set("module", e.target.value)} />
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Semestre *</label>
              <input className="champ" type="text" placeholder="ex : S5"
                value={nouveauCours.semestre} onChange={(e) => set("semestre", e.target.value)} />
            </div>
            <div className="champ-groupe">
              <label className="champ-label">Enseignant</label>
              <input className="champ champ-readonly" type="text" value={profil.nom} readOnly />
            </div>
            <div className="champ-groupe" style={{ gridColumn: "1 / -1" }}>
              <label className="champ-label">Contenu *</label>
              <textarea className="champ champ-textarea" rows={4} placeholder="Décrivez le contenu du cours..."
                value={nouveauCours.contenu} onChange={(e) => set("contenu", e.target.value)} />
            </div>
          </div>
          <div className="form-seance-footer">
            <button className="btn-principal btn-valider" onClick={ajouterCours}>Ajouter le cours</button>
          </div>
        </div>
      )}

      {cours.length > 0 && (
        <div className="barre-recherche-cours">
          <span className="icone-recherche">🔍</span>
          <input className="input-recherche-cours" type="text"
            placeholder="Rechercher par titre, matière ou enseignant..."
            value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          {recherche && (
            <button className="btn-effacer-recherche" onClick={() => setRecherche("")}>✕</button>
          )}
        </div>
      )}

      {cours.length === 0 ? (
        <p>Aucun cours disponible.</p>
      ) : coursFiltres.length === 0 ? (
        <p className="aucun-resultat">Aucun cours ne correspond à « {recherche} ».</p>
      ) : (
        <div className="grille-cours">
          {coursFiltres.map((c) => (
            <div className="carte-cours" key={c._id}>
              {profil.role === "enseignant" && (
                <button className="btn-supprimer-cours" title="Supprimer ce cours"
                  onClick={() => supprimerCours(c._id, c.titre)}>✕</button>
              )}
              <h3>{c.titre}</h3>
              <p className="meta">{c.module} — {c.semestre}</p>
              <p className="meta">Enseignant : {c.enseignant}</p>
              <p className="contenu-cours">
                {c.contenu.length > 120 ? c.contenu.slice(0, 120) + "..." : c.contenu}
              </p>
              <DocumentsCours coursId={c._id} profil={profil} token={token} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
