"use client";

import { useState } from "react";
import C from "../lib/utils/colors";
import { Tabs } from "../components/ui/Widgets";
import TabEtablissements    from "../../app/components/declarations/TabEtablissements";
import TabRecapitulatif     from "../../app/components/declarations/TabRecapitulatif";
import TabAjoutEtablissement from "../../app/components/declarations/TabAjoutEtablissement";
import { ArrowL, ArrowR }   from "../components/ui/Icons";

export function PageStep1({ setPage, setDeclarationContext }) {
    const [exercice, setExercice] = useState("2025");

    const handleSuivant = () => {
        setDeclarationContext({ exercice });
        setPage("step2");
    };

    return (
        <main style={{ padding: "24px 24px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: C.white, borderRadius: 8, padding: "20px 24px", boxShadow: C.shadow }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Nouvelle Déclaration</h1>
                <p style={{ fontSize: 13, color: C.textGrey, margin: "4px 0 0" }}>
                    Sélectionnez l'exercice fiscal pour commencer
                </p>
            </div>

            <div style={{
                background: C.white, borderRadius: 10, boxShadow: C.shadow, flex: 1,
                display: "flex", flexDirection: "column", justifyContent: "center",
                alignItems: "center", padding: "60px 40px", gap: 20,
            }}>
                <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: C.textMid, display: "block", marginBottom: 6 }}>
                            Exercice fiscal
                        </label>
                        <select value={exercice} onChange={(e) => setExercice(e.target.value)} style={{
                            width: "100%", border: `1px solid ${C.border}`, borderRadius: 8,
                            padding: "12px 14px", fontSize: 14, color: C.textMid,
                            background: C.white, cursor: "pointer", outline: "none",
                        }}>
                            {[2025, 2024, 2023, 2022].map(y => (
                                <option key={y} value={y}>Exercice {y}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{
                        background: "#fffbeb", border: "1px solid #fde68a",
                        borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#92400e",
                    }}>
                        ℹ La déclaration sera créée après validation dans le récapitulatif.
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleSuivant} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    border: `1.5px solid ${C.orange}`, background: C.white,
                    color: C.orange, borderRadius: 6, padding: "11px 28px",
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                    Suivant <ArrowR />
                </button>
            </div>
        </main>
    );
}

// ─── Onglets — on ajoute "ajout_etablissement" sans toucher aux autres ──────
const ONGLETS = [
    { key: "etablissements",     label: "Etablissements"      },
    { key: "recapitulatif",      label: "Recapitulatif"       },
];

export function PageStep2({ setPage, declarationContext, onDeclarationSoumise, draftAEditer }) {
    const [ongletActif,   setOngletActif]   = useState("etablissements");
    const [lignes,        setLignes]        = useState([]);
    // Si on édite un draft existant, on initialise idDeclaration avec son id
    const [idDeclaration, setIdDeclaration] = useState(draftAEditer?.id || null);

    return (
        <main style={{ padding: "24px 24px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: C.white, borderRadius: 8, padding: "16px 24px", boxShadow: C.shadow }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Déclaration Patente</h1>
                <p style={{ fontSize: 13, color: C.textGrey, margin: "4px 0 0" }}>
                    Exercice {declarationContext?.exercice}
                </p>
            </div>

            <div style={{ background: C.white, borderRadius: 10, boxShadow: C.shadow, overflow: "hidden" }}>
                <div style={{ padding: "24px 24px 0" }}>
                    <Tabs tabs={ONGLETS} active={ongletActif} onChange={setOngletActif} />
                </div>
                <div style={{ padding: "0 24px 24px" }}>

                    {/* Onglet existant — inchangé */}
                    {ongletActif === "etablissements" && (
                        <TabEtablissements
                            lignes={lignes}
                            setLignes={setLignes}
                            declarationContext={declarationContext}
                            idDeclaration={idDeclaration}
                            onEnregistreDraft={(id) => setIdDeclaration(id)}
                            onSuivant={() => setOngletActif("recapitulatif")}
                        />
                    )}

                    {/* Onglet existant — inchangé */}
                    {ongletActif === "recapitulatif" && (
                        <TabRecapitulatif
                            lignes={lignes}
                            declarationContext={declarationContext}
                            idDeclaration={idDeclaration}
                            onRetour={() => setOngletActif("etablissements")}
                            onDeclarationSoumise={onDeclarationSoumise}
                        />
                    )}
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <button onClick={() => setPage("declaration")} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    border: `1.5px solid ${C.textGrey}`, background: C.white,
                    color: C.textMid, borderRadius: 6, padding: "11px 28px",
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                    <ArrowL /> Retour
                </button>
            </div>
        </main>
    );
}