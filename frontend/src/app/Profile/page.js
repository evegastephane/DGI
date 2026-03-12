"use client";

import { useState, useEffect } from "react";
import C from "../lib/utils/colors";
import { getContribuable, CURRENT_USER_ID } from "../lib/api/contribuableApi";
import mockData from "../data/mockData.json";

// ─── Communes du Cameroun ──────────────────────────────────────────────────
const COMMUNES = [
    "Yaoundé 1", "Yaoundé 2", "Yaoundé 3", "Yaoundé 4", "Yaoundé 5",
    "Yaoundé 6", "Yaoundé 7", "Douala 1", "Douala 2", "Douala 3",
    "Douala 4", "Douala 5", "Bafoussam 1", "Bafoussam 2", "Bafoussam 3",
    "Garoua 1", "Garoua 2", "Garoua 3", "Maroua 1", "Maroua 2",
    "Bamenda 1", "Bamenda 2", "Bamenda 3", "Ngaoundéré 1", "Ngaoundéré 2",
    "Bertoua 1", "Bertoua 2", "Ebolowa 1", "Ebolowa 2", "Buea",
];

// ─── Badge rôle/centre ─────────────────────────────────────────────────────
const ROLE_BADGE = {
    CGA: { bg: "#EDE9FE", color: "#7C3AED", label: "Adhérant CGA" },
    DGE: { bg: "#DBEAFE", color: "#1D4ED8", label: "Contribuable DGE" },
    CIS: { bg: "#D1FAE5", color: "#065F46", label: "Adhérant CIS" },
};

// ─── Composant champ lecture seule ─────────────────────────────────────────
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
                {valeur || "—"}
            </div>
        </div>
    );
}

// ─── Composant champ éditable ──────────────────────────────────────────────
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

// ─── Select commune ────────────────────────────────────────────────────────
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

// ─── Avatar initiales ──────────────────────────────────────────────────────
function Avatar({ initiales, bg = C.orange }) {
    return (
        <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: bg, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 700, color: "#fff", flexShrink: 0,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
            {initiales}
        </div>
    );
}

