"use client";

import { useState } from "react";
import C from "../../lib/utils/colors";
import { creerDeclaration, modifierDeclaration } from "../../lib/api/declarationApi";
import { CURRENT_USER_ID } from "../../lib/api/contribuableApi";

// ─── Formules fiscales ────────────────────────────────────────────────────────
// impôts = (CA + marge) × taux
// Patente          : base × 0,156 %
// Licence patente  : base × 0,156 %
// TDL              : barème annuel fixe selon la tranche du montant de patente

const TAUX = 0.00156; // 0,156 %
const TAUX_AFFICHE = "0,156 %"; // Taux affiché dans la colonne "Taux appliquées"

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
    // ── Base : CA global + Marge administrée ─────────────────────────────
    const totalCA = lignes.reduce((a, l) => a + (parseFloat(l.Total_CA)                  || 0), 0);
    const marge   = lignes.reduce((a, l) => a + (parseFloat(l.montant_marge_administree) || 0), 0);
    const base    = totalCA + marge;

    // ── Patente : base × 0,156 % ─────────────────────────────────────────
    const patentePrincipal = Math.round(base * TAUX);

    // ── Licence sur la patente : base × 0,156 % ──────────────────────────
    const licencePrincipal = Math.round(base * TAUX);

    // ── TDL : barème annuel basé sur le montant de la patente ────────────
    const tdlPrincipal = calculerTDL(patentePrincipal);

    // ── Solde = total des impôts = patente + licence + TDL ───────────────
    const soldeTotal = patentePrincipal + licencePrincipal + tdlPrincipal;

    return {
        patente: {
            principal: patentePrincipal,
            taux:      TAUX_AFFICHE,
            penalites: 0,
            total:     patentePrincipal,
        },
        licencePatente: {
            principal: licencePrincipal,
            taux:      TAUX_AFFICHE,
            penalites: 0,
            total:     licencePrincipal,
        },
        tdlPatente: {
            principal: tdlPrincipal,
            taux:      "Barème",
            penalites: 0,
            total:     tdlPrincipal,
        },
        solde: {
            principal: soldeTotal,
            taux:      "—",
            penalites: 0,
            total:     soldeTotal,
        },
    };
}

const LIGNES = [
    { key: "patente",        label: "Patente"                },
    { key: "licencePatente", label: "Licence sur la patente" },
    { key: "tdlPatente",     label: "TDL sur la patente"     },
    { key: "solde",          label: "Solde"                  },
];

