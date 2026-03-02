// src/lib/api/dashboardApi.js

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const fetcher = async (path) => {
    const res = await fetch(`${BASE_URL}${path}`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || `Erreur ${res.status}`);
    return json.data;
};

// GET /api/dashboard/stats
export { getDashboardStats } from "./contribuableApi";

// GET /api/dashboard/declarations-par-type
export const getDeclarationsParType = async () =>
    fetcher("/dashboard/declarations-par-type");

// GET /api/dashboard/recettes-par-commune
export const getRecettesParCommune = async () =>
    fetcher("/dashboard/recettes-par-commune");