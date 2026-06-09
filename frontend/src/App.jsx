import { useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8001";

function App() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [message, setMessage] = useState("");
  const [profil, setProfil] = useState(null);
  const [seances, setSeances] = useState([]);
  const [cours, setCours] = useState([]);

  const [conversation, setConversation] = useState([]);
  const [questionChat, setQuestionChat] = useState("");
  const [chatEnCours, setChatEnCours] = useState(false);

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

      const reponseSeances = await fetch(`${API_URL}/seances`);
      setSeances(await reponseSeances.json());

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

  // ===== ÉCRAN DE CONNEXION =====
  if (!profil) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Chatbot Universitaire</h1>
          <p className="sous-titre">Connectez-vous à votre espace étudiant</p>
          <input className="champ" type="email" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="champ" type="password" placeholder="Mot de passe"
            value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && seConnecter()} />
          <button className="btn-principal" onClick={seConnecter}>Se connecter</button>
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
          <div className="chat-messages">
            {conversation.length === 0 && (
              <p className="chat-vide">Posez une question sur vos cours, votre emploi du temps ou la vie universitaire.</p>
            )}
            {conversation.map((msg, i) => (
              <div key={i} className={`bulle-ligne ${msg.role}`}>
                <div className={`bulle ${msg.role}`}>
                  {msg.texte}
                  {msg.intention && <span className="bulle-intention">Intention : {msg.intention}</span>}
                </div>
              </div>
            ))}
            {chatEnCours && <p className="chat-loading">L'assistant réfléchit...</p>}
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