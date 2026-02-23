"use client";

import { useState, useRef, useEffect } from "react";
import C from "../lib/utils/colors";
import mockData from "../data/mockData.json";

// ─── Données statuts (labels exactement comme l'image) ───────────────────
const STATUT_OPTIONS = [
    { value: "DRAFT",     label: "DRAFT"     },
    { value: "SUBMITTED", label: "SUBMITTED" },
    { value: "VALIDATED", label: "VALIDATED" },
    { value: "REJECTED",  label: "REJECTED"  },
];

const EXERCICE_OPTIONS = ["2025", "2024", "2023"];

// Mapping statut mockData → valeurs filtres
const STATUT_MAP = {
    non_paye:  "DRAFT",
    paye:      "VALIDATED",
    soumise:   "SUBMITTED",
    rejetee:   "REJECTED",
};

// ─── Composant Checkbox orange style DGI ──────────────────────────────────
function OrangeCheckbox({ checked, onChange, id }) {
    return (
        <div
            onClick={onChange}
            style={{
                width: 18, height: 18, borderRadius: 3, cursor: "pointer", flexShrink: 0,
                border: checked ? "none" : `2px solid #9CA3AF`,
                background: checked ? C.orange : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}
        >
            {checked && (
                <svg viewBox="0 0 12 9" width="11" height="9" fill="none">
                    <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )}
        </div>
    );
}

// ─── Input "outlined Material" avec label flottant ────────────────────────
function OutlinedInput({ label, value, onClear, onClick, open, children }) {
    const isFilled = value && value.length > 0;
    return (
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            {/* Bordure + fond */}
            <div
                onClick={onClick}
                style={{
                    border: `1.5px solid ${open || isFilled ? C.orange : "#9CA3AF"}`,
                    borderRadius: 4, padding: "14px 40px 6px 12px",
                    background: C.white, cursor: "pointer", minHeight: 52,
                    display: "flex", alignItems: "center",
                }}
            >
                {/* Label flottant */}
                <span style={{
                    position: "absolute", left: 10,
                    top: isFilled || open ? 4 : 16,
                    fontSize: isFilled || open ? 10 : 14,
                    color: open ? C.orange : isFilled ? C.orange : "#9CA3AF",
                    transition: "all 0.15s", pointerEvents: "none",
                    background: C.white, padding: "0 2px",
                    fontFamily: "Arial, sans-serif",
                }}>
          {label}
        </span>

                {/* Valeur affichée */}
                <span style={{
                    fontSize: 14, color: isFilled ? C.textDark : "transparent",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: "calc(100% - 10px)", display: "block",
                }}>
          {value || "​"}
        </span>
            </div>

            {/* Bouton × clear */}
            {isFilled && (
                <button
                    onClick={(e) => { e.stopPropagation(); onClear(); }}
                    style={{
                        position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "0 2px",
                    }}
                >
                    ×
                </button>
            )}

            {/* Flèche dropdown */}
            <span style={{
                position: "absolute", right: 8, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`,
                pointerEvents: "none", color: "#9CA3AF", fontSize: 12,
                transition: "transform 0.15s",
            }}>
        ▼
      </span>

            {/* Slot dropdown */}
            {children}
        </div>
    );
}

// ─── Badge statut ─────────────────────────────────────────────────────────
function Badge({ statut }) {
    const map = {
        paye:      { label: "VALIDATED", bg: "#DCFCE7", color: "#16A34A" },
        non_paye:  { label: "DRAFT",     bg: "#FEF3C7", color: "#D97706" },
        soumise:   { label: "SUBMITTED", bg: "#DBEAFE", color: "#1D4ED8" },
        rejetee:   { label: "REJECTED",  bg: "#FEE2E2", color: "#DC2626" },
    };
    const s = map[statut] ?? { label: statut?.toUpperCase(), bg: "#F3F4F6", color: "#6B7280" };
    return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: s.bg, color: s.color }}>
      {s.label}
    </span>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function PageListeDesAvis() {
    const [rechercheOuverte,  setRechercheOuverte]  = useState(true);
    const [exerciceSaisi,     setExerciceSaisi]      = useState("");
    const [exerciceOpen,      setExerciceOpen]        = useState(false);
    const [statutOpen,        setStatutOpen]          = useState(false);
    const [statutsSelec,      setStatutsSelec]        = useState([]);   // [] = tous
    const [downloading,       setDownloading]          = useState(null); // id en cours

    // Données filtrées
    const [avisFiltres, setAvisFiltres] = useState(mockData.avisListe);

    const exerciceRef = useRef(null);
    const statutRef   = useRef(null);

    // Fermer dropdowns au clic extérieur
    useEffect(() => {
        const handler = (e) => {
            if (exerciceRef.current && !exerciceRef.current.contains(e.target)) setExerciceOpen(false);
            if (statutRef.current   && !statutRef.current.contains(e.target))   setStatutOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Toggle statut sélectionné ────────────────────────────────────────
    const toggleStatut = (val) => {
        setStatutsSelec((prev) =>
            prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]
        );
    };

    const toggleTout = () => setStatutsSelec([]);

    // ── Valeur affichée dans le champ Statut ────────────────────────────
    const statutAffiche = statutsSelec.length > 0 ? statutsSelec.join(", ") : "";

    // ── Recherche ────────────────────────────────────────────────────────
    const handleRechercher = () => {
        let result = [...mockData.avisListe];

        if (exerciceSaisi.trim()) {
            const annee = parseInt(exerciceSaisi.replace(/\D/g, ""));
            if (!isNaN(annee)) result = result.filter((a) => a.anneeFiscale === annee);
        }

        if (statutsSelec.length > 0) {
            result = result.filter((a) => {
                const mapped = STATUT_MAP[a.statut] ?? a.statut?.toUpperCase();
                return statutsSelec.includes(mapped);
            });
        }

        setAvisFiltres(result);
    };

    // ── Téléchargement PDF via route Next.js ────────────────────────────
    // Appelle GET /api/avis/:id/pdf → pdfkit côté serveur → téléchargement
    const handleTelecharger = async (avis) => {
        setDownloading(avis.id);
        try {
            const res = await fetch(`/api/avis/${avis.id}/pdf`);
            if (!res.ok) throw new Error("Erreur génération PDF");

            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `avis-${avis.reference}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("Impossible de générer le PDF : " + e.message);
        } finally {
            setDownloading(null);
        }
    };

    // ── Styles communs ────────────────────────────────────────────────────
    const thStyle = {
        padding: "14px 20px", textAlign: "left", fontSize: 13,
        fontWeight: 500, color: C.textMid, background: C.white,
    };

    const tdStyle = {
        padding: "18px 20px", fontSize: 14, color: C.textDark,
        borderBottom: `1px solid #F3F4F6`, verticalAlign: "middle",
    };

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column" }}>

            {/* ── Titre ── */}
            <div style={{ background: C.white, padding: "20px 28px", borderBottom: "1px solid #E5E7EB" }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: C.textDark }}>Liste des Avis</h1>
            </div>

            <div style={{ padding: "0 0 40px" }}>

                {/* ── Bloc Recherche avancée ── */}
                <div style={{ background: C.white, borderBottom: "1px solid #E5E7EB" }}>

                    {/* Header cliquable */}
                    <div
                        onClick={() => setRechercheOuverte(!rechercheOuverte)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 28px", cursor: "pointer", userSelect: "none" }}
                    >
                        <span style={{ fontWeight: 600, fontSize: 16, color: C.textDark }}>Recherche avancée</span>
                        <span style={{ fontSize: 18, color: C.textGrey }}>{rechercheOuverte ? "∧" : "∨"}</span>
                    </div>

                    {/* Filtres */}
                    {rechercheOuverte && (
                        <div style={{ display: "flex", gap: 16, padding: "4px 28px 24px", alignItems: "flex-end", flexWrap: "wrap" }}>

                            {/* ── Exercice — input texte + dropdown liste ── */}
                            <div ref={exerciceRef} style={{ flex: 1, minWidth: 200, position: "relative" }}>
                                <OutlinedInput
                                    label="Exercice"
                                    value={exerciceSaisi ? `EXERCICE ${exerciceSaisi}` : ""}
                                    onClear={() => { setExerciceSaisi(""); setAvisFiltres(mockData.avisListe); }}
                                    onClick={() => setExerciceOpen(!exerciceOpen)}
                                    open={exerciceOpen}
                                >
                                    {exerciceOpen && (
                                        <div style={{
                                            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                                            background: C.white, border: `1px solid ${C.border}`,
                                            borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden",
                                        }}>
                                            {/* Input libre pour saisir une année */}
                                            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}` }}>
                                                <input
                                                    type="number"
                                                    placeholder="Saisir une année..."
                                                    value={exerciceSaisi}
                                                    onChange={(e) => setExerciceSaisi(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 10px", fontSize: 13, outline: "none" }}
                                                    autoFocus
                                                />
                                            </div>
                                            {EXERCICE_OPTIONS.map((ex) => (
                                                <div
                                                    key={ex}
                                                    onClick={() => { setExerciceSaisi(ex); setExerciceOpen(false); }}
                                                    style={{
                                                        padding: "11px 16px", cursor: "pointer", fontSize: 14,
                                                        background: exerciceSaisi === ex ? C.orangeBg : "transparent",
                                                        color: exerciceSaisi === ex ? C.orange : C.textDark,
                                                        fontWeight: exerciceSaisi === ex ? 600 : 400,
                                                    }}
                                                    onMouseEnter={(e) => { if (exerciceSaisi !== ex) e.currentTarget.style.background = "#F9FAFB"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = exerciceSaisi === ex ? C.orangeBg : "transparent"; }}
                                                >
                                                    EXERCICE {ex}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </OutlinedInput>
                            </div>

                            {/* ── Statut — multi-checkbox ── */}
                            <div ref={statutRef} style={{ flex: 1, minWidth: 200, position: "relative" }}>
                                <OutlinedInput
                                    label="Statut"
                                    value={statutAffiche}
                                    onClear={() => { setStatutsSelec([]); }}
                                    onClick={() => setStatutOpen(!statutOpen)}
                                    open={statutOpen}
                                >
                                    {statutOpen && (
                                        <div style={{
                                            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                                            background: C.white, border: `1px solid ${C.border}`,
                                            borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden",
                                        }}>
                                            {/* Option Tout */}
                                            <div
                                                onClick={toggleTout}
                                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", borderBottom: `1px solid #F3F4F6` }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                            >
                                                <OrangeCheckbox checked={statutsSelec.length === 0} onChange={toggleTout} />
                                                <span style={{ fontSize: 14, color: C.textMid }}>Tout</span>
                                            </div>

                                            {/* Options individuelles */}
                                            {STATUT_OPTIONS.map(({ value, label }) => {
                                                const checked = statutsSelec.includes(value);
                                                return (
                                                    <div
                                                        key={value}
                                                        onClick={() => toggleStatut(value)}
                                                        style={{
                                                            display: "flex", alignItems: "center", gap: 12,
                                                            padding: "13px 16px", cursor: "pointer",
                                                            background: checked ? C.orangeBg : "transparent",
                                                            borderBottom: `1px solid #F3F4F6`,
                                                        }}
                                                        onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = "#F9FAFB"; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.background = checked ? C.orangeBg : "transparent"; }}
                                                    >
                                                        <OrangeCheckbox checked={checked} onChange={() => toggleStatut(value)} />
                                                        <span style={{ fontSize: 14, color: checked ? C.textDark : C.textMid, fontWeight: checked ? 600 : 400 }}>
                              {label}
                            </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </OutlinedInput>
                            </div>

                            {/* ── Bouton RECHERCHER ── */}
                            <button
                                onClick={handleRechercher}
                                style={{
                                    flex: 1, minWidth: 180, display: "flex", alignItems: "center", justifyContent: "center",
                                    gap: 8, border: `1.5px solid ${C.orange}`, background: C.white,
                                    color: C.orange, borderRadius: 4, padding: "14px 20px",
                                    fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.8,
                                    height: 52,
                                }}
                            >
                                🔍 RECHERCHER
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Compteur rows ── */}
                <div style={{ background: "#F3F4F6", padding: "10px 28px", textAlign: "right", fontSize: 13, color: C.textGrey }}>
                    showing {avisFiltres.length} of {mockData.avisListe.length} rows
                </div>

                {/* ── Tableau ── */}
                <div style={{ background: C.white, overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                        <thead>
                        <tr style={{ borderBottom: `1px solid #E5E7EB` }}>
                            <th style={thStyle}>Ref Declaration</th>
                            <th style={thStyle}>Année fiscale</th>
                            <th style={thStyle}>Structure Fiscale</th>
                            <th style={thStyle}>Montant à payer</th>
                            <th style={thStyle}>Date de déclaration</th>
                            <th style={{ ...thStyle, width: 60 }}>•••</th>
                        </tr>
                        </thead>
                        <tbody>
                        {avisFiltres.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: "60px 20px", textAlign: "center", color: C.textGrey, fontSize: 14 }}>
                                    Aucun avis ne correspond aux critères sélectionnés.<br />
                                    <span style={{ fontSize: 12, marginTop: 8, display: "block" }}>
                      Les avis sont générés automatiquement après la validation d'une déclaration.
                    </span>
                                </td>
                            </tr>
                        ) : (
                            avisFiltres.map((avis) => (
                                <LigneAvis
                                    key={avis.id}
                                    avis={avis}
                                    onTelecharger={() => handleTelecharger(avis)}
                                    downloading={downloading === avis.id}
                                    tdStyle={tdStyle}
                                />
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}

// ─── Composant ligne du tableau ────────────────────────────────────────────
function LigneAvis({ avis, onTelecharger, downloading, tdStyle }) {
    const [menuOuvert, setMenuOuvert] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Trouver la DPR associée pour la date
    const dpr        = mockData.dprListe.find((d) => d.id === avis.dprId) ?? {};
    const dateDecl   = dpr.dateSoumission
        ? new Date(dpr.dateSoumission).toLocaleDateString("fr-FR")
        : avis.dateEmission
            ? new Date(avis.dateEmission).toLocaleDateString("fr-FR")
            : "—";

    return (
        <tr style={{ borderBottom: `1px solid #F3F4F6` }}>
            <td style={{ ...tdStyle, fontFamily: "monospace", color: C.orange, fontWeight: 600 }}>
                {avis.reference}
            </td>
            <td style={tdStyle}>{avis.anneeFiscale}</td>
            <td style={tdStyle}>{mockData.utilisateur.structureFiscale}</td>
            <td style={tdStyle}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <Badge statut={avis.statut} />
                    <span style={{ fontSize: 13, color: C.textMid }}>
            {Number(avis.montant).toLocaleString("fr-FR")} FCFA
          </span>
                </div>
            </td>
            <td style={tdStyle}>{dateDecl}</td>

            {/* ── Menu ··· ── */}
            <td style={{ ...tdStyle, position: "relative" }} ref={menuRef}>
                <button
                    onClick={() => setMenuOuvert(!menuOuvert)}
                    style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textGrey, letterSpacing: 3, padding: "4px 6px", borderRadius: 4 }}
                    title="Options"
                >
                    •••
                </button>

                {menuOuvert && (
                    <div style={{
                        position: "absolute", right: 8, top: "100%", zIndex: 200,
                        background: C.white, border: `1px solid ${C.border}`,
                        borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        minWidth: 220, overflow: "hidden",
                    }}>
                        <button
                            onClick={() => { setMenuOuvert(false); onTelecharger(); }}
                            disabled={downloading}
                            style={{
                                display: "flex", alignItems: "center", gap: 12, width: "100%",
                                padding: "14px 16px", border: "none", background: "transparent",
                                cursor: downloading ? "not-allowed" : "pointer",
                                fontSize: 14, color: downloading ? C.textGrey : C.textDark, textAlign: "left",
                            }}
                            onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.background = C.orangeBg; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                            <span style={{ fontSize: 18 }}>{downloading ? "⏳" : "⬇"}</span>
                            {downloading ? "Génération PDF..." : "Télécharger l'avis"}
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}