// src/lib/api/apiClient.js
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

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
    return json.data;
}

export const api = {
    get:    (endpoint)       => request("GET",    endpoint),
    post:   (endpoint, body) => request("POST",   endpoint, body),
    put:    (endpoint, body) => request("PUT",    endpoint, body),
    patch:  (endpoint, body) => request("PATCH",  endpoint, body),
    delete: (endpoint)       => request("DELETE", endpoint),
};