import { useState, useEffect } from "react";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast, { Toaster } from "react-hot-toast";

import LoginPage from "./components/LoginPage";
import NavBar from "./components/NavBar";
import PanneauEnseignant from "./components/PanneauEnseignant";
import EmploiDuTemps from "./components/EmploiDuTemps";
import SectionCours from "./components/SectionCours";
import SectionEtudiants from "./components/SectionEtudiants";
import ChatSection from "./components/ChatSection";
import ChatFlottant from "./components/ChatFlottant";

const TOASTER_OPTS = {
  style: { borderRadius: "10px", fontSize: "14px", fontFamily: "inherit" },
  success: { iconTheme: { primary: "#16a34a", secondary: "#fff" } },
  error:   { iconTheme: { primary: "#dc2626", secondary: "#fff" } },
  duration: 3500,
};

function App() {
  const [token, setToken] = useState(null);
  const [profil, setProfil] = useState(null);
  const [seances, setSeances] = useState([]);
  const [cours, setCours] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [sectionActive, setSectionActive] = useState("emploi");
  const [modeSombre, setModeSombre] = useState(() => localStorage.getItem("theme") === "sombre");
  const [heureActuelle, setHeureActuelle] = useState(
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );

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

  const handleLoginSuccess = ({ token: t, profil: p, seances: s, cours: c, etudiants: e }) => {
    setToken(t);
    setProfil(p);
    setSeances(s);
    setCours(c);
    setEtudiants(e);
  };

  const seDeconnecter = () => {
    setProfil(null);
    setToken(null);
    setSeances([]);
    setCours([]);
    setEtudiants([]);
  };

  const getInitiales = (nom) => {
    if (!nom) return "?";
    const mots = nom.trim().split(" ");
    if (mots.length === 1) return mots[0][0].toUpperCase();
    return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
  };

  const exporterPDF = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    doc.setFontSize(16);
    doc.setTextColor(24, 95, 165);
    doc.text(`Emploi du temps — ${profil.nom}`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le ${date}`, 14, 26);
    if (profil.groupe) doc.text(`Groupe : ${profil.groupe}`, 14, 32);
    autoTable(doc, {
      startY: profil.groupe ? 38 : 33,
      head: [["Matière", "Enseignant", "Salle", "Groupe", "Date", "Horaire", "Type"]],
      body: seances.map((s) => [
        s.matiere, s.enseignant, s.salle, s.groupe,
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

  const dateAujourdhui = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (!profil) {
    return (
      <>
        <LoginPage
          modeSombre={modeSombre}
          setModeSombre={setModeSombre}
          onSuccess={handleLoginSuccess}
          setChargement={setChargement}
        />
        <Toaster position="bottom-right" toastOptions={TOASTER_OPTS} />
      </>
    );
  }

  return (
    <div>
      <NavBar
        profil={profil}
        sectionActive={sectionActive}
        modeSombre={modeSombre}
        setModeSombre={setModeSombre}
        dateAujourdhui={dateAujourdhui}
        seDeconnecter={seDeconnecter}
        getInitiales={getInitiales}
      />

      <div className="contenu">
        {chargement && (
          <div className="skeleton-page">
            <div className="skeleton skeleton-banner" />
            <div className="stats-grille">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton skeleton-stat" />)}
            </div>
            <div className="skeleton skeleton-titre" />
            <div className="skeleton skeleton-table" />
            <div className="skeleton skeleton-titre" />
            <div className="grille-cours">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-carte-cours" />)}
            </div>
          </div>
        )}

        <div className="bienvenue-banner">
          <div>
            <h2 className="bienvenue-titre">
              {new Date().getHours() < 12 ? "Bonjour" : new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir"},{" "}
              {profil.nom.split(" ")[0]} 👋
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
                  <strong>{prochaine.matiere}</strong>
                  {" · "}{new Date(prochaine.date_seance).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  {" · "}{prochaine.heure_debut.slice(0, 5)}
                  {" · "}{prochaine.salle}
                </span>
              </div>
            ) : null;
          })()}
        </div>

        {/* Stats — Tailwind : rounded-2xl shadow-sm sur chaque carte */}
        <div className="stats-grille">
          <div className="stat-carte stat-bleu rounded-2xl shadow-sm">
            <span className="stat-icone">📅</span>
            <span className="stat-valeur">{seances.length}</span>
            <span className="stat-label">Séances</span>
          </div>
          <div className="stat-carte stat-vert rounded-2xl shadow-sm">
            <span className="stat-icone">📚</span>
            <span className="stat-valeur">{cours.length}</span>
            <span className="stat-label">Cours</span>
          </div>
          <div className="stat-carte stat-violet rounded-2xl shadow-sm">
            <span className="stat-icone">📖</span>
            <span className="stat-valeur">{new Set(seances.map((s) => s.matiere)).size}</span>
            <span className="stat-label">Matières</span>
          </div>
          <div className="stat-carte stat-orange rounded-2xl shadow-sm">
            <span className="stat-icone">👨‍🏫</span>
            <span className="stat-valeur">{new Set(seances.map((s) => s.enseignant)).size}</span>
            <span className="stat-label">Enseignants</span>
          </div>
        </div>

        {profil.role === "enseignant" && (
          <PanneauEnseignant
            profil={profil}
            setProfil={setProfil}
            token={token}
            setSeances={setSeances}
          />
        )}

        <EmploiDuTemps
          profil={profil}
          token={token}
          seances={seances}
          setSeances={setSeances}
          exporterPDF={exporterPDF}
        />

        <SectionCours
          profil={profil}
          token={token}
          cours={cours}
          setCours={setCours}
        />

        {profil.role === "enseignant" && (
          <SectionEtudiants etudiants={etudiants} />
        )}

        <ChatSection
          profil={profil}
          token={token}
          getInitiales={getInitiales}
        />
      </div>

      <ChatFlottant profil={profil} token={token} />

      <Toaster position="bottom-right" toastOptions={TOASTER_OPTS} />
    </div>
  );
}

export default App;
