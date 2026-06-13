import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import * as api from "../api";

const COULEURS = ["#185FA5", "#16a34a", "#d97706", "#7c3aed", "#dc2626"];

export default function ChatSection({ profil, token, getInitiales }) {
  const [conversation, setConversation] = useState([]);
  const [questionChat, setQuestionChat] = useState("");
  const [chatEnCours, setChatEnCours] = useState(false);
  const [copieIndex, setCopieIndex] = useState(null);
  const finChatRef = useRef(null);

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, chatEnCours]);

  useEffect(() => {
    const sauvegarde = localStorage.getItem(`chatbot_conv_${profil.id}`);
    if (sauvegarde) {
      try { setConversation(JSON.parse(sauvegarde)); } catch {}
    }
  }, [profil.id]);

  useEffect(() => {
    localStorage.setItem(`chatbot_conv_${profil.id}`, JSON.stringify(conversation));
  }, [conversation, profil.id]);

  const maintenant = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const envoyerQuestion = async (texte = questionChat) => {
    if (!texte.trim() || chatEnCours) return;
    // conversation ici = valeur AVANT le setConversation ci-dessous (closure React)
    const historique = conversation.map((m) => ({ role: m.role, texte: m.texte }));
    setConversation((c) => [...c, { role: "etudiant", texte, heure: maintenant() }]);
    setQuestionChat("");
    setChatEnCours(true);
    try {
      const data = await api.envoyerChat(token, texte, historique);
      setConversation((c) => [...c, {
        role: "bot", texte: data.reponse,
        intention: data.intention, confiance: data.confiance,
        heure: maintenant(),
      }]);
    } catch {
      setConversation((c) => [...c, { role: "bot", texte: "Erreur de connexion au chatbot.", heure: maintenant() }]);
    }
    setChatEnCours(false);
  };

  const effacerConversation = () => {
    setConversation([]);
    localStorage.removeItem(`chatbot_conv_${profil.id}`);
  };

  const intentionsDetectees = conversation.filter((m) => m.role === "bot" && m.intention);
  const comptageIntentions = intentionsDetectees.reduce((acc, m) => {
    const label = m.intention.replace(/_/g, " ");
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const dataIntentions = Object.entries(comptageIntentions).map(([name, value]) => ({ name, value }));

  return (
    <>
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
              {/* Suggestions — Tailwind : transition + hover:scale */}
            <div className="suggestions">
                {[
                  "Quel est mon prochain cours ?",
                  "Résume le cours de réseaux",
                  "Comment m'inscrire à la bibliothèque ?",
                  "Quelles filières si j'aime l'IA ?",
                ].map((q, i) => (
                  <button key={i}
                    className="suggestion-btn transition-transform duration-150 hover:scale-105 hover:shadow-md"
                    onClick={() => envoyerQuestion(q)}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversation.map((msg, i) => (
            <div key={i} className={`bulle-ligne ${msg.role}`}>
              {msg.role === "bot" && <div className="chat-avatar chat-avatar-bot">🤖</div>}
              <div className="bulle-contenu">
                <div className={`bulle ${msg.role}`}>
                  <ReactMarkdown>{msg.texte}</ReactMarkdown>
                  {msg.intention && (
                    <div className="intention-ligne">
                      <span className={`badge-intention badge-${msg.intention}`}>
                        {msg.intention.replace(/_/g, " ")}
                      </span>
                      {msg.confiance != null && (
                        <span className="confiance-wrapper" title={`Confiance : ${msg.confiance}%`}>
                          <span className="confiance-barre">
                            <span className="confiance-fill" style={{
                              width: `${msg.confiance}%`,
                              background: msg.confiance >= 80 ? "#16a34a" : msg.confiance >= 55 ? "#d97706" : "#dc2626",
                            }} />
                          </span>
                          <span className="confiance-pct">{msg.confiance}%</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="msg-footer">
                  {msg.heure && <span className="msg-heure">{msg.heure}</span>}
                  <div className="msg-actions">
                    {msg.role === "bot" && (
                      <button className="msg-action-btn" title="Copier la réponse"
                        onClick={() => {
                          navigator.clipboard.writeText(msg.texte);
                          setCopieIndex(i);
                          setTimeout(() => setCopieIndex(null), 2000);
                        }}>
                        {copieIndex === i ? "✅ Copié" : "📋 Copier"}
                      </button>
                    )}
                    {msg.role === "etudiant" && (
                      <button className="msg-action-btn" title="Renvoyer cette question"
                        onClick={() => envoyerQuestion(msg.texte)} disabled={chatEnCours}>
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
                <div className="bulle bot points-animes"><span></span><span></span><span></span></div>
              </div>
            </div>
          )}
          <div ref={finChatRef} />
        </div>

        {intentionsDetectees.length >= 2 && (
          <div className="intentions-stats">
            <p className="intentions-titre">📊 Répartition des intentions détectées</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dataIntentions} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={11}>
                  {dataIntentions.map((_, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} question${v > 1 ? "s" : ""}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="chat-input-zone">
          <input className="chat-input" type="text" placeholder="Votre question..."
            value={questionChat} onChange={(e) => setQuestionChat(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && envoyerQuestion()} />
          <button className="btn-principal" style={{ width: "auto", padding: "12px 24px" }}
            onClick={() => envoyerQuestion()} disabled={chatEnCours}>
            Envoyer
          </button>
        </div>
      </div>
    </>
  );
}
