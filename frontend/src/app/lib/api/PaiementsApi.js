import { api } from "./apiClient";

const BASE = "/paiements";

// ─── Mapping statut ────────────────────────────────────────────────────────
const STATUT_MAP = {
    en_attente:  "PENDING",
    paye:        "PAID",
    rejete:      "REJECTED",
    partiel:     "PARTIAL",
    IN_PROGRESS: "IN_PROGRESS",
    SUCCESS:     "SUCCESS",
    FAILED:      "FAILED",
    PAID:        "PAID",
    PENDING:     "PENDING",
    REJECTED:    "REJECTED",
    PARTIAL:     "PARTIAL",
};

// ─── GET - Liste des paiements ─────────────────────────────────────────────
export async function getPaiements({ anneeFiscale, statuts = [], sortKey, sortDir } = {}) {
    try {
        const query = new URLSearchParams();
        if (anneeFiscale) query.append("anneeFiscale", anneeFiscale);
        if (sortKey) {
            query.append("_sort", sortKey);
            query.append("_order", sortDir === "desc" ? "desc" : "asc");
        }
        const url = `${BASE}?${query.toString()}`;
        const response = await api.get(url);
        let data = Array.isArray(response) ? response : [];

        // Normalise le champ payeLe depuis datePaiement si absent
        data = data.map((p) => ({
            ...p,
            // Le backend stocke datePaiement, le frontend attend payeLe
            payeLe: p.payeLe ?? p.datePaiement ?? null,
        }));

        if (statuts.length > 0) {
            data = data.filter((p) => {
                const statut = p?.statutPaiement;
                const mapped = STATUT_MAP[statut] ?? statut?.toUpperCase();
                return mapped && statuts.includes(mapped);
            });
        }
        return data;
    } catch (error) {
        console.error("Erreur getPaiements :", error);
        return [];
    }
}

// ─── GET - Un paiement par ID ──────────────────────────────────────────────
export async function getPaiementById(id) {
    return api.get(`${BASE}/${id}`);
}

// ─── POST - Créer un paiement ──────────────────────────────────────────────
// Utilisé pour enregistrer un paiement IN_PROGRESS dès le lancement
export async function createPaiement(paiement) {
    return api.post(BASE, paiement);
}

// ─── PATCH - Mise à jour partielle (statut, montant, référence…) ───────────
// C'est la méthode à utiliser pour passer de IN_PROGRESS → SUCCESS/FAILED
export async function updatePaiement(id, updates) {
    return api.patch(`${BASE}/${id}`, updates);
}

// ─── PUT - Remplacement complet (usage rare) ───────────────────────────────
export async function replacePaiement(id, paiement) {
    return api.put(`${BASE}/${id}`, paiement);
}

// ─── DELETE ────────────────────────────────────────────────────────────────
export async function deletePaiement(id) {
    return api.delete(`${BASE}/${id}`);
}
