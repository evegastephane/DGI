// src/lib/api/declarationApi.js
// ─── API Déclarations ─────────────────────────────────────────────────────
import { api } from "./apiClient";
import { CURRENT_USER_ID } from "./contribuableApi";

// GET /api/contribuables/:id/declarations → liste des DPR du contribuable
export const getDeclarations = (id = CURRENT_USER_ID) =>
    api.get(`/contribuables/${id}/declarations`);

// GET /api/contribuables/:id/avis-imposition → liste des avis du contribuable
export const getAvisImposition = (id = CURRENT_USER_ID) =>
    api.get(`/contribuables/${id}/avis-imposition`);

// GET /api/declarations/:id — détail complet d'une déclaration
export const getDeclaration = (idDecl) =>
    api.get(`/declarations/${idDecl}`);

// POST /api/declarations — soumettre une nouvelle déclaration
export const creerDeclaration = (body) =>
    api.post("/declarations", body);

// PUT /api/declarations/:id — modifier une déclaration
export const modifierDeclaration = (idDecl, body) =>
    api.put(`/declarations/${idDecl}`, body);

// PATCH /api/declarations/:id/statut — changer le statut
export const changerStatutDeclaration = (idDecl, statut, motif_rejet = null) =>
    api.patch(`/declarations/${idDecl}/statut`, { statut, motif_rejet });

// GET /api/declarations/:id/paiements
export const getPaiementsDeclaration = (idDecl) =>
    api.get(`/declarations/${idDecl}/paiements`);

// POST /api/etablissements — enregistrer un établissement
export const creerEtablissement = (body) =>
    api.post("/etablissements", body);

