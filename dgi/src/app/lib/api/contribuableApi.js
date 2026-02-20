// src/lib/api/contribuableApi.js
// ─── API Contribuables ────────────────────────────────────────────────────
import { api } from "./apiClient";

// Contribuable connecté — ID=1 pour la simulation (sera issu du JWT côté Spring Boot)
export const CURRENT_USER_ID = 1;

// GET /api/contribuables/:id — profil complet
export const getContribuable = (id = CURRENT_USER_ID) =>
    api.get(`/contribuables/${id}`);

// GET /api/contribuables/:id/notifications
export const getNotifications = (id = CURRENT_USER_ID) =>
    api.get(`/contribuables/${id}/notifications`);

// GET /api/contribuables/:id/AMR
export const getAMR = (id = CURRENT_USER_ID) =>
    api.get(`/contribuables/${id}/AMR`);

// GET /api/contribuables/:id/etablissements
export const getEtablissements = (id = CURRENT_USER_ID) =>
    api.get(`/contribuables/${id}/etablissements`);

// PATCH /api/notifications/:id/lire
export const marquerNotificationLue = (idNotif) =>
    api.patch(`/notifications/${idNotif}/lire`);