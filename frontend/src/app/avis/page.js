"use client";

import { useState, useRef, useEffect } from "react";
import C from "../lib/utils/colors";
import {
    getAvis,
    telechargerAvisPDF,
    CURRENT_USER_ID,
} from "../lib/api/contribuableApi";
import { createPaiement } from "../lib/api/PaiementsApi";
import { initialiserPaiement, pollStatutPaiement } from "../lib/api/harmonyPaiementApi";

const EXERCICE_OPTIONS = ["2025", "2024", "2023", "2022"];

// ─── Mapping id opérateur → code Harmony 2 ────────────────────────────────
// Codes acceptés par l'API : OM, MOMO, CAMPOST, OTP, EXPRESSUNION, UBA_M2U, YOOMEE, EXPRESSEXCHANGE
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
            <div style={{
                width: 68, height: 44, borderRadius: 6, background: "#FFCC00",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
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
            <div style={{
                width: 68, height: 44, borderRadius: 6, background: "#000",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
                <div style={{
                    width: 24, height: 24, background: "#FF6600", borderRadius: 3,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
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
            <div style={{
                width: 68, height: 44, borderRadius: 6, background: "#fff",
                border: "2px solid #00B050",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
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
            <div style={{
                width: 54, height: 44, borderRadius: 6, background: "#1a1a2e",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
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
            <div style={{
                width: 72, height: 44, borderRadius: 6, background: "#CC0000",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
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
            <div style={{
                width: 72, height: 44, borderRadius: 6, background: "#F5C000",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
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
            <div style={{
                width: 72, height: 44, borderRadius: 6, background: "#CC0000",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            }}>
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
            <div style={{
                width: 72, height: 44, borderRadius: 6, background: "#003399",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
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

// ─── Toast (notification verte en bas) ───────────────────────────────────
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

// ─── OutlinedInput ────────────────────────────────────────────────────────
function OutlinedInput({ label, value, onClear, onClick, open, children }) {
    const isFilled = value && value.length > 0;
    return (
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <div onClick={onClick} style={{
                border: `1.5px solid ${open || isFilled ? C.orange : "#9CA3AF"}`,
                borderRadius: 4, padding: "14px 40px 6px 12px",
                background: C.white, cursor: "pointer", minHeight: 52,
                display: "flex", alignItems: "center",
            }}>
                <span style={{
                    position: "absolute", left: 10,
                    top: isFilled || open ? 4 : 16,
                    fontSize: isFilled || open ? 10 : 14,
                    color: open || isFilled ? C.orange : "#9CA3AF",
                    transition: "all 0.15s", pointerEvents: "none",
                    background: C.white, padding: "0 2px",
                }}>{label}</span>
                <span style={{
                    fontSize: 14, color: isFilled ? C.textDark : "transparent",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: "calc(100% - 10px)", display: "block",
                }}>{value || "\u200b"}</span>
            </div>
            {isFilled && (
                <button onClick={(e) => { e.stopPropagation(); onClear(); }} style={{
                    position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16,
                }}>×</button>
            )}
            <span style={{
                position: "absolute", right: 8, top: "50%",
                transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`,
                pointerEvents: "none", color: "#9CA3AF", fontSize: 12, transition: "transform 0.15s",
            }}>▼</span>
            {children}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE PAIEMENT — même design que les screenshots, branché sur Harmony 2
// ════════════════════════════════════════════════════════════════════════════
function PagePaiement({ avis, onRetour, contribuable }) {
    const [onglet,          setOnglet]          = useState("mobile");
    const [operateurId,     setOperateurId]     = useState("om");
    const [etablissementId, setEtablissementId] = useState("uba");
    const [telephone,       setTelephone]       = useState("+237 ");
    const [loading,         setLoading]         = useState(false);
    const [statut,          setStatut]          = useState(null); // null | "IN_PROGRESS" | "SUCCESS" | "FAILED"
    const [refPaiement,     setRefPaiement]     = useState("");
    const [referencePanier, setReferencePanier] = useState("");
    const [toast,           setToast]           = useState(false);
    const [toastMsg,        setToastMsg]        = useState("");

    const liste      = onglet === "mobile" ? OPERATEURS_MOBILES : ETABLISSEMENTS_FIN;
    const selId      = onglet === "mobile" ? operateurId : etablissementId;
    const setSelId   = onglet === "mobile" ? setOperateurId : setEtablissementId;
    const fournisseur = liste.find(i => i.id === selId);

    const showToast = (msg) => {
        setToastMsg(msg); setToast(true);
        setTimeout(() => setToast(false), 4000);
    };

    const handleConfirmer = async () => {
        const numNettoyé = telephone
            .replace(/\+237/g, "")
            .replace(/[\s\-\.]/g, "")
            .trim();
        if (numNettoyé.length < 8) return;
        setLoading(true);

        const harmonyCode = HARMONY_CODE[selId] || "OM";
        const niu = contribuable?.NIU || contribuable?.niu || avis?.niu || "";

        try {
            const res = await initialiserPaiement({
                niu,
                montantAPayer:        Number(avis.montantBrut || avis.montantAPayer || 0),
                codeOperateur:        harmonyCode,
                numeroCompte:         numNettoyé,
                referenceDeclaration: avis.reference,
                libelleImpot:         avis.libelleImpot || `Droits d'enregistrement — ${avis.annee || new Date().getFullYear()}`,
                typeDeclaration:      avis.typeDeclaration || "ACTE_NOTARIE",
                libelleDeclaration:   `Paiement avis ${avis.reference}`,
            });

            // Extraire la référence panier (plusieurs noms possibles selon la version de l'API)
            const refPanier =
                res?.referencePanier     ||
                res?.reference_panier    ||
                res?.data?.referencePanier ||
                res?.idPanier            ||
                avis.reference;

            setReferencePanier(refPanier);
            setRefPaiement(refPanier);

            // Enregistrement initial en BD (statut IN_PROGRESS)
            let paiementId = null;
            try {
                const paiementCree = await createPaiement({
                    referenceDeclaration: avis.reference,
                    anneeFiscale:         avis.annee,
                    structureFiscale:     avis.structure || "CDI YAOUNDE 1",
                    montantAPayer:        Number(avis.montantBrut || avis.montantAPayer || 0),
                    montantPaye:          0,
                    statutPaiement:       "IN_PROGRESS",
                    operateur:            fournisseur?.label,
                    referencePaiement:    refPanier,
                    telephone,
                    payeLe:               null,
                });
                paiementId = paiementCree?.id;
            } catch (dbErr) {
                console.warn("[BD] Enregistrement paiement initial échoué:", dbErr.message);
            }

            setStatut("IN_PROGRESS");
            showToast("Le paiement a été initié avec succès");

            // Polling silencieux — met à jour la BD dès confirmation
            pollStatutPaiement(refPanier, (detail) => {
                const s = String(detail?.statut ?? "").toUpperCase();
                const isSuccess = ["1", "SUCCESSFUL", "PAYÉ", "PAYE"].includes(s) || detail?.statut === 1;
                const isFailed  = ["2", "FAILED", "ÉCHOUÉ", "ECHEC"].includes(s) || detail?.statut === 2;

                if (isSuccess) {
                    setStatut("SUCCESS");
                    const refFinal = detail?.referencePaiement || refPanier;
                    setRefPaiement(refFinal);
                    // Mise à jour statut en BD
                    if (paiementId) {
                        import("../lib/api/PaiementsApi").then(({ updatePaiement }) =>
                            updatePaiement(paiementId, {
                                statutPaiement:    "SUCCESS",
                                montantPaye:       Number(avis.montantBrut || avis.montantAPayer || 0),
                                referencePaiement: refFinal,
                                payeLe:            new Date().toISOString(),
                            }).catch(() => null)
                        );
                    } else {
                        // Pas d'ID connu → créer un nouveau enregistrement de succès
                        import("../lib/api/PaiementsApi").then(({ createPaiement: cp }) =>
                            cp({
                                referenceDeclaration: avis.reference,
                                anneeFiscale:         avis.annee,
                                structureFiscale:     avis.structure || "CDI YAOUNDE 1",
                                montantAPayer:        Number(avis.montantBrut || avis.montantAPayer || 0),
                                montantPaye:          Number(avis.montantBrut || avis.montantAPayer || 0),
                                statutPaiement:       "SUCCESS",
                                operateur:            fournisseur?.label,
                                referencePaiement:    refFinal,
                                telephone,
                                payeLe:               new Date().toISOString(),
                            }).catch(() => null)
                        );
                    }
                }
                if (isFailed) {
                    setStatut("FAILED");
                    if (paiementId) {
                        import("../lib/api/PaiementsApi").then(({ updatePaiement }) =>
                            updatePaiement(paiementId, { statutPaiement: "FAILED" }).catch(() => null)
                        );
                    }
                }
            }, { intervalMs: 5_000, timeoutMs: 180_000 }).catch(() => null);

        } catch (e) {
            // Afficher le vrai message d'erreur Harmony 2 dans la console
            console.error("[Harmony2] Erreur paiement:", e.message);
            // Montrer l'erreur à l'utilisateur via le toast puis FAILED
            showToast("Erreur : " + e.message);
            setStatut("FAILED");
        } finally {
            setLoading(false);
        }
    };

    // ── Écrans de statut ──────────────────────────────────────────────────
    if (statut) {
        return (
            <main style={{ flex: 1, background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
                <div style={{ background: C.white, padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
                    <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: C.textDark }}>
                        Payez votre Déclaration de l'IRPP
                    </h1>
                </div>

                <div style={{
                    margin: "40px auto", width: "90%", maxWidth: 560,
                    background: C.white, borderRadius: 4,
                    padding: "48px 40px", textAlign: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}>
                    {statut === "IN_PROGRESS" && (
                        <>
                            <p style={{ fontSize: 20, fontWeight: 700, color: C.textDark, margin: "0 0 4px" }}>
                                En attente de la confirmation du paiement
                            </p>
                            <p style={{ fontSize: 15, color: C.textGrey, marginBottom: 0 }}>
                                {fournisseur?.id === "om" ? "OM" : fournisseur?.label}
                            </p>
                            <OrangeSpinner />
                            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 10 }}>
                                Ci-dessous le numéro de référence du document :
                            </p>
                            <div style={{
                                display: "inline-block", background: "#F3F4F6",
                                border: "1px solid #D1D5DB", borderRadius: 6,
                                padding: "10px 28px", fontSize: 15, fontWeight: 700,
                                fontFamily: "monospace", letterSpacing: 1,
                            }}>
                                {refPaiement}
                            </div>
                            <div style={{ marginTop: 16, fontSize: 14, color: "#6B7280" }}>
                                Statut du Paiement :{" "}
                                <span style={{ fontWeight: 700, color: "#D97706" }}>IN_PROGRESS</span>
                            </div>
                            <button onClick={onRetour} style={{
                                marginTop: 32, display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "10px 24px", border: `1px solid ${C.border}`,
                                borderRadius: 6, background: "#F9FAFB", color: C.textMid,
                                fontWeight: 600, fontSize: 14, cursor: "pointer",
                            }}>
                                ‹ RETOURNER
                            </button>
                        </>
                    )}

                    {statut === "SUCCESS" && (
                        <>
                            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
                            <p style={{ fontSize: 20, fontWeight: 700, color: "#15803D", margin: "0 0 8px" }}>
                                Paiement réussi !
                            </p>
                            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 18 }}>
                                Votre paiement a été confirmé avec succès.
                            </p>
                            <div style={{
                                display: "inline-block", background: "#F0FDF4",
                                border: "1px solid #86EFAC", borderRadius: 6,
                                padding: "10px 28px", fontSize: 15, fontWeight: 700,
                                fontFamily: "monospace", color: "#166534",
                            }}>
                                {refPaiement}
                            </div>
                            <div style={{ marginTop: 14, fontSize: 14, color: "#6B7280" }}>
                                Statut du Paiement :{" "}
                                <span style={{ fontWeight: 700, color: "#15803D" }}>SUCCESS</span>
                            </div>
                            <button onClick={onRetour} style={{
                                marginTop: 32, padding: "12px 36px",
                                background: C.orange, color: C.white, border: "none",
                                borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer",
                            }}>
                                Retour à la liste
                            </button>
                        </>
                    )}

                    {statut === "FAILED" && (
                        <>
                            <div style={{ fontSize: 52, marginBottom: 12 }}>❌</div>
                            <p style={{ fontSize: 20, fontWeight: 700, color: "#DC2626", margin: "0 0 8px" }}>
                                Paiement échoué
                            </p>
                            <p style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
                                Le paiement n'a pas abouti. Veuillez réessayer.
                            </p>
                            <div style={{ fontSize: 14, color: "#6B7280" }}>
                                Statut du Paiement :{" "}
                                <span style={{ fontWeight: 700, color: "#DC2626" }}>FAILED</span>
                            </div>
                            <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center" }}>
                                <button onClick={() => setStatut(null)} style={{
                                    padding: "11px 28px", background: C.orange, color: C.white,
                                    border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer",
                                }}>Réessayer</button>
                                <button onClick={onRetour} style={{
                                    padding: "11px 28px", background: C.white, color: C.textMid,
                                    border: `1px solid ${C.border}`, borderRadius: 8, fontWeight: 600, cursor: "pointer",
                                }}>Retourner</button>
                            </div>
                        </>
                    )}
                </div>

                <div style={{ textAlign: "center", padding: "16px 0 32px", fontSize: 13, color: "#9CA3AF" }}>
                    Copyright © <strong>Direction Générale des Impôts</strong> {new Date().getFullYear()}
                </div>

                <Toast visible={toast} message={toastMsg} />
            </main>
        );
    }

    // ── Formulaire principal ──────────────────────────────────────────────
    const numNettoyé = telephone.replace(/\s/g, "").replace("+237", "");
    const canConfirm  = numNettoyé.length >= 8 && !loading;

    return (
        <main style={{ flex: 1, background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
            <div style={{ background: C.white, padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
                <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: C.textDark }}>
                    Payez votre Déclaration de l'IRPP
                </h1>
            </div>

            <div style={{
                margin: "32px auto", width: "90%", maxWidth: 660,
                background: C.white, borderRadius: 4,
                padding: "36px 52px 40px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}>
                {/* ── Toggle onglets ── */}
                <div style={{
                    display: "flex", borderRadius: 10, background: "#F3F4F6",
                    padding: 4, marginBottom: 32, gap: 0,
                }}>
                    {[
                        { id: "mobile",    label: "Opérateurs Mobiles",
                            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg> },
                        { id: "financier", label: "Établissements Financiers",
                            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setOnglet(tab.id)} style={{
                            flex: 1, padding: "12px 10px", border: "none", borderRadius: 8,
                            fontWeight: 600, fontSize: 13, cursor: "pointer",
                            background: onglet === tab.id ? C.orange : "transparent",
                            color: onglet === tab.id ? "#fff" : C.textMid,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                            boxShadow: onglet === tab.id ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                            transition: "all 0.15s",
                        }}>
                            <span style={{ display: "flex" }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Logos avec radio ── */}
                <div style={{
                    display: "flex", gap: 20, justifyContent: "center",
                    marginBottom: 28, flexWrap: "wrap", alignItems: "center",
                }}>
                    {liste.map(item => {
                        const sel = selId === item.id;
                        return (
                            <div key={item.id} onClick={() => setSelId(item.id)}
                                 style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <div style={{
                                    width: 18, height: 18, borderRadius: "50%",
                                    border: sel ? `5px solid ${C.orange}` : "2px solid #D1D5DB",
                                    background: "#fff", flexShrink: 0,
                                    boxSizing: "border-box", transition: "all 0.15s",
                                }} />
                                <div style={{
                                    padding: 4, borderRadius: 8,
                                    border: sel ? `2px solid ${C.orange}` : "2px solid transparent",
                                    background: sel ? C.orangeBg : "#F9FAFB",
                                    transition: "all 0.15s",
                                }}>
                                    <item.Logo />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Montant ── */}
                <p style={{ fontSize: 15, color: C.textDark, marginBottom: 12 }}>
                    Montant à payer :{" "}
                    <strong>{Number(avis.montantBrut || 0).toLocaleString("fr-FR")} FCFA</strong>
                </p>

                {/* ── Label téléphone ── */}
                <p style={{ fontSize: 14, color: C.textDark, marginBottom: 8 }}>
                    Saisissez numéro de téléphone : <strong>{fournisseur?.label}</strong>
                </p>

                {/* ── Input téléphone ── */}
                <input
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+237 ..."
                    style={{
                        width: "100%", border: "1.5px solid #D1D5DB",
                        borderRadius: 6, padding: "14px 16px", fontSize: 15,
                        outline: "none", boxSizing: "border-box", marginBottom: 16,
                    }}
                    onFocus={(e) => (e.target.style.border = `1.5px solid ${C.orange}`)}
                    onBlur={(e)  => (e.target.style.border = "1.5px solid #D1D5DB")}
                />

                {/* ── Note ── */}
                <p style={{ fontSize: 13, color: C.textDark, marginBottom: 32, lineHeight: 1.7 }}>
                    <strong>Note :</strong> {fournisseur?.note}
                </p>

                {/* ── Boutons ── */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button onClick={onRetour} style={{
                        padding: "12px 28px", border: `1.5px solid ${C.orange}`,
                        background: C.white, color: C.orange,
                        borderRadius: 6, fontWeight: 700, fontSize: 14, cursor: "pointer",
                    }}>
                        Retourner
                    </button>
                    <button onClick={handleConfirmer} disabled={!canConfirm} style={{
                        padding: "12px 28px",
                        background: canConfirm ? C.orange : "#D1D5DB",
                        color: "#fff", border: "none", borderRadius: 6,
                        fontWeight: 700, fontSize: 14,
                        cursor: canConfirm ? "pointer" : "not-allowed",
                        transition: "background 0.15s",
                    }}>
                        {loading ? "Traitement..." : "Confirmez le Paiement"}
                    </button>
                </div>
            </div>

            <div style={{ textAlign: "center", padding: "16px 0 32px", fontSize: 13, color: "#9CA3AF" }}>
                Copyright © <strong>Direction Générale des Impôts</strong> {new Date().getFullYear()}
            </div>
        </main>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// MENU ••• ACTIONS
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
        setOpen(false);
        setDownloading(true);
        try {
            await telechargerAvisPDF(avis.id, `${type === "accuse" ? "ACCUSE" : "AVIS"}-${avis.reference}`);
        } catch (e) {
            alert("Erreur : " + e.message);
        } finally {
            setDownloading(false);
        }
    };

    const item = (onClick, icon, label, disabled = false) => (
        <button onClick={onClick} disabled={disabled} style={{
            display: "flex", alignItems: "center", gap: 12,
            width: "100%", padding: "13px 18px",
            border: "none", background: "transparent",
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
                color: "#6B7280", fontSize: 20, letterSpacing: 3,
                padding: "4px 8px", borderRadius: 4,
            }}>
                {downloading ? "⏳" : "•••"}
            </button>

            {open && (
                <div style={{
                    position: "absolute", right: 8, top: "100%", zIndex: 300,
                    background: C.white, border: `1px solid ${C.border}`,
                    borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.15)",
                    minWidth: 230, overflow: "hidden",
                }}>
                    {item(() => handleTelecharger("avis"),   "⬇", "Télécharger l'avis",   downloading)}
                    <div style={{ height: 1, background: "#F3F4F6" }} />
                    {item(() => handleTelecharger("accuse"), "📄", "Télécharger l'accusé", downloading)}
                    <div style={{ height: 1, background: "#F3F4F6" }} />
                    {item(() => { setOpen(false); onPayer(avis); }, "💳", "Payer")}
                </div>
            )}
        </td>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE — Liste des Avis
// ════════════════════════════════════════════════════════════════════════════
export default function PageListeDesAvis() {
    const [rechercheOuverte, setRechercheOuverte] = useState(true);
    const [exerciceSaisi,    setExerciceSaisi]    = useState("");
    const [exerciceOpen,     setExerciceOpen]     = useState(false);
    const [tousLesAvis,      setTousLesAvis]      = useState([]);
    const [avisFiltres,      setAvisFiltres]      = useState([]);
    const [loading,          setLoading]          = useState(true);
    const [erreur,           setErreur]           = useState(null);
    const [rowsPerPage,      setRowsPerPage]      = useState(10);
    const [currentPage,      setCurrentPage]      = useState(1);
    const [avisAPayer,       setAvisAPayer]       = useState(null);
    const [contribuable,     setContribuable]     = useState({});
    const exerciceRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        // Charger le contribuable pour le NIU (nécessaire pour Harmony 2)
        import("../lib/api/contribuableApi").then(m => {
            m.getContribuable(CURRENT_USER_ID).then(setContribuable).catch(() => {});
        });
        getAvis({ id_contribuable: CURRENT_USER_ID })
            .then(d => { setTousLesAvis(d); setAvisFiltres(d); })
            .catch(e => setErreur(e.message))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const h = (e) => { if (exerciceRef.current && !exerciceRef.current.contains(e.target)) setExerciceOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    // Afficher la page de paiement en plein écran (comme dans les screenshots)
    if (avisAPayer) return (
        <PagePaiement
            avis={avisAPayer}
            contribuable={contribuable}
            onRetour={() => setAvisAPayer(null)}
        />
    );

    const handleRechercher = () => {
        setAvisFiltres(exerciceSaisi.trim()
            ? tousLesAvis.filter(a => String(a.annee) === String(exerciceSaisi.trim()))
            : tousLesAvis);
        setCurrentPage(1);
    };

    const totalPages = Math.max(1, Math.ceil(avisFiltres.length / rowsPerPage));
    const paginated  = avisFiltres.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const fmtDate    = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
    const fmtMontant = (n) => n ? Number(n).toLocaleString("fr-FR") : "0";

    const thStyle = {
        padding: "14px 20px", textAlign: "left", fontSize: 13, fontWeight: 600,
        color: C.textMid, background: C.white, borderBottom: `2px solid ${C.border}`, whiteSpace: "nowrap",
    };
    const tdStyle = {
        padding: "16px 20px", fontSize: 13, color: C.textDark,
        borderBottom: `1px solid #f3f4f6`, verticalAlign: "middle",
    };

    return (
        <main style={{ flex: 1, background: "#f3f4f6", display: "flex", flexDirection: "column" }}>
            <div style={{ background: C.white, marginTop: 20, marginLeft: 18, width: "96%", padding: "20px 16px", borderRadius: 5 }}>
                <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: C.textDark }}>Liste des Avis</h1>
            </div>

            <div style={{ padding: "0 0 40px" }}>
                {/* Recherche */}
                <div style={{ background: C.white, width: "96%", marginLeft: 18, marginTop: 16 }}>
                    <div onClick={() => setRechercheOuverte(!rechercheOuverte)} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "18px 28px", cursor: "pointer", userSelect: "none",
                    }}>
                        <span style={{ fontWeight: 600, fontSize: 16, color: C.textDark, marginLeft: -15 }}>Recherche avancée</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textGrey} strokeWidth="2"
                             style={{ transform: rechercheOuverte ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </div>
                    {rechercheOuverte && (
                        <div style={{ display: "flex", gap: 16, padding: "4px 28px 24px", alignItems: "flex-end", flexWrap: "wrap" }}>
                            <div ref={exerciceRef} style={{ flex: 1, minWidth: 200, position: "relative" }}>
                                <OutlinedInput
                                    label="Exercice"
                                    value={exerciceSaisi ? `EXERCICE ${exerciceSaisi}` : ""}
                                    onClear={() => { setExerciceSaisi(""); setAvisFiltres(tousLesAvis); setCurrentPage(1); }}
                                    onClick={() => setExerciceOpen(!exerciceOpen)}
                                    open={exerciceOpen}
                                >
                                    {exerciceOpen && (
                                        <div style={{
                                            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                                            background: C.white, border: `1px solid ${C.border}`,
                                            borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden",
                                        }}>
                                            {EXERCICE_OPTIONS.map(ex => (
                                                <div key={ex} onClick={() => { setExerciceSaisi(ex); setExerciceOpen(false); }}
                                                     style={{ padding: "11px 16px", cursor: "pointer", fontSize: 14,
                                                         background: exerciceSaisi === ex ? C.orangeBg : "transparent",
                                                         color: exerciceSaisi === ex ? C.orange : C.textDark,
                                                         fontWeight: exerciceSaisi === ex ? 600 : 400 }}
                                                     onMouseEnter={(e) => { if (exerciceSaisi !== ex) e.currentTarget.style.background = "#f9fafb"; }}
                                                     onMouseLeave={(e) => { e.currentTarget.style.background = exerciceSaisi === ex ? C.orangeBg : "transparent"; }}>
                                                    EXERCICE {ex}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </OutlinedInput>
                            </div>
                            <button onClick={handleRechercher} style={{
                                flex: 1, minWidth: 180, height: 52,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                border: `1.5px solid ${C.orange}`, background: C.white,
                                color: C.orange, borderRadius: 4, padding: "14px 20px",
                                fontWeight: 700, fontSize: 14, cursor: "pointer",
                            }}>
                                🔍 RECHERCHER
                            </button>
                        </div>
                    )}
                </div>

                {/* Compteur */}
                <div style={{ background: "#f3f4f6", padding: "10px 28px", textAlign: "right", fontSize: 13, color: C.textGrey }}>
                    {loading ? "Chargement..." : `showing ${paginated.length} of ${avisFiltres.length} rows`}
                </div>

                {/* Tableau */}
                <div style={{ background: C.white, overflowX: "auto", width: "96%", marginLeft: 18, border: "1px solid lightgray" }}>
                    {loading ? (
                        <div style={{ padding: "60px", textAlign: "center", color: "#9ca3af" }}>Chargement...</div>
                    ) : erreur ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#b91c1c" }}>⚠ {erreur}</div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                            <thead>
                            <tr>
                                <th style={thStyle}>Référence</th>
                                <th style={thStyle}>Année fiscale</th>
                                <th style={thStyle}>Structure Fiscale</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>Montant</th>
                                <th style={thStyle}>Date émission</th>
                                <th style={thStyle}>Statut</th>
                                <th style={{ ...thStyle, width: 60, textAlign: "center" }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.length === 0 ? (
                                <tr><td colSpan={7} style={{ padding: "60px 20px", textAlign: "center", color: C.textGrey }}>
                                    Aucun avis d'imposition trouvé.
                                </td></tr>
                            ) : paginated.map((a) => (
                                <tr key={a.id}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                                    <td style={{ ...tdStyle, fontFamily: "monospace", color: C.orange, fontWeight: 600 }}>
                                        {a.reference || "—"}
                                    </td>
                                    <td style={tdStyle}>{a.annee || "—"}</td>
                                    <td style={tdStyle}>{a.structure || "CDI YAOUNDE"}</td>
                                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                                        {fmtMontant(a.montantBrut)} FCFA
                                    </td>
                                    <td style={tdStyle}>{fmtDate(a.date)}</td>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: "3px 10px", borderRadius: 12,
                                            fontSize: 12, fontWeight: 600,
                                            background: a.statut === "PAYE" ? "#DCFCE7"
                                                : ["EMIS","SUBMITTED","INIT"].includes(a.statut) ? "#FEF9C3"
                                                    : "#F3F4F6",
                                            color: a.statut === "PAYE" ? "#15803D"
                                                : ["EMIS","SUBMITTED","INIT"].includes(a.statut) ? "#92400E"
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
                    )}
                </div>

                {/* Pagination */}
                {!loading && avisFiltres.length > 0 && (
                    <div style={{
                        background: C.white, width: "96%", marginLeft: 18,
                        padding: "14px 28px", display: "flex", justifyContent: "space-between",
                        alignItems: "center", borderTop: `1px solid ${C.border}`, flexWrap: "wrap", gap: 10,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textGrey }}>
                            Rows per page:
                            <select value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    style={{ border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 13, cursor: "pointer", outline: "none" }}>
                                {[10, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textGrey }}>
                            <span>{(currentPage-1)*rowsPerPage+1}–{Math.min(currentPage*rowsPerPage, avisFiltres.length)} of {avisFiltres.length}</span>
                            <button onClick={() => setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
                                    style={{ width:30, height:30, borderRadius:4, border:`1px solid ${C.border}`, background:"none", cursor:currentPage===1?"not-allowed":"pointer", color:currentPage===1?"#d1d5db":C.textMid }}>‹</button>
                            <button onClick={() => setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                                    style={{ width:30, height:30, borderRadius:4, border:`1px solid ${C.border}`, background:"none", cursor:currentPage===totalPages?"not-allowed":"pointer", color:currentPage===totalPages?"#d1d5db":C.textMid }}>›</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}