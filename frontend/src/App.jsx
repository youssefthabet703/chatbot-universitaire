import { useState } from "react";

const API_URL = "http://localhost:8001";

function App() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [message, setMessage] = useState("");
  const [profil, setProfil] = useState(null);

  const seConnecter = async () => {
    setMessage("Connexion en cours...");
    try {
      // 1. Demander un jeton à l'API
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

      // 2. Utiliser le jeton pour récupérer le profil
      const reponseProfil = await fetch(`${API_URL}/moi`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profilData = await reponseProfil.json();

      setProfil(profilData);
      setMessage("Connexion réussie !");
    } catch (erreur) {
      setMessage("Erreur de connexion au serveur");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Chatbot Universitaire</h1>
      <h2 style={{ textAlign: "center", color: "#555" }}>Connexion</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <button
          onClick={seConnecter}
          style={{ padding: "10px", fontSize: "16px", cursor: "pointer", background: "#185FA5", color: "white", border: "none" }}
        >
          Se connecter
        </button>
      </div>

      {message && <p style={{ textAlign: "center", marginTop: "16px" }}>{message}</p>}

      {profil && (
        <div style={{ marginTop: "20px", padding: "16px", background: "#EAF3DE", borderRadius: "8px" }}>
          <p><strong>Bienvenue, {profil.nom} !</strong></p>
          <p>Email : {profil.email}</p>
          <p>Rôle : {profil.role}</p>
        </div>
      )}
    </div>
  );
}

export default App;