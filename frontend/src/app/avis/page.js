"use client";

import { useState, useRef, useEffect } from "react";
import C from "../lib/utils/colors";
import {
    getAvis,
    telechargerAvisPDF,
    CURRENT_USER_ID,
} from "../lib/api/contribuableApi";
import { createPaiement, updatePaiement } from "../lib/api/PaiementsApi";
import { initialiserPaiement, pollStatutPaiement } from "../lib/api/harmonyPaiementApi";

const EXERCICE_OPTIONS = ["2025", "2024", "2023", "2022"];
const ROWS_OPTIONS     = [10, 25, 50];

const STATUT_OPTIONS = [
    { value: "SUBMITTED", label: "SUBMITTED" },
    { value: "DRAFT",     label: "DRAFT"     },
    { value: "VALIDE",    label: "VALIDÉ"    },
    { value: "REJETE",    label: "REJETÉ"    },
];

// ─── Mapping id opérateur → code Harmony 2 ────────────────────────────────
const HARMONY_CODE = {
    om:           "OM",
    mtn:          "MOMO",
    yoomee:       "YOOMEE",
    otp:          "OTP",
    uba:          "UBA_M2U",
    campost:      "CAMPOST",
    ecobank:      "EXPRESSEXCHANGE",
    expressunion: "EXPRESSUNION",
};

