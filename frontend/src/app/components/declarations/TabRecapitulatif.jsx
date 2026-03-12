"use client";

import { useState } from "react";
import C from "../../lib/utils/colors";
import { creerDeclaration, modifierDeclaration } from "../../lib/api/declarationApi";
import { CURRENT_USER_ID } from "../../lib/api/contribuableApi";
import ModalPaiement from "../paiement/ModalPaiement";

// ─── Seuils CIME/CSI et DGE ──────────────────────────────────────────────────
const SEUILS = {
    CIME: { min: 141_500,       max: 4_500_000,       label: "CIME/CSI" },
    DGE:  { min: 5_000_000,     max: 2_500_000_000,   label: "DGE"      },
};

function detecterRegime(base) {
    if (base >= SEUILS.DGE.min) return "DGE";
    return "CIME";
}

const TAUX = 0.00156;
const TAUX_AFFICHE = "0,156 %";

function calculerTDL(patente) {
    if (patente <= 30_000)  return 7_500;
    if (patente <= 60_000)  return 9_000;
    if (patente <= 100_000) return 15_000;
    if (patente <= 150_000) return 22_500;
    if (patente <= 200_000) return 30_000;
    if (patente <= 300_000) return 45_000;
    if (patente <= 400_000) return 60_000;
    if (patente <= 500_000) return 75_000;
    return 90_000;
}

function calculerDepuisLignes(lignes) {
    const totalCA = lignes.reduce((a, l) => a + (parseFloat(l.Total_CA)                  || 0), 0);
    const marge   = lignes.reduce((a, l) => a + (parseFloat(l.montant_marge_administree) || 0), 0);
    const base    = totalCA + marge;

    const patentePrincipal = Math.round(base * TAUX);
    const licencePrincipal = Math.round(base * TAUX);
    const tdlPrincipal     = calculerTDL(patentePrincipal);
    const soldeTotal       = patentePrincipal + licencePrincipal + tdlPrincipal;
    const regime           = detecterRegime(base);

    return {
        base, totalCA, marge, regime,
        patente:        { principal: base, taux: TAUX_AFFICHE, penalites: 0, total: patentePrincipal },
        licencePatente: { principal: base, taux: TAUX_AFFICHE, penalites: 0, total: licencePrincipal },
        tdlPatente:     { principal: base, taux: "Barème",     penalites: 0, total: tdlPrincipal     },
        solde:          { principal: base, taux: "—",          penalites: 0, total: soldeTotal        },
    };
}

const LIGNES_RECAP = [
    { key: "patente",        label: "Patente"                },
    { key: "licencePatente", label: "Licence sur la patente" },
    { key: "tdlPatente",     label: "TDL sur la patente"     },
    { key: "solde",          label: "Solde"                  },
];

const COLONNES_RECAP = [
    { key: "principal", label: "Principal"       },
    { key: "taux",      label: "Taux appliquées" },
    { key: "penalites", label: "Pénalités"       },
    { key: "total",     label: "Total"           },
];

const cellStyle = {
    border: `1.5px solid ${C.yellow}`,
    background: C.orangeBg,
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    textAlign: "right",
    fontWeight: 600,
    color: C.orangeText,
    minWidth: 130,
    minHeight: 44,
    display: "block",
    width: "100%",
    outline: "none",
    cursor: "default",
};

const fmt = (n) => (n !== null && n !== undefined ? n.toLocaleString("fr-FR") : "0");

