// src/app/lib/api/contribuableApi.js
// ─── Client API Spring Boot ────────────────────────────────────────────────
// Toutes les réponses JSON ont la forme : { success: true, data: ..., timestamp: ... }
// Cette couche extrait automatiquement le champ "data".

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Contribuable connecté (sera issu du JWT plus tard)
export const CURRENT_USER_ID = 1;

// ─── Helper HTTP JSON ──────────────────────────────────────────────────────
const fetcher = async (path, options = {}) => {
    const res  = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
        throw new Error(json.message || `Erreur HTTP ${res.status}`);
    }
    return json.data;
};

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export const getDashboardStats = async (idContribuable = null, annee = null) => {
    const params = new URLSearchParams();
    if (idContribuable) params.append("id_contribuable", idContribuable);
    if (annee)          params.append("annee_fiscale",   annee);
    const query = params.toString();
    const data  = await fetcher(`/dashboard/stats${query ? "?" + query : ""}`);
    return {
        dprGenerees:          data.declarations?.total           || 0,
        dprSoumises:          (data.declarations?.validees || 0) + (data.declarations?.en_cours || 0),
        avisPayes:            data.avis?.payes                   || 0,
        avisNonPayes:         data.avis?.non_payes               || 0,
        avisTotal:            data.avis?.total                   || 0,
        amrEnCours:           data.AMR?.en_cours                 || 0,
        amrMontantTotal:      data.AMR?.montant_total            || 0,
        totalRecouvert:       data.recettes?.total_recouvre      || 0,
        notifsNonLues:        data.notifications?.non_lues       || 0,
        declarationsValidees: data.declarations?.validees        || 0,
        declarationsEnCours:  data.declarations?.en_cours        || 0,
        declarationsRejetees: data.declarations?.rejetees        || 0,
        tauxValidation:       data.declarations?.taux_validation || 0,
    };
};

// ══════════════════════════════════════════════════════════════════════════════
// DÉCLARATIONS
// ══════════════════════════════════════════════════════════════════════════════
export const getDPRs = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data  = await fetcher(`/declarations${query ? "?" + query : ""}`);
    const list  = Array.isArray(data) ? data : (data.content || []);
    return list.map((d) => ({
        id:               d.idDeclaration,
        reference:        d.referenceDeclaration,
        annee:            d.anneeFiscale,
        statut:           d.statut,
        type:             d.typeDeclaration,
        structureFiscale: d.structureFiscale || "DGI",
        montant:          d.montantAPayer
            ? new Intl.NumberFormat("fr-FR").format(d.montantAPayer) + " FCFA" : "—",
        montantBrut:      d.montantAPayer || 0,
        dateDeclaration:  d.dateSoumission || d.dateDeclaration,
    }));
};

export const getDeclarationById     = (id)  => fetcher(`/declarations/${id}`);
export const createDeclaration      = (body) =>
    fetcher("/declarations", { method: "POST", body: JSON.stringify(body) });
export const changerStatutDeclaration = (id, statut, motifRejet = null) =>
    fetcher(`/declarations/${id}/statut`, {
        method: "PATCH",
        body: JSON.stringify({ statut, motif_rejet: motifRejet }),
    });

// ══════════════════════════════════════════════════════════════════════════════
// AVIS D'IMPOSITION
// ══════════════════════════════════════════════════════════════════════════════
export const getAvis = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data  = await fetcher(`/avis-imposition${query ? "?" + query : ""}`);
    const list  = Array.isArray(data) ? data : (data.content || []);
    return list.map((a) => ({
        id:             a.idAvis,
        reference:      a.reference,
        annee:          a.anneeFiscale || "—",
        statut:         a.statut,
        structure:      a.structureFiscale || "DGI",
        date:           a.dateNotification || a.dateReception,
        montant:        a.montant
            ? new Intl.NumberFormat("fr-FR").format(a.montant) + " FCFA" : "—",
        montantBrut:    a.montant || 0,
        ribReceveur:    a.ribReceveur,
        idDeclaration:  a.idDeclaration,
        idContribuable: a.idContribuable,
    }));
};

export const getAvisById = (id) => fetcher(`/avis-imposition/${id}`);
export const payerAvis   = (id) =>
    fetcher(`/avis-imposition/${id}/payer`, { method: "PATCH" });

/**
 * Télécharge le PDF d'un avis depuis le backend.
 * Le backend génère le PDF à la volée depuis le template DOCX.
 *
 * @param {number} avisId    - ID de l'avis en base
 * @param {string} reference - Référence pour nommer le fichier téléchargé
 */
export const telechargerAvisPDF = async (avisId, reference) => {
    const url      = `${BASE_URL}/avis-imposition/${avisId}/telecharger`;
    const response = await fetch(url);

    if (!response.ok) {
        const msg = await response.text().catch(() => "Erreur inconnue");
        throw new Error(`Erreur téléchargement (${response.status}) : ${msg}`);
    }

    const blob     = await response.blob();
    const filename = `DPR_AVIS-${reference || avisId}.pdf`;
    const href     = URL.createObjectURL(blob);
    const a        = document.createElement("a");
    a.href         = href;
    a.download     = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
};

