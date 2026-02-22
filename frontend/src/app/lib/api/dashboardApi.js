// src/lib/api/dashboardApi.js
// ─── API Dashboard ────────────────────────────────────────────────────────
import { api } from "./apiClient";
import { CURRENT_USER_ID } from "./contribuableApi";

// GET /api/dashboard/stats?id_contribuable=1
// Retourne les stats filtrées pour le contribuable connecté
export const getDashboardStats = (id = CURRENT_USER_ID) =>
    api.get(`/dashboard/stats?id_contribuable=${id}`);

// GET /api/dashboard/declarations-par-type
export const getDeclarationsParType = () =>
    api.get("/dashboard/declarations-par-type");

// GET /api/dashboard/recettes-par-commune
export const getRecettesParCommune = () =>
    api.get("/dashboard/recettes-par-commune");