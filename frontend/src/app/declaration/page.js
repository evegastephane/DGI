"use client";

import { useState } from "react";
import C from "../lib/utils/colors";
import { Tabs } from "../components/ui/Widgets";
import TabEtablissements     from "../../app/components/declarations/TabEtablissements";
import TabRecapitulatif      from "../../app/components/declarations/TabRecapitulatif";
import { ArrowL, ArrowR }    from "../components/ui/Icons";

// ─── Step 1 — exporté pour src/app/page.js ───────────────────────────────────
export function PageStep1({ setPage, setDeclarationContext }) {
    const [exercice, setExercice] = useState("2025");

    const handleSuivant = () => {
        setDeclarationContext({ exercice });
        setPage("step2");
    };

    return (
        <main style={{ padding: "24px 24px 40px", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: C.white, borderRadius: 7, padding: "15px 24px", boxShadow: C.shadow }}>
                <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Nouvelle Déclaration</h1>
            </div>

            <div style={{
                background: C.white, borderRadius: 0, boxShadow: C.shadow, flex: 1,
                display: "flex", flexDirection: "column", justifyContent: "center",
                alignItems: "center", padding: "60px 40px", gap: 20,
            }}>
                <div style={{ width: "100%", maxWidth: "80%", display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                        <label style={{ fontSize: 15, fontWeight: 600, color: C.textMid, display: "block", marginBottom: 18, letterSpacing: 1.5}}>
                            Veuillez sélectionner l'exercice pour cette déclaration
                        </label>
                        <select value={exercice} onChange={(e) => setExercice(e.target.value)} style={{
                            width: "100%", border: `1px solid ${C.border}`, borderRadius: 6,
                            padding: "12px 5px", fontSize: 14, color: C.textMid,
                            background: C.white, cursor: "pointer", outline: "none",
                        }}>
                            {[2025, 2024, 2023, 2022].map(y => (
                                <option key={y} value={y}>Exercice {y}</option>
                            ))}
                        </select>
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

// ─── Onglets ──────────────────────────────────────────────────────────────────
const ONGLETS = [
    { key: "etablissements", label: "Etablissements" },
    { key: "recapitulatif",  label: "Recapitulatif"  },
];

// ─── Step 2 — exporté pour src/app/page.js ───────────────────────────────────
export function PageStep2({ setPage, declarationContext, onDeclarationSoumise, draftAEditer }) {
    const [ongletActif,   setOngletActif]   = useState("etablissements");
    const [lignes,        setLignes]        = useState([]);
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

// ─── export default — obligatoire pour Next.js App Router ────────────────────
export default function DeclarationPage() {
    const [page,               setPage]               = useState("step1");
    const [declarationContext, setDeclarationContext] = useState(null);

    return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {page === "step1" && (
                <PageStep1
                    setPage={setPage}
                    setDeclarationContext={setDeclarationContext}
                />
            )}
            {page === "step2" && (
                <PageStep2
                    setPage={setPage}
                    declarationContext={declarationContext}
                    onDeclarationSoumise={() => setPage("step1")}
                />
            )}
        </div>
    );
}