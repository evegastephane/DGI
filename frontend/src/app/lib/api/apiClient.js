// src/lib/api/apiClient.js
// ─── Client HTTP central ───────────────────────────────────────────────────
// Toutes les requêtes passent ici.
// Pour basculer vers Spring Boot → changer BASE_URL uniquement.

const BASE_URL = "http://localhost:3001/api";

// ─── Fetch générique avec gestion d'erreur ────────────────────────────────
async function request(method, endpoint, body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const json     = await response.json();

    if (!response.ok || !json.success) {
        throw new Error(json.message || `Erreur ${response.status}`);
    }

    return json.data; // ← on retourne directement { data } du backend
}

// ─── Méthodes exposées ─────────────────────────────────────────────────────
export const api = {
    get:    (endpoint)         => request("GET",    endpoint),
    post:   (endpoint, body)   => request("POST",   endpoint, body),
    put:    (endpoint, body)   => request("PUT",    endpoint, body),
    patch:  (endpoint, body)   => request("PATCH",  endpoint, body),
    delete: (endpoint)         => request("DELETE", endpoint),
};