// ─── Alerte régime ────────────────────────────────────────────────────────────
function AlerteRegime({ regime, base, onConfirmer, onAnnuler }) {
    const seuil       = SEUILS[regime];
    const couleurBg   = regime === "DGE" ? "#FEF3C7" : "#EFF6FF";
    const couleurBord = regime === "DGE" ? "#F59E0B" : "#93C5FD";
    const couleurTxt  = regime === "DGE" ? "#92400E" : "#1D4ED8";

    return (
        <div style={{ background: couleurBg, border: `2px solid ${couleurBord}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{regime === "DGE" ? "" : ""}</span>
                <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: couleurTxt, margin: "0 0 6px", fontSize: 15 }}>
                        Basculement vers le régime {regime === "DGE" ? "DGE" : "CIME/CSI"}
                    </p>
                    <p style={{ color: couleurTxt, fontSize: 13, margin: "0 0 4px" }}>
                        La base imposable calculée est de <strong>{fmt(base)} FCFA</strong>.
                    </p>
                    <p style={{ color: couleurTxt, fontSize: 13, margin: "0 0 14px" }}>
                        {regime === "DGE"
                            ? `Ce montant dépasse le seuil CIME/CSI (4 500 000 FCFA). Votre déclaration relève désormais de la DGE.`
                            : `Ce montant est inférieur au seuil DGE. Votre déclaration relève des CIME/CSI.`}
                    </p>
                    <p style={{ color: couleurTxt, fontSize: 12, margin: "0 0 16px", fontStyle: "italic" }}>
                        Confirmez-vous la soumission sous le régime <strong>{seuil.label}</strong> ?
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={onConfirmer} style={{
                            background: regime === "DGE" ? "#F59E0B" : "#2563EB",
                            color: "#fff", border: "none", borderRadius: 8,
                            padding: "10px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer",
                        }}>
                            Confirmer - Régime {seuil.label}
                        </button>
                        <button onClick={onAnnuler} style={{
                            background: "#fff", color: "#6B7280",
                            border: "1px solid #D1D5DB", borderRadius: 8,
                            padding: "10px 22px", fontWeight: 600, fontSize: 13, cursor: "pointer",
                        }}>
                            Retour
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function TabRecapitulatif({
                                             lignes = [],
                                             declarationContext = {},
                                             idDeclaration,
                                             onRetour,
                                             onDeclarationSoumise,
                                         }) {
    const [loading,       setLoading]       = useState(false);
    const [succes,        setSucces]        = useState(null);   // objet déclaration après soumission
    const [erreur,        setErreur]        = useState(null);
    const [confirmer,     setConfirmer]     = useState(false);
    const [alerteRegime,  setAlerteRegime]  = useState(false);
    const [modalPaiement, setModalPaiement] = useState(false);  // ← nouveau : affiche ModalPaiement

    const calculs      = lignes.length > 0 ? calculerDepuisLignes(lignes) : null;
    const totalGeneral = calculs ? calculs.solde.total : 0;
    const regime       = calculs ? calculs.regime : null;
    const base         = calculs ? calculs.base   : 0;

    const validationRegime = (() => {
        if (!calculs) return null;
        const seuil = SEUILS[regime];
        if (base < seuil.min) return {
            type: "error",
            msg: `La base imposable (${fmt(base)} FCFA) est inférieure au minimum ${seuil.label} : ${fmt(seuil.min)} FCFA.`,
        };
        if (base > seuil.max) {
            if (regime === "CIME") return {
                type: "warning_dge",
                msg: `La base (${fmt(base)} FCFA) dépasse le plafond CIME/CSI (${fmt(SEUILS.CIME.max)} FCFA). Passage au régime DGE détecté.`,
            };
            return {
                type: "error",
                msg: `La base imposable (${fmt(base)} FCFA) dépasse le maximum ${seuil.label} : ${fmt(seuil.max)} FCFA.`,
            };
        }
        return null;
    })();

    const handleDemanderSoumission = () => {
        if (validationRegime?.type === "warning_dge") {
            setAlerteRegime(true);
        } else {
            setConfirmer(true);
        }
    };

    const handleSoumettre = async () => {
        if (!calculs) return;
        setLoading(true);
        setErreur(null);
        try {
            const payload = {
                idContribuable:  CURRENT_USER_ID,
                typeDeclaration: "PATENTE",
                anneeFiscale:    parseInt(declarationContext?.exercice || "2025"),
                montantAPayer:   totalGeneral,
                statut:          "SUBMITTED",
            };

            let result;
            if (idDeclaration) {
                result = await modifierDeclaration(idDeclaration, { ...payload, idDeclaration });
            } else {
                result = await creerDeclaration(payload);
            }

            setSucces(result);
            setConfirmer(false);
            setAlerteRegime(false);
            if (onDeclarationSoumise) {
                setTimeout(() => onDeclarationSoumise(), 4000);
            }
        } catch (e) {
            setErreur(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Objet déclaration à passer à ModalPaiement (format attendu par la modal)
    const declarationPourPaiement = succes ? {
        reference:    succes.referenceDeclaration || succes.reference || `DECL-${idDeclaration || ""}`,
        annee:        declarationContext?.exercice || new Date().getFullYear(),
        montantBrut:  totalGeneral,
        montantAPayer: totalGeneral,
    } : null;

    return (
        <div>
            {/* Titre */}
            <div style={{ background: C.orangeBg, borderRadius: 8, padding: "14px 22px", marginBottom: 20 }}>
                <span style={{ color: C.orange, fontWeight: 700, fontSize: 20 }}>
                    I – Récapitulatif
                </span>
            </div>

            {/* Résumé base imposable */}
            {calculs && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total CA</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.orange, margin: 0 }}>{fmt(calculs.totalCA)} FCFA</p>
                    </div>
                    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Marge administrée</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: C.orange, margin: 0 }}>{fmt(calculs.marge)} FCFA</p>
                    </div>
                    <div style={{ background: "#FEF3C7", border: `1px solid ${C.yellow}`, borderRadius: 10, padding: "14px 16px" }}>
                        <p style={{ fontSize: 11, color: "#92400E", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Base imposable — Régime {regime ? SEUILS[regime].label : "—"}
                        </p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#92400E", margin: 0 }}>{fmt(base)} FCFA</p>
                    </div>
                </div>
            )}

            {/* Indicateur brouillon */}
            {idDeclaration && !succes && (
                <div style={{
                    background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8,
                    padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#92400e",
                    display: "flex", alignItems: "center", gap: 8,
                }}>
                    📝 Brouillon enregistré — La soumission générera un avis d'imposition.
                </div>
            )}

            {/* Alerte validation min/max */}
            {validationRegime && validationRegime.type === "error" && (
                <div style={{
                    background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
                    padding: "12px 16px", marginBottom: 16,
                    display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                    <span style={{ fontSize: 18 }}>⚠</span>
                    <div>
                        <p style={{ fontWeight: 700, color: "#B91C1C", margin: "0 0 4px", fontSize: 13 }}>Montant hors plage autorisée</p>
                        <p style={{ color: "#DC2626", fontSize: 13, margin: 0 }}>{validationRegime.msg}</p>
                    </div>
                </div>
            )}

            {/* Alerte passage CIME → DGE */}
            {alerteRegime && (
                <AlerteRegime
                    regime="DGE"
                    base={base}
                    onConfirmer={handleSoumettre}
                    onAnnuler={() => setAlerteRegime(false)}
                />
            )}

            {/* ── Succès soumission ── avec bouton PAYER ─────────────────────── */}
            {succes && (
                <div style={{
                    background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10,
                    padding: "16px 20px", marginBottom: 20,
                }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <span style={{ fontSize: 22, marginTop: 2 }}>✅</span>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, color: "#15803d", margin: 0, fontSize: 14 }}>
                                Déclaration soumise avec succès !
                            </p>
                            <p style={{ color: "#166534", margin: "4px 0 0", fontSize: 13 }}>
                                Référence : <strong>{succes.referenceDeclaration || "—"}</strong> —
                                Montant : <strong>{totalGeneral.toLocaleString("fr-FR")} FCFA</strong>
                            </p>
                            <p style={{ color: "#166534", margin: "4px 0 8px", fontSize: 12 }}>
                                Un avis d'imposition a été généré. Consultez la <strong>Liste des Avis</strong>.
                            </p>
                            {/* ── Bouton PAYER ── */}
                            <button
                                onClick={() => setModalPaiement(true)}
                                style={{
                                    display: "inline-flex", alignItems: "center", gap: 8,
                                    background: C.orange, color: "#fff",
                                    border: "none", borderRadius: 8,
                                    padding: "10px 24px", fontWeight: 700, fontSize: 14,
                                    cursor: "pointer", marginTop: 4,
                                    boxShadow: "0 4px 12px rgba(242,148,0,0.3)",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "#D97706"}
                                onMouseLeave={(e) => e.currentTarget.style.background = C.orange}
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                                    <line x1="1" y1="10" x2="23" y2="10"/>
                                </svg>
                                Payer maintenant — {totalGeneral.toLocaleString("fr-FR")} FCFA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Erreur */}
            {erreur && (
                <div style={{
                    background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10,
                    padding: "14px 18px", marginBottom: 20, color: "#b91c1c", fontSize: 13,
                }}>
                    [!] {erreur}
                </div>
            )}

            {/* Confirmation soumission normale */}
            {confirmer && !alerteRegime && (
                <div style={{
                    background: "#fffbeb", border: "2px solid #f59e0b", borderRadius: 10,
                    padding: "16px 20px", marginBottom: 20,
                }}>
                    <p style={{ fontWeight: 700, color: "#92400e", margin: "0 0 8px", fontSize: 14 }}>
                        Confirmer la soumission ?
                    </p>
                    <p style={{ color: "#78350f", fontSize: 13, margin: "0 0 4px" }}>
                        Base imposable : <strong>{fmt(base)} FCFA</strong> — Régime <strong>{regime ? SEUILS[regime].label : "—"}</strong>
                    </p>
                    <p style={{ color: "#78350f", fontSize: 13, margin: "0 0 14px" }}>
                        Montant total des impôts : <strong>{fmt(totalGeneral)} FCFA</strong> — Exercice {declarationContext?.exercice}
                        <br />
                        <span style={{ fontSize: 12 }}>Un avis d'imposition sera automatiquement généré.</span>
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={handleSoumettre} disabled={loading} style={{
                            background: C.orange, color: C.white, border: "none", borderRadius: 8,
                            padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer",
                        }}>
                            {loading ? "Soumission..." : "Confirmer"}
                        </button>
                        <button onClick={() => setConfirmer(false)} style={{
                            background: C.white, color: C.textMid, border: `1px solid ${C.border}`,
                            borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, cursor: "pointer",
                        }}>
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Tableau récapitulatif */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 640 }}>
                    <thead>
                    <tr>
                        <th style={{ width: 190, padding: "12px 16px", background: "transparent" }}></th>
                        {COLONNES_RECAP.map((c) => (
                            <th key={c.key} style={{
                                padding: "14px 10px", textAlign: "center", fontSize: 13,
                                fontWeight: 700, color: C.textDark,
                                background: "#f0f4f8", border: `1px solid ${C.border}`,
                            }}>
                                {c.label}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {LIGNES_RECAP.map(({ key: kl, label }, idx) => {
                        const row = calculs?.[kl];
                        return (
                            <tr key={kl}>
                                <td style={{
                                    padding: "10px 16px", fontWeight: 600, fontSize: 13,
                                    color: C.textMid, textAlign: "right", whiteSpace: "nowrap",
                                    verticalAlign: "middle",
                                    borderBottom: idx < LIGNES_RECAP.length - 1 ? `1px solid ${C.border}` : "none",
                                }}>
                                    {label}
                                </td>
                                {COLONNES_RECAP.map(({ key: kc }) => {
                                    const val = row?.[kc];
                                    const isStr = typeof val === "string";
                                    return (
                                        <td key={kc} style={{ padding: "8px 10px", border: `1px solid ${C.border}` }}>
                                            <div style={cellStyle}>
                                                {row ? (isStr ? val : fmt(val)) : ""}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Boutons bas */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
                <button onClick={onRetour} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    border: `1.5px solid ${C.textGrey}`, background: C.white,
                    color: C.textMid, borderRadius: 6, padding: "11px 28px",
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                    ← Prev
                </button>

                {!succes && (
                    <button
                        onClick={handleDemanderSoumission}
                        disabled={validationRegime?.type === "error" || !calculs}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            border: `1.5px solid ${validationRegime?.type === "error" ? "#D1D5DB" : C.orange}`,
                            background: C.white,
                            color: validationRegime?.type === "error" ? "#9CA3AF" : C.orange,
                            borderRadius: 6, padding: "11px 28px",
                            fontWeight: 700, fontSize: 14,
                            cursor: validationRegime?.type === "error" ? "not-allowed" : "pointer",
                        }}
                    >
                        Soumettre →
                    </button>
                )}
            </div>

            {/* ── Modal Paiement (s'ouvre après soumission réussie) ───────────── */}
            {modalPaiement && declarationPourPaiement && (
                <ModalPaiement
                    declaration={declarationPourPaiement}
                    contribuable={{ NIU: "" }}
                    onClose={() => setModalPaiement(false)}
                    onSuccess={(result) => {
                        console.log("[Paiement] Succès depuis déclaration:", result);
                        setModalPaiement(false);
                    }}
                />
            )}
        </div>
    );
}