"use client";
// src/app/components/paiement/ModalPaiement.jsx
// ─── Modal de paiement Harmony 2 ──────────────────────────────────────────
// Usage : <ModalPaiement declaration={...} contribuable={...} onClose={...} onSuccess={...} />

import { useState, useEffect, useRef } from "react";
import C from "../../lib/utils/colors";
import {
    OPERATEURS,
    initialiserPaiement,
    pollStatutPaiement,
    genererReference,
} from "../../lib/api/harmonyPaiementApi";

// ─── Étapes ───────────────────────────────────────────────────────────────
const ETAPES = { SAISIE: "saisie", TRAITEMENT: "traitement", SUCCES: "succes", ECHEC: "echec" };

// ─── Input outlined ────────────────────────────────────────────────────────
function Input({ label, value, onChange, type = "text", disabled = false, error = false }) {
    const [focus, setFocus] = useState(false);
    const filled = value && value.length > 0;
    return (
        <div style={{ position: "relative", marginBottom: 4 }}>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange && onChange(e.target.value)}
                disabled={disabled}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                style={{
                    width: "100%", boxSizing: "border-box",
                    border: `1.5px solid ${error ? "#EF4444" : disabled ? "#E5E7EB" : focus ? C.orange : filled ? C.orange : "#9CA3AF"}`,
                    borderRadius: 6, padding: "18px 14px 6px",
                    fontSize: 14, color: disabled ? "#9CA3AF" : C.textDark,
                    outline: "none", background: disabled ? "#F9FAFB" : C.white,
                    minHeight: 52, transition: "border-color 0.15s",
                    boxShadow: focus && !disabled ? `0 0 0 3px rgba(242,148,0,0.10)` : "none",
                }}
            />
            <span style={{
                position: "absolute", left: 12,
                top: focus || filled ? 5 : 18,
                fontSize: focus || filled ? 10 : 14,
                color: error ? "#EF4444" : disabled ? "#9CA3AF" : focus ? C.orange : filled ? C.orange : "#9CA3AF",
                transition: "all 0.15s", pointerEvents: "none",
                background: disabled ? "#F9FAFB" : C.white,
                padding: "0 2px",
            }}>{label}</span>
        </div>
    );
}

// ─── Carte opérateur ───────────────────────────────────────────────────────
function CarteOperateur({ op, selected, onClick }) {
    return (
        <div onClick={onClick} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            padding: "12px 10px", borderRadius: 8, cursor: "pointer",
            border: `2px solid ${selected ? op.couleur : "#E5E7EB"}`,
            background: selected ? `${op.couleur}10` : C.white,
            transition: "all 0.15s", flex: "1 1 80px", minWidth: 80,
            boxShadow: selected ? `0 0 0 1px ${op.couleur}40` : "none",
        }}>
            <span style={{ fontSize: 24 }}>{op.icon}</span>
            <span style={{ fontSize: 11, fontWeight: selected ? 700 : 500, color: selected ? op.couleur : "#6B7280", textAlign: "center", lineHeight: 1.2 }}>{op.label}</span>
            {selected && (
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: op.couleur, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 12 9" width="9" height="7" fill="none">
                        <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </div>
            )}
        </div>
    );
}

