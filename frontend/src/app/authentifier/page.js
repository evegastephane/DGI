"use client";

import { useState, useRef, useEffect } from "react";
import C from "../lib/utils/colors";
import { getDeclarations, getDeclaration } from "../lib/api/declarationApi";
import { getAvis, getContribuable, CURRENT_USER_ID } from "../lib/api/contribuableApi";
import { generateAvisPDF, downloadPDF } from "../lib/utils/generateAvisPDF";

const TYPE_OPTIONS = ["AVIS", "ACCUSE"];

// ─── Dropdown — style identique au screenshot ─────────────────────────────
// Champ plat, bordure grise, label placeholder gris à gauche,
// bordure + label orange quand ouvert/rempli, flèche ▼ à droite
function SelectOutlined({ label, value, onChange, options }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const isFilled = !!value;
    const isActive = open || isFilled;

    return (
        <div ref={ref} style={{ position: "relative", width: "100%" }}>
            {/* Trigger — fieldset+legend pour vrai découpage de bordure */}
            <fieldset
                onClick={() => setOpen(!open)}
                style={{
                    position: "relative",
                    border: `1.5px solid ${isActive ? C.orange : "#d1d5db"}`,
                    borderRadius: 4,
                    height: 52,
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 40px 0 10px",
                    userSelect: "none",
                    margin: 0,
                }}
            >
                {/* Legend crée le vrai gap dans la bordure */}
                <legend style={{
                    padding: isActive ? "0 4px" : 0,
                    fontSize: 11,
                    lineHeight: 1,
                    height: isActive ? "auto" : 0,
                    overflow: "hidden",
                    color: "transparent",
                    transition: "all 0.15s",
                    marginLeft: 6,
                    whiteSpace: "nowrap",
                    maxWidth: isActive ? 200 : 0,
                }}>
                    {label}
                </legend>

                {/* Label flottant — positionné au-dessus via la legend */}
                <span style={{
                    position: "absolute",
                    left: 14,
                    top: isActive ? -10 : "50%",
                    transform: isActive ? "none" : "translateY(-50%)",
                    fontSize: isActive ? 11 : 14,
                    color: isActive ? C.orange : "#9ca3af",
                    background: "transparent",
                    padding: "0 4px",
                    transition: "all 0.15s",
                    pointerEvents: "none",
                    lineHeight: 1,
                }}>
                    {label}
                </span>

                {/* Valeur sélectionnée */}
                <span style={{
                    fontSize: 14,
                    color: isFilled ? "#111827" : "transparent",
                }}>
                    {isFilled ? value : "\u200b"}
                </span>

                {/* Flèche */}
                <svg
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="#9ca3af" strokeWidth="2"
                    style={{
                        position: "absolute", right: 12, top: "50%",
                        transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`,
                        transition: "transform 0.15s", pointerEvents: "none",
                    }}
                >
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </fieldset>

            {/* Dropdown liste */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0,
                    background: "#fff", border: `1px solid #e5e7eb`,
                    borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    zIndex: 200, overflow: "hidden",
                }}>
                    {options.map((opt) => (
                        <div
                            key={opt}
                            onClick={() => { onChange(opt); setOpen(false); }}
                            style={{
                                padding: "15px 16px",
                                cursor: "pointer",
                                fontSize: 14,
                                color: value === opt ? C.orange : "#111827",
                                fontWeight: value === opt ? 600 : 400,
                                background: value === opt ? "#FFF7ED" : "transparent",
                                borderBottom: `1px solid #f3f4f6`,
                            }}
                            onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = "#f9fafb"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = value === opt ? "#FFF7ED" : "transparent"; }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Input plat — style identique au screenshot ───────────────────────────
// Placeholder gris simple, bordure grise, hauteur 52px, pas de label flottant
function InputFlat({ placeholder, value, onChange }) {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ position: "relative", width: "100%" }}>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={placeholder}
                style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: `1px solid ${focused ? C.orange : "#d1d5db"}`,
                    borderRadius: 4,
                    padding: "0 14px",
                    height: 52,
                    fontSize: 14,
                    color: "#111827",
                    outline: "none",
                    background: "transparent",
                    transition: "border-color 0.15s",
                }}
            />
        </div>
    );
}

