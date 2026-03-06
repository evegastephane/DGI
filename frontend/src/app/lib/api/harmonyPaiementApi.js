// src/app/lib/api/harmonyPaiementApi.js
// ─── Client Harmony 2 via proxy Next.js (/api/harmony/...) ────────────────

const PROXY_BASE = "/api/harmony";

export const OPERATEURS = [
    { code: "MOMO",            label: "MTN MoMo",      icon: "📱", couleur: "#FFCC00" },
    { code: "OM",              label: "Orange Money",  icon: "🟠", couleur: "#FF6600" },
    { code: "YOOMEE",          label: "YooMee Money",  icon: "💚", couleur: "#00B050" },
    { code: "OTP",             label: "OTP",           icon: "🔐", couleur: "#6366F1" },
    { code: "UBA_M2U",         label: "UBA M2U",       icon: "🏦", couleur: "#CC0000" },
    { code: "CAMPOST",         label: "CAMPOST",       icon: "📮", couleur: "#003399" },
    { code: "EXPRESSUNION",    label: "Express Union", icon: "💵", couleur: "#003399" },
    { code: "EXPRESSEXCHANGE", label: "Ecobank",       icon: "🏧", couleur: "#CC0000" },
];

export function genererReference(prefix = "DGI") {
    const d    = new Date();
    const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
    const rand = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
    return `${prefix}-TRX-${date}-${rand}`;
}

async function harmonyFetch(path, options = {}) {
    const url = `${PROXY_BASE}${path}`;

    console.log("[Harmony2]", options.method || "GET", url);
    if (options.body) {
        try { console.log("[Harmony2] payload:", JSON.parse(options.body)); } catch {}
    }

    const res  = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });

    const text = await res.text().catch(() => "");
    console.log("[Harmony2] status:", res.status, "body:", text.slice(0, 300));

    let json;
    try { json = JSON.parse(text); }
    catch { json = { raw: text }; }

    if (!res.ok) {
        const msg =
            json?.message           ||
            json?.error_description ||
            json?.error             ||
            json?.detail            ||
            json?.raw               ||
            `Erreur HTTP ${res.status}`;
        throw new Error(msg);
    }

    if (json?.statusCode && Number(json.statusCode) >= 400) {
        throw new Error(json.message || `Erreur serveur ${json.statusCode}`);
    }

    return json;
}

export async function initialiserPaiement({
                                              niu,
                                              montantAPayer,
                                              codeOperateur,
                                              numeroCompte,
                                              referenceDeclaration,
                                              libelleImpot       = "Patente DGI",
                                              typeDeclaration    = "PATENTE",
                                              libelleDeclaration = "Paiement portail contribuable DGI",
                                          }) {
    const numero = String(numeroCompte)
        .replace(/\+237/g, "")
        .replace(/[\s\-\.]/g, "")
        .trim();

    const payload = {
        reference_demande  : referenceDeclaration,
        niu                : "P120616628524A",   // NIU hardcodé (compte de test DGI)
        libelle_impot      : libelleImpot,
        code_operateur     : codeOperateur,      // opérateur choisi par l'utilisateur
        numero_compte      : numero,             // numéro saisi par l'utilisateur
        montantAPayer      : montantAPayer,      // montant réel de la déclaration
        typeDeclaration    : typeDeclaration,
        typeAvis           : "AVIS_H2",
        libelleDeclaration : libelleDeclaration,
    };

    console.log("[Harmony2] initialiserPaiement payload final:", payload);

    const res = await harmonyFetch("/arn/generate/payment", {
        method: "POST",
        body:   JSON.stringify(payload),
    });

    const referencePanier =
        res.referencePanier       ||
        res.reference_panier      ||
        res.data?.referencePanier ||
        (typeof res.data === "string" ? res.data : null);

    if (!referencePanier) {
        throw new Error("Référence panier non reçue de Harmony 2");
    }

    return { ...res, referencePanier };
}

export async function getDetailPanier(referencePanier) {
    const res    = await harmonyFetch(`/get/${referencePanier}`);
    const detail = Array.isArray(res.data) ? res.data[0] : (res.data || res);
    return {
        referencePanier:   detail.referencePanier,
        montantAPayer:     detail.montantAPayer,
        statut:            detail.statut,
        statutLabel:       mapStatut(detail.statut),
        referencePaiement: detail.referencePaiement,
        structureImpot:    detail.structureImpot,
        _raw:              detail,
    };
}

function mapStatut(code) {
    if (code === 1 || code === "1" || code === "SUCCESSFUL") return "PAYE";
    if (code === 2 || code === "2" || code === "FAILED")     return "FAILED";
    if (code === 3 || code === "3" || code === "PARTIAL")    return "EN ATTENTE"; // en attente de confirmation USSD
    if (code === 4 || code === "4" || code === "EXPIRED")    return "EXPIRED";
    if (code === 0 || code === "0" || code === "PENDING")    return "EN ATTENTE";
    return String(code || "").toUpperCase() || "EN ATTENTE";
}

export async function pollStatutPaiement(referencePanier, onUpdate, {
    intervalMs = 5000,
    timeoutMs  = 180000,
} = {}) {
    const debut      = Date.now();
    let erreurConsec = 0;

    return new Promise((resolve, reject) => {
        const tick = async () => {
            if (Date.now() - debut > timeoutMs) {
                reject(new Error("Delai d'attente depasse."));
                return;
            }
            try {
                const detail = await getDetailPanier(referencePanier);
                erreurConsec = 0;
                onUpdate(detail);

                const s = String(detail.statut).toUpperCase();
                console.log("[Harmony2] poll tick — statut brut:", detail.statut, "| type:", typeof detail.statut, "| mapped:", s);

                // Statuts terminaux :
                // 1 = SUCCESS, 2 = FAILED, 3 = PARTIAL (accepté comme succès)
                // Statuts terminaux Harmony :
                // 1 = SUCCESS (paiement confirmé)
                // 2 = FAILED  (paiement refusé)
                // 4 = EXPIRED (délai dépassé)
                // 3 = EN ATTENTE de confirmation USSD → on continue de poller
                // 0 = PENDING → on continue de poller
                const isTerminal =
                    detail.statut === 1 || detail.statut === 2 || detail.statut === 4 ||
                    ["1", "2", "4", "SUCCESSFUL", "FAILED", "EXPIRED", "PAYE", "PAYÉ"].includes(s);

                if (isTerminal) {
                    console.log("[Harmony2] poll terminé — statut final:", s);
                    resolve(detail);
                } else {
                    setTimeout(tick, intervalMs);
                }
            } catch (err) {
                erreurConsec++;
                console.warn("[Harmony2] poll erreur #" + erreurConsec + ":", err.message);
                if (erreurConsec >= 10) {
                    reject(new Error("Trop d'erreurs consecutives: " + err.message));
                } else {
                    setTimeout(tick, intervalMs);
                }
            }
        };
        setTimeout(tick, intervalMs);
    });
}