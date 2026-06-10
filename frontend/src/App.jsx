import { useState, useRef, useEffect } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  GraduationCap, CalendarDays, BookOpen, Users, Bot,
  Moon, Sun, LogOut, Calendar, MessageCircle, X, Send,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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
  const [modeSombre, setModeSombre] = useState(() => localStorage.getItem("theme") === "sombre");
  const [heureActuelle, setHeureActuelle] = useState(
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
  const [profil, setProfil] = useState(null);
  const [seances, setSeances] = useState([]);
  const [cours, setCours] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [semaineOffset, setSemaineOffset] = useState(0);
  const [vueEmploi, setVueEmploi] = useState("semaine");

  const [conversation, setConversation] = useState([]);
  const [questionChat, setQuestionChat] = useState("");
  const [chatEnCours, setChatEnCours] = useState(false);
  const finChatRef = useRef(null);

  const [token, setToken] = useState(null);
  const [chatOuvert, setChatOuvert] = useState(false);
  const [convFlottante, setConvFlottante] = useState([]);
  const [questionFlottante, setQuestionFlottante] = useState("");
  const [flottantEnCours, setFlottantEnCours] = useState(false);
  const [nonLus, setNonLus] = useState(0);
  const finFlottantRef = useRef(null);
  const [showFormSeance, setShowFormSeance] = useState(false);
  const [nouvelleSeance, setNouvelleSeance] = useState({
    matiere: "", salle: "", groupe: "", type_seance: "CM",
    date_seance: "", heure_debut: "", heure_fin: "",
  });
  const [rechercheCours, setRechercheCours] = useState("");
  const [showFormCours, setShowFormCours] = useState(false);
  const [nouveauCours, setNouveauCours] = useState({ titre: "", module: "", semestre: "", contenu: "" });
  const [etudiants, setEtudiants] = useState([]);
  const [rechercheEtu, setRechercheEtu] = useState("");

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, chatEnCours]);

  useEffect(() => {
    finFlottantRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convFlottante, flottantEnCours]);

  useEffect(() => {
    if (chatOuvert) setNonLus(0);
  }, [chatOuvert]);

  // Charger l'historique depuis localStorage quand le profil est disponible
  useEffect(() => {
    if (!profil) return;
    const sauvegarde = localStorage.getItem(`chatbot_conv_${profil.id}`);
    if (sauvegarde) {
      try { setConversation(JSON.parse(sauvegarde)); } catch {}
    }
  }, [profil?.id]);

  // Sauvegarder la conversation à chaque changement
  useEffect(() => {
    if (!profil) return;
    localStorage.setItem(`chatbot_conv_${profil.id}`, JSON.stringify(conversation));
  }, [conversation, profil?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeureActuelle(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (modeSombre) {
      document.body.classList.add("mode-sombre");
      localStorage.setItem("theme", "sombre");
    } else {
      document.body.classList.remove("mode-sombre");
      localStorage.setItem("theme", "clair");
    }
  }, [modeSombre]);

  useEffect(() => {
    document.body.style.overflow = profil ? "" : "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [profil]);

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

  const effacerConversation = () => {
    setConversation([]);
    if (profil) localStorage.removeItem(`chatbot_conv_${profil.id}`);
  };

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
        toast.error("Email ou mot de passe incorrect");
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
      setChargement(true);

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
      toast.error("Erreur de connexion au serveur");
    } finally {
      setChargement(false);
      setConnexionEnCours(false);
    }
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
    setShowFormCours(false);
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
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    const id = toast.loading("Ajout en cours...");
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
        toast.error(err.detail || "Erreur lors de l'ajout", { id });
        return;
      }
      toast.success("Séance ajoutée avec succès !", { id });
      setShowFormSeance(false);
      setNouvelleSeance({ matiere: "", salle: "", groupe: "", type_seance: "CM", date_seance: "", heure_debut: "", heure_fin: "" });
      const r = await fetch(`${API_URL}/seances`);
      setSeances(await r.json());
    } catch {
      toast.error("Erreur de connexion au serveur", { id });
    }
  };

  const ajouterCours = async () => {
    const { titre, module, semestre, contenu } = nouveauCours;
    if (!titre || !module || !semestre || !contenu) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    const id = toast.loading("Ajout en cours...");
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
        toast.error(err.detail || "Erreur lors de l'ajout", { id });
        return;
      }
      toast.success("Cours ajouté avec succès !", { id });
      setShowFormCours(false);
      setNouveauCours({ titre: "", module: "", semestre: "", contenu: "" });
      const r = await fetch(`${API_URL}/cours`);
      setCours(await r.json());
    } catch {
      toast.error("Erreur de connexion au serveur", { id });
    }
  };

  const sInscrire = async () => {
    if (!nomInscription || !email || !motDePasse) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
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
        toast.error(err.detail || "Erreur lors de l'inscription");
        return;
      }
      toast.success("Compte créé ! Vous pouvez vous connecter.");
      setMode("connexion");
      setNomInscription("");
      setGroupeInscription("");
      setMotDePasse("");
    } catch (erreur) {
      toast.error("Erreur de connexion au serveur");
    }
  };

  const envoyerFlottant = async () => {
    if (!questionFlottante.trim() || flottantEnCours) return;
    const texte = questionFlottante;
    const heure = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setConvFlottante((c) => [...c, { role: "etudiant", texte, heure }]);
    setQuestionFlottante("");
    setFlottantEnCours(true);
    try {
      const rep = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: texte }),
      });
      const data = await rep.json();
      setConvFlottante((c) => [...c, { role: "bot", texte: data.reponse, heure }]);
      if (!chatOuvert) setNonLus((n) => n + 1);
    } catch {
      setConvFlottante((c) => [...c, { role: "bot", texte: "Erreur de connexion.", heure }]);
    }
    setFlottantEnCours(false);
  };

  const exporterPDF = () => {
    const doc = new jsPDF();
    const titre = `Emploi du temps — ${profil.nom}`;
    const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    doc.setFontSize(16);
    doc.setTextColor(24, 95, 165);
    doc.text(titre, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le ${date}`, 14, 26);
    if (profil.groupe) doc.text(`Groupe : ${profil.groupe}`, 14, 32);

    autoTable(doc, {
      startY: profil.groupe ? 38 : 33,
      head: [["Matière", "Enseignant", "Salle", "Groupe", "Date", "Horaire", "Type"]],
      body: seances.map((s) => [
        s.matiere,
        s.enseignant,
        s.salle,
        s.groupe,
        new Date(s.date_seance).toLocaleDateString("fr-FR"),
        `${s.heure_debut.slice(0, 5)} – ${s.heure_fin.slice(0, 5)}`,
        s.type_seance,
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [24, 95, 165], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 247, 255] },
    });

    doc.save(`emploi_du_temps_${profil.nom.replace(/\s+/g, "_")}.pdf`);
  };

  // ===== ÉCRAN DE CONNEXION / INSCRIPTION =====
  if (!profil) {
    const estSucces = message.toLowerCase().includes("créé") || message.toLowerCase().includes("connecter");
    return (
      <div className="login-page">
        <button
          className="login-theme-btn"
          onClick={() => setModeSombre(!modeSombre)}
          title={modeSombre ? "Mode clair" : "Mode sombre"}
        >
          {modeSombre ? "☀️" : "🌙"}
        </button>
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
        <div className="navbar-titre">
          <GraduationCap size={20} strokeWidth={2} /> Chatbot Universitaire
        </div>

        <div className="navbar-liens">
          {[
            { id: "emploi", label: "Emploi du temps", icon: <CalendarDays size={15} strokeWidth={2} /> },
            { id: "cours",  label: "Cours",            icon: <BookOpen size={15} strokeWidth={2} /> },
            ...(profil.role === "enseignant" ? [{ id: "etudiants", label: "Étudiants", icon: <Users size={15} strokeWidth={2} /> }] : []),
            { id: "chat",   label: "Assistant",        icon: <Bot size={15} strokeWidth={2} /> },
          ].map(({ id, label, icon }) => (
            <a
              key={id}
              className={`navbar-lien ${sectionActive === id ? "actif" : ""}`}
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {icon} {label}
            </a>
          ))}
        </div>

        <div className="navbar-date">
          <Calendar size={14} strokeWidth={2} />
          {dateAujourdhui.charAt(0).toUpperCase() + dateAujourdhui.slice(1)}
        </div>

        <div className="navbar-user">
          <button className="btn-theme" onClick={() => setModeSombre(!modeSombre)} title={modeSombre ? "Mode clair" : "Mode sombre"}>
            {modeSombre ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
          </button>
          <div className="avatar">{getInitiales(profil.nom)}</div>
          <span className="navbar-nom">{profil.nom}</span>
          <span className={`badge-role badge-role-${profil.role}`}>{profil.role}</span>
          <button className="btn-deconnexion" onClick={seDeconnecter}>
            <LogOut size={14} strokeWidth={2} /> Déconnexion
          </button>
        </div>
      </nav>

      <div className="contenu">

        {/* ===== SKELETONS ===== */}
        {chargement && (
          <div className="skeleton-page">
            <div className="skeleton skeleton-banner" />
            <div className="stats-grille">
              {[1,2,3,4].map((i) => <div key={i} className="skeleton skeleton-stat" />)}
            </div>
            <div className="skeleton skeleton-titre" />
            <div className="skeleton skeleton-table" />
            <div className="skeleton skeleton-titre" />
            <div className="grille-cours">
              {[1,2,3].map((i) => <div key={i} className="skeleton skeleton-carte-cours" />)}
            </div>
          </div>
        )}

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
          {profil.role === "etudiant" && (() => {
            const aujourd = new Date().toISOString().slice(0, 10);
            const prochaine = seances.find((s) => s.date_seance >= aujourd);
            return prochaine ? (
              <div className="bienvenue-prochaine">
                <span className="prochaine-label">Prochaine séance</span>
                <span className="prochaine-info">
                  <strong>{prochaine.matiere}</strong> · {new Date(prochaine.date_seance).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} · {prochaine.heure_debut.slice(0,5)} · {prochaine.salle}
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
                </div>
              </div>
            )}
          </div>
        )}

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
          <div className="carte">
            <table>
              <thead>
                <tr>
                  <th>Matière</th><th>Type</th><th>Enseignant</th><th>Salle</th>
                  <th>Groupe</th><th>Date</th><th>Horaire</th>
                </tr>
              </thead>
              <tbody>
                {[...seances].sort((a,b) => a.date_seance.localeCompare(b.date_seance)).map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.matiere}</strong></td>
                    <td><span className={`badge-type badge-type-${s.type_seance.toLowerCase()}`}>{s.type_seance}</span></td>
                    <td>{s.enseignant}</td>
                    <td>{s.salle}</td>
                    <td>{s.groupe}</td>
                    <td>{new Date(s.date_seance).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}</td>
                    <td>{s.heure_debut.slice(0,5)} – {s.heure_fin.slice(0,5)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (() => {
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

          const debutSemaine = fmt(jours[0]);
          const finSemaine = fmt(jours[4]);
          const labelSemaine = `${jours[0].toLocaleDateString("fr-FR", { day:"numeric", month:"long" })} – ${jours[4].toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}`;

          return (
            <div>
              <div className="semaine-nav">
                <button className="btn-semaine" onClick={() => setSemaineOffset(o => o - 1)}>‹</button>
                <span className="semaine-label">{labelSemaine}</span>
                <button className="btn-semaine" onClick={() => setSemaineOffset(o => o + 1)}>›</button>
                {semaineOffset !== 0 && (
                  <button className="btn-semaine-aujourd" onClick={() => setSemaineOffset(0)}>Aujourd'hui</button>
                )}
              </div>
              <div className="grille-semaine">
                {jours.map((jour, idx) => {
                  const dateStr = fmt(jour);
                  const estAujourd = dateStr === fmt(aujourd);
                  const seancesJour = seances.filter(s => s.date_seance === dateStr)
                    .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
                  return (
                    <div key={idx} className={`colonne-jour ${estAujourd ? "aujourd-hui" : ""}`}>
                      <div className="jour-header">
                        <span className="jour-nom">{fmtLabel(jour).split(" ")[0]}</span>
                        <span className={`jour-num ${estAujourd ? "jour-num-actif" : ""}`}>
                          {jour.getDate()}
                        </span>
                      </div>
                      <div className="jour-seances">
                        {seancesJour.length === 0
                          ? <div className="jour-vide" />
                          : seancesJour.map((s) => (
                            <div key={s.id} className={`carte-seance carte-seance-${s.type_seance.toLowerCase()}`}>
                              <div className="seance-heure">{s.heure_debut.slice(0,5)} – {s.heure_fin.slice(0,5)}</div>
                              <div className="seance-matiere">{s.matiere}</div>
                              <div className="seance-meta">{s.salle} · {s.enseignant}</div>
                              <span className={`badge-type badge-type-${s.type_seance.toLowerCase()}`}>{s.type_seance}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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
                        const id = toast.loading("Suppression...");
                        const rep = await fetch(`${API_URL}/cours/${c._id}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (rep.ok) {
                          toast.success("Cours supprimé.", { id });
                          setCours((prev) => prev.filter((x) => x._id !== c._id));
                        } else {
                          toast.error("Erreur lors de la suppression.", { id });
                        }
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

      {/* ===== WIDGET CHAT FLOTTANT ===== */}
      <div className={`chat-flottant-panel ${chatOuvert ? "ouvert" : ""}`}>
        <div className="chat-flottant-header">
          <div className="chat-flottant-titre">
            <Bot size={18} strokeWidth={2} />
            <span>Assistant virtuel</span>
          </div>
          <button className="chat-flottant-fermer" onClick={() => setChatOuvert(false)}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="chat-flottant-messages">
          {convFlottante.length === 0 && (
            <div className="chat-flottant-vide">
              <Bot size={32} strokeWidth={1.5} />
              <p>Bonjour {profil.nom.split(" ")[0]} ! Comment puis-je vous aider ?</p>
            </div>
          )}
          {convFlottante.map((msg, i) => (
            <div key={i} className={`bulle-flottante ${msg.role}`}>
              {msg.role === "bot" && <div className="avatar-flottant">🤖</div>}
              <div className="bulle-flottante-contenu">
                <div className={`bulle ${msg.role}`}>
                  <ReactMarkdown>{msg.texte}</ReactMarkdown>
                </div>
                <span className="msg-heure">{msg.heure}</span>
              </div>
            </div>
          ))}
          {flottantEnCours && (
            <div className="bulle-flottante bot">
              <div className="avatar-flottant">🤖</div>
              <div className="bulle bot points-animes">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={finFlottantRef} />
        </div>

        <div className="chat-flottant-input">
          <input
            type="text"
            placeholder="Votre question..."
            value={questionFlottante}
            onChange={(e) => setQuestionFlottante(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyerFlottant()}
          />
          <button onClick={envoyerFlottant} disabled={flottantEnCours}>
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <button
        className="chat-flottant-btn"
        onClick={() => setChatOuvert(!chatOuvert)}
        title="Assistant virtuel"
      >
        {chatOuvert ? <X size={24} strokeWidth={2} /> : <MessageCircle size={24} strokeWidth={2} />}
        {!chatOuvert && nonLus > 0 && <span className="chat-flottant-badge">{nonLus}</span>}
      </button>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { borderRadius: "10px", fontSize: "14px", fontFamily: "inherit" },
          success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
          duration: 3500,
        }}
      />
    </div>
  );
}

export default App;