// ─── Vue : Résultat authentification ──────────────────────────────────────
function VueResultat({ avis, declaration, contribuable, onRetour }) {
    const [dlLoading, setDlLoading] = useState(false);

    const handleTelecharger = async () => {
        setDlLoading(true);
        try {
            const bytes = await generateAvisPDF(declaration || avis, contribuable);
            downloadPDF(bytes, `avis-${(declaration || avis).reference || "document"}.pdf`);
        } catch (e) {
            alert("Erreur PDF : " + e.message);
        } finally {
            setDlLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "32px 0" }}>
            <p style={{ fontSize: 15, color: C.textDark, textAlign: "center", margin: 0 }}>
                Votre document est authentifié et reconnu par le système fiscal Camerounais
            </p>

            <div style={{
                width: 90, height: 90, borderRadius: "50%",
                border: "5px solid #22c55e",
                display: "flex", alignItems: "center", justifyContent: "center",
            }}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>

            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <button onClick={onRetour} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, color: C.textMid, fontWeight: 600, padding: "10px 20px",
                }}>
                    Précédent
                </button>
                <button onClick={handleTelecharger} disabled={dlLoading} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "#fff", border: `1.5px solid #22c55e`,
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

            <div style={{
                width: "100%", maxWidth: 680,
                border: `1px solid ${C.border}`, borderRadius: 10,
                background: "#fff", overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}>
                <div style={{ background: "#f3f4f6", padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.textDark }}>Aperçu du document</span>
                </div>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                        ["Référence",     (declaration || avis)?.reference || "—"],
                        ["Type",          "AVIS D'IMPOSITION"],
                        ["Année fiscale", (declaration || avis)?.annee || "—"],
                        ["Contribuable",  contribuable?.nom_beneficiaire || contribuable?.nomBeneficiaire || "—"],
                        ["NIU",           contribuable?.NIU || contribuable?.niu || "—"],
                        ["Structure",     (declaration || avis)?.structureFiscale || "CDI YAOUNDE 2"],
                        ["Montant",       `${((declaration || avis)?.montantBrut || 0).toLocaleString("fr-FR")} FCFA`],
                        ["Statut", <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 999, padding: "2px 12px", fontSize: 12, fontWeight: 700 }}>AUTHENTIFIÉ</span>],
                    ].map(([lbl, val]) => (
                        <div key={lbl} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                            <span style={{ fontSize: 13, color: "#6b7280", minWidth: 120, fontWeight: 600 }}>{lbl} :</span>
                            <span style={{ fontSize: 13, color: C.textDark }}>{val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════════════
export default function PageAuthentifier() {
    const [mode,      setMode]      = useState(null);
    const [typeDoc,   setTypeDoc]   = useState("");
    const [reference, setReference] = useState("");
    const [loading,   setLoading]   = useState(false);
    const [erreur,    setErreur]    = useState(null);
    const [resultat,  setResultat]  = useState(null);

    const handleValider = async () => {
        if (!typeDoc || !reference.trim()) {
            setErreur("Veuillez sélectionner un type de document et saisir la référence.");
            return;
        }
        setLoading(true);
        setErreur(null);
        try {
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
        <main style={{ flex: 1, background: "#f0f0f0", display: "flex", flexDirection: "column", minHeight: "100vh" }}>

            {/* ── Bannière DGI ── */}
            <div style={{ display: "flex", justifyContent: "center", padding: "0 40px" }}>
                <img
                    src="/banniere-dgi.png"
                    alt="Direction Générale des Impôts"
                    style={{ width: "100%", maxWidth: 1100, display: "block", borderRadius: 0, marginTop: 20 }}
                />
            </div>

            {/* ── Contenu principal ── */}
            <div style={{
                flex: 1,
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "40px 24px",
                gap: 28,
            }}>

                {/* Titre */}
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0, textAlign: "center" }}>
                    Authentification des documents
                </h2>

                {/* Boutons mode — toujours visibles sauf résultat */}
                {!resultat && (
                    <div style={{ display: "flex", gap: 12 }}>
                        <button
                            onClick={() => { setMode("reference"); setErreur(null); }}
                            style={{
                                background: C.orange,
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                padding: "13px 32px",
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: "pointer",
                                letterSpacing: 0.3,
                                boxShadow: mode === "reference" ? `0 0 0 3px #FFF7ED` : "none",
                            }}
                        >
                            Saisir la référence
                        </button>
                        <button
                            onClick={() => { setMode("qr"); setErreur(null); }}
                            style={{
                                background: "#16a34a",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                padding: "13px 32px",
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: "pointer",
                                letterSpacing: 0.3,
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
                        width: "100%",
                        maxWidth: 480,
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                    }}>
                        {/* Champ Type de document */}
                        <SelectOutlined
                            label="Type de document"
                            value={typeDoc}
                            onChange={setTypeDoc}
                            options={TYPE_OPTIONS}
                        />

                        {/* Champ Référence — toujours visible */}
                        <InputFlat
                            placeholder="Référence du document"
                            value={reference}
                            onChange={setReference}
                        />

                        {/* Erreur */}
                        {erreur && (
                            <div style={{
                                padding: "12px 16px", background: "#fef2f2",
                                border: "1px solid #fca5a5", borderRadius: 8,
                                color: "#b91c1c", fontSize: 13,
                            }}>
                                [!] {erreur}
                            </div>
                        )}

                        {/* Bouton Valider — toujours visible, orange atténué si incomplet */}
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                onClick={handleValider}
                                disabled={loading}
                                style={{
                                    background: (!typeDoc || !reference.trim() || loading) ? "#F6C171" : C.orange,
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "11px 36px",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    transition: "background 0.15s",
                                }}
                            >
                                {loading ? "Vérification..." : "Valider"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Mode : Scanner QR ── */}
                {mode === "qr" && !resultat && (
                    <div style={{
                        width: "100%", maxWidth: 480,
                        background: "#fff", borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        padding: "40px 32px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
                    }}>
                        <div style={{
                            width: 240, height: 240,
                            border: `3px solid ${C.orange}`,
                            borderRadius: 12, position: "relative",
                            background: "#f9fafb",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {[
                                { top: -3, left: -3,   borderTop: `4px solid ${C.orange}`, borderLeft:   `4px solid ${C.orange}` },
                                { top: -3, right: -3,  borderTop: `4px solid ${C.orange}`, borderRight:  `4px solid ${C.orange}` },
                                { bottom: -3, left: -3,  borderBottom: `4px solid ${C.orange}`, borderLeft:  `4px solid ${C.orange}` },
                                { bottom: -3, right: -3, borderBottom: `4px solid ${C.orange}`, borderRight: `4px solid ${C.orange}` },
                            ].map((s, i) => (
                                <div key={i} style={{ position: "absolute", width: 24, height: 24, ...s }}/>
                            ))}
                            <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
                                <rect x="5"  y="5"  width="28" height="28" rx="3" stroke={C.orange} strokeWidth="3" fill="none"/>
                                <rect x="14" y="14" width="10" height="10" fill={C.orange}/>
                                <rect x="47" y="5"  width="28" height="28" rx="3" stroke={C.orange} strokeWidth="3" fill="none"/>
                                <rect x="56" y="14" width="10" height="10" fill={C.orange}/>
                                <rect x="5"  y="47" width="28" height="28" rx="3" stroke={C.orange} strokeWidth="3" fill="none"/>
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