"use client";

import { useState } from "react";
import C from "../lib/utils/colors";
import mockData from "../data/mockData.json";

// ─── Communes du Cameroun (liste simplifiée) ──────────────────────────────
const COMMUNES = [
    "Yaoundé 1", "Yaoundé 2", "Yaoundé 3", "Yaoundé 4", "Yaoundé 5",
    "Yaoundé 6", "Yaoundé 7", "Douala 1", "Douala 2", "Douala 3",
    "Douala 4", "Douala 5", "Bafoussam 1", "Bafoussam 2", "Bafoussam 3",
    "Garoua 1", "Garoua 2", "Garoua 3", "Maroua 1", "Maroua 2",
    "Bamenda 1", "Bamenda 2", "Bamenda 3", "Ngaoundéré 1", "Ngaoundéré 2",
    "Bertoua 1", "Bertoua 2", "Ebolowa 1", "Ebolowa 2", "Buea",
];

// ─── Composant champ lecture seule (pré-rempli, non modifiable) ───────────
function ChampLecture({ label, valeur }) {
    return (
        <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 13, color: C.textGrey, marginBottom: 6 }}>
                {label} <span style={{ color: C.orange }}>*</span>
            </label>
            <div style={{
                fontSize: 15, color: C.textDark, paddingBottom: 10,
                borderBottom: `1.5px dashed #D1D5DB`,
            }}>
                {valeur}
            </div>
        </div>
    );
}

// ─── Composant champ éditable (underline style) ───────────────────────────
function ChampInput({ label, value, onChange, type = "text", requis = true, placeholder = "" }) {
    const [focus, setFocus] = useState(false);
    return (
        <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 13, color: focus ? C.orange : C.textGrey, marginBottom: 6, transition: "color 0.15s" }}>
                {label} {requis && <span style={{ color: C.orange }}>*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                style={{
                    width: "100%", border: "none", borderBottom: `1.5px solid ${focus ? C.orange : "#D1D5DB"}`,
                    outline: "none", fontSize: 15, color: C.textDark,
                    padding: "4px 0 10px", background: "transparent",
                    transition: "border-color 0.2s", boxSizing: "border-box",
                }}
            />
        </div>
    );
}

// ─── Composant select Commune (underline style) ───────────────────────────
function ChampSelect({ label, value, onChange, options, requis = true }) {
    const [focus, setFocus] = useState(false);
    return (
        <div style={{ marginBottom: 28, position: "relative" }}>
            <label style={{ display: "block", fontSize: 13, color: focus ? C.orange : C.textGrey, marginBottom: 6, transition: "color 0.15s" }}>
                {label} {requis && <span style={{ color: C.orange }}>*</span>}
            </label>
            <div style={{ position: "relative" }}>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                    style={{
                        width: "100%", border: "none",
                        borderBottom: `1.5px solid ${focus ? C.orange : "#D1D5DB"}`,
                        outline: "none", fontSize: 15,
                        color: value ? C.textDark : C.textGrey,
                        padding: "4px 28px 10px 0",
                        background: "transparent", appearance: "none",
                        cursor: "pointer", transition: "border-color 0.2s",
                        boxSizing: "border-box",
                    }}
                >
                    <option value="" disabled></option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <span style={{
                    position: "absolute", right: 4, top: "50%", transform: "translateY(-60%)",
                    pointerEvents: "none", color: C.textGrey, fontSize: 14,
                }}>▼</span>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function PageMonProfil() {
    const utilisateur = mockData.utilisateur ?? {};

    // Champs pré-remplis (lecture seule)
    const nif             = utilisateur.nif             ?? "P050517806522K";
    const structureFiscale= utilisateur.structureFiscale ?? "CDI YAOUNDE 1";
    const nomsComplets    = utilisateur.nomsComplets    ?? utilisateur.nom ?? "Onana Yvan Frédéric";

    // Champs éditables
    const [email,         setEmail]         = useState(utilisateur.email         ?? "");
    const [emailAdditionnel, setEmailAdditionnel] = useState(utilisateur.emailAdditionnel ?? "");
    const [telephone,     setTelephone]     = useState(utilisateur.telephone     ?? "237");
    const [commune,       setCommune]       = useState(utilisateur.commune       ?? "");

    const [enregistrement, setEnregistrement] = useState(null); // null | "succes" | "erreur"
    const [chargement,     setChargement]     = useState(false);

    const handleContinuer = async () => {
        // Validation basique
        if (!email || !telephone || !commune) {
            setEnregistrement("erreur");
            return;
        }
        setChargement(true);
        setEnregistrement(null);

        // Simuler un appel API (remplacer par fetch réel)
        await new Promise((r) => setTimeout(r, 800));
        setChargement(false);
        setEnregistrement("succes");
    };

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column" }}>

            <div style={{fontSize: 11, alignItems: "center", justifyContent: "center"}}>
                <h1>Mettre à jour les informations de votre profile</h1>
            </div>

            <div style={{ padding: "28px 40px" }}>
                <div style={{
                    background: C.white, borderRadius: 10,
                    padding: "40px 48px 36px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    maxWidth: 900, margin: "0 auto",
                    marginTop: 70,
                }}>

                    {/* ── Champs lecture seule ── */}
                    <ChampLecture label="Numéro d'identification fiscale" valeur={nif} />
                    <ChampLecture label="Structure Fiscale"               valeur={structureFiscale} />
                    <ChampLecture label="Noms complets"                   valeur={nomsComplets} />

                    {/* ── Séparateur visuel ── */}
                    <div style={{ height: 12 }} />

                    {/* ── Champs éditables ── */}
                    <ChampInput
                        label="Email"
                        type="email"
                        value={email}
                        onChange={setEmail}
                        requis
                    />
                    <ChampInput
                        label="Email additionnel (Optionel)"
                        type="email"
                        value={emailAdditionnel}
                        onChange={setEmailAdditionnel}
                        requis={false}
                    />
                    <ChampInput
                        label="Phone number"
                        type="tel"
                        value={telephone}
                        onChange={setTelephone}
                        requis
                    />
                    <ChampSelect
                        label="Commune"
                        value={commune}
                        onChange={setCommune}
                        options={COMMUNES}
                        requis
                    />

                    {/* ── Message retour ── */}
                    {enregistrement === "succes" && (
                        <div style={{ marginBottom: 16, padding: "10px 16px", background: "#DCFCE7", color: "#16A34A", borderRadius: 6, fontSize: 14, fontWeight: 500 }}>
                            ✓ Profil mis à jour avec succès.
                        </div>
                    )}
                    {enregistrement === "erreur" && (
                        <div style={{ marginBottom: 16, padding: "10px 16px", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, fontSize: 14, fontWeight: 500 }}>
                            Veuillez remplir tous les champs obligatoires.
                        </div>
                    )}

                    {/* ── Bouton Continuer ── */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button
                            onClick={handleContinuer}
                            disabled={chargement}
                            style={{
                                padding: "12px 32px",
                                background: chargement ? "#F5C77E" : C.orange,
                                color: C.white, border: "none",
                                borderRadius: 6, fontSize: 15, fontWeight: 600,
                                cursor: chargement ? "not-allowed" : "pointer",
                                transition: "background 0.2s",
                                minWidth: 140,
                            }}
                            onMouseEnter={(e) => { if (!chargement) e.currentTarget.style.background = "#E09510"; }}
                            onMouseLeave={(e) => { if (!chargement) e.currentTarget.style.background = C.orange; }}
                        >
                            {chargement ? "Enregistrement..." : "Continuer"}
                        </button>
                    </div>

                </div>
            </div>
        </main>
    );
}