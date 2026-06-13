import { useState } from "react";

export default function SectionEtudiants({ etudiants }) {
  const [rechercheEtu, setRechercheEtu] = useState("");

  const t = rechercheEtu.toLowerCase();
  const filtres = etudiants.filter((e) =>
    e.nom.toLowerCase().includes(t) ||
    e.email.toLowerCase().includes(t) ||
    (e.groupe || "").toLowerCase().includes(t)
  );

  const groupes = filtres.reduce((acc, e) => {
    const cle = e.groupe || "Sans groupe";
    if (!acc[cle]) acc[cle] = [];
    acc[cle].push(e);
    return acc;
  }, {});

  const clesTriees = Object.keys(groupes).sort((a, b) =>
    a === "Sans groupe" ? 1 : b === "Sans groupe" ? -1 : a.localeCompare(b)
  );

  return (
    <div>
      <h2 id="etudiants" className="section-titre">Liste des étudiants</h2>
      <div className="barre-recherche-cours" style={{ marginBottom: 16 }}>
        <span className="icone-recherche">🔍</span>
        <input className="input-recherche-cours" type="text"
          placeholder="Rechercher par nom, email ou groupe..."
          value={rechercheEtu} onChange={(e) => setRechercheEtu(e.target.value)} />
        {rechercheEtu && (
          <button className="btn-effacer-recherche" onClick={() => setRechercheEtu("")}>✕</button>
        )}
      </div>

      {etudiants.length === 0 ? (
        <p>Aucun étudiant inscrit.</p>
      ) : filtres.length === 0 ? (
        <p className="aucun-resultat">Aucun étudiant ne correspond à « {rechercheEtu} ».</p>
      ) : (
        <div className="groupes-etudiants">
          {clesTriees.map((groupe) => (
            <div className="bloc-groupe" key={groupe}>
              <div className="bloc-groupe-header">
                <span className="badge-groupe">{groupe}</span>
                <span className="compteur-groupe">
                  {groupes[groupe].length} étudiant{groupes[groupe].length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="carte">
                <table>
                  <thead><tr><th>Nom</th><th>Email</th></tr></thead>
                  <tbody>
                    {groupes[groupe].map((e) => (
                      <tr key={e.id}>
                        <td>
                          <div className="etu-nom">
                            <div className="avatar avatar-sm">
                              {e.nom.trim().split(" ").map((m) => m[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            {e.nom}
                          </div>
                        </td>
                        <td>{e.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="compteur-etu">
        {etudiants.length} étudiant{etudiants.length > 1 ? "s" : ""} inscrits au total
      </p>
    </div>
  );
}
