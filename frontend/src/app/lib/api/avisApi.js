// src/lib/api/avisApi.js
// ─── API Avis d'Imposition ────────────────────────────────────────────────
// Remplacer BASE_URL par l'URL Spring Boot quand disponible.

const BASE_URL = "http://localhost:3001/api";

async function request(endpoint) {
    const res  = await fetch(`${BASE_URL}${endpoint}`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || `Erreur ${res.status}`);
    return json.data;
}

// GET /api/contribuables/:id/avis-imposition
// Retourne tous les avis du contribuable connecté
export const getAvisContribuable = (idContribuable = 1) =>
    request(`/contribuables/${idContribuable}/avis-imposition`);

// GET /api/avis-imposition/:id
// Retourne le détail complet d'un avis (avec declaration + contribuable)
export const getAvisDetail = (idAvis) =>
    request(`/avis-imposition/${idAvis}`);

// GET /api/avis-imposition?exercice=2024&statut=NON_PAYE&id_contribuable=1
// Recherche avancée filtrée côté backend
export const rechercherAvis = ({ exercice, statut, idContribuable = 1 }) => {
    const params = new URLSearchParams({ id_contribuable: idContribuable });
    if (exercice) params.append("exercice", exercice);
    if (statut)   params.append("statut",   statut);
    return request(`/avis-imposition?${params.toString()}`);
};