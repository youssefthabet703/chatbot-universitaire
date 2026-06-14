const API_URL = "http://localhost:8001";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const connexion = async (email, motDePasse) => {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", motDePasse);
  const rep = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!rep.ok) throw new Error("Email ou mot de passe incorrect");
  return rep.json();
};

export const fetchProfil = (token) =>
  fetch(`${API_URL}/moi`, { headers: authHeaders(token) }).then((r) => r.json());

export const mettreAJourProfil = (token, data) =>
  fetch(`${API_URL}/moi`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const inscrire = async (data) => {
  const rep = await fetch(`${API_URL}/utilisateurs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!rep.ok) {
    const err = await rep.json();
    throw new Error(err.detail || "Erreur lors de l'inscription");
  }
  return rep.json();
};

export const fetchSeances = (groupe) => {
  const url = groupe
    ? `${API_URL}/seances?groupe=${encodeURIComponent(groupe)}`
    : `${API_URL}/seances`;
  return fetch(url).then((r) => r.json());
};

export const ajouterSeance = async (token, data) => {
  const rep = await fetch(`${API_URL}/seances`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!rep.ok) {
    const err = await rep.json();
    throw new Error(err.detail || "Erreur lors de l'ajout");
  }
  return rep.json();
};

export const modifierSeance = async (token, id, data) => {
  const rep = await fetch(`${API_URL}/seances/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!rep.ok) {
    const err = await rep.json();
    throw new Error(err.detail || "Erreur lors de la modification");
  }
  return rep.json();
};

export const supprimerSeance = async (token, id) => {
  const rep = await fetch(`${API_URL}/seances/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!rep.ok) throw new Error("Erreur lors de la suppression");
};

export const fetchCours = () =>
  fetch(`${API_URL}/cours`).then((r) => r.json());

export const ajouterCours = async (token, data) => {
  const rep = await fetch(`${API_URL}/cours`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!rep.ok) {
    const err = await rep.json();
    throw new Error(err.detail || "Erreur lors de l'ajout");
  }
  return rep.json();
};

export const supprimerCours = async (token, id) => {
  const rep = await fetch(`${API_URL}/cours/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!rep.ok) throw new Error("Erreur lors de la suppression");
};

export const fetchEtudiants = (token) =>
  fetch(`${API_URL}/etudiants`, { headers: authHeaders(token) }).then((r) => r.json());

export const envoyerChat = async (token, question, historique = []) => {
  const rep = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ question, historique }),
  });
  if (!rep.ok) throw new Error("Erreur de connexion au chatbot");
  return rep.json();
}