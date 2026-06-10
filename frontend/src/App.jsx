import { useState, useRef, useEffect } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

const API_URL = "http://localhost:8001";

function App() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [mode, setMode] = useState("connexion"); // "connexion" ou "inscription"
  const [nomInscription, setNomInscription] = useState("");
  const [groupeInscription, setGroupeInscription] = useState("");
  const [message, setMessage] = useState("");
  const [profil, setProfil] = useState(null);
  const [seances, setSeances] = useState([]);
  const [cours, setCours] = useState([]);

  const [conversation, setConversation] = useState([]);
  const [questionChat, setQuestionChat] = useState("");
  const [chatEnCours, setChatEnCours] = useState(false);
  const finChatRef = useRef(null);

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, chatEnCours]);

  const effacerConversation = () => setConversation([]);

  const seConnecter = async () => {
    setMessage("Connexion en cours...");
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", motDePasse);

      const reponse = await fetch(`${API_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!reponse.ok) {
        setMessage("Email ou mot de passe incorrect");
        return;
      }

      const data = await reponse.json();
      const token = data.access_token;

      const reponseProfil = await fetch(`${API_URL}/moi`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profilData = await reponseProfil.json();
      setProfil(profilData);
      setMessage("");
      const groupe = profilData.groupe;
      const urlSeances = groupe
        ? `${API_URL}/seances?groupe=${encodeURIComponent(groupe)}`
        : `${API_URL}/seances`;
      const reponseSeances = await fetch(urlSeances);
      setSeances(await reponseSeances.json());;

     const reponseCours = await fetch(`${API_URL}/cours`);
      setCours(await reponseCours.json());
    } catch (erreur) {
      setMessage("Erreur de connexion au serveur");
    }
  };

  const seDeconnecter = () => {
    setProfil(null);
    setSeances([]);
    setCours([]);
    setEmail("");
    setMotDePasse("");
    setMessage("");
    setConversation([]);
  };

  const envoyerQuestion = async () => {
    if (!questionChat.trim()) return;
    const maQuestion = questionChat;
    setConversation((c) => [...c, { role: "etudiant", texte: maQuestion }]);
    setQuestionChat("");
    setChatEnCours(true);
    try {
      const reponse = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: maQuestion }),
      });
      const data = await reponse.json();
      setConversation((c) => [...c, { role: "bot", texte: data.reponse, intention: data.intention }]);
    } catch (erreur) {
      setConversation((c) => [...c, { role: "bot", texte: "Erreur de connexion au chatbot." }]);
    }
    setChatEnCours(false);
  };

  const envoyerSuggestion = async (texte) => {
    setConversation((c) => [...c, { role: "etudiant", texte }]);
    setChatEnCours(true);
    try {
      const reponse = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: texte }),
      });
      const data = await reponse.json();
      setConversation((c) => [...c, { role: "bot", texte: data.reponse, intention: data.intention }]);
    } catch (erreur) {
      setConversation((c) => [...c, { role: "bot", texte: "Erreur de connexion au chatbot." }]);
    }
    setChatEnCours(false);
  };
  const sInscrire = async () => {
    if (!nomInscription || !email || !motDePasse) {
      setMessage("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setMessage("Création du compte...");
    try {
      const reponse = await fetch(`${API_URL}/utilisateurs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nomInscription,
          email: email,
          mot_de_passe: motDePasse,
          role: "etudiant",
          groupe: groupeInscription || null,
        }),
      });
      if (!reponse.ok) {
        const err = await reponse.json();
        setMessage(err.detail || "Erreur lors de l'inscription");
        return;
      }
      setMessage("Compte créé ! Vous pouvez vous connecter.");
      setMode("connexion");
      setNomInscription("");
      setGroupeInscription("");
      setMotDePasse("");
    } catch (erreur) {
      setMessage("Erreur de connexion au serveur");
    }
  };

  // ===== ÉCRAN DE CONNEXION / INSCRIPTION =====
  if (!profil) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Chatbot Universitaire</h1>
          {mode === "connexion" ? (
            <>
              <p className="sous-titre">Connectez-vous à votre espace étudiant</p>
              <input className="champ" type="email" placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="champ" type="password" placeholder="Mot de passe"
                value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && seConnecter()} />
              <button className="btn-principal" onClick={seConnecter}>Se connecter</button>
              <p className="bascule-auth">
                Pas encore de compte ?{" "}
                <span onClick={() => { setMode("inscription"); setMessage(""); }}>S'inscrire</span>
              </p>
            </>
          ) : (
            <>
              <p className="sous-titre">Créez votre compte étudiant</p>
              <input className="champ" type="text" placeholder="Nom complet"
                value={nomInscription} onChange={(e) => setNomInscription(e.target.value)} />
              <input className="champ" type="email" placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="champ" type="password" placeholder="Mot de passe"
                value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
              <input className="champ" type="text" placeholder="Groupe (ex : L3-INFO-G1)"
                value={groupeInscription} onChange={(e) => setGroupeInscription(e.target.value)} />
              <button className="btn-principal" onClick={sInscrire}>Créer mon compte</button>
              <p className="bascule-auth">
                Déjà un compte ?{" "}
                <span onClick={() => { setMode("connexion"); setMessage(""); }}>Se connecter</span>
              </p>
            </>
          )}
          {message && <p className="message-erreur">{message}</p>}
        </div>
      </div>
    );
  }

  // ===== TABLEAU DE BORD =====
  return (
    <div>
      <nav className="navbar">
        <div className="navbar-titre">Chatbot Universitaire</div>
        <div className="navbar-user">
          <span>{profil.nom} · {profil.role}</span>
          <button className="btn-deconnexion" onClick={seDeconnecter}>Déconnexion</button>
        </div>
      </nav>

      <div className="contenu">
        <div className="stats-grille">
          <div className="stat-carte">
            <span className="stat-valeur">{seances.length}</span>
            <span className="stat-label">Séances</span>
          </div>
          <div className="stat-carte">
            <span className="stat-valeur">{cours.length}</span>
            <span className="stat-label">Cours</span>
          </div>
          <div className="stat-carte">
            <span className="stat-valeur">{new Set(seances.map((s) => s.matiere)).size}</span>
            <span className="stat-label">Matières</span>
          </div>
          <div className="stat-carte">
            <span className="stat-valeur">{new Set(seances.map((s) => s.enseignant)).size}</span>
            <span className="stat-label">Enseignants</span>
          </div>
        </div>

        <h2 className="section-titre">Mon emploi du temps</h2>
        {seances.length === 0 ? (
          <p>Aucune séance enregistrée.</p>
        ) : (
          <div className="carte">
            <table>
              <thead>
                <tr>
                  <th>Matière</th><th>Enseignant</th><th>Salle</th>
                  <th>Groupe</th><th>Date</th><th>Horaire</th>
                </tr>
              </thead>
              <tbody>
                {seances.map((s) => (
                  <tr key={s.id}>
                    <td>{s.matiere}</td>
                    <td>{s.enseignant}</td>
                    <td>{s.salle}</td>
                    <td>{s.groupe}</td>
                    <td>{s.date_seance}</td>
                    <td>{s.heure_debut} - {s.heure_fin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="section-titre">Mes cours</h2>
        {cours.length === 0 ? (
          <p>Aucun cours disponible.</p>
        ) : (
          <div className="grille-cours">
            {cours.map((c) => (
              <div className="carte-cours" key={c._id}>
                <h3>{c.titre}</h3>
                <p className="meta">{c.module} — {c.semestre}</p>
                <p className="meta">Enseignant : {c.enseignant}</p>
                <p className="contenu-cours">
                  {c.contenu.length > 120 ? c.contenu.slice(0, 120) + "..." : c.contenu}
                </p>
              </div>
            ))}
          </div>
        )}

        <h2 className="section-titre">Assistant virtuel</h2>
        <div className="chat-box">
          {conversation.length > 0 && (
            <div className="chat-header">
              <button className="btn-effacer" onClick={effacerConversation}>Effacer la conversation</button>
            </div>
          )}
          <div className="chat-messages">
            {conversation.length === 0 && (
              <div>
                <p className="chat-vide">Posez une question, ou choisissez une suggestion :</p>
                <div className="suggestions">
                  {[
                    "Quel est mon prochain cours ?",
                    "Résume le cours de réseaux",
                    "Comment m'inscrire à la bibliothèque ?",
                    "Quelles filières si j'aime l'IA ?",
                  ].map((q, i) => (
                    <button key={i} className="suggestion-btn" onClick={() => envoyerSuggestion(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {conversation.map((msg, i) => (
              <div key={i} className={`bulle-ligne ${msg.role}`}>
                <div className={`bulle ${msg.role}`}>
                  <ReactMarkdown>{msg.texte}</ReactMarkdown>
                  {msg.intention && <span className="bulle-intention">Intention : {msg.intention}</span>}
                </div>
              </div>
            ))}
            {chatEnCours && (
              <div className="bulle-ligne bot">
                <div className="bulle bot points-animes">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={finChatRef} />
          </div>
          <div className="chat-input-zone">
            <input
              className="chat-input"
              type="text"
              placeholder="Votre question..."
              value={questionChat}
              onChange={(e) => setQuestionChat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && envoyerQuestion()}
            />
            <button className="btn-principal" style={{ width: "auto", padding: "12px 24px" }}
              onClick={envoyerQuestion} disabled={chatEnCours}>
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;