import { useState } from "react";

const API_URL = "http://localhost:8001";

function App() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [message, setMessage] = useState("");
  const [profil, setProfil] = useState(null);
  const [seances, setSeances] = useState([]);

  // État du chat
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
      const seancesData = await reponseSeances.json();
      setSeances(seancesData);
    } catch (erreur) {
      setMessage("Erreur de connexion au serveur");
    }
  };

  const seDeconnecter = () => {
    setProfil(null);
    setSeances([]);
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
      setConversation((c) => [...c, { role: "bot", texte: data.reponse }]);
    } catch (erreur) {
      setConversation((c) => [...c, { role: "bot", texte: "Erreur de connexion au chatbot." }]);
    }
    setChatEnCours(false);
  };

  // ÉCRAN DE CONNEXION
  if (!profil) {
    return (
      <div style={{ maxWidth: "400px", margin: "80px auto", fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ textAlign: "center" }}>Chatbot Universitaire</h1>
        <h2 style={{ textAlign: "center", color: "#555" }}>Connexion</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} style={{ padding: "10px", fontSize: "16px" }} />
          <input type="password" placeholder="Mot de passe" value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)} style={{ padding: "10px", fontSize: "16px" }} />
          <button onClick={seConnecter}
            style={{ padding: "10px", fontSize: "16px", cursor: "pointer", background: "#185FA5", color: "white", border: "none" }}>
            Se connecter
          </button>
        </div>
        {message && <p style={{ textAlign: "center", marginTop: "16px" }}>{message}</p>}
      </div>
    );
  }

  // TABLEAU DE BORD + CHAT
  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Bonjour, {profil.nom}</h1>
        <button onClick={seDeconnecter}
          style={{ padding: "8px 16px", cursor: "pointer", background: "#A32D2D", color: "white", border: "none" }}>
          Déconnexion
        </button>
      </div>
      <p style={{ color: "#555" }}>Rôle : {profil.role} — {profil.email}</p>

      <h2 style={{ marginTop: "30px" }}>Mon emploi du temps</h2>
      {seances.length === 0 ? (
        <p>Aucune séance enregistrée.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
          <thead>
            <tr style={{ background: "#185FA5", color: "white" }}>
              <th style={{ padding: "10px", textAlign: "left" }}>Matière</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Enseignant</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Salle</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Groupe</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Date</th>
              <th style={{ padding: "10px", textAlign: "left" }}>Horaire</th>
            </tr>
          </thead>
          <tbody>
            {seances.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "10px" }}>{s.matiere}</td>
                <td style={{ padding: "10px" }}>{s.enseignant}</td>
                <td style={{ padding: "10px" }}>{s.salle}</td>
                <td style={{ padding: "10px" }}>{s.groupe}</td>
                <td style={{ padding: "10px" }}>{s.date_seance}</td>
                <td style={{ padding: "10px" }}>{s.heure_debut} - {s.heure_fin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: "40px" }}>Assistant virtuel</h2>
      <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", minHeight: "200px" }}>
        <div style={{ marginBottom: "16px", maxHeight: "300px", overflowY: "auto" }}>
          {conversation.length === 0 && (
            <p style={{ color: "#888" }}>Posez une question sur vos cours, votre emploi du temps ou la vie universitaire.</p>
          )}
          {conversation.map((msg, i) => (
            <div key={i} style={{ textAlign: msg.role === "etudiant" ? "right" : "left", margin: "8px 0" }}>
              <span style={{
                display: "inline-block", padding: "8px 12px", borderRadius: "12px", maxWidth: "70%",
                background: msg.role === "etudiant" ? "#185FA5" : "#EAF3DE",
                color: msg.role === "etudiant" ? "white" : "#222",
              }}>
                {msg.texte}
              </span>
            </div>
          ))}
          {chatEnCours && <p style={{ color: "#888", fontStyle: "italic" }}>L'assistant réfléchit...</p>}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Votre question..."
            value={questionChat}
            onChange={(e) => setQuestionChat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyerQuestion()}
            style={{ flex: 1, padding: "10px", fontSize: "16px" }}
          />
          <button onClick={envoyerQuestion} disabled={chatEnCours}
            style={{ padding: "10px 20px", cursor: "pointer", background: "#185FA5", color: "white", border: "none" }}>
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;