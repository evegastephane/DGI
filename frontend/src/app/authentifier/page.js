"use client";

import { useState, useRef } from "react";
import C from "../lib/utils/colors";
import { getDeclarations, getDeclaration } from "../lib/api/declarationApi";
import { getAvis, getContribuable, CURRENT_USER_ID } from "../lib/api/contribuableApi";
import { generateAvisPDF, downloadPDF } from "../lib/utils/generateAvisPDF";

const TYPE_OPTIONS = ["AVIS", "ACCUSE"];

// ─── Dropdown custom ───────────────────────────────────────────────────────
function SelectOutlined({ label, value, onChange, options }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Fermer en cliquant dehors
    const handleBlur = () => setTimeout(() => setOpen(false), 150);

    return (
        <div ref={ref} style={{ position: "relative", width: "100%" }}>
            <div
                onClick={() => setOpen(!open)}
                style={{
                    border: `1.5px solid ${value ? C.orange : "#9ca3af"}`,
                    borderRadius: 4,
                    padding: "16px 40px 6px 14px",
                    background: C.white,
                    cursor: "pointer",
                    minHeight: 54,
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                }}
                onBlur={handleBlur}
                tabIndex={0}
            >
                {/* Label flottant */}
                <span style={{
                    position: "absolute",
                    left: 12,
                    top: value || open ? 5 : 18,
                    fontSize: value || open ? 11 : 14,
                    color: open ? C.orange : value ? C.orange : "#9ca3af",
                    transition: "all 0.15s",
                    pointerEvents: "none",
                    background: C.white,
                    padding: "0 2px",
                    fontFamily: "'Segoe UI', Arial, sans-serif",
                }}>
                    {label}
                </span>
                <span style={{ fontSize: 14, color: C.textDark }}>{value || ""}</span>
                {/* Flèche */}
                <span style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`,
                    transition: "transform 0.15s", color: "#9ca3af", fontSize: 12,
                }}>▼</span>
            </div>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0,
                    background: C.white, border: `1px solid ${C.border}`,
                    borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    zIndex: 100, overflow: "hidden",
                }}>
                    {options.map((opt) => (
                        <div
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            style={{
                                padding: "14px 16px", cursor: "pointer",
                                fontSize: 14, color: value === opt ? C.orange : C.textDark,
                                background: value === opt ? C.orangeBg : "transparent",
                                fontWeight: value === opt ? 700 : 400,
                                borderBottom: `1px solid #f3f4f6`,
                            }}
                            onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = "#f9fafb"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = value === opt ? C.orangeBg : "transparent"; }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Input Material outlined ───────────────────────────────────────────────
function InputOutlined({ label, value, onChange, placeholder }) {
    const [focused, setFocused] = useState(false);
    const filled = value.length > 0;
    return (
        <div style={{ position: "relative", width: "100%" }}>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder=""
                style={{
                    width: "100%", boxSizing: "border-box",
                    border: `1.5px solid ${focused ? C.orange : "#9ca3af"}`,
                    borderRadius: 4, padding: "18px 14px 6px",
                    fontSize: 14, color: C.textDark,
                    outline: "none", background: C.white,
                    fontFamily: "'Segoe UI', Arial, sans-serif",
                    minHeight: 54,
                }}
            />
            <span style={{
                position: "absolute", left: 12,
                top: focused || filled ? 5 : 18,
                fontSize: focused || filled ? 11 : 14,
                color: focused ? C.orange : filled ? C.orange : "#9ca3af",
                transition: "all 0.15s", pointerEvents: "none",
                background: C.white, padding: "0 2px",
            }}>
                {label}
            </span>
        </div>
    );
}