const COLONNES = [
    { key: "principal", label: "Principal"       },
    { key: "taux",      label: "Taux appliquées" },
    { key: "penalites", label: "Penalités"       },
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

// ─── Composant ────────────────────────────────────────────────────────────────
export default function TabRecapitulatif({
                                             lignes = [],
                                             declarationContext = {},
                                             idDeclaration,          // ID du brouillon enregistré depuis TabEtablissements
                                             onRetour,
                                             onDeclarationSoumise
                                         }) {
    const [loading,   setLoading]   = useState(false);
    const [succes,    setSucces]    = useState(null);
    const [erreur,    setErreur]    = useState(null);
    const [confirmer, setConfirmer] = useState(false);

    const calculs      = lignes.length > 0 ? calculerDepuisLignes(lignes) : null;
    const totalGeneral = calculs ? calculs.solde.total : 0;

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
                // ✅ Brouillon existant → on le passe en SUBMITTED
                // Le backend va générer l'Avis d'imposition automatiquement
                result = await modifierDeclaration(idDeclaration, { ...payload, idDeclaration });
            } else {
                // Pas de brouillon → création directe en SUBMITTED
                result = await creerDeclaration(payload);
            }

            setSucces(result);
            setConfirmer(false);
            if (onDeclarationSoumise) {
                setTimeout(() => onDeclarationSoumise(), 2000);
            }
        } catch (e) {
            setErreur(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* Titre */}
            <div style={{ background: C.orangeBg, borderRadius: 8, padding: "14px 22px", marginBottom: 28 }}>
                <span style={{ color: C.orange, fontWeight: 700, fontSize: 20, fontFamily: "monospace" }}>
                    I – Recapitulatif
                </span>
            </div>

            {/* Indicateur brouillon */}
            {idDeclaration && !succes && (
                <div style={{
                    background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8,
                    padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#92400e",
                    display: "flex", alignItems: "center", gap: 8,
                }}>
                    📝 Brouillon enregistré — La confirmation soumettra définitivement la déclaration et générera un avis d'imposition.
                </div>
            )}

            {/* Message succès */}
            {succes && (
                <div style={{
                    background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10,
                    padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12,
                }}>
                    <span style={{ fontSize: 22 }}>✅</span>
                    <div>
                        <p style={{ fontWeight: 700, color: "#15803d", margin: 0, fontSize: 14 }}>
                            Déclaration soumise avec succès !
                        </p>
                        <p style={{ color: "#166534", margin: "4px 0 0", fontSize: 13 }}>
                            Référence : <strong>{succes.referenceDeclaration || succes.reference_declaration || "—"}</strong> —
                            Montant : <strong>{totalGeneral.toLocaleString("fr-FR")} FCFA</strong>
                        </p>
                        <p style={{ color: "#166534", margin: "4px 0 0", fontSize: 12 }}>
                            Un avis d'imposition a été généré automatiquement. Consultez la <strong>Liste des Avis</strong>.
                        </p>
                    </div>
                </div>
            )}

            {/* Erreur */}
            {erreur && (
                <div style={{
                    background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10,
                    padding: "14px 18px", marginBottom: 20, color: "#b91c1c", fontSize: 13,
                }}>
                    ⚠ {erreur}
                </div>
            )}

            {/* Confirmation */}
            {confirmer && (
                <div style={{
                    background: "#fffbeb", border: "2px solid #f59e0b", borderRadius: 10,
                    padding: "16px 20px", marginBottom: 20,
                }}>
                    <p style={{ fontWeight: 700, color: "#92400e", margin: "0 0 8px", fontSize: 14 }}>
                        ⚠ Confirmer la soumission ?
                    </p>
                    <p style={{ color: "#78350f", fontSize: 13, margin: "0 0 14px" }}>
                        Montant total : <strong>{totalGeneral.toLocaleString("fr-FR")} FCFA</strong> — Exercice {declarationContext?.exercice}
                        <br />
                        <span style={{ fontSize: 12 }}>Un avis d'imposition sera automatiquement généré.</span>
                    </p>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={handleSoumettre} disabled={loading} style={{
                            background: C.orange, color: C.white, border: "none", borderRadius: 8,
                            padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer",
                        }}>
                            {loading ? "Soumission..." : "✓ Confirmer"}
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
                        {COLONNES.map((c) => (
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
                    {LIGNES.map(({ key: kl, label }, idx) => {
                        const row = calculs?.[kl];
                        return (
                            <tr key={kl}>
                                <td style={{
                                    padding: "10px 16px", fontWeight: 600, fontSize: 13,
                                    color: C.textMid, textAlign: "right", whiteSpace: "nowrap",
                                    verticalAlign: "middle",
                                    borderBottom: idx < LIGNES.length - 1 ? `1px solid ${C.border}` : "none",
                                }}>
                                    {label}
                                </td>
                                {COLONNES.map(({ key: kc }) => {
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

            {/* Boutons Retour / Soumettre */}
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
                    <button onClick={() => setConfirmer(true)} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        border: `1.5px solid ${C.orange}`, background: C.white,
                        color: C.orange, borderRadius: 6, padding: "11px 28px",
                        fontWeight: 700, fontSize: 14, cursor: "pointer",
                    }}>
                        Soumettre →
                    </button>
                )}
            </div>
        </div>
    );
}