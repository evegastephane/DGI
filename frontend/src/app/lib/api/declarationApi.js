// src/lib/api/declarationApi.js
// ─── API Déclarations Patente ─────────────────────────────────────────────
import { api } from "./apiClient";
import { CURRENT_USER_ID } from "./contribuableApi";

// GET /api/contribuables/:id/declarations → liste des déclarations du contribuable
export const getDeclarations = async (id = CURRENT_USER_ID) => {
    const data = await api.get(`/contribuables/${id}/declarations`);
    const list = Array.isArray(data) ? data : (data.content || []);
    return list.map((d) => ({
        id:               d.idDeclaration,
        reference:        d.referenceDeclaration || "—",
        annee:            d.anneeFiscale,
        statut:           d.statut,
        type:             d.typeDeclaration,
        structureFiscale: d.structureFiscale || "CDI YAOUNDE 2",
        montantBrut:      d.montantAPayer || 0,
        date:             d.dateSoumission || d.dateDeclaration,
    }));
};

// GET /api/declarations/:id — détail complet d'une déclaration
export const getDeclaration = (idDecl) =>
    api.get(`/declarations/${idDecl}`);

// POST /api/declarations — créer une nouvelle déclaration Patente
// → le backend génère automatiquement un Avis d'imposition
export const creerDeclaration = (body) =>
    api.post("/declarations", body);

// PUT /api/declarations/:id — modifier une déclaration
export const modifierDeclaration = (idDecl, body) =>
    api.put(`/declarations/${idDecl}`, body);

// GET /api/declarations/:id/paiements
export const getPaiementsDeclaration = (idDecl) =>
    api.get(`/declarations/${idDecl}/paiements`);

// POST /api/etablissements — enregistrer un établissement
// Note: EtablissementController retourne directement l'objet (sans wrapper success/data)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
export const creerEtablissement = async (body) => {
    const res = await fetch(`${BASE_URL}/etablissements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nom: body.nomEtablissement,
            idContribuable: body.idContribuable,
        }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Erreur HTTP ${res.status}`);
    }
    return res.json();
};