// ══════════════════════════════════════════════════════════════════════════════
// AMR
// ══════════════════════════════════════════════════════════════════════════════
export const getAMRs = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data  = await fetcher(`/amr${query ? "?" + query : ""}`);
    const list  = Array.isArray(data) ? data : (data.content || []);
    return list.map((a) => ({
        id:                 a.idAMR,
        reference:          `AMR-${a.numeroAMR || a.idAMR}`,
        numeroAMR:          a.numeroAMR,
        statut:             a.statut,
        motif:              a.motif,
        montantInitial:     a.montantInitial,
        montantMajorations: a.montantMajorations,
        montantTotal:       a.montantTotal
            ? new Intl.NumberFormat("fr-FR").format(a.montantTotal) + " FCFA" : "—",
        dateEmission:       a.dateEmission,
    }));
};

export const createAMR      = (payload) =>
    fetcher("/amr", { method: "POST", body: JSON.stringify(payload) });
export const changerStatutAMR = (id, statut) =>
    fetcher(`/amr/${id}/statut`, { method: "PATCH", body: JSON.stringify({ statut }) });

// ══════════════════════════════════════════════════════════════════════════════
// CONTRIBUABLES
// ══════════════════════════════════════════════════════════════════════════════
export const getContribuable = async (id = CURRENT_USER_ID) => {
    const d = await fetcher(`/contribuables/${id}`);
    return {
        NIU:              d.niu              || d.NIU              || "—",
        prenom:           d.prenom           || "—",
        nom_beneficiaire: d.nomBeneficiaire  || d.nom_beneficiaire || "—",
        raison_sociale:   d.raisonSociale    || d.raison_sociale   || "—",
        email:            d.email            || "—",
        telephone:        d.telephone        || d.tel              || "—",
        regimeFiscal:     d.regimeFiscal     || d.regime_fiscal    || "—",
        structureFiscale: d.structureFiscale || d.structure_fiscale|| "CDI YAOUNDE 2",
        statut:           d.statut,
        commune:          d.commune
            ? { nom_commune: d.commune.nomCommune || d.commune.nom_commune || d.commune }
            : { nom_commune: "—" },
        ...d,
    };
};

export const getEtablissements  = (id = CURRENT_USER_ID) => fetcher(`/contribuables/${id}/etablissements`);
export const getContribuables   = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const data  = await fetcher(`/contribuables${query ? "?" + query : ""}`);
    return Array.isArray(data) ? data : (data.content || []);
};
export const getContribuableById  = (id) => fetcher(`/contribuables/${id}`);
export const createContribuable   = (payload) =>
    fetcher("/contribuables", { method: "POST", body: JSON.stringify(payload) });

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
export const getNotifications = async (idContribuable = null) => {
    const query = idContribuable ? `?id_contribuable=${idContribuable}` : "";
    const data  = await fetcher(`/notifications${query}`);
    const list  = Array.isArray(data) ? data : (data.content || []);
    return list.map((n) => ({
        id:           n.idNotification,
        idDeclaration: n.idDeclaration,
        titre:        n.titre || "Notification",
        message:      n.contenu || "",
        date:         n.dateCreation,
        priorite:     (n.priorite || "NORMALE").toLowerCase(),
        lu:           n.statut === "LU",
        expediteur:   n.expediteur || "DGI",
        type:         n.type,
    }));
};

export const marquerNotificationLue = (id) =>
    fetcher(`/notifications/${id}/lire`, { method: "PATCH" });
export const marquerToutesLues      = (idContribuable = null) =>
    fetcher("/notifications/lire-tout", {
        method: "PATCH",
        body: JSON.stringify(idContribuable ? { id_contribuable: idContribuable } : {}),
    });

// ══════════════════════════════════════════════════════════════════════════════
// PAIEMENTS
// ══════════════════════════════════════════════════════════════════════════════
export const getPaiements    = () => fetcher("/paiements");
export const createPaiement  = (idDeclaration, montantPaye, modePaiement) =>
    fetcher("/paiements", {
        method: "POST",
        body: JSON.stringify({
            id_declaration: idDeclaration,
            montant_paye:   montantPaye,
            mode_paiement:  modePaiement,
        }),
    });

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL FISCAL
// ══════════════════════════════════════════════════════════════════════════════
export const calculerPatente = (chiffreAffaire, typeActivite = "COMMERCE") =>
    fetcher("/fiscal/calculer-patente", {
        method: "POST",
        body: JSON.stringify({ chiffre_affaire: chiffreAffaire, type_activite: typeActivite }),
    });
export const calculerTDL = (surfaceM2, commune = "") =>
    fetcher("/fiscal/calculer-TDL", {
        method: "POST",
        body: JSON.stringify({ surface_m2: surfaceM2, commune }),
    });

/**
 * Retourne le taux d'imposition selon la structureFiscale (CGA=0%, DGE=0.2%)
 * Le profil est configure manuellement en BD.
 */
export const getTauxImpot = (structureFiscale) =>
    fetcher(`/fiscal/taux-impot?structureFiscale=${encodeURIComponent(structureFiscale || "")}`);

export const calculerImpot = (montant, structureFiscale) =>
    fetcher("/fiscal/calculer-impot", {
        method: "POST",
        body: JSON.stringify({ montant, structureFiscale }),
    });