import { useState } from "react";
import toast from "react-hot-toast";
import * as api from "../api";

export default function PanneauAdmin({ token, utilisateurs, setUtilisateurs }) {
  const [recherche, setRecherche] = useState("");
  const [enCours, setEnCours] = useState(null);

  const t = recherche.toLowerCase();
  const filtres = utilisateurs.filter(
    (u) =>
      u.nom.toLowerCase().includes(t) ||
      u.email.toLowerCase().includes(t) ||
      u.role.toLowerCase().includes(t)
  );

  const changerRole = async (id, nouveauRole) => {
    setEnCours(id);
    try {
      const mis_a_jour = await api.changerRole(token, id, nouveauRole);
      setUtilisateurs((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: mis_a_jour.role } : u))
      );
      toast.success(`Rôle mis à jour : ${mis_a_jour.role}`);
    } catch (err) {
      toast.error(err.message || "Erreur lors du changement de rôle");
    } finally {
      setEnCours(null);
    }
  };

  const supprimerUtilisateur = async (id, nom) => {
    if (!window.confirm(`Supprimer le compte de « ${nom} » ?`)) return;
    try {
      await api.supprimerUtilisateurAdmin(token, id);
      setUtilisateurs((prev) => prev.filter((u) => u.id !== id));
      toast.success("Compte supprimé");
    } catch (err) {
      toast.error(err.message || "Erreur lors de la suppression");
    }
  };

  const stats = {
    total: utilisateurs.length,
    etudiants: utilisateurs.filter((u) => u.role === "etudiant").length,
    enseignants: utilisateurs.filter((u) => u.role === "enseignant").length,
    admins: utilisateurs.filter((u) => u.role === "admin").length,
  };

  return (
    <div>
      <h2 id="admin" className="section-titre">Gestion des utilisateurs</h2>

      <div className="stats-grille" style={{ marginBottom: 20 }}>
        <div className="stat-carte stat-bleu rounded-2xl shadow-sm">
          <span className="stat-icone">👥</span>
          <span className="stat-valeur">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-carte stat-vert rounded-2xl shadow-sm">
          <span className="stat-icone">🎓</span>
          <span className="stat-valeur">{stats.etudiants}</span>
          <span className="stat-label">Étudiants</span>
        </div>
        <div className="stat-carte stat-violet rounded-2xl shadow-sm">
          <span className="stat-icone">👨‍🏫</span>
          <span className="stat-valeur">{stats.enseignants}</span>
          <span className="stat-label">Enseignants</span>
        </div>
        <div className="stat-carte stat-orange rounded-2xl shadow-sm">
          <span className="stat-icone">🛡️</span>
          <span className="stat-valeur">{stats.admins}</span>
          <span className="stat-label">Admins</span>
        </div>
      </div>

      <div className="barre-recherche-cours" style={{ marginBottom: 16 }}>
        <span className="icone-recherche">🔍</span>
        <input
          className="input-recherche-cours"
          type="text"
          placeholder="Rechercher par nom, email ou rôle..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        {recherche && (
          <button className="btn-effacer-recherche" onClick={() => setRecherche("")}>
            ✕
          </button>
        )}
      </div>

      <div className="carte">
        {filtres.length === 0 ? (
          <p style={{ padding: "16px", textAlign: "center", color: "var(--gris-texte)" }}>
            {recherche
              ? `Aucun utilisateur ne correspond à « ${recherche} ».`
              : "Aucun utilisateur."}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Groupe</th>
                <th>Rôle actuel</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="etu-nom">
                      <div className="avatar avatar-sm">
                        {u.nom
                          .trim()
                          .split(" ")
                          .map((m) => m[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      {u.nom}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.groupe || "—"}</td>
                  <td>
                    <span
                      className={`badge-role badge-role-${u.role} rounded-full text-xs font-semibold`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.role !== "admin" ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn-action-seance btn-edit"
                          disabled={enCours === u.id}
                          onClick={() =>
                            changerRole(u.id, u.role === "etudiant" ? "enseignant" : "etudiant")
                          }
                          title={
                            u.role === "etudiant"
                              ? "Promouvoir en enseignant"
                              : "Rétrograder en étudiant"
                          }
                        >
                          {enCours === u.id
                            ? "…"
                            : u.role === "etudiant"
                            ? "→ Enseignant"
                            : "→ Étudiant"}
                        </button>
                        <button
                          className="btn-action-seance btn-del"
                          onClick={() => supprimerUtilisateur(u.id, u.nom)}
                          title="Supprimer ce compte"
                        >
                          Supprimer
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "var(--gris-texte)", fontSize: 13 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