// ─── Étape traitement (spinner + polling) ─────────────────────────────────
function EtapeTraitement({ message, sousMessage }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "32px 0" }}>
            <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: C.orangeBg,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    width: 40, height: 40,
                    border: `4px solid ${C.orangeBg}`,
                    borderTop: `4px solid ${C.orange}`,
                    borderRadius: "50%",
                    animation: "paySpinH2 0.8s linear infinite",
                }} />
            </div>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.textDark, margin: "0 0 6px" }}>{message}</p>
                <p style={{ fontSize: 13, color: C.textGrey, margin: 0, maxWidth: 320 }}>{sousMessage}</p>
            </div>
            <style>{`@keyframes paySpinH2 { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ─── Résumé transaction ────────────────────────────────────────────────────
function ResumeTransaction({ lignes }) {
    return (
        <div style={{
            background: "#F9FAFB", borderRadius: 8, padding: "14px 16px",
            border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8,
        }}>
            {lignes.map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</span>
                    <span style={{ fontSize: 13, color: C.textDark, fontWeight: 500 }}>{val}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Modal principale ──────────────────────────────────────────────────────
export default function ModalPaiement({ declaration, contribuable, onClose, onSuccess }) {
    const [etape,          setEtape]          = useState(ETAPES.SAISIE);
    const [operateur,      setOperateur]      = useState(null);
    const [numero,         setNumero]         = useState("");
    const [erreurs,        setErreurs]        = useState({});
    const [referencePanier,setReferencePanier]= useState(null);
    const [detailPanier,   setDetailPanier]   = useState(null);
    const [traitementMsg,  setTraitementMsg]  = useState("");
    const [echecMsg,       setEchecMsg]       = useState("");
    const stopPollRef = useRef(false);

    const montant  = Number(declaration?.montantBrut || declaration?.montantAPayer || 0);
    const niu      = contribuable?.NIU || contribuable?.niu || "";
    const reference= declaration?.reference || genererReference();

    // Nettoyage sur démontage
    useEffect(() => { return () => { stopPollRef.current = true; }; }, []);

    // ── Validation ────────────────────────────────────────────────────────
    const valider = () => {
        const e = {};
        if (!operateur) e.operateur = "Sélectionnez un opérateur";
        if (!numero.trim()) e.numero = "Numéro requis";
        else if (!/^\d{8,12}$/.test(numero.trim())) e.numero = "Format invalide (8 à 12 chiffres)";
        if (!montant || montant <= 0) e.montant = "Montant invalide";
        setErreurs(e);
        return Object.keys(e).length === 0;
    };

    // ── Lancer le paiement ────────────────────────────────────────────────
    const handlePayer = async () => {
        if (!valider()) return;
        setEtape(ETAPES.TRAITEMENT);
        setTraitementMsg("Initialisation du paiement…");

        try {
            const res = await initialiserPaiement({
                niu,
                montantAPayer:       montant,
                codeOperateur:       operateur.code,
                numeroCompte:        numero.trim(),
                referenceDeclaration: reference,
                libelleImpot:        `Patente — ${declaration?.annee || new Date().getFullYear()}`,
                typeDeclaration:     "PATENTE",
                libelleDeclaration:  `Paiement de la déclaration ${reference}`,
            });

            const refPanier = res.referencePanier || res.reference_panier || res.data?.referencePanier;
            if (!refPanier) throw new Error("Référence panier non reçue");

            setReferencePanier(refPanier);
            setTraitementMsg(`Paiement envoyé sur ${operateur.label}…`);

            // Polling toutes les 5s (max 3 min)
            await pollStatutPaiement(
                refPanier,
                (detail) => {
                    if (stopPollRef.current) return;
                    setDetailPanier(detail);
                    setTraitementMsg(`Paiement en cours — ${detail.statutLabel || "EN ATTENTE"}…`);
                },
                { intervalMs: 5_000, timeoutMs: 180_000 }
            );

            // Succès
            if (!stopPollRef.current) {
                const final = await import("../../lib/api/harmonyPaiementApi").then(m => m.getDetailPanier(refPanier));
                setDetailPanier(final);
                setEtape(ETAPES.SUCCES);
                if (onSuccess) onSuccess({ referencePanier: refPanier, ...final });
            }
        } catch (e) {
            setEchecMsg(e.message || "Une erreur est survenue lors du paiement.");
            setEtape(ETAPES.ECHEC);
        }
    };

    const opSelecte = OPERATEURS.find(o => o.code === operateur?.code);
    const fmtMontant = montant.toLocaleString("fr-FR") + " FCFA";

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 2000,
                background: "rgba(0,0,0,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: 20,
            }}
        >
            <div style={{
                background: C.white, borderRadius: 14,
                width: "100%", maxWidth: 520,
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                overflow: "hidden", maxHeight: "90vh", overflowY: "auto",
            }}>
                {/* ── Header ── */}
                <div style={{
                    background: etape === ETAPES.SUCCES ? "#16A34A" : etape === ETAPES.ECHEC ? "#DC2626" : C.orange,
                    padding: "18px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "background 0.3s",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "rgba(255,255,255,0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {etape === ETAPES.SUCCES ? (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : etape === ETAPES.ECHEC ? (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                    <line x1="1" y1="10" x2="23" y2="10"/>
                                </svg>
                            )}
                        </div>
                        <div>
                            <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>
                                {etape === ETAPES.SUCCES ? "Paiement effectué" : etape === ETAPES.ECHEC ? "Paiement échoué" : "Payer ma déclaration"}
                            </p>
                            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, margin: 0 }}>
                                {declaration?.reference || "—"} · {declaration?.annee || "—"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 6, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>

                {/* ── Corps ── */}
                <div style={{ padding: "24px" }}>

                    {/* ──────── ÉTAPE SAISIE ──────── */}
                    {etape === ETAPES.SAISIE && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {/* Résumé déclaration */}
                            <ResumeTransaction lignes={[
                                ["Déclaration",    declaration?.reference || "—"],
                                ["Année fiscale",  declaration?.annee     || "—"],
                                ["NIU",            niu                    || "—"],
                                ["Montant à payer",fmtMontant             ],
                            ]} />

                            {/* Sélection opérateur */}
                            <div>
                                <p style={{ fontSize: 13, fontWeight: 700, color: C.textDark, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Choisir l'opérateur
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {OPERATEURS.map((op) => (
                                        <CarteOperateur key={op.code} op={op}
                                                        selected={operateur?.code === op.code}
                                                        onClick={() => setOperateur(op)} />
                                    ))}
                                </div>
                                {erreurs.operateur && (
                                    <p style={{ fontSize: 12, color: "#EF4444", margin: "6px 0 0" }}>⚠ {erreurs.operateur}</p>
                                )}
                            </div>

                            {/* Numéro de compte */}
                            {operateur && (
                                <div>
                                    <Input
                                        label={`Numéro ${operateur.label}`}
                                        value={numero}
                                        onChange={(v) => { setNumero(v); setErreurs(e => ({ ...e, numero: "" })); }}
                                        type="tel"
                                        error={!!erreurs.numero}
                                    />
                                    {erreurs.numero && (
                                        <p style={{ fontSize: 12, color: "#EF4444", margin: "4px 0 0" }}>⚠ {erreurs.numero}</p>
                                    )}
                                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "6px 0 0" }}>
                                        Entrez le numéro associé à votre compte {operateur.label} (sans espaces ni +237)
                                    </p>
                                </div>
                            )}

                            {erreurs.montant && (
                                <p style={{ fontSize: 12, color: "#EF4444" }}>⚠ {erreurs.montant}</p>
                            )}

                            {/* Bouton payer */}
                            <button onClick={handlePayer}
                                    style={{
                                        background: C.orange, color: "#fff", border: "none",
                                        borderRadius: 8, padding: "14px 0", width: "100%",
                                        fontSize: 15, fontWeight: 700, cursor: "pointer",
                                        boxShadow: "0 4px 14px rgba(242,148,0,0.35)",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                        transition: "all 0.15s",
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#D97706"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = C.orange}
                            >
                                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                    <line x1="1" y1="10" x2="23" y2="10"/>
                                </svg>
                                Payer {fmtMontant}
                            </button>

                            <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", margin: 0 }}>
                                Paiement sécurisé via Harmony 2 · DGI Cameroun
                            </p>
                        </div>
                    )}

                    {/* ──────── ÉTAPE TRAITEMENT ──────── */}
                    {etape === ETAPES.TRAITEMENT && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <EtapeTraitement
                                message={traitementMsg}
                                sousMessage={`Vérification du paiement sur ${opSelecte?.label || operateur?.label || ""}. Confirmez la transaction sur votre téléphone si une notification vous est envoyée.`}
                            />
                            {referencePanier && (
                                <ResumeTransaction lignes={[
                                    ["Réf. panier",   referencePanier],
                                    ["Opérateur",     opSelecte?.label || "—"],
                                    ["Numéro",        numero],
                                    ["Montant",       fmtMontant],
                                    ["Statut",        detailPanier?.statutLabel || "EN ATTENTE"],
                                ]} />
                            )}
                            <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", margin: 0 }}>
                                Vérification automatique toutes les 5 secondes (max 3 min)
                            </p>
                        </div>
                    )}

                    {/* ──────── ÉTAPE SUCCÈS ──────── */}
                    {etape === ETAPES.SUCCES && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                                <div style={{
                                    width: 72, height: 72, borderRadius: "50%",
                                    background: "#DCFCE7", border: "3px solid #22C55E",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 14px",
                                }}>
                                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#16A34A" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <p style={{ fontSize: 17, fontWeight: 700, color: "#15803D", margin: "0 0 4px" }}>Paiement confirmé !</p>
                                <p style={{ fontSize: 13, color: "#166534", margin: 0 }}>Votre déclaration a été réglée avec succès.</p>
                            </div>

                            {detailPanier && (
                                <ResumeTransaction lignes={[
                                    ["Réf. panier",     detailPanier.referencePanier || referencePanier],
                                    ["Réf. paiement",   detailPanier.referencePaiement || "—"],
                                    ["Opérateur",       opSelecte?.label || "—"],
                                    ["Montant payé",    (detailPanier.montantAPayer || montant).toLocaleString("fr-FR") + " FCFA"],
                                    ["Structure",       detailPanier.structureImpot  || "CDI YAOUNDE 2"],
                                ]} />
                            )}

                            <button onClick={onClose}
                                    style={{
                                        background: "#16A34A", color: "#fff", border: "none",
                                        borderRadius: 8, padding: "13px 0", width: "100%",
                                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                                    }}>
                                Fermer
                            </button>
                        </div>
                    )}

                    {/* ──────── ÉTAPE ÉCHEC ──────── */}
                    {etape === ETAPES.ECHEC && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            <div style={{ textAlign: "center", padding: "12px 0 8px" }}>
                                <div style={{
                                    width: 72, height: 72, borderRadius: "50%",
                                    background: "#FEE2E2", border: "3px solid #EF4444",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    margin: "0 auto 14px", fontSize: 36,
                                }}>✕</div>
                                <p style={{ fontSize: 17, fontWeight: 700, color: "#DC2626", margin: "0 0 6px" }}>Paiement échoué</p>
                                <p style={{ fontSize: 13, color: "#6B7280", margin: 0, maxWidth: 300, marginInline: "auto" }}>{echecMsg}</p>
                            </div>

                            <div style={{ display: "flex", gap: 10 }}>
                                <button onClick={() => { setEtape(ETAPES.SAISIE); setErreurs({}); setEchecMsg(""); }}
                                        style={{
                                            flex: 1, background: C.white, color: C.orange,
                                            border: `2px solid ${C.orange}`, borderRadius: 8,
                                            padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer",
                                        }}>
                                    Réessayer
                                </button>
                                <button onClick={onClose}
                                        style={{
                                            flex: 1, background: "#F3F4F6", color: "#6B7280",
                                            border: "none", borderRadius: 8,
                                            padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer",
                                        }}>
                                    Annuler
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}