// ─── Carte profil (switcher) ───────────────────────────────────────────────
function ProfilCard({ profil, actif, onClick }) {
    const centre  = profil.centre;
    const badge   = centre ? ROLE_BADGE[centre] : null;
    const couleur = centre === "CGA" ? "#7C3AED" : centre === "DGE" ? "#1D4ED8" : centre === "CIS" ? "#065F46" : C.orange;

    return (
        <div
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 18px", borderRadius: 10, cursor: "pointer",
                border: actif ? `2px solid ${couleur}` : "2px solid #E5E7EB",
                background: actif ? (centre === "CGA" ? "#F5F3FF" : centre === "DGE" ? "#EFF6FF" : centre === "CIS" ? "#ECFDF5" : "#FFF7ED") : "#fff",
                transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { if (!actif) e.currentTarget.style.borderColor = "#9CA3AF"; }}
            onMouseLeave={(e) => { if (!actif) e.currentTarget.style.borderColor = "#E5E7EB"; }}
        >
            <Avatar initiales={profil.initiales} bg={couleur} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: C.textDark, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {profil.nom}
                </p>
                <p style={{ fontSize: 12, color: C.textGrey, margin: "2px 0 0" }}>{profil.nif}</p>
                {badge && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: badge.bg, color: badge.color, display: "inline-block", marginTop: 4 }}>
                        {badge.label}
                    </span>
                )}
            </div>
            {actif && (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: couleur, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 12 9" width="10" height="9" fill="none">
                        <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            )}
        </div>
    );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function PageMonProfil() {
    const profils      = mockData.profils ?? [];
    const [profilId, setProfilId]     = useState(mockData.profilActif ?? 1);
    const [loading, setLoading]       = useState(false);
    const [apiData, setApiData]       = useState(null);

    // Champs éditables
    const [email, setEmail]                     = useState("");
    const [emailAdditionnel, setEmailAdditionnel] = useState("");
    const [telephone, setTelephone]             = useState("");
    const [commune, setCommune]                 = useState("");
    const [enregistrement, setEnregistrement]   = useState(null);
    const [chargement, setChargement]           = useState(false);

    // Chargement depuis API ou fallback mock
    useEffect(() => {
        const fetchProfil = async () => {
            setLoading(true);
            setEnregistrement(null);
            try {
                // On essaie l'API avec l'id du profil actif
                const data = await getContribuable(profilId);
                setApiData(data);
                setEmail(data.email !== "—" ? data.email : "");
                setEmailAdditionnel(data.emailAdditionnel ?? "");
                setTelephone(data.telephone !== "—" ? data.telephone : "");
                setCommune(data.commune?.nom_commune !== "—" ? (data.commune?.nom_commune ?? "") : "");
            } catch {
                // Fallback sur les données mock
                const mock = profils.find((p) => p.id === profilId) ?? profils[0];
                setApiData(null);
                setEmail(mock?.email ?? "");
                setEmailAdditionnel(mock?.emailAdditionnel ?? "");
                setTelephone(mock?.telephone ?? "");
                setCommune(mock?.commune ?? "");
            } finally {
                setLoading(false);
            }
        };
        fetchProfil();
    }, [profilId]);

    // Profil courant (pour les champs lecture seule)
    const mockProfil    = profils.find((p) => p.id === profilId) ?? profils[0] ?? {};
    const nif           = apiData?.NIU           ?? mockProfil.nif            ?? "—";
    const structureFisc = apiData?.structureFiscale ?? mockProfil.structureFiscale ?? "—";
    const nomsComplets  = apiData
        ? [apiData.prenom, apiData.nom_beneficiaire].filter(Boolean).join(" ") || mockProfil.nom
        : mockProfil.nom ?? "—";

    const centre  = mockProfil.centre;
    const couleur = centre === "CGA" ? "#7C3AED" : centre === "DGE" ? "#1D4ED8" : centre === "CIS" ? "#065F46" : C.orange;

    const handleContinuer = async () => {
        if (!email || !telephone || !commune) {
            setEnregistrement("erreur");
            return;
        }
        setChargement(true);
        setEnregistrement(null);
        await new Promise((r) => setTimeout(r, 800));
        setChargement(false);
        setEnregistrement("succes");
    };

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column" }}>

            {/* ── Titre — centré ── */}
            <div style={{
                background: "#F3F4F6", marginTop: 22, width: "100%",
                padding: "20px 24px", border: "none",
                display: "flex", justifyContent: "center",
            }}>
                <h1 style={{ fontSize: 19, fontWeight: 700, color: C.textDark, margin: 0, textAlign: "center" }}>
                    Mettre à jour les informations de votre profil
                </h1>
            </div>

            {/* ── Formulaire centré et moins large ── */}
            <div style={{ padding: "24px 18px 60px", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "100%", maxWidth: 975 }}>
                    <div style={{
                        background: "#fff", borderRadius: 10,
                        padding: "40px 48px 36px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                        border: "1px solid #E5E7EB",
                    }}>

                        {loading ? (
                            <div style={{ textAlign: "center", padding: "40px 0", color: C.textGrey }}>
                                <div style={{ fontSize: 14 }}>Chargement du profil...</div>
                            </div>
                        ) : (
                            <>
                                {/* Champs lecture seule */}
                                <ChampLecture label="Numéro d'identification fiscale" valeur={nif} />
                                <ChampLecture label="Structure Fiscale"               valeur={structureFisc} />
                                <ChampLecture label="Noms complets"                   valeur={nomsComplets} />

                                <div style={{ height: 12 }} />

                                {/* Champs éditables */}
                                <ChampInput
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={setEmail}
                                    requis
                                />
                                <ChampInput
                                    label="Email additionnel (Optionnel)"
                                    type="email"
                                    value={emailAdditionnel}
                                    onChange={setEmailAdditionnel}
                                    requis={false}
                                />
                                <ChampInput
                                    label="Numéro de téléphone"
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

                                {/* Messages */}
                                {enregistrement === "succes" && (
                                    <div style={{ marginBottom: 16, padding: "10px 16px", background: "#DCFCE7", color: "#16A34A", borderRadius: 6, fontSize: 14, fontWeight: 500 }}>
                                        Profil mis à jour avec succès.
                                    </div>
                                )}
                                {enregistrement === "erreur" && (
                                    <div style={{ marginBottom: 16, padding: "10px 16px", background: "#FEE2E2", color: "#DC2626", borderRadius: 6, fontSize: 14, fontWeight: 500 }}>
                                        Veuillez remplir tous les champs obligatoires.
                                    </div>
                                )}

                                {/* Bloc information fiscale selon profil */}
                                {centre && ROLE_BADGE[centre] && (
                                    <div style={{
                                        marginBottom: 20, padding: "14px 18px",
                                        background: centre === "CGA" ? "#F5F3FF" : centre === "DGE" ? "#EFF6FF" : "#F0FDF4",
                                        border: `1px solid ${centre === "CGA" ? "#DDD6FE" : centre === "DGE" ? "#BFDBFE" : "#BBF7D0"}`,
                                        borderRadius: 8,
                                    }}>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: couleur, margin: "0 0 6px" }}>
                                            Regime fiscal applicable
                                        </p>
                                        {centre === "CGA" && (
                                            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                                                En tant qu'adherant CGA, vous etes <strong>exonere d'impot sur 1 an</strong> (taux : 0%).
                                            </p>
                                        )}
                                        {centre === "DGE" && (
                                            <p style={{ fontSize: 13, color: "#6B7280", margin: 0 }}>
                                                En tant que contribuable DGE, un taux d'imposition preferentiel de <strong>0,2%</strong> vous est applique.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Bouton */}
                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                    <button
                                        onClick={handleContinuer}
                                        disabled={chargement}
                                        style={{
                                            padding: "12px 32px",
                                            background: chargement ? "#F5C77E" : couleur,
                                            color: "#fff", border: "none",
                                            borderRadius: 6, fontSize: 15, fontWeight: 600,
                                            cursor: chargement ? "not-allowed" : "pointer",
                                            transition: "background 0.2s",
                                            minWidth: 140,
                                        }}
                                    >
                                        {chargement ? "Enregistrement..." : "Continuer"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}