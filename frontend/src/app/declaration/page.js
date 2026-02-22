"use client";

import { useState } from "react";
import C from "../lib/utils/colors";
import { Tabs } from "../components/ui/Widgets";
import TabEtablissements from "../../app/components/declarations/TabEtablissements";
import TabRecapitulatif  from "../../app/components/declarations/TabRecapitulatif";
import { ArrowL, ArrowR } from "../components/ui/Icons";
import { creerDeclaration } from "../lib/api/declarationApi";
import { CURRENT_USER_ID } from "../lib/api/contribuableApi";

// ════════════════════════════════════════════
// PageStep1 — Sélection de l'exercice fiscal
// Props : setPage → aller à step2
// ════════════════════════════════════════════
export function PageStep1({ setPage }) {
    const [exercice,    setExercice]    = useState("2024");
    const [typeDecl,    setTypeDecl]    = useState("PATENTE");
    const [loading,     setLoading]     = useState(false);
    const [erreur,      setErreur]      = useState(null);
    const [confirmation,setConfirmation]= useState(null);

    const handleSuivant = async () => {
        setLoading(true);
        setErreur(null);
        try {
            const nouvelle = await creerDeclaration({
                id_contribuable: CURRENT_USER_ID,
                type_declaration: typeDecl,
                annee_fiscale: parseInt(exercice),
            });
            setConfirmation(nouvelle);
            // Passer à l'étape 2 après un court délai pour montrer la confirmation
            setTimeout(() => setPage("step2"), 1200);
        } catch (e) {
            setErreur(e.message);
            setLoading(false);
        }
    };

    return (
        <main style={{ padding: "24px 24px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: C.white, borderRadius: 8, padding: "20px 24px", boxShadow: C.shadow }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Nouvelle Déclaration</h1>
            </div>

            <div style={{ background: C.white, borderRadius: 10, boxShadow: C.shadow, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 40px", gap: 24 }}>

                {/* Confirmation */}
                {confirmation && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #22c55e", borderRadius: 8, padding: "14px 20px", color: "#15803d", fontWeight: 600, fontSize: 14, width: "100%", maxWidth: 560, textAlign: "center" }}>
                        ✓ Déclaration <b>{confirmation.reference_declaration}</b> créée avec succès !
                    </div>
                )}

                {/* Erreur */}
                {erreur && (
                    <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 20px", color: "#b91c1c", fontSize: 13, width: "100%", maxWidth: 560 }}>
                        ⚠ {erreur}
                    </div>
                )}

                <p style={{ fontSize: 15, color: C.textMid, margin: 0 }}>
                    Sélectionnez l'exercice fiscal et le type de déclaration
                </p>

                <div style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Exercice */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: C.textMid, display: "block", marginBottom: 6 }}>
                            Exercice fiscal
                        </label>
                        <select value={exercice} onChange={(e) => setExercice(e.target.value)}
                                style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 6, padding: "14px 16px", fontSize: 14, color: C.textMid, background: C.white, cursor: "pointer" }}>
                            <option value="2024">Exercice 2024</option>
                            <option value="2025">Exercice 2025</option>
                            <option value="2023">Exercice 2023</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleSuivant} disabled={loading}
                        style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.orange}`, background: loading ? C.orangeBg : C.white, color: C.orange, borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Envoi en cours..." : <><span>Suivant</span> <ArrowR /></>}
                </button>
            </div>
        </main>
    );
}


// PageStep2 — Formulaire (onglets Etablissements / Récapitulatif)
// Inchangé côté API — les données sont gérées dans chaque onglet

const ONGLETS = [
    { key: "etablissements", label: "Etablissements" },
    { key: "recapitulatif",  label: "Recapitulatif"  },
];

export function PageStep2({ setPage }) {
    const [ongletActif, setOngletActif] = useState("etablissements");

    return (
        <main style={{ padding: "24px 24px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Déclaration Patente</h1>

            <div style={{ background: C.white, borderRadius: 10, boxShadow: C.shadow, overflow: "hidden" }}>
                <div style={{ padding: "24px 24px 0" }}>
                    <Tabs tabs={ONGLETS} active={ongletActif} onChange={setOngletActif} />
                </div>
                <div style={{ padding: "0 24px 24px" }}>
                    {ongletActif === "etablissements" && <TabEtablissements />}
                    {ongletActif === "recapitulatif"  && <TabRecapitulatif />}
                </div>
            </div>

            {/* Prev / Suivant */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => setPage("declaration")}
                        style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.textGrey}`, background: C.white, color: C.textMid, borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    <ArrowL /> Prev
                </button>
                <button style={{ display: "flex", alignItems: "center", gap: 8, border: `1.5px solid ${C.orange}`, background: C.white, color: C.orange, borderRadius: 6, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    Suivant <ArrowR />
                </button>
            </div>
        </main>
    );
}