// ─── Opérateurs mobiles ───────────────────────────────────────────────────
const OPERATEURS_MOBILES = [
    {
        id: "mtn",
        label: "MTN Mobile Money",
        note: "Confirmez le paiement en composant le #126# sur votre smartphone, puis entrez votre code secret MTN MoMo.",
        Logo: () => (
            <div style={{ width: 68, height: 44, borderRadius: 6, background: "#FFCC00", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#000", lineHeight: 1 }}>MTN</span>
                <span style={{ fontSize: 7, color: "#000" }}>Mobile Money</span>
            </div>
        ),
    },
    {
        id: "om",
        label: "Orange Money",
        note: "Confirmez le paiement, composez le #150# sur votre smartphone, puis entrez votre code secret OM.",
        Logo: () => (
            <div style={{ width: 68, height: 44, borderRadius: 6, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, background: "#FF6600", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 16 16" width="14" height="14">
                        <polyline points="2,14 8,2 14,14" fill="none" stroke="#fff" strokeWidth="2.5"/>
                        <line x1="4" y1="10" x2="12" y2="10" stroke="#fff" strokeWidth="2"/>
                    </svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#FF6600" }}>OM</span>
            </div>
        ),
    },
    {
        id: "yoomee",
        label: "YooMee Money",
        note: "Composez le *555# pour approuver le paiement YooMee.",
        Logo: () => (
            <div style={{ width: 68, height: 44, borderRadius: 6, background: "#fff", border: "2px solid #00B050", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#00B050" }}>YooMee</span>
                <span style={{ fontSize: 8, color: "#444" }}>Money</span>
            </div>
        ),
    },
    {
        id: "otp",
        label: "OTP",
        note: "Un code OTP sera envoyé par SMS pour valider votre paiement.",
        Logo: () => (
            <div style={{ width: 54, height: 44, borderRadius: 6, background: "#1a1a2e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 14, color: "#aaa", letterSpacing: 3 }}>***</span>
                <span style={{ fontSize: 7.5, color: "#aaa" }}>OTP</span>
            </div>
        ),
    },
];

// ─── Établissements financiers ────────────────────────────────────────────
const ETABLISSEMENTS_FIN = [
    {
        id: "uba",
        label: "UBA M2U",
        note: "Télécharger l'application M2U sur PlayStore et AppStore pour approuver votre paiement.",
        Logo: () => (
            <div style={{ width: 72, height: 44, borderRadius: 6, background: "#CC0000", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>UBA</span>
                <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M2 7h10M7 2l5 5-5 5"/>
                </svg>
            </div>
        ),
    },
    {
        id: "campost",
        label: "CAMPOST",
        note: "Rendez-vous à l'agence CAMPOST la plus proche avec votre référence de paiement.",
        Logo: () => (
            <div style={{ width: 72, height: 44, borderRadius: 6, background: "#F5C000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 32 18" width="28" height="14">
                    <polygon points="16,1 30,17 2,17" fill="none" stroke="#003399" strokeWidth="2.5"/>
                </svg>
                <span style={{ fontSize: 7.5, fontWeight: 900, color: "#003399" }}>CAMPOST</span>
            </div>
        ),
    },
    {
        id: "ecobank",
        label: "Ecobank",
        note: "Connectez-vous à votre espace Ecobank Online pour approuver le paiement.",
        Logo: () => (
            <div style={{ width: 72, height: 44, borderRadius: 6, background: "#CC0000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                <svg viewBox="0 0 32 16" width="28" height="12" fill="none">
                    <path d="M3 8 Q10 1 16 8 Q22 15 29 8" stroke="#fff" strokeWidth="2" fill="none"/>
                    <path d="M3 8 Q10 15 16 8 Q22 1 29 8" stroke="#fff" strokeWidth="1" fill="none" opacity="0.5"/>
                </svg>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: "#fff" }}>Ecobank</span>
            </div>
        ),
    },
    {
        id: "expressunion",
        label: "Express Union",
        note: "Rendez-vous à une agence Express Union avec votre référence pour effectuer le paiement.",
        Logo: () => (
            <div style={{ width: 72, height: 44, borderRadius: 6, background: "#003399", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: "#fff", letterSpacing: 0.5 }}>EXPRESS</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>UNION</span>
            </div>
        ),
    },
];

// ─── Spinner animé orange ─────────────────────────────────────────────────
function OrangeSpinner() {
    const [rotation, setRotation] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setRotation(r => r + 30), 100);
        return () => clearInterval(id);
    }, []);
    return (
        <div style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}>
            <svg width="92" height="92" viewBox="0 0 92 92"
                 style={{ transform: `rotate(${rotation}deg)`, transition: "transform 0.1s linear" }}>
                {Array.from({ length: 12 }).map((_, i) => {
                    const angle   = (i / 12) * 2 * Math.PI;
                    const r       = 36;
                    const cx      = 46 + r * Math.sin(angle);
                    const cy      = 46 - r * Math.cos(angle);
                    const opacity = 0.15 + (i / 11) * 0.85;
                    const size    = 3 + Math.floor(i / 4);
                    return <circle key={i} cx={cx} cy={cy} r={size} fill={C.orange} opacity={opacity} />;
                })}
            </svg>
        </div>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────
function Toast({ visible, message }) {
    if (!visible) return null;
    return (
        <div style={{
            position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
            zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
            background: "#0D9488", color: "#fff", padding: "14px 24px",
            borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            fontSize: 14, fontWeight: 500, whiteSpace: "nowrap",
        }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l3 3 5-5"/>
            </svg>
            {message}
        </div>
    );
}

// ─── ExerciceSelect — label flottant (style MesDeclarations) ─────────────
function ExerciceSelect({ label, value, onChange, options }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const isFilled = !!value;

    return (
        <div ref={ref} style={{ position: "relative", flex: 1 }}>
            <div onClick={() => setOpen(!open)} style={{
                position: "relative",
                border: `1.5px solid ${open || isFilled ? "#F59E0B" : "#D1D5DB"}`,
                borderRadius: 4, height: 37, background: "#fff",
                cursor: "pointer", userSelect: "none",
                display: "flex", alignItems: "center", padding: "0 14px",
            }}>
                {/* Floating label */}
                <span style={{
                    position: "absolute", left: 12,
                    top: open || isFilled ? -10 : "50%",
                    transform: open || isFilled ? "none" : "translateY(-50%)",
                    fontSize: open || isFilled ? 11 : 14,
                    color: open || isFilled ? "#F59E0B" : "#9CA3AF",
                    background: "#fff", padding: "0 4px",
                    transition: "all 0.15s", pointerEvents: "none", lineHeight: 1,
                }}>{label}</span>

                <span style={{ fontSize: 14, color: isFilled ? "#111827" : "transparent", marginTop: 4 }}>
                    {isFilled ? `EXERCICE ${value}` : "\u200b"}
                </span>

                {isFilled && (
                    <button onClick={(e) => { e.stopPropagation(); onChange(""); }}
                            style={{
                                position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer",
                                color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "2px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>×</button>
                )}

                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                     style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`, transition: "transform 0.2s", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200,
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.10)", overflow: "hidden",
                }}>
                    {options.map((opt) => (
                        <div key={opt}
                             onClick={() => { onChange(opt); setOpen(false); }}
                             style={{
                                 padding: "13px 16px", fontSize: 14, cursor: "pointer",
                                 color: value === opt ? "#F59E0B" : "#374151",
                                 fontWeight: value === opt ? 600 : 400,
                                 background: value === opt ? "#FFF7ED" : "transparent",
                                 borderBottom: `1px solid #F3F4F6`,
                             }}
                             onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = "#F9FAFB"; }}
                             onMouseLeave={(e) => { e.currentTarget.style.background = value === opt ? "#FFF7ED" : "transparent"; }}>
                            EXERCICE {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── StatutSelect — label flottant + checkboxes (identique à MesDeclarations) ─
function StatutSelect({ label, value, onChange, options }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const isFilled = !!value;
    const selected = options.find(o => o.value === value);

    return (
        <div ref={ref} style={{ position: "relative", flex: 1 }}>
            <div onClick={() => setOpen(!open)} style={{
                position: "relative", border: `1.5px solid ${open || isFilled ? "#F59E0B" : "#D1D5DB"}`,
                borderRadius: 4, height: 37, background: "#fff",
                cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", padding: "0 14px",
            }}>
                <span style={{
                    position: "absolute", left: 12, top: open || isFilled ? -10 : "50%",
                    transform: open || isFilled ? "none" : "translateY(-50%)",
                    fontSize: open || isFilled ? 11 : 14,
                    color: open || isFilled ? "#F59E0B" : "#9CA3AF",
                    background: "#fff", padding: "0 4px",
                    transition: "all 0.15s", pointerEvents: "none", lineHeight: 1,
                }}>{label}</span>
                <span style={{ fontSize: 14, color: isFilled ? "#111827" : "transparent", marginTop: 4 }}>
                    {selected?.label || "\u200b"}
                </span>
                {isFilled && (
                    <button onClick={(e) => { e.stopPropagation(); onChange(""); }}
                            style={{
                                position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer",
                                color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "2px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>×</button>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                     style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`, transition: "transform 0.2s", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>

            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200,
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.10)", overflow: "hidden",
                }}>
                    {/* Option "Tout" */}
                    <div onClick={() => { onChange(""); setOpen(false); }}
                         style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", cursor: "pointer", borderBottom: `1px solid #F3F4F6`, background: "transparent" }}
                         onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                         onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <span style={{
                            width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                            border: `2px solid ${!value ? "#F59E0B" : "#D1D5DB"}`,
                            background: !value ? "#FFF7ED" : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {!value && (
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </span>
                        <span style={{ fontSize: 14, color: "#9CA3AF", fontWeight: !value ? 500 : 400 }}>Tout</span>
                    </div>

                    {options.map((opt) => {
                        const checked = value === opt.value;
                        return (
                            <div key={opt.value}
                                 onClick={() => { onChange(opt.value); setOpen(false); }}
                                 style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", cursor: "pointer", borderBottom: `1px solid #F3F4F6`, background: "transparent" }}
                                 onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                                 onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                <span style={{
                                    width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                                    border: `2px solid ${checked ? "#F59E0B" : "#D1D5DB"}`,
                                    background: checked ? "#FFF7ED" : "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {checked && (
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6l3 3 5-5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </span>
                                <span style={{ fontSize: 14, color: "#374151", fontWeight: checked ? 500 : 400, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    {opt.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


// ════════════════════════════════════════════════════════════════════════════
function PagePaiement({ avis, onRetour, contribuable }) {
    const [onglet,          setOnglet]          = useState("mobile");
    const [operateurId,     setOperateurId]     = useState("om");
    const [etablissementId, setEtablissementId] = useState("uba");
    const [telephone,       setTelephone]       = useState("+237 ");
    const [loading,         setLoading]         = useState(false);
    const [statut,          setStatut]          = useState(null);
    const [refPaiement,     setRefPaiement]     = useState("");
    const [referencePanier, setReferencePanier] = useState("");
    const [toast,           setToast]           = useState(false);
    const [toastMsg,        setToastMsg]        = useState("");

    const liste       = onglet === "mobile" ? OPERATEURS_MOBILES : ETABLISSEMENTS_FIN;
    const selId       = onglet === "mobile" ? operateurId : etablissementId;
    const setSelId    = onglet === "mobile" ? setOperateurId : setEtablissementId;
    const fournisseur = liste.find(i => i.id === selId);

    const showToast = (msg) => { setToastMsg(msg); setToast(true); setTimeout(() => setToast(false), 4000); };

    const handleConfirmer = async () => {
        const numNettoyé = telephone.replace(/\+237/g, "").replace(/[\s\-\.]/g, "").trim();
        if (numNettoyé.length < 8) return;
        setLoading(true);
        const harmonyCode = HARMONY_CODE[selId] || "OM";
        const niu         = contribuable?.NIU || contribuable?.niu || avis?.niu || "";
        const montant     = Number(avis.montantBrut || avis.montantAPayer || 0);
        const modeLabel   = fournisseur?.label || selId;

        const sauvegarderPaiement = async (statut, extra = {}) => {
            try {
                const p = await createPaiement({ referenceDeclaration: avis.reference, anneeFiscale: avis.annee ? Number(avis.annee) : null, structureFiscale: avis.structure || "CDI YAOUNDE 1", montantAPayer: montant, montantPaye: statut === "SUCCESS" ? montant : 0, statutPaiement: statut, modePaiement: modeLabel, ...extra });
                return p?.idPaiement ?? p?.id ?? null;
            } catch (err) { console.warn("[BD] sauvegarderPaiement échoué:", err.message); return null; }
        };
        const mettreAJour = async (id, updates) => {
            if (!id) return;
            try { await updatePaiement(id, updates); } catch (err) { console.warn("[BD] mettreAJour échoué:", err.message); }
        };

        try {
            const res = await initialiserPaiement({ niu, montantAPayer: montant, codeOperateur: harmonyCode, numeroCompte: numNettoyé, referenceDeclaration: avis.reference, libelleImpot: avis.libelleImpot || `Droits d'enregistrement — ${avis.annee || new Date().getFullYear()}`, typeDeclaration: avis.typeDeclaration || "ACTE_NOTARIE", libelleDeclaration: `Paiement avis ${avis.reference}` });
            const refPanier = res?.referencePanier || res?.reference_panier || res?.data?.referencePanier || res?.idPanier || avis.reference;
            setReferencePanier(refPanier); setRefPaiement(refPanier);
            const paiementId = await sauvegarderPaiement("IN_PROGRESS", { referencePaiement: refPanier });
            setStatut("IN_PROGRESS"); showToast("Le paiement a été initié avec succès");
            pollStatutPaiement(refPanier, () => {}, { intervalMs: 5_000, timeoutMs: 180_000 })
                .then((detail) => {
                    const s = String(detail?.statut ?? "").toUpperCase();
                    const isSuccess = detail?.statut === 1 || ["1", "SUCCESSFUL", "PAYE", "PAYÉ"].includes(s);
                    const isFailed  = detail?.statut === 2 || ["2", "FAILED", "ECHEC"].includes(s);
                    if (isSuccess) {
                        const refFinal = detail?.referencePaiement || refPanier;
                        setRefPaiement(refFinal); setStatut("SUCCESS");
                        if (paiementId) mettreAJour(paiementId, { statutPaiement: "SUCCESS", montantPaye: montant, referencePaiement: refFinal, payeLe: new Date().toISOString() });
                        else sauvegarderPaiement("SUCCESS", { referencePaiement: refFinal, payeLe: new Date().toISOString() });
                    } else if (isFailed) {
                        setStatut("FAILED");
                        if (paiementId) mettreAJour(paiementId, { statutPaiement: "FAILED" });
                        else sauvegarderPaiement("FAILED", { referencePaiement: refPanier });
                    }
                })
                .catch(() => {
                    setStatut((current) => {
                        if (current === "SUCCESS") return "SUCCESS";
                        if (paiementId) mettreAJour(paiementId, { statutPaiement: "FAILED" });
                        else sauvegarderPaiement("FAILED", { referencePaiement: refPanier });
                        return "FAILED";
                    });
                });
        } catch (e) {
            console.error("[Harmony2] Erreur paiement:", e.message);
            showToast("Erreur : " + e.message); setStatut("FAILED");
            await sauvegarderPaiement("FAILED", { referencePaiement: `ERR-${avis.reference}` });
        } finally { setLoading(false); }
    };

    if (statut) {
        return (
            <main style={{ flex: 1, background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
                <div style={{ background: C.white, padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
                    <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: C.textDark }}>Payez votre Déclaration de l'IRPP</h1>
                </div>
                <div style={{ margin: "40px auto", width: "90%", maxWidth: 560, background: C.white, borderRadius: 4, padding: "48px 40px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    {statut === "IN_PROGRESS" && (<>
                        <p style={{ fontSize: 20, fontWeight: 700, color: C.textDark, margin: "0 0 4px" }}>En attente de la confirmation du paiement</p>
                        <p style={{ fontSize: 15, color: C.textGrey, marginBottom: 0 }}>{fournisseur?.id === "om" ? "OM" : fournisseur?.label}</p>
                        <OrangeSpinner />
                        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 10 }}>Ci-dessous le numéro de référence du document :</p>
                        <div style={{ display: "inline-block", background: "#F3F4F6", border: "1px solid #D1D5DB", borderRadius: 6, padding: "10px 28px", fontSize: 15, fontWeight: 700, fontFamily: "monospace", letterSpacing: 1 }}>{refPaiement}</div>
                        <div style={{ marginTop: 16, fontSize: 14, color: "#6B7280" }}>Statut du Paiement : <span style={{ fontWeight: 700, color: "#D97706" }}>PAIEMENT INITIE</span></div>
                        <button onClick={onRetour} style={{ marginTop: 32, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", border: `1px solid ${C.border}`, borderRadius: 6, background: "#F9FAFB", color: C.textMid, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>‹ RETOURNER</button>
                    </>)}
                    {statut === "SUCCESS" && (<>
                        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="26" fill="#DCFCE7"/><path d="M14 26L22 34L38 18" stroke="#16A34A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                        <p style={{ fontSize: 20, fontWeight: 700, color: "#15803D", margin: "0 0 8px" }}>Paiement réussi !</p>
                        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 18 }}>Votre paiement a été confirmé avec succès.</p>
                        <div style={{ display: "inline-block", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 6, padding: "10px 28px", fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: "#166534" }}>{refPaiement}</div>
                        <div style={{ marginTop: 14, fontSize: 14, color: "#6B7280" }}>Statut du Paiement : <span style={{ fontWeight: 700, color: "#15803D" }}>SUCCESS</span></div>
                        <button onClick={onRetour} style={{ marginTop: 32, padding: "12px 36px", background: C.orange, color: C.white, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Retour à la liste</button>
                    </>)}
                    {statut === "FAILED" && (<>
                        <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="26" fill="#FEE2E2"/><path d="M17 17L35 35M35 17L17 35" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round"/></svg></div>
                        <p style={{ fontSize: 20, fontWeight: 700, color: "#DC2626", margin: "0 0 8px" }}>Paiement échoué</p>
                        <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>Le paiement n'a pas abouti. Veuillez réessayer.</p>
                        <div style={{ fontSize: 14, color: "#6B7280" }}>Statut du Paiement : <span style={{ fontWeight: 700, color: "#DC2626" }}>FAILED</span></div>
                        <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center" }}>
                            <button onClick={() => setStatut(null)} style={{ padding: "11px 28px", background: C.orange, color: C.white, border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Réessayer</button>
                            <button onClick={onRetour} style={{ padding: "11px 28px", background: C.white, color: C.textMid, border: `1px solid ${C.border}`, borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Retourner</button>
                        </div>
                    </>)}
                </div>
                <div style={{ textAlign: "center", padding: "16px 0 32px", fontSize: 13, color: "#9CA3AF" }}>Copyright © <strong>Direction Générale des Impôts</strong> {new Date().getFullYear()}</div>
                <Toast visible={toast} message={toastMsg} />
            </main>
        );
    }

    const numNettoyé = telephone.replace(/\s/g, "").replace("+237", "");
    const canConfirm  = numNettoyé.length >= 8 && !loading;

    return (
        <main style={{ flex: 1, background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
            <div style={{ background: C.white, padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
                <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: C.textDark }}>Payez votre Déclaration de l'IRPP</h1>
            </div>
            <div style={{ margin: "32px auto", width: "90%", maxWidth: 660, background: C.white, borderRadius: 4, padding: "36px 52px 40px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <div style={{ display: "flex", borderRadius: 10, background: "#F3F4F6", padding: 4, marginBottom: 32 }}>
                    {[{ id: "mobile", label: "Opérateurs Mobiles", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg> }, { id: "financier", label: "Établissements Financiers", icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> }].map(tab => (
                        <button key={tab.id} onClick={() => setOnglet(tab.id)} style={{ flex: 1, padding: "12px 10px", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", background: onglet === tab.id ? C.orange : "transparent", color: onglet === tab.id ? "#fff" : C.textMid, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: onglet === tab.id ? "0 2px 8px rgba(0,0,0,0.15)" : "none", transition: "all 0.15s" }}>
                            <span style={{ display: "flex" }}>{tab.icon}</span>{tab.label}
                        </button>
                    ))}
                </div>
                <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
                    {liste.map(item => {
                        const sel = selId === item.id;
                        return (
                            <div key={item.id} onClick={() => setSelId(item.id)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", border: sel ? `5px solid ${C.orange}` : "2px solid #D1D5DB", background: "#fff", flexShrink: 0, boxSizing: "border-box", transition: "all 0.15s" }} />
                                <div style={{ padding: 4, borderRadius: 8, border: sel ? `2px solid ${C.orange}` : "2px solid transparent", background: sel ? C.orangeBg : "#F9FAFB", transition: "all 0.15s" }}><item.Logo /></div>
                            </div>
                        );
                    })}
                </div>
                <p style={{ fontSize: 15, color: C.textDark, marginBottom: 12 }}>Montant à payer : <strong>{Number(avis.montantBrut || 0).toLocaleString("fr-FR")} FCFA</strong></p>
                <p style={{ fontSize: 14, color: C.textDark, marginBottom: 8 }}>Saisissez numéro de téléphone : <strong>{fournisseur?.label}</strong></p>
                <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+237 ..." style={{ width: "100%", border: "1.5px solid #D1D5DB", borderRadius: 6, padding: "14px 16px", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 16 }} onFocus={(e) => (e.target.style.border = `1.5px solid ${C.orange}`)} onBlur={(e) => (e.target.style.border = "1.5px solid #D1D5DB")} />
                <p style={{ fontSize: 13, color: C.textDark, marginBottom: 32, lineHeight: 1.7 }}><strong>Note :</strong> {fournisseur?.note}</p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button onClick={onRetour} style={{ padding: "12px 28px", border: `1.5px solid ${C.orange}`, background: C.white, color: C.orange, borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Retourner</button>
                    <button onClick={handleConfirmer} disabled={!canConfirm} style={{ padding: "12px 28px", background: canConfirm ? C.orange : "#D1D5DB", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: canConfirm ? "pointer" : "not-allowed", transition: "background 0.15s" }}>{loading ? "Traitement..." : "Confirmez le Paiement"}</button>
                </div>
            </div>
            <div style={{ textAlign: "center", padding: "16px 0 32px", fontSize: 13, color: "#9CA3AF" }}>Copyright © <strong>Direction Générale des Impôts</strong> {new Date().getFullYear()}</div>
        </main>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// MENU ••• ACTIONS — inchangé (logique d'origine)
// ════════════════════════════════════════════════════════════════════════════
function ActionMenu({ avis, onPayer }) {
    const [open,        setOpen]        = useState(false);
    const [downloading, setDownloading] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const handleTelecharger = async (type) => {
        setOpen(false); setDownloading(true);
        try { await telechargerAvisPDF(avis.id, `${type === "accuse" ? "ACCUSE" : "AVIS"}-${avis.reference}`); }
        catch (e) { alert("Erreur : " + e.message); }
        finally { setDownloading(false); }
    };

    const item = (onClick, icon, label, disabled = false) => (
        <button onClick={onClick} disabled={disabled} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%",
            padding: "13px 18px", border: "none", background: "transparent",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: 14, color: disabled ? "#9CA3AF" : C.textDark, textAlign: "left",
        }}
                onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = C.orangeBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 16 }}>{icon}</span>{label}
        </button>
    );

    return (
        <td style={{ padding: "14px 16px", textAlign: "center", position: "relative" }} ref={ref}>
            <button onClick={() => setOpen(!open)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#9CA3AF", fontSize: 22, letterSpacing: 2,
                padding: "4px 8px", borderRadius: 4, lineHeight: 1,
                display: "flex", alignItems: "center",
            }}>
                {downloading ? "..." : "•••"}
            </button>
            {open && (
                <div style={{
                    position: "absolute", right: 8, top: "100%", zIndex: 300,
                    background: C.white, border: `1px solid #E5E7EB`,
                    borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    minWidth: 230, overflow: "hidden",
                }}>
                    {item(() => handleTelecharger("avis"),   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, "Télécharger l'avis",   downloading)}
                    <div style={{ height: 1, background: "#F3F4F6" }} />
                    {item(() => handleTelecharger("accuse"), <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, "Télécharger l'accusé", downloading)}
                    <div style={{ height: 1, background: "#F3F4F6" }} />
                    {item(() => { setOpen(false); onPayer(avis); }, <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, "Payer")}
                </div>
            )}
        </td>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE — Liste des Avis
// ════════════════════════════════════════════════════════════════════════════
export default function PageListeDesAvis() {
    const [rechercheOuverte, setRechercheOuverte] = useState(false);
    const [tousLesAvis,      setTousLesAvis]      = useState([]);
    const [avisFiltres,      setAvisFiltres]      = useState([]);
    const [loading,          setLoading]          = useState(true);
    const [erreur,           setErreur]           = useState(null);
    const [rowsPerPage,      setRowsPerPage]      = useState(10);
    const [currentPage,      setCurrentPage]      = useState(1);
    const [avisAPayer,       setAvisAPayer]       = useState(null);
    const [contribuable,     setContribuable]     = useState({});

    // Valeur "en attente" — appliquée uniquement au clic sur Rechercher
    const [pendingExercice, setPendingExercice] = useState("");
    const [pendingStatut,   setPendingStatut]   = useState("");
    const [exerciceSaisi,   setExerciceSaisi]   = useState("");
    const [filtreStatut,    setFiltreStatut]    = useState("");

    useEffect(() => {
        setLoading(true);
        import("../lib/api/contribuableApi").then(m => {
            m.getContribuable(CURRENT_USER_ID).then(setContribuable).catch(() => {});
        });
        getAvis({ id_contribuable: CURRENT_USER_ID })
            .then(d => { setTousLesAvis(d); setAvisFiltres(d); })
            .catch(e => setErreur(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (avisAPayer) return (
        <PagePaiement avis={avisAPayer} contribuable={contribuable} onRetour={() => setAvisAPayer(null)} />
    );

    const handleRechercher = () => {
        setExerciceSaisi(pendingExercice);
        setFiltreStatut(pendingStatut);
        let result = [...tousLesAvis];
        if (pendingExercice.trim()) result = result.filter(a => String(a.annee) === String(pendingExercice.trim()));
        if (pendingStatut)         result = result.filter(a => a.statut?.toUpperCase() === pendingStatut.toUpperCase());
        setAvisFiltres(result);
        setCurrentPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(avisFiltres.length / rowsPerPage));
    const paginated  = avisFiltres.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const fmtDate    = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
    const fmtMontant = (n) => n ? Number(n).toLocaleString("fr-FR") : "0";

    const thS = {
        padding: "0", textAlign: "left", fontSize: 13,
        fontWeight: 500, color: "#6B7280", borderBottom: `1px solid #E5E7EB`,
        whiteSpace: "nowrap", background: "#fff",
    };
    const tdS = {
        padding: "18px 20px", fontSize: 14, color: "#111827", verticalAlign: "middle",
    };

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column", padding: "24px 24px" }}>

            {/* ── En-tête ── */}
            <div style={{ background: "#fff", borderRadius: 8, padding: "18px 24px", marginBottom: 16, border: `1px solid #E5E7EB` }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" }}>Liste des Avis</h1>
            </div>

            {/* ── Recherche avancée ── */}
            <div style={{ background: "#fff", borderRadius: 0, border: `1px solid #E5E7EB`, marginBottom: 16 }}>
                <button onClick={() => setRechercheOuverte(!rechercheOuverte)}
                        style={{
                            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
                            fontSize: 15, color: "black", fontWeight: 500,
                        }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        Recherche avancée
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                         style={{ transform: rechercheOuverte ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>

                {rechercheOuverte && (
                    <div style={{ padding: "0 24px 20px", display: "flex", gap: 12, alignItems: "center" }}>
                        {/* Exercice */}
                        <ExerciceSelect
                            label="Exercice"
                            value={pendingExercice}
                            onChange={(v) => setPendingExercice(v)}
                            options={EXERCICE_OPTIONS}
                        />

                        {/* Statut */}
                        <StatutSelect
                            label="Statut"
                            value={pendingStatut}
                            onChange={(v) => setPendingStatut(v)}
                            options={STATUT_OPTIONS}
                        />

                        {/* Bouton Rechercher */}
                        <button
                            onClick={handleRechercher}
                            style={{
                                flex: 1,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                background: "#fff", color: "#F59E0B",
                                border: `1.5px solid #F59E0B`, borderRadius: 4,
                                padding: "0 24px", height: 37, fontSize: 14,
                                fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#FFF7ED"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                            RECHERCHER
                        </button>
                    </div>
                )}
            </div>

            {/* Compteur */}
            <div style={{
                padding: "12px 24px", textAlign: "right",
                fontSize: 13, color: "#black",
            }}>
                {loading ? "Chargement..." : `showing ${paginated.length} of ${avisFiltres.length} rows`}
            </div>

            {/* ── Tableau ── */}
            <div style={{ background: "#fff", borderRadius: 0, border: `1px solid #E5E7EB`, overflow: "hidden" }}>

                {loading ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>Chargement...</div>
                ) : erreur ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#B91C1C", fontSize: 13 }}>[!] {erreur}</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                            <thead>
                            <tr style={{ borderBottom: `1px solid #E5E7EB` }}>
                                <th style={thS}><div style={{ padding: "13px 20px" }}>Référence</div></th>
                                <th style={thS}><div style={{ padding: "13px 20px" }}>Année fiscale</div></th>
                                <th style={thS}><div style={{ padding: "13px 20px" }}>Structure Fiscale</div></th>
                                <th style={{ ...thS, textAlign: "right" }}><div style={{ padding: "13px 20px" }}>Montant</div></th>
                                <th style={thS}><div style={{ padding: "13px 20px" }}>Date émission</div></th>
                                <th style={thS}><div style={{ padding: "13px 20px" }}>Statut</div></th>
                                <th style={{ ...thS, textAlign: "center" }}><div style={{ padding: "13px 16px" }}>•••</div></th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: "60px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                                        {exerciceSaisi
                                            ? `Aucun avis trouvé pour l'exercice ${exerciceSaisi}${filtreStatut ? ` avec le statut ${filtreStatut}` : ""}.`
                                            : filtreStatut
                                                ? `Aucun avis trouvé avec le statut ${filtreStatut}.`
                                                : "Aucun avis d'imposition trouvé."
                                        }
                                    </td>
                                </tr>
                            ) : paginated.map((a) => (
                                <tr key={a.id}
                                    style={{ borderBottom: `1px solid #F3F4F6`, transition: "background 0.1s" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ ...tdS, fontFamily: "monospace", fontSize: 13, color: "#F59E0B", fontWeight: 600 }}>
                                        {a.reference || "—"}
                                    </td>
                                    <td style={tdS}>{a.annee || "—"}</td>
                                    <td style={tdS}>{a.structure || "CDI YAOUNDE"}</td>
                                    <td style={{ ...tdS, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                                        {fmtMontant(a.montantBrut)} FCFA
                                    </td>
                                    <td style={{ ...tdS, color: "#6B7280" }}>{fmtDate(a.date)}</td>
                                    <td style={tdS}>
                                        <span style={{
                                            padding: "5px 16px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                                            display: "inline-block", textTransform: "uppercase", letterSpacing: "0.05em",
                                            background: a.statut === "PAYE"
                                                ? "#F0FDF4"
                                                : ["EMIS", "SUBMITTED", "INIT"].includes(a.statut)
                                                    ? "#F59E0B"
                                                    : "#F3F4F6",
                                            color: a.statut === "PAYE"
                                                ? "#15803D"
                                                : ["EMIS", "SUBMITTED", "INIT"].includes(a.statut)
                                                    ? "#fff"
                                                    : "#6B7280",
                                        }}>
                                            {a.statut === "PAYE" ? "PAYÉ" : a.statut || "ÉMIS"}
                                        </span>
                                    </td>
                                    <ActionMenu avis={a} onPayer={setAvisAPayer} />
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination ── */}
                <div style={{
                    display: "flex", justifyContent: "flex-end", alignItems: "center",
                    padding: "12px 16px", borderTop: `1px solid #E5E7EB`,
                    background: "#fff", gap: 24,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
                        <span style={{ whiteSpace: "nowrap" }}>Rows per page:</span>
                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                            <select value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    style={{
                                        appearance: "none", border: "none", background: "transparent",
                                        fontSize: 13, color: "#374151", cursor: "pointer",
                                        outline: "none", paddingRight: 18, fontWeight: 400,
                                    }}>
                                {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"
                                 style={{ position: "absolute", right: 0, pointerEvents: "none" }}>
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </div>
                    </div>

                    <span style={{ fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>
                        {avisFiltres.length === 0 ? "0" : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, avisFiltres.length)} of {avisFiltres.length}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                style={{
                                    width: 28, height: 28, borderRadius: 4, border: "none",
                                    background: "none", cursor: currentPage === 1 ? "default" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: currentPage === 1 ? "#D1D5DB" : "#374151",
                                }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                style={{
                                    width: 28, height: 28, borderRadius: 4, border: "none",
                                    background: "none", cursor: currentPage === totalPages ? "default" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: currentPage === totalPages ? "#D1D5DB" : "#374151",
                                }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}