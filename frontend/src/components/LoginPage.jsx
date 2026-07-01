import { useState } from "react";
import toast from "react-hot-toast";
import * as api from "../api";

export default function LoginPage({ modeSombre, setModeSombre, onSuccess, setChargement }) {
  const [mode, setMode] = useState("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");
  const [groupe, setGroupe] = useState("");
  const [enCours, setEnCours] = useState(false);

  const seConnecter = async () => {
    setEnCours(true);
    try {
      const data = await api.connexion(email, motDePasse);
      const tokenRecu = data.access_token;
      setChargement(true);
      const profil = await api.fetchProfil(tokenRecu);
      const [seances, cours] = await Promise.all([
        api.fetchSeances(profil.groupe),
        api.fetchCours(),
      ]);
      const etudiants = profil.role === "enseignant" ? await api.fetchEtudiants(tokenRecu) : [];
      const utilisateurs = profil.role === "admin" ? await api.fetchTousUtilisateurs(tokenRecu) : [];
      onSuccess({ token: tokenRecu, profil, seances, cours, etudiants, utilisateurs });
    } catch (err) {
      toast.error(err.message || "Erreur de connexion");
    } finally {
      setEnCours(false);
      setChargement(false);
    }
  };

  const sInscrire = async () => {
    if (!nom || !email || !motDePasse) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    try {
      await api.inscrire({ nom, email, mot_de_passe: motDePasse, role: "etudiant", groupe: groupe || null });
      toast.success("Compte créé ! Vous pouvez vous connecter.");
      setMode("connexion");
      setNom("");
      setGroupe("");
      setMotDePasse("");
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="login-page">
      <button className="login-theme-btn" onClick={() => setModeSombre(!modeSombre)}
        title={modeSombre ? "Mode clair" : "Mode sombre"}>
        {modeSombre ? "☀️" : "🌙"}
      </button>
      <div className="login-split">
        <div className="login-branding">
          <div className="login-branding-inner">
            <div className="login-logo">🎓</div>
            <h1 className="login-titre-brand">Chatbot<br />Universitaire</h1>
            <p className="login-slogan">Votre assistant intelligent pour la vie universitaire</p>
            <ul className="login-features">
              <li><span className="feature-icon">📅</span> Consultez votre emploi du temps</li>
              <li><span className="feature-icon">📚</span> Accédez à vos cours</li>
              <li><span className="feature-icon">🤖</span> Posez vos questions à l'IA</li>
              <li><span className="feature-icon">👨‍🏫</span> Gérez vos séances (enseignants)</li>
            </ul>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-card">
            <div className="login-tabs">
              <button className={`login-tab ${mode === "connexion" ? "active" : ""}`}
                onClick={() => setMode("connexion")}>Connexion</button>
              <button className={`login-tab ${mode === "inscription" ? "active" : ""}`}
                onClick={() => setMode("inscription")}>Inscription</button>
            </div>

            {mode === "connexion" ? (
              <>
                <p className="sous-titre">Bienvenue ! Connectez-vous pour continuer.</p>
                <div className="champ-wrapper">
                  <span className="champ-icone">✉️</span>
                  <input className="champ champ-avec-icone" type="email" placeholder="Adresse email"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="champ-wrapper">
                  <span className="champ-icone">🔒</span>
                  <input className="champ champ-avec-icone" type="password" placeholder="Mot de passe"
                    value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !enCours && seConnecter()} />
                </div>
                <button className="btn-principal" onClick={seConnecter} disabled={enCours}>
                  {enCours ? <span className="spinner-btn"></span> : "Se connecter"}
                </button>
              </>
            ) : (
              <>
                <p className="sous-titre">Créez votre espace étudiant gratuitement.</p>
                <div className="champ-wrapper">
                  <span className="champ-icone">👤</span>
                  <input className="champ champ-avec-icone" type="text" placeholder="Nom complet"
                    value={nom} onChange={(e) => setNom(e.target.value)} />
                </div>
                <div className="champ-wrapper">
                  <span className="champ-icone">✉️</span>
                  <input className="champ champ-avec-icone" type="email" placeholder="Adresse email"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="champ-wrapper">
                  <span className="champ-icone">🔒</span>
                  <input className="champ champ-avec-icone" type="password" placeholder="Mot de passe"
                    value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
                </div>
                <div className="champ-wrapper">
                  <span className="champ-icone">🏫</span>
                  <input className="champ champ-avec-icone" type="text" placeholder="Groupe (ex : L3-INFO-G1)"
                    value={groupe} onChange={(e) => setGroupe(e.target.value)} />
                </div>
                <button className="btn-principal" onClick={sInscrire}>Créer mon compte</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
