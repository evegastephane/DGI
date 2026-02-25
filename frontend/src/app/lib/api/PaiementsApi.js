import {api} from "./apiClient";

const BASE = "/paiements";

// ─── Mapping statut FR → EN ───────────────────────────────────────────────
const STATUT_MAP = {
    en_attente: "PENDING",
    paye:       "PAID",
    rejete:     "REJECTED",
    partiel:    "PARTIAL",
};

// ─── GET - Liste des paiements (avec filtres + tri) ───────────────────────
/**
 * @param {Object} params
 * @param {number|string} [params.anneeFiscale]   - Filtrer par année fiscale
 * @param {string[]}      [params.statuts]        - Filtrer par statuts (ex: ["PAID","PENDING"])
 * @param {string}        [params.sortKey]        - Clé de tri (ex: "anneeFiscale")
 * @param {"asc"|"desc"}  [params.sortDir]        - Direction du tri
 * @returns {Promise<Array>}
 */
export async function getPaiements({ anneeFiscale, statuts = [], sortKey, sortDir } = {}) {
    try {
        const query = new URLSearchParams();

        if (anneeFiscale) {
            query.append("anneeFiscale", anneeFiscale);
        }

        if (sortKey) {
            query.append("_sort", sortKey);
            query.append("_order", sortDir === "desc" ? "desc" : "asc");
        }

        const url = `${BASE}?${query.toString()}`;
        const response = await api.get(url);

        // ✅ Étape 1 : s'assurer que response est un tableau
        let data = Array.isArray(response) ? response : [];

        // ✅ Étape 2 : filtre sur les statuts (si demandé)
        if (statuts.length > 0) {
            data = data.filter((p) => {
                // Sécuriser l'accès à statutPaiement
                const statut = p?.statutPaiement;
                const mapped = STATUT_MAP[statut] ?? statut?.toUpperCase();
                return mapped && statuts.includes(mapped);
            });
        }

        return data;
    } catch (error) {
        console.error("Erreur dans getPaiements :", error);
        return []; // ✅ Retourner un tableau vide en cas d'erreur
    }
}

// ─── GET - Un paiement par ID ─────────────────────────────────────────────
/**
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function getPaiementById(id) {
    return api.get(`${BASE}/${id}`);
}

// ─── POST - Créer un paiement ─────────────────────────────────────────────
/**
 * @param {Object} paiement
 * @param {number}  paiement.anneeFiscale
 * @param {string}  paiement.structureFiscale
 * @param {string}  paiement.referenceDeclaration
 * @param {string}  [paiement.referencePaiement]
 * @param {string}  paiement.statutPaiement       - "en_attente" | "paye" | "partiel" | "rejete"
 * @param {number}  paiement.montantAPayer
 * @param {number}  [paiement.montantPaye]
 * @param {string}  [paiement.payeLe]             - ISO date string
 * @returns {Promise<Object>}
 */
export async function createPaiement(paiement) {
    return api.post(BASE, paiement);
}

// ─── PUT - Modifier un paiement ───────────────────────────────────────────
/**
 * @param {string|number} id
 * @param {Object} updates - Champs à mettre à jour
 * @returns {Promise<Object>}
 */
export async function updatePaiement(id, updates) {
    return api.put(`${BASE}/${id}`, updates);
}

// ─── PATCH - Modifier partiellement un paiement ───────────────────────────
/**
 * @param {string|number} id
 * @param {Object} updates - Champs partiels à mettre à jour
 * @returns {Promise<Object>}
 */
export async function patchPaiement(id, updates) {
    return api.patch(`${BASE}/${id}`, updates);
}

// ─── DELETE - Supprimer un paiement ──────────────────────────────────────
/**
 * @param {string|number} id
 * @returns {Promise<void>}
 */
export async function deletePaiement(id) {
    return api.delete(`${BASE}/${id}`);
}