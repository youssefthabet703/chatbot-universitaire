import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, X, MessageCircle, Send } from "lucide-react";
import * as api from "../api";

export default function ChatFlottant({ profil, token }) {
  const [chatOuvert, setChatOuvert] = useState(false);
  const [convFlottante, setConvFlottante] = useState([]);
  const [questionFlottante, setQuestionFlottante] = useState("");
  const [flottantEnCours, setFlottantEnCours] = useState(false);
  const [nonLus, setNonLus] = useState(0);
  const finFlottantRef = useRef(null);

  useEffect(() => {
    finFlottantRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convFlottante, flottantEnCours]);

  useEffect(() => {
    if (chatOuvert) setNonLus(0);
  }, [chatOuvert]);

  const envoyerFlottant = async () => {
    if (!questionFlottante.trim() || flottantEnCours) return;
    const texte = questionFlottante;
    const heure = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    setConvFlottante((c) => [...c, { role: "etudiant", texte, heure }]);
    setQuestionFlottante("");
    setFlottantEnCours(true);
    try {
      const data = await api.envoyerChat(token, texte);
      setConvFlottante((c) => [...c, { role: "bot", texte: data.reponse, heure }]);
      if (!chatOuvert) setNonLus((n) => n + 1);
    } catch {
      setConvFlottante((c) => [...c, { role: "bot", texte: "Erreur de connexion.", heure }]);
    }
    setFlottantEnCours(false);
  };

  return (
    <>
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
              <div className="bulle bot points-animes"><span></span><span></span><span></span></div>
            </div>
          )}
          <div ref={finFlottantRef} />
        </div>

        <div className="chat-flottant-input">
          <input type="text" placeholder="Votre question..."
            value={questionFlottante} onChange={(e) => setQuestionFlottante(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyerFlottant()} />
          <button onClick={envoyerFlottant} disabled={flottantEnCours}>
            <Send size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <button className="chat-flottant-btn" onClick={() => setChatOuvert(!chatOuvert)} title="Assistant virtuel">
        {chatOuvert ? <X size={24} strokeWidth={2} /> : <MessageCircle size={24} strokeWidth={2} />}
        {!chatOuvert && nonLus > 0 && <span className="chat-flottant-badge">{nonLus}</span>}
      </button>
    </>
  );
}
