import { useState, useRef, useEffect } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

const API_URL = "http://localhost:8001";

function App() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [mode, setMode] = useState("connexion");
  const [nomInscription, setNomInscription] = useState("");
  const [groupeInscription, setGroupeInscription] = useState("");
  const [message, setMessage] = useState("");
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [copieIndex, setCopieIndex] = useState(null);
  const [sectionActive, setSectionActive] = useState("emploi");
  const [heureActuelle, setHeureActuelle] = useState(
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
  const [profil, setProfil] = useState(null);
  const [seances, setSeances] = useState([]);
  const [cours, setCours] = useState([]);

  const [conversation, setConversation] = useState([]);
  const [questionChat, setQuestionChat] = useState("");
  const [chatEnCours, setChatEnCours] = useState(false);
  const finChatRef = useRef(null);

  const [token, setToken] = useState(null);
  const [showFormSeance, setShowFormSeance] = useState(false);
  const [nouvelleSeance, setNouvelleSeance] = useState({
    matiere: "", salle: "", groupe: "", type_seance: "CM",
    date_seance: "", heure_debut: "", heure_fin: "",
  });
  const [messageSeance, setMessageSeance] = useState("");
  const [rechercheCours, setRechercheCours] = useState("");
  const [showFormCours, setShowFormCours] = useState(false);
  const [nouveauCours, setNouveauCours] = useState({ titre: "", module: "", semestre: "", contenu: "" });
  const [messageCours, setMessageCours] = useState("");
  const [etudiants, setEtudiants] = useState([]);
  const [rechercheEtu, setRechercheEtu] = useState("");

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, chatEnCours]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeureActuelle(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!profil) return;
    const ids = ["emploi", "cours", "etudiants", "chat"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setSectionActive(e.target.id); });
      },
      { threshold: 0.3 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [profil]);

  const effacerConversation = () => setConversation([]);

  const getInitiales = (nom) => {
    if (!nom) return "?";
    const mots = nom.trim().split(" ");
    if (mots.length === 1) return mots[0][0].toUpperCase();
    return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
  };

  const seConnecter = async () => {
    setConnexionEnCours(true);
    setMessage("");
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
        setConnexionEnCours(false);
        return;
      }

      const data = await reponse.json();
      const tokenRecu = data.access_token;
      setToken(tokenRecu);

      const reponseProfil = await fetch(`${API_URL}/moi`, {
        headers: { Authorization: `Bearer ${tokenRecu}` },
      });
      const profilData = await reponseProfil.json();
      setProfil(profilData);
      setMessage("");

      if (profilData.role === "enseignant") {
        const repEtu = await fetch(`${API_URL}/etudiants`, {
          headers: { Authorization: `Bearer ${tokenRecu}` },
        });
        setEtudiants(await repEtu.json());
      }

      const groupe = profilData.groupe;
      const urlSeances = groupe
        ? `${API_URL}/seances?groupe=${encodeURIComponent(groupe)}`
        : `${API_URL}/seances`;
      const reponseSeances = await fetch(urlSeances);
      setSeances(await reponseSeances.json());

      const reponseCours = await fetch(`${API_URL}/cours`);
      setCours(await reponseCours.json());
    } catch (erreur) {
      setMessage("Erreur de connexion au serveur");
    }
    setConnexionEnCours(false);
  };

  const seDeconnecter = () => {
    setProfil(null);
    setToken(null);
    setSeances([]);
    setCours([]);
    setEmail("");
    setMotDePasse("");
    setMessage("");
    setConversation([]);
    setShowFormSeance(false);
    setMessageSeance("");
    setShowFormCours(false);
    setMessageCours("");
    setEtudiants([]);
    setRechercheEtu("");
  };

  const envoyerQuestion = async () => {
    if (!questionChat.trim()) return;
    const maQuestion = questionChat;
    const maintenant = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setConversation((c) => [...c, { role: "etudiant", texte: maQuestion, heure: maintenant() }]);
    setQuestionChat("");
    setChatEnCours(true);
    try {
      const reponse = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: maQuestion }),
      });
      const data = await reponse.json();
      setConversation((c) => [...c, { role: "bot", texte: data.reponse, intention: data.intention, heure: maintenant() }]);
    } catch (erreur) {
      setConversation((c) => [...c, { role: "bot", texte: "Erreur de connexion au chatbot.", heure: maintenant() }]);
    }
    setChatEnCours(false);
  };

  const envoyerSuggestion = async (texte) => {
    const maintenant = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setConversation((c) => [...c, { role: "etudiant", texte, heure: maintenant() }]);
    setChatEnCours(true);
    try {
      const reponse = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: texte }),
      });
      const data = await reponse.json();
      setConversation((c) => [...c, { role: "bot", texte: data.reponse, intention: data.intention, heure: maintenant() }]);
    } catch (erreur) {
      setConversation((c) => [...c, { role: "bot", texte: "Erreur de connexion au chatbot.", heure: maintenant() }]);
    }
    setChatEnCours(false);
  };

  const ajouterSeance = async () => {
    const { matiere, salle, groupe, date_seance, heure_debut, heure_fin } = nouvelleSeance;
    if (!matiere || !salle || !groupe || !date_seance || !heure_debut || !heure_fin) {
      setMessageSeance("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setMessageSeance("Ajout en cours...");
    try {
      const reponse = await fetch(`${API_URL}/seances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...nouvelleSeance, enseignant: profil.nom }),
      });
      if (!reponse.ok) {
        const err = await reponse.json();
        setMessageSeance(err.detail || "Erreur lors de l'ajout");
        return;
      }
      setMessageSeance("Séance ajoutée avec succès !");
      setShowFormSeance(false);
      setNouvelleSeance({ matiere: "", salle: "", groupe: "", type_seance: "CM", date_seance: "", heure_debut: "", heure_fin: "" });
      const r = await fetch(`${API_URL}/seances`);
      setSeances(await r.json());
    } catch {
      setMessageSeance("Erreur de connexion au serveur");
    }
  };

  const ajouterCours = async () => {
    const { titre, module, semestre, contenu } = nouveauCours;
    if (!titre || !module || !semestre || !contenu) {
      setMessageCours("Veuillez remplir tous les champs.");
      return;
    }
    setMessageCours("Ajout en cours...");
    try {
      const reponse = await fetch(`${API_URL}/cours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...nouveauCours, enseignant: profil.nom }),
      });
      if (!reponse.ok) {
        const err = await reponse.json();
        setMessageCours(err.detail || "Erreur lors de l'ajout");
        return;
      }
      setMessageCours("Cours ajouté avec succès !");
      setShowFormCours(false);
      setNouveauCours({ titre: "", module: "", semestre: "", contenu: "" });
      const r = await fetch(`${API_URL}/cours`);
      setCours(await r.json());
    } catch {
      setMessageCours("Erreur de connexion au serveur");
    }
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
    const estSucces = message.toLowerCase().includes("créé") || message.toLowerCase().includes("connecter");
    return (
      <div className="login-page">
        <div className="login-split">
          {/* Panneau gauche — branding */}
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

          {/* Panneau droit — formulaire */}
          <div className="login-form-panel">
            <div className="login-card">
              <div className="login-tabs">
                <button className={`login-tab ${mode === "connexion" ? "active" : ""}`}
                  onClick={() => { setMode("connexion"); setMessage(""); }}>
                  Connexion
                </button>
                <button className={`login-tab ${mode === "inscription" ? "active" : ""}`}
                  onClick={() => { setMode("inscription"); setMessage(""); }}>
                  Inscription
                </button>
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
                      onKeyDown={(e) => e.key === "Enter" && !connexionEnCours && seConnecter()} />
                  </div>
                  <button className="btn-principal" onClick={seConnecter} disabled={connexionEnCours}>
                    {connexionEnCours ? <span className="spinner-btn"></span> : "Se connecter"}
                  </button>
                </>
              ) : (
                <>
                  <p className="sous-titre">Créez votre espace étudiant gratuitement.</p>
                  <div className="champ-wrapper">
                    <span className="champ-icone">👤</span>
                    <input className="champ champ-avec-icone" type="text" placeholder="Nom complet"
                      value={nomInscription} onChange={(e) => setNomInscription(e.target.value)} />
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
                      value={groupeInscription} onChange={(e) => setGroupeInscription(e.target.value)} />
                  </div>
                  <button className="btn-principal" onClick={sInscrire}>Créer mon compte</button>
                </>
              )}

              {message && (
                <div className={`alerte ${estSucces ? "alerte-succes" : "alerte-erreur"}`}>
                  <span>{estSucces ? "✅" : "⚠️"}</span> {message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== TABLEAU DE BORD =====
  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return (
    <div>
      <nav className="navbar">
        <div className="navbar-titre">🎓 Chatbot Universitaire</div>

        <div className="navbar-liens">
          {[
            { id: "emploi", label: "📅 Emploi du temps" },
            { id: "cours",  label: "📚 Cours" },
            ...(profil.role === "enseignant" ? [{ id: "etudiants", label: "👥 Étudiants" }] : []),
            { id: "chat",   label: "🤖 Assistant" },
          ].map(({ id, label }) => (
            <a
              key={id}
              className={`navbar-lien ${sectionActive === id ? "actif" : ""}`}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {label}
            </a>
          ))}
        </div>

        <div className="navbar-date">
          📅 {dateAujourdhui.charAt(0).toUpperCase() + dateAujourdhui.slice(1)}
        </div>

        <div className="navbar-user">
          <div className="avatar">{getInitiales(profil.nom)}</div>
          <span>{profil.nom}</span>
          <span className={`badge-role badge-role-${profil.role}`}>{profil.role}</span>
          <button className="btn-deconnexion" onClick={seDeconnecter} title="Déconnexion">⏻</button>
        </div>
      </nav>

      <div className="contenu">

        {/* Message de bienvenue */}
        <div className="bienvenue-banner">
          <div>
            <h2 className="bienvenue-titre">
              {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir"}, {profil.nom.split(" ")[0]} 👋
            </h2>
            <p className="bienvenue-sous">
              {dateAujourdhui.charAt(0).toUpperCase() + dateAujourdhui.slice(1)}
              {" · "}<span className="bienvenue-heure">🕐 {heureActuelle}</span>
              {profil.role === "etudiant" && profil.groupe ? ` · Groupe ${profil.groupe}` : ""}
              {profil.role === "enseignant" ? " · Espace enseignant" : ""}
            </p>
          </div>
          {(() => {
            const aujourd = new Date().toISOString().slice(0, 10);
            const prochaine = seances.find((s) => s.date_seance >= aujourd);
            return prochaine ? (
              <div className="bienvenue-prochaine">
                <span className="prochaine-label">Prochaine séance</span>
                <span className="prochaine-info">
                  <strong>{prochaine.matiere}</strong> · {prochaine.date_seance} · {prochaine.heure_debut.slice(0,5)} · {prochaine.salle}
                </span>
              </div>
            ) : null;
          })()}
        </div>

        <div className="stats-grille">
          <div className="stat-carte stat-bleu">
            <span className="stat-icone">📅</span>
            <span className="stat-valeur">{seances.length}</span>
            <span className="stat-label">Séances</span>
          </div>
          <div className="stat-carte stat-vert">
            <span className="stat-icone">📚</span>
            <span className="stat-valeur">{cours.length}</span>
            <span className="stat-label">Cours</span>
          </div>
          <div className="stat-carte stat-violet">
            <span className="stat-icone">📖</span>
            <span className="stat-valeur">{new Set(seances.map((s) => s.matiere)).size}</span>
            <span className="stat-label">Matières</span>
          </div>
          <div className="stat-carte stat-orange">
            <span className="stat-icone">👨‍🏫</span>
            <span className="stat-valeur">{new Set(seances.map((s) => s.enseignant)).size}</span>
            <span className="stat-label">Enseignants</span>
          </div>
        </div>

        {profil.role === "enseignant" && (
          <div className="panneau-enseignant">
            <div className="panneau-enseignant-header">
              <h2 className="section-titre" style={{ margin: 0 }}>Gestion des séances</h2>
              <button
                className={`btn-ajouter-seance ${showFormSeance ? "btn-annuler" : ""}`}
                onClick={() => { setShowFormSeance(!showFormSeance); setMessageSeance(""); }}
              >
                {showFormSeance ? "Annuler" : "+ Nouvelle séance"}
              </button>
            </div>

            {showFormSeance && (
              <div className="carte form-seance">
                <div className="grille-form">
                  <div className="champ-groupe">
                    <label className="champ-label">Matière *</label>
                    <input className="champ" type="text" placeholder="ex : Algorithmique"
                      value={nouvelleSeance.matiere}
                      onChange={(e) => setNouvelleSeance({ ...nouvelleSeance, matiere: e.target.value })} />
                  </div>
                  <div className="champ-groupe">
                    <label className="champ-label">Salle *</label>
                    <input className="champ" type="text" placeholder="ex : B204"
                      value={nouvelleSeance.salle}
                      onChange={(e) => setNouvelleSeance({ ...nouvelleSeance, salle: e.target.value })} />
                  </div>
                  <div className="champ-groupe">
                    <label className="champ-label">Groupe *</label>
                    <input className="champ" type="text" placeholder="ex : L3-INFO-G1"
                      value={nouvelleSeance.groupe}
                      onChange={(e) => setNouvelleSeance({ ...nouvelleSeance, groupe: e.target.value })} />
                  </div>
                  <div className="champ-groupe">
                    <label className="champ-label">Type</label>
                    <select className="champ champ-select"
                      value={nouvelleSeance.type_seance}
                      onChange={(e) => setNouvelleSeance({ ...nouvelleSeance, type_seance: e.target.value })}>
                      <option value="CM">CM</option>
                      <option value="TD">TD</option>
                      <option value="TP">TP</option>
                    </select>
                  </div>
                  <div className="champ-groupe">
                    <label className="champ-label">Date *</label>
                    <input className="champ" type="date"
                      value={nouvelleSeance.date_seance}
                      onChange={(e) => setNouvelleSeance({ ...nouvelleSeance, date_seance: e.target.value })} />
                  </div>
                  <div className="champ-groupe">
                    <label className="champ-label">Heure début *</label>
                    <input className="champ" type="time"
                      value={nouvelleSeance.heure_debut}
                      onChange={(e) => setNouvelleSeance({ ...nouvelleSeance, heure_debut: e.target.value })} />
                  </div>
                  <div className="champ-groupe">
                    <label className="champ-label">Heure fin *</label>
                    <input className="champ" type="time"
                      value={nouvelleSeance.heure_fin}
                      onChange={(e) => setNouvelleSeance({ ...nouvelleSeance, heure_fin: e.target.value })} />
                  </div>
                  <div className="champ-groupe">
                    <label className="champ-label">Enseignant</label>
                    <input className="champ champ-readonly" type="text" value={profil.nom} readOnly />
                  </div>
                </div>
                <div className="form-seance-footer">
                  <button className="btn-principal btn-valider" onClick={ajouterSeance}>
                    Ajouter la séance
                  </button>
                  {messageSeance && (
                    <p className={messageSeance.includes("succès") ? "message-succes" : "message-erreur"}>
                      {messageSeance}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <h2 id="emploi" className="section-titre">Mon emploi du temps</h2>
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

        <div className="panneau-enseignant-header" style={{ marginTop: 32, marginBottom: 16 }}>
          <h2 id="cours" className="section-titre" style={{ margin: 0 }}>Mes cours</h2>
          {profil.role === "enseignant" && (
            <button
              className={`btn-ajouter-seance ${showFormCours ? "btn-annuler" : ""}`}
              onClick={() => { setShowFormCours(!showFormCours); setMessageCours(""); }}
            >
              {showFormCours ? "Annuler" : "+ Nouveau cours"}
            </button>
          )}
        </div>

        {profil.role === "enseignant" && showFormCours && (
          <div className="carte form-seance" style={{ marginBottom: 24 }}>
            <div className="grille-form">
              <div className="champ-groupe" style={{ gridColumn: "1 / -1" }}>
                <label className="champ-label">Titre *</label>
                <input className="champ" type="text" placeholder="ex : Introduction à l'Intelligence Artificielle"
                  value={nouveauCours.titre}
                  onChange={(e) => setNouveauCours({ ...nouveauCours, titre: e.target.value })} />
              </div>
              <div className="champ-groupe">
                <label className="champ-label">Matière *</label>
                <input className="champ" type="text" placeholder="ex : Intelligence Artificielle"
                  value={nouveauCours.module}
                  onChange={(e) => setNouveauCours({ ...nouveauCours, module: e.target.value })} />
              </div>
              <div className="champ-groupe">
                <label className="champ-label">Semestre *</label>
                <input className="champ" type="text" placeholder="ex : S5"
                  value={nouveauCours.semestre}
                  onChange={(e) => setNouveauCours({ ...nouveauCours, semestre: e.target.value })} />
              </div>
              <div className="champ-groupe">
                <label className="champ-label">Enseignant</label>
                <input className="champ champ-readonly" type="text" value={profil.nom} readOnly />
              </div>
              <div className="champ-groupe" style={{ gridColumn: "1 / -1" }}>
                <label className="champ-label">Contenu *</label>
                <textarea className="champ champ-textarea" rows={4}
                  placeholder="Décrivez le contenu du cours..."
                  value={nouveauCours.contenu}
                  onChange={(e) => setNouveauCours({ ...nouveauCours, contenu: e.target.value })} />
              </div>
            </div>
            <div className="form-seance-footer">
              <button className="btn-principal btn-valider" onClick={ajouterCours}>Ajouter le cours</button>
              {messageCours && (
                <p className={messageCours.includes("succès") ? "message-succes" : "message-erreur"}>{messageCours}</p>
              )}
            </div>
          </div>
        )}

        {cours.length > 0 && (
          <div className="barre-recherche-cours">
            <span className="icone-recherche">🔍</span>
            <input
              className="input-recherche-cours"
              type="text"
              placeholder="Rechercher par titre, matière ou enseignant..."
              value={rechercheCours}
              onChange={(e) => setRechercheCours(e.target.value)}
            />
            {rechercheCours && (
              <button className="btn-effacer-recherche" onClick={() => setRechercheCours("")}>✕</button>
            )}
          </div>
        )}
        {cours.length === 0 ? (
          <p>Aucun cours disponible.</p>
        ) : (() => {
          const terme = rechercheCours.toLowerCase();
          const coursFiltres = cours.filter((c) =>
            c.titre.toLowerCase().includes(terme) ||
            c.module.toLowerCase().includes(terme) ||
            c.enseignant.toLowerCase().includes(terme)
          );
          return coursFiltres.length === 0 ? (
            <p className="aucun-resultat">Aucun cours ne correspond à « {rechercheCours} ».</p>
          ) : (
            <div className="grille-cours">
              {coursFiltres.map((c) => (
                <div className="carte-cours" key={c._id}>
                  {profil.role === "enseignant" && (
                    <button className="btn-supprimer-cours" title="Supprimer ce cours"
                      onClick={async () => {
                        if (!confirm(`Supprimer « ${c.titre} » ?`)) return;
                        await fetch(`${API_URL}/cours/${c._id}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        setCours((prev) => prev.filter((x) => x._id !== c._id));
                      }}>✕</button>
                  )}
                  <h3>{c.titre}</h3>
                  <p className="meta">{c.module} — {c.semestre}</p>
                  <p className="meta">Enseignant : {c.enseignant}</p>
                  <p className="contenu-cours">
                    {c.contenu.length > 120 ? c.contenu.slice(0, 120) + "..." : c.contenu}
                  </p>
                </div>
              ))}
            </div>
          );
        })()}

        {profil.role === "enseignant" && (
          <div>
            <h2 id="etudiants" className="section-titre">Liste des étudiants</h2>
            <div className="barre-recherche-cours" style={{ marginBottom: 16 }}>
              <span className="icone-recherche">🔍</span>
              <input
                className="input-recherche-cours"
                type="text"
                placeholder="Rechercher par nom, email ou groupe..."
                value={rechercheEtu}
                onChange={(e) => setRechercheEtu(e.target.value)}
              />
              {rechercheEtu && (
                <button className="btn-effacer-recherche" onClick={() => setRechercheEtu("")}>✕</button>
              )}
            </div>
            {etudiants.length === 0 ? (
              <p>Aucun étudiant inscrit.</p>
            ) : (() => {
              const t = rechercheEtu.toLowerCase();
              const filtres = etudiants.filter((e) =>
                e.nom.toLowerCase().includes(t) ||
                e.email.toLowerCase().includes(t) ||
                (e.groupe || "").toLowerCase().includes(t)
              );
              if (filtres.length === 0)
                return <p className="aucun-resultat">Aucun étudiant ne correspond à « {rechercheEtu} ».</p>;

              // Regrouper par groupe
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
                <div className="groupes-etudiants">
                  {clesTriees.map((groupe) => (
                    <div className="bloc-groupe" key={groupe}>
                      <div className="bloc-groupe-header">
                        <span className="badge-groupe">{groupe}</span>
                        <span className="compteur-groupe">{groupes[groupe].length} étudiant{groupes[groupe].length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="carte">
                        <table>
                          <thead>
                            <tr><th>Nom</th><th>Email</th></tr>
                          </thead>
                          <tbody>
                            {groupes[groupe].map((e) => (
                              <tr key={e.id}>
                                <td>
                                  <div className="etu-nom">
                                    <div className="avatar avatar-sm">{e.nom.trim().split(" ").map(m => m[0]).join("").slice(0, 2).toUpperCase()}</div>
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
              );
            })()}
            <p className="compteur-etu">{etudiants.length} étudiant{etudiants.length > 1 ? "s" : ""} inscrits au total</p>
          </div>
        )}

        <h2 id="chat" className="section-titre">Assistant virtuel</h2>
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
                {msg.role === "bot" && (
                  <div className="chat-avatar chat-avatar-bot">🤖</div>
                )}
                <div className="bulle-contenu">
                  <div className={`bulle ${msg.role}`}>
                    <ReactMarkdown>{msg.texte}</ReactMarkdown>
                    {msg.intention && (
                      <span className={`badge-intention badge-${msg.intention}`}>
                        {msg.intention.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <div className="msg-footer">
                    {msg.heure && <span className="msg-heure">{msg.heure}</span>}
                    <div className="msg-actions">
                      {msg.role === "bot" && (
                        <button
                          className="msg-action-btn"
                          title="Copier la réponse"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.texte);
                            setCopieIndex(i);
                            setTimeout(() => setCopieIndex(null), 2000);
                          }}
                        >
                          {copieIndex === i ? "✅ Copié" : "📋 Copier"}
                        </button>
                      )}
                      {msg.role === "etudiant" && (
                        <button
                          className="msg-action-btn"
                          title="Renvoyer cette question"
                          onClick={() => !chatEnCours && envoyerSuggestion(msg.texte)}
                          disabled={chatEnCours}
                        >
                          ↺ Renvoyer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {msg.role === "etudiant" && (
                  <div className="chat-avatar chat-avatar-etu">{getInitiales(profil.nom)}</div>
                )}
              </div>
            ))}
            {chatEnCours && (
              <div className="bulle-ligne bot">
                <div className="chat-avatar chat-avatar-bot">🤖</div>
                <div className="bulle-contenu">
                  <div className="bulle bot points-animes">
                    <span></span><span></span><span></span>
                  </div>
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