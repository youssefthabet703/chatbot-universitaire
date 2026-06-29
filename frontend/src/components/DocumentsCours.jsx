import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as api from "../api";

const API_URL = "http://localhost:8001";

export default function DocumentsCours({ coursId, profil, token }) {
  const [documents, setDocuments] = useState([]);
  const [ouvert, setOuvert] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [typeDoc, setTypeDoc] = useState("pdf");
  const [nom, setNom] = useState("");
  const [url, setUrl] = useState("");
  const [fichier, setFichier] = useState(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    if (ouvert) {
      api.fetchDocumentsCours(coursId).then(setDocuments).catch(() => {});
    }
  }, [ouvert, coursId]);

  const ajouterDocument = async () => {
    if (!nom.trim()) { toast.error("Donnez un nom au document."); return; }
    if (typeDoc === "lien" && !url.trim()) { toast.error("URL requise."); return; }
    if (typeDoc === "pdf" && !fichier) { toast.error("Sélectionnez un fichier PDF."); return; }

    setChargement(true);
    const toastId = toast.loading("Ajout en cours...");
    try {
      await api.ajouterDocument(token, coursId, { nom, typeDoc, url, fichier });
      toast.success("Document ajouté !", { id: toastId });
      setDocuments(await api.fetchDocumentsCours(coursId));
      annulerForm();
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'ajout", { id: toastId });
    } finally {
      setChargement(false);
    }
  };

  const supprimerDocument = async (docId, docNom) => {
    if (!confirm(`Supprimer « ${docNom} » ?`)) return;
    const toastId = toast.loading("Suppression...");
    try {
      await api.supprimerDocument(token, docId);
      toast.success("Document supprimé.", { id: toastId });
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
    } catch {
      toast.error("Erreur lors de la suppression.", { id: toastId });
    }
  };

  const annulerForm = () => {
    setShowForm(false);
    setNom(""); setUrl(""); setFichier(null); setTypeDoc("pdf");
  };

  return (
    <div className="docs-section">
      <button className="docs-toggle" onClick={() => setOuvert(!ouvert)}>
        <span>📎 Documents</span>
        {documents.length > 0 && <span className="docs-badge">{documents.length}</span>}
        <span className="docs-chevron">{ouvert ? "▲" : "▼"}</span>
      </button>

      {ouvert && (
        <div className="docs-contenu">
          {documents.length === 0 && !showForm && (
            <p className="docs-vide">Aucun document déposé</p>
          )}

          {documents.length > 0 && (
            <ul className="docs-liste">
              {documents.map((d) => (
                <li key={d._id} className="docs-item">
                  <span className="docs-icone">{d.type === "pdf" ? "📄" : "🔗"}</span>
                  {d.type === "pdf" ? (
                    <a
                      href={`${API_URL}/documents/${d._id}/telecharger`}
                      target="_blank"
                      rel="noreferrer"
                      className="docs-nom"
                    >
                      {d.nom}
                    </a>
                  ) : (
                    <a href={d.url} target="_blank" rel="noreferrer" className="docs-nom">
                      {d.nom}
                    </a>
                  )}
                  {profil.role === "enseignant" && (
                    <button
                      className="docs-btn-suppr"
                      title="Supprimer"
                      onClick={() => supprimerDocument(d._id, d.nom)}
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {profil.role === "enseignant" && !showForm && (
            <button className="docs-btn-ajouter" onClick={() => setShowForm(true)}>
              + Ajouter un document
            </button>
          )}

          {profil.role === "enseignant" && showForm && (
            <div className="docs-form">
              <select
                className="champ champ-select"
                value={typeDoc}
                onChange={(e) => setTypeDoc(e.target.value)}
              >
                <option value="pdf">📄 Fichier PDF</option>
                <option value="lien">🔗 Lien / URL</option>
              </select>
              <input
                className="champ"
                type="text"
                placeholder="Nom du document (ex : Syllabus S5, Cours chapitre 1...)"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
              {typeDoc === "lien" ? (
                <input
                  className="champ"
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              ) : (
                <input
                  className="champ docs-file-input"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFichier(e.target.files[0])}
                />
              )}
              <div className="docs-form-actions">
                <button
                  className="btn-principal btn-valider"
                  onClick={ajouterDocument}
                  disabled={chargement}
                >
                  {chargement ? "Ajout..." : "Ajouter"}
                </button>
                <button className="docs-btn-annuler" onClick={annulerForm}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
