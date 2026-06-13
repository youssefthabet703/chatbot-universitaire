import { useState } from "react";
import { CalendarDays, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../api";

export default function EmploiDuTemps({ profil, token, seances, setSeances, exporterPDF }) {
  const [vueEmploi, setVueEmploi] = useState("semaine");
  const [semaineOffset, setSemaineOffset] = useState(0);
  const [seanceEnEdition, setSeanceEnEdition] = useState(null);
  const [formEdition, setFormEdition] = useState({});

  const ouvrirEdition = (s) => {
    setSeanceEnEdition(s.id);
    setFormEdition({
      matiere: s.matiere, salle: s.salle, groupe: s.groupe,
      type_seance: s.type_seance, date_seance: s.date_seance,
      heure_debut: s.heure_debut.slice(0, 5), heure_fin: s.heure_fin.slice(0, 5),
      enseignant: s.enseignant,
    });
    setVueEmploi("liste");
  };

  const modifierSeance = async () => {
    const aujourd = new Date().toISOString().slice(0, 10);
    if (formEdition.date_seance < aujourd) {
      toast.error("Impossible de déplacer une séance dans le passé.");
      return;
    }
    const id = toast.loading("Modification en cours...");
    try {
      await api.modifierSeance(token, seanceEnEdition, formEdition);
      toast.success("Séance modifiée !", { id });
      setSeanceEnEdition(null);
      setSeances(await api.fetchSeances());
    } catch (err) {
      toast.error(err.message || "Erreur lors de la modification", { id });
    }
  };

  const supprimerSeance = async (seanceId, matiere) => {
    if (!confirm(`Supprimer la séance « ${matiere} » ?`)) return;
    const id = toast.loading("Suppression...");
    try {
      await api.supprimerSeance(token, seanceId);
      toast.success("Séance supprimée.", { id });
      setSeances((prev) => prev.filter((s) => s.id !== seanceId));
    } catch {
      toast.error("Erreur lors de la suppression.", { id });
    }
  };

  const setEdition = (key, val) => setFormEdition((prev) => ({ ...prev, [key]: val }));

  return (
    <>
      <div className="section-titre-ligne">
        <h2 id="emploi" className="section-titre" style={{ margin: 0 }}>Mon emploi du temps</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="vue-toggle">
            <button className={vueEmploi === "semaine" ? "actif" : ""} onClick={() => setVueEmploi("semaine")}>Semaine</button>
            <button className={vueEmploi === "liste" ? "actif" : ""} onClick={() => setVueEmploi("liste")}>Liste</button>
          </div>
          {seances.length > 0 && (
            <button className="btn-export-pdf" onClick={exporterPDF} title="Télécharger en PDF">
              <CalendarDays size={14} strokeWidth={2} /> Exporter PDF
            </button>
          )}
        </div>
      </div>

      {seances.length === 0 ? (
        <p className="etat-vide">Aucune séance enregistrée.</p>
      ) : vueEmploi === "liste" ? (
        <VueListe
          profil={profil}
          seances={seances}
          seanceEnEdition={seanceEnEdition}
          formEdition={formEdition}
          setEdition={setEdition}
          ouvrirEdition={ouvrirEdition}
          modifierSeance={modifierSeance}
          supprimerSeance={supprimerSeance}
          annulerEdition={() => setSeanceEnEdition(null)}
        />
      ) : (
        <VueSemaine
          profil={profil}
          seances={seances}
          semaineOffset={semaineOffset}
          setSemaineOffset={setSemaineOffset}
          ouvrirEdition={ouvrirEdition}
          supprimerSeance={supprimerSeance}
        />
      )}
    </>
  );
}

function VueListe({ profil, seances, seanceEnEdition, formEdition, setEdition, ouvrirEdition, modifierSeance, supprimerSeance, annulerEdition }) {
  return (
    <>
      {seanceEnEdition && (
        <div className="carte form-seance" style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>✏️ Modifier la séance</p>
          <div className="grille-form">
            {[
              { label: "Matière *", key: "matiere", type: "text", placeholder: "ex : Algorithmique" },
              { label: "Salle *", key: "salle", type: "text", placeholder: "ex : B204" },
              { label: "Groupe *", key: "groupe", type: "text", placeholder: "ex : L3-INFO-G1" },
              { label: "Date *", key: "date_seance", type: "date", min: new Date().toISOString().slice(0, 10) },
              { label: "Heure début *", key: "heure_debut", type: "time" },
              { label: "Heure fin *", key: "heure_fin", type: "time" },
            ].map(({ label, key, type, placeholder, min }) => (
              <div className="champ-groupe" key={key}>
                <label className="champ-label">{label}</label>
                <input className="champ" type={type} placeholder={placeholder} min={min}
                  value={formEdition[key] || ""}
                  onChange={(e) => setEdition(key, e.target.value)} />
              </div>
            ))}
            <div className="champ-groupe">
              <label className="champ-label">Type</label>
              <select className="champ champ-select" value={formEdition.type_seance || "CM"}
                onChange={(e) => setEdition("type_seance", e.target.value)}>
                <option value="CM">CM</option>
                <option value="TD">TD</option>
                <option value="TP">TP</option>
              </select>
            </div>
          </div>
          <div className="form-seance-footer">
            <button className="btn-principal btn-valider" onClick={modifierSeance}>Enregistrer</button>
            <button className="btn-ajouter-seance btn-annuler" onClick={annulerEdition}>Annuler</button>
          </div>
        </div>
      )}
      <div className="carte">
        <table>
          <thead>
            <tr>
              <th>Matière</th><th>Type</th><th>Enseignant</th><th>Salle</th>
              <th>Groupe</th><th>Date</th><th>Horaire</th>
              {profil.role === "enseignant" && <th></th>}
            </tr>
          </thead>
          <tbody>
            {[...seances].sort((a, b) => a.date_seance.localeCompare(b.date_seance)).map((s) => (
              <tr key={s.id} className={seanceEnEdition === s.id ? "ligne-en-edition" : ""}>
                <td><strong>{s.matiere}</strong></td>
                <td><span className={`badge-type badge-type-${s.type_seance.toLowerCase()}`}>{s.type_seance}</span></td>
                <td>{s.enseignant}</td>
                <td>{s.salle}</td>
                <td>{s.groupe}</td>
                <td>{new Date(s.date_seance).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</td>
                <td>{s.heure_debut.slice(0, 5)} – {s.heure_fin.slice(0, 5)}</td>
                {profil.role === "enseignant" && (
                  <td>
                    <div className="seance-actions">
                      <button className="btn-action-seance btn-edit" title="Modifier" onClick={() => ouvrirEdition(s)}>
                        <Pencil size={13} strokeWidth={2} />
                      </button>
                      <button className="btn-action-seance btn-del" title="Supprimer" onClick={() => supprimerSeance(s.id, s.matiere)}>
                        <Trash2 size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function VueSemaine({ profil, seances, semaineOffset, setSemaineOffset, ouvrirEdition, supprimerSeance }) {
  const aujourd = new Date();
  const lundiBase = new Date(aujourd);
  lundiBase.setDate(aujourd.getDate() - ((aujourd.getDay() + 6) % 7) + semaineOffset * 7);

  const jours = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(lundiBase);
    d.setDate(lundiBase.getDate() + i);
    return d;
  });

  const fmt = (d) => d.toISOString().slice(0, 10);
  const fmtLabel = (d) => d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const labelSemaine = `${jours[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} – ${jours[4].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <div>
      <div className="semaine-nav">
        <button className="btn-semaine" onClick={() => setSemaineOffset((o) => o - 1)}>‹</button>
        <span className="semaine-label">{labelSemaine}</span>
        <button className="btn-semaine" onClick={() => setSemaineOffset((o) => o + 1)}>›</button>
        {semaineOffset !== 0 && (
          <button className="btn-semaine-aujourd" onClick={() => setSemaineOffset(0)}>Aujourd'hui</button>
        )}
      </div>
      <div className="grille-semaine">
        {jours.map((jour, idx) => {
          const dateStr = fmt(jour);
          const estAujourd = dateStr === fmt(aujourd);
          const seancesJour = seances.filter((s) => s.date_seance === dateStr)
            .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
          return (
            <div key={idx} className={`colonne-jour ${estAujourd ? "aujourd-hui" : ""}`}>
              <div className="jour-header">
                <span className="jour-nom">{fmtLabel(jour).split(" ")[0]}</span>
                <span className={`jour-num ${estAujourd ? "jour-num-actif" : ""}`}>{jour.getDate()}</span>
              </div>
              <div className="jour-seances">
                {seancesJour.length === 0 ? (
                  <div className="jour-vide" />
                ) : (
                  seancesJour.map((s) => (
                    <div key={s.id} className={`carte-seance carte-seance-${s.type_seance.toLowerCase()}`}>
                      <div className="seance-heure">{s.heure_debut.slice(0, 5)} – {s.heure_fin.slice(0, 5)}</div>
                      <div className="seance-matiere">{s.matiere}</div>
                      <div className="seance-meta">{s.salle} · {s.enseignant}</div>
                      <div className="seance-footer-row">
                        <span className={`badge-type badge-type-${s.type_seance.toLowerCase()}`}>{s.type_seance}</span>
                        {profil.role === "enseignant" && (
                          <div className="seance-actions-mini">
                            <button className="btn-action-seance btn-edit" title="Modifier"
                              onClick={() => ouvrirEdition(s)}>
                              <Pencil size={11} strokeWidth={2} />
                            </button>
                            <button className="btn-action-seance btn-del" title="Supprimer"
                              onClick={() => supprimerSeance(s.id, s.matiere)}>
                              <Trash2 size={11} strokeWidth={2} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
