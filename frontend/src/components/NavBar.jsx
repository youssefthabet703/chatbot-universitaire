import { GraduationCap, CalendarDays, BookOpen, Users, Bot, Moon, Sun, LogOut, Calendar } from "lucide-react";

export default function NavBar({ profil, sectionActive, modeSombre, setModeSombre, dateAujourdhui, seDeconnecter, getInitiales }) {
  const liens = [
    { id: "emploi",    label: "Emploi du temps", icon: <CalendarDays size={15} strokeWidth={2} /> },
    { id: "cours",     label: "Cours",            icon: <BookOpen size={15} strokeWidth={2} /> },
    ...(profil.role === "enseignant"
      ? [{ id: "etudiants", label: "Étudiants", icon: <Users size={15} strokeWidth={2} /> }]
      : []),
    { id: "chat",      label: "Assistant",        icon: <Bot size={15} strokeWidth={2} /> },
  ];

  return (
    <nav className="navbar">
      {/* Titre — Tailwind : flex + gap pour aligner icône et texte */}
      <div className="navbar-titre flex items-center gap-2">
        <GraduationCap size={20} strokeWidth={2} /> Chatbot Universitaire
      </div>

      <div className="navbar-liens">
        {liens.map(({ id, label, icon }) => (
          <a key={id} className={`navbar-lien flex items-center gap-1.5 ${sectionActive === id ? "actif" : ""}`}
            href={`#${id}`}
            onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}>
            {icon} {label}
          </a>
        ))}
      </div>

      {/* Date — Tailwind : flex + items-center + gap */}
      <div className="navbar-date flex items-center gap-1.5">
        <Calendar size={14} strokeWidth={2} />
        {dateAujourdhui.charAt(0).toUpperCase() + dateAujourdhui.slice(1)}
      </div>

      {/* Zone utilisateur — Tailwind : flex + items-center + gap */}
      <div className="navbar-user flex items-center gap-2">
        <button className="btn-theme transition-transform duration-200 hover:scale-110"
          onClick={() => setModeSombre(!modeSombre)}
          title={modeSombre ? "Mode clair" : "Mode sombre"}>
          {modeSombre ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
        </button>
        <div className="avatar">{getInitiales(profil.nom)}</div>
        <span className="navbar-nom">{profil.nom}</span>
        {/* Badge rôle — Tailwind : rounded-full + text-xs */}
        <span className={`badge-role badge-role-${profil.role} rounded-full text-xs font-semibold`}>
          {profil.role}
        </span>
        <button className="btn-deconnexion flex items-center gap-1.5 transition-opacity duration-150 hover:opacity-80"
          onClick={seDeconnecter}>
          <LogOut size={14} strokeWidth={2} /> Déconnexion
        </button>
      </div>
    </nav>
  );
}
