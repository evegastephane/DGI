"use client";

import { useState } from "react";
import C from "../../lib/utils/colors";
import { RecapCell } from "../../components/ui/Widgets";

// ─── Structure du tableau ──────────────────────────────────────────────────
const LIGNES = [
    { key: "licencePatente", label: "Licence sur la patente" },
    { key: "tdlPatente",     label: "TDL sur la patente"     },
    { key: "licence",        label: "Licence"                },
    { key: "solde",          label: "Solde"                  },
];

const COLONNES = [
    { key: "principal", label: "Principal"       },
    { key: "taux",      label: "Taux appliquées" },
    { key: "penalites", label: "Penalités"       },
    { key: "total",     label: "Total"           }, // ← calculé automatiquement
];

// ─── Etat initial : tout à vide ────────────────────────────────────────────
const etatInitial = {
    licencePatente: { principal: "", taux: "", penalites: "", total: "" },
    tdlPatente:     { principal: "", taux: "", penalites: "", total: "" },
    licence:        { principal: "", taux: "", penalites: "", total: "" },
    solde:          { principal: "", taux: "", penalites: "", total: "" },
};

// ─── Composant principal ───────────────────────────────────────────────────
export default function TabRecapitulatif() {
    const [data, setData] = useState(etatInitial);

    // Modification d'une cellule + recalcul du Total automatique
    const handleChange = (ligne, col, valeur) => {
        setData((prev) => {
            const maj = { ...prev[ligne], [col]: valeur };

            // Total = Principal + Taux + Pénalités
            const p   = parseFloat(maj.principal) || 0;
            const t   = parseFloat(maj.taux)      || 0;
            const pen = parseFloat(maj.penalites)  || 0;
            maj.total = p + t + pen > 0 ? String(p + t + pen) : "";

            return { ...prev, [ligne]: maj };
        });
    };

    return (
        <div>
            {/* ── Titre section ── */}
            <div style={{ background: C.orangeBg, borderRadius: 8, padding: "14px 22px", marginBottom: 28 }}>
        <span style={{ color: C.orange, fontWeight: 700, fontSize: 20, fontFamily: "monospace" }}>
          I – Recapitulatif
        </span>
            </div>

            {/* ── Tableau ── */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 640 }}>
                    <thead>
                    <tr>
                        <th style={{ width: 180, padding: "12px 16px", background: "transparent" }}></th>
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
                    {LIGNES.map(({ key: kl, label }, idx) => (
                        <tr key={kl}>
                            {/* Label de la ligne */}
                            <td style={{
                                padding: "10px 16px", fontWeight: 600, fontSize: 13,
                                color: C.textMid, textAlign: "right", whiteSpace: "nowrap",
                                verticalAlign: "middle",
                                borderBottom: idx < LIGNES.length - 1 ? `1px solid ${C.border}` : "none",
                            }}>
                                {label}
                            </td>

                            {/* Cellules de saisie */}
                            {COLONNES.map(({ key: kc }) => (
                                <td key={kc} style={{ padding: "8px 10px", border: `1px solid ${C.border}`, background: "#fffdf5" }}>
                                    <RecapCell
                                        value={data[kl][kc]}
                                        readOnly={kc === "total"} // La colonne Total est en lecture seule
                                        onChange={(e) => handleChange(kl, kc, e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}