// ─── Vue : Résultat authentification ──────────────────────────────────────
function VueResultat({ avis, declaration, contribuable, onRetour }) {
    const [dlLoading, setDlLoading] = useState(false);

    const handleTelecharger = async () => {
        setDlLoading(true);
        try {
            const bytes = await generateAvisPDF(
                declaration || avis,
                contribuable
            );
            downloadPDF(bytes, `avis-${(declaration || avis).reference || "document"}.pdf`);
        } catch (e) {
            alert("Erreur PDF : " + e.message);
        } finally {
            setDlLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "32px 0" }}>
            {/* Texte authentifié */}
            <p style={{ fontSize: 15, color: C.textDark, textAlign: "center", margin: 0 }}>
                Votre document est authentifié et reconnu par le système fiscal Camerounais
            </p>

            {/* Icône check vert */}
            <div style={{
                width: 90, height: 90, borderRadius: "50%",
                border: "5px solid #22c55e",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>

            {/* Boutons */}
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <button onClick={onRetour} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, color: C.textMid, fontWeight: 600,
                    padding: "10px 20px",
                }}>
                    Précédent
                </button>
                <button onClick={handleTelecharger} disabled={dlLoading} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: C.white, border: `1.5px solid #22c55e`,
                    color: "#16a34a", borderRadius: 6, padding: "10px 22px",
                    fontSize: 14, fontWeight: 700, cursor: dlLoading ? "not-allowed" : "pointer",
                    opacity: dlLoading ? 0.7 : 1,
                }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    {dlLoading ? "Génération..." : "Télécharger Document"}
                </button>
            </div>

            {/* Aperçu infos document */}
            <div style={{
                width: "100%", maxWidth: 680,
                border: `1px solid ${C.border}`, borderRadius: 10,
                background: C.white, overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
                {/* Header aperçu */}
                <div style={{ background: "#f3f4f6", padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.textDark }}>Aperçu du document</span>
                </div>

                {/* Infos */}
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                        ["Référence",      (declaration || avis)?.reference || "—"],
                        ["Type",           "AVIS D'IMPOSITION"],
                        ["Année fiscale",  (declaration || avis)?.annee || "—"],
                        ["Contribuable",   contribuable?.nom_beneficiaire || contribuable?.nomBeneficiaire || "—"],
                        ["NIU",            contribuable?.NIU || contribuable?.niu || "—"],
                        ["Structure",      (declaration || avis)?.structureFiscale || "CDI YAOUNDE 2"],
                        ["Montant",        `${((declaration || avis)?.montantBrut || 0).toLocaleString("fr-FR")} FCFA`],
                        ["Statut",
                            <span style={{
                                background: "#f0fdf4", color: "#16a34a",
                                border: "1px solid #86efac", borderRadius: 999,
                                padding: "2px 12px", fontSize: 12, fontWeight: 700,
                            }}>AUTHENTIFIÉ</span>
                        ],
                    ].map(([label, value]) => (
                        <div key={label} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "#6b7280", minWidth: 120, fontWeight: 600 }}>{label} :</span>
                            <span style={{ fontSize: 13, color: C.textDark }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function PageAuthentifier() {
    const [mode,       setMode]       = useState(null);       // null | "reference" | "qr"
    const [typeDoc,    setTypeDoc]    = useState("");
    const [reference,  setReference]  = useState("");
    const [loading,    setLoading]    = useState(false);
    const [erreur,     setErreur]     = useState(null);
    const [resultat,   setResultat]   = useState(null);       // { declaration, avis, contribuable }

    const handleValider = async () => {
        if (!typeDoc || !reference.trim()) {
            setErreur("Veuillez sélectionner un type de document et saisir la référence.");
            return;
        }
        setLoading(true);
        setErreur(null);
        try {
            // Récupérer les déclarations et chercher par référence
            const declarations = await getDeclarations(CURRENT_USER_ID);
            const declaration  = declarations.find(
                (d) => d.reference?.toLowerCase() === reference.trim().toLowerCase()
                    && d.statut?.toUpperCase() === "SUBMITTED"
            );

            if (!declaration) {
                setErreur("Aucun document trouvé pour cette référence. Vérifiez la référence et le type.");
                setLoading(false);
                return;
            }

            // Récupérer les infos contribuable
            const contribuable = await getContribuable(CURRENT_USER_ID).catch(() => ({}));

            setResultat({ declaration, contribuable });
        } catch (e) {
            setErreur("Erreur lors de la vérification : " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setMode(null);
        setTypeDoc("");
        setReference("");
        setErreur(null);
        setResultat(null);
    };

    return (
        <main style={{ flex: 1, background: C.bg, display: "flex", flexDirection: "column" }}>

            {/* ── Bannière DGI ── */}
            <div style={{
                width: "100%", height: 120,
                background: "linear-gradient(135deg, #1a3a5c 0%, #2563a8 40%, #c0392b 70%, #8B0000 100%)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 40px", boxSizing: "border-box",
                position: "relative", overflow: "hidden",
            }}>
                {/* Logo DGI gauche */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 1 }}>
                    <div style={{
                        width: 70, height: 70, borderRadius: "50%",
                        background: "rgba(255,255,255,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "2px solid rgba(255,255,255,0.4)",
                    }}>
                        <span style={{ color: "white", fontWeight: 900, fontSize: 22, fontFamily: "serif" }}>DGI</span>
                    </div>
                </div>

                {/* Texte centre */}
                <div style={{ textAlign: "center", zIndex: 1 }}>
                    <div style={{ color: "white", fontWeight: 800, fontSize: 18, letterSpacing: 1 }}>
                        DIRECTION GÉNÉRALE DES IMPOTS
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 4, letterSpacing: 0.5 }}>
                        DIRECTORATE GENERAL OF TAXATION
                    </div>
                </div>

                {/* Armoiries droite */}
                <div style={{
                    width: 70, height: 70, borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid rgba(255,255,255,0.4)",
                    zIndex: 1,
                }}>
                    <svg viewBox="0 0 40 40" width="40" height="40">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
                        <text x="20" y="24" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">CMR</text>
                    </svg>
                </div>
            </div>

            {/* ── Contenu ── */}
            <div style={{ padding: "40px 60px", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>

                {/* Titre */}
                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.textDark, margin: 0 }}>
                    Authentification des documents
                </h2>

                {/* Boutons mode */}
                {!resultat && (
                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                            onClick={() => { setMode("reference"); setErreur(null); }}
                            style={{
                                background: C.orange, color: C.white,
                                border: "none", borderRadius: 6,
                                padding: "12px 28px", fontSize: 14, fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: mode === "reference" ? `0 0 0 3px ${C.orangeBg}` : "none",
                            }}
                        >
                            Saisir la référence
                        </button>
                        <button
                            onClick={() => { setMode("qr"); setErreur(null); }}
                            style={{
                                background: "#16a34a", color: C.white,
                                border: "none", borderRadius: 6,
                                padding: "12px 28px", fontSize: 14, fontWeight: 700,
                                cursor: "pointer",
                                boxShadow: mode === "qr" ? "0 0 0 3px #dcfce7" : "none",
                            }}
                        >
                            Scanner le code QR
                        </button>
                    </div>
                )}

                {/* ── Mode : Saisir référence ── */}
                {mode === "reference" && !resultat && (
                    <div style={{
                        width: "100%", maxWidth: 680,
                        background: C.white, borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        padding: "28px 32px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        display: "flex", flexDirection: "column", gap: 18,
                    }}>
                        <SelectOutlined
                            label="Type de document"
                            value={typeDoc}
                            onChange={setTypeDoc}
                            options={TYPE_OPTIONS}
                        />
                        {typeDoc && (
                            <InputOutlined
                                label="Référence du document"
                                value={reference}
                                onChange={setReference}
                            />
                        )}
                        {erreur && (
                            <div style={{
                                padding: "12px 16px", background: "#fef2f2",
                                border: "1px solid #fca5a5", borderRadius: 8,
                                color: "#b91c1c", fontSize: 13,
                            }}>
                                [!] {erreur}
                            </div>
                        )}
                        {typeDoc && (
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    onClick={handleValider}
                                    disabled={loading}
                                    style={{
                                        background: loading ? "#d97706" : C.orange,
                                        color: C.white, border: "none",
                                        borderRadius: 6, padding: "11px 32px",
                                        fontSize: 14, fontWeight: 700,
                                        cursor: loading ? "not-allowed" : "pointer",
                                        opacity: loading ? 0.8 : 1,
                                    }}
                                >
                                    {loading ? "Vérification..." : "Valider"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Mode : Scanner QR ── */}
                {mode === "qr" && !resultat && (
                    <div style={{
                        width: "100%", maxWidth: 480,
                        background: C.white, borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        padding: "40px 32px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
                    }}>
                        {/* Cadre caméra simulé */}
                        <div style={{
                            width: 240, height: 240,
                            border: `3px solid ${C.orange}`,
                            borderRadius: 12, position: "relative",
                            background: "#f9fafb",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {/* Coins scanner */}
                            {[["top:0,left:0","borderTop,borderLeft"],["top:0,right:0","borderTop,borderRight"],
                              ["bottom:0,left:0","borderBottom,borderLeft"],["bottom:0,right:0","borderBottom,borderRight"]
                            ].map((_, i) => {
                                const positions = [
                                    { top: -3, left: -3 }, { top: -3, right: -3 },
                                    { bottom: -3, left: -3 }, { bottom: -3, right: -3 },
                                ];
                                const borders = [
                                    { borderTop: `4px solid ${C.orange}`, borderLeft: `4px solid ${C.orange}` },
                                    { borderTop: `4px solid ${C.orange}`, borderRight: `4px solid ${C.orange}` },
                                    { borderBottom: `4px solid ${C.orange}`, borderLeft: `4px solid ${C.orange}` },
                                    { borderBottom: `4px solid ${C.orange}`, borderRight: `4px solid ${C.orange}` },
                                ];
                                return (
                                    <div key={i} style={{
                                        position: "absolute", width: 24, height: 24,
                                        ...positions[i], ...borders[i],
                                    }}/>
                                );
                            })}
                            {/* Icone QR */}
                            <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
                                <rect x="5" y="5" width="28" height="28" rx="3" stroke={C.orange} strokeWidth="3" fill="none"/>
                                <rect x="14" y="14" width="10" height="10" fill={C.orange}/>
                                <rect x="47" y="5" width="28" height="28" rx="3" stroke={C.orange} strokeWidth="3" fill="none"/>
                                <rect x="56" y="14" width="10" height="10" fill={C.orange}/>
                                <rect x="5" y="47" width="28" height="28" rx="3" stroke={C.orange} strokeWidth="3" fill="none"/>
                                <rect x="14" y="56" width="10" height="10" fill={C.orange}/>
                                <line x1="47" y1="47" x2="75" y2="47" stroke={C.orange} strokeWidth="3"/>
                                <line x1="47" y1="60" x2="60" y2="60" stroke={C.orange} strokeWidth="3"/>
                                <line x1="47" y1="73" x2="75" y2="73" stroke={C.orange} strokeWidth="3"/>
                                <line x1="68" y1="47" x2="68" y2="75" stroke={C.orange} strokeWidth="3"/>
                            </svg>
                        </div>
                        <p style={{ fontSize: 13, color: "#6b7280", textAlign: "center", margin: 0 }}>
                            Pointez la caméra vers le code QR présent sur votre document fiscal.
                        </p>
                        <button
                            onClick={() => setMode("reference")}
                            style={{
                                background: "none", border: `1px solid ${C.border}`,
                                borderRadius: 6, padding: "10px 20px",
                                fontSize: 13, color: C.textMid, cursor: "pointer",
                            }}
                        >
                            Saisir la référence manuellement
                        </button>
                    </div>
                )}

                {/* ── Résultat ── */}
                {resultat && (
                    <div style={{ width: "100%", maxWidth: 680 }}>
                        <VueResultat
                            declaration={resultat.declaration}
                            avis={resultat.avis}
                            contribuable={resultat.contribuable}
                            onRetour={handleReset}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
