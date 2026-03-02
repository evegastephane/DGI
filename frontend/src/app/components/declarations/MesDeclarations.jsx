"use client";

import { useState, useEffect, useRef } from "react";
import C from "../../lib/utils/colors";
import { CURRENT_USER_ID, getContribuable } from "../../lib/api/contribuableApi";
import { getDeclarations } from "@/app/lib/api/declarationApi";
import { generateAvisPDF, downloadPDF } from "../../lib/utils/generateAvisPDF";

// ─── Badge statut ─────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
    const MAP = {
        SUBMITTED: { bg: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74", label: "SUBMITTED" },
        DRAFT:     { bg: "#f3f4f6", color: "#6b7280", border: "1px solid #d1d5db", label: "DRAFT"     },
        PAYE:      { bg: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", label: "PAYÉ"      },
        APURE:     { bg: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd", label: "APURÉ"     },
        CONTESTE:  { bg: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", label: "CONTESTÉ"  },
        VALIDEE:   { bg: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74", label: "SUBMITTED" },
    };
    const s = MAP[statut?.toUpperCase()] || MAP.DRAFT;
    return (
        <span style={{
            background: s.bg, color: s.color, border: s.border,
            padding: "4px 14px", borderRadius: 999,
            fontSize: 11, fontWeight: 700, display: "inline-block",
            textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
            {s.label}
        </span>
    );
}

// ─── Menu ··· ─────────────────────────────────────────────────────────────────
function ActionMenu({ declaration, contribuable }) {
    const [open,         setOpen]         = useState(false);
    const [downloading,  setDownloading]  = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const handleTelecharger = async () => {
        setOpen(false);
        setDownloading(true);
        try {
            const bytes = await generateAvisPDF(declaration, contribuable);
            downloadPDF(bytes, `avis-${declaration.reference || declaration.id}.pdf`);
        } catch (e) {
            alert("Erreur génération PDF : " + e.message);
        } finally {
            setDownloading(false);
        }
    };

    const menuItems = [
        {
            label: downloading ? "⏳ Génération..." : "⬇ Télécharger l'avis",
            onClick: handleTelecharger,
            disabled: downloading || declaration.statut?.toUpperCase() === "DRAFT",
        },
        { label: "💳 Payer", onClick: () => setOpen(false), disabled: false },
    ];

    return (
        <td style={{ padding: "12px 16px", position: "relative" }} ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#9ca3af", fontSize: 18, letterSpacing: 3, padding: "4px 6px", borderRadius: 4,
                }}
            >
                {downloading ? "⏳" : "•••"}
            </button>
            {open && (
                <div style={{
                    position: "absolute", right: 8, top: "100%", zIndex: 200,
                    background: C.white, border: `1px solid ${C.border}`,
                    borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    minWidth: 200, overflow: "hidden",
                }}>
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={item.onClick}
                            disabled={item.disabled}
                            style={{
                                display: "flex", alignItems: "center", gap: 12, width: "100%",
                                padding: "13px 16px", border: "none",
                                background: "transparent",
                                cursor: item.disabled ? "not-allowed" : "pointer",
                                fontSize: 13,
                                color: item.disabled ? "#9ca3af" : C.textDark,
                                textAlign: "left",
                                borderBottom: `1px solid #f3f4f6`,
                            }}
                            onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = C.orangeBg; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                            {item.label}
                            {item.label.includes("Télécharger") && declaration.statut?.toUpperCase() === "DRAFT" && (
                                <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: "auto" }}>DRAFT</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </td>
    );
}

const thStyle = {
    padding: "13px 16px", textAlign: "left", fontSize: 13,
    fontWeight: 600, color: "#374151", borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
};
const tdStyle = { padding: "14px 16px", fontSize: 13, color: "#374151" };
const ROWS_OPTIONS = [10, 25, 50];
const STATUT_OPTIONS = [
    { value: "SUBMITTED", label: "SUBMITTED" },
    { value: "DRAFT",     label: "DRAFT"     },
    { value: "PAYE",      label: "PAYÉ"      },
    { value: "APURE",     label: "APURÉ"     },
];

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MesDeclarations() {
    const [avis,             setAvis]             = useState([]);
    const [contribuable,     setContribuable]     = useState({});
    const [loading,          setLoading]          = useState(true);
    const [error,            setError]            = useState(null);
    const [rechercheOpen,    setRechercheOpen]    = useState(false);
    const [rowsPerPage,      setRowsPerPage]      = useState(10);
    const [currentPage,      setCurrentPage]      = useState(1);

    const [filtreRef,    setFiltreRef]    = useState("");
    const [filtreAnnee,  setFiltreAnnee]  = useState("");
    const [filtreStatut, setFiltreStatut] = useState("");

    // ── Charger déclarations + infos contribuable ─────────────────────────
    useEffect(() => {
        setLoading(true);
        Promise.all([
            getDeclarations(CURRENT_USER_ID),
            getContribuable(CURRENT_USER_ID).catch(() => ({})),
        ])
            .then(([declarations, contrib]) => {
                setAvis(declarations);
                setContribuable(contrib);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    // ── Filtrage ──────────────────────────────────────────────────────────
    const filtered = avis.filter((a) => {
        if (filtreRef    && !a.reference?.toLowerCase().includes(filtreRef.toLowerCase())) return false;
        if (filtreAnnee  && String(a.annee) !== filtreAnnee)                               return false;
        if (filtreStatut && a.statut?.toUpperCase() !== filtreStatut)                      return false;
        return true;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const inputStyle = {
        border: `1.5px solid ${C.border}`, borderRadius: 6, padding: "10px 14px",
        fontSize: 13, color: C.textDark, background: C.white, outline: "none", width: "100%",
    };

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
        : "—";

    return (
        <main style={{ padding: "24px 24px 60px", flex: 1 }}>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>
                    Liste des Déclarations
                </h1>
            </div>

            <div style={{
                background: C.white, borderRadius: 12,
                border: `1px solid ${C.border}`, overflow: "hidden",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
                {/* Recherche avancée */}
                <div style={{ borderBottom: `1px solid ${C.border}` }}>
                    <button onClick={() => setRechercheOpen(!rechercheOpen)} style={{
                        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "16px 24px", background: "none", border: "none", cursor: "pointer",
                        fontSize: 14, color: "#9ca3af",
                    }}>
                        <span>Recherche avancée</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             style={{ transform: rechercheOpen ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>

                    {rechercheOpen && (
                        <div style={{ padding: "0 24px 20px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>
                                    Référence de déclaration
                                </label>
                                <input value={filtreRef} onChange={(e) => { setFiltreRef(e.target.value); setCurrentPage(1); }}
                                       placeholder="AV-GNR-..." style={inputStyle}
                                       onFocus={(e) => e.target.style.borderColor = C.orange}
                                       onBlur={(e) => e.target.style.borderColor = C.border} />
                            </div>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>
                                    Année fiscale
                                </label>
                                <select value={filtreAnnee} onChange={(e) => { setFiltreAnnee(e.target.value); setCurrentPage(1); }} style={inputStyle}>
                                    <option value="">Toutes</option>
                                    {[2025, 2024, 2023, 2022].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>
                                    Statut
                                </label>
                                <select value={filtreStatut} onChange={(e) => { setFiltreStatut(e.target.value); setCurrentPage(1); }} style={inputStyle}>
                                    <option value="">Tous</option>
                                    {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                                <button onClick={() => { setFiltreRef(""); setFiltreAnnee(""); setFiltreStatut(""); setCurrentPage(1); }} style={{
                                    background: "none", color: "#9ca3af", border: `1px solid ${C.border}`,
                                    borderRadius: 6, padding: "10px 16px", fontSize: 13, cursor: "pointer",
                                }}>Réinitialiser</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Compteur */}
                <div style={{
                    padding: "10px 24px", textAlign: "right",
                    fontSize: 12, color: "#9ca3af", background: "#f9fafb",
                    borderBottom: `1px solid ${C.border}`,
                }}>
                    showing {paginated.length} of {filtered.length} rows
                </div>

                {/* Tableau */}
                {loading ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#9ca3af" }}>Chargement...</div>
                ) : error ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#b91c1c", fontSize: 13 }}>⚠ {error}</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
                            <thead>
                            <tr style={{ borderBottom: `1px solid #e5e7eb` }}>
                                <th style={thStyle}>Référence de déclaration</th>
                                <th style={thStyle}>Année fiscale</th>
                                <th style={thStyle}>Structure Fiscale</th>
                                <th style={thStyle}>Statut</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>Montant à payer</th>
                                <th style={thStyle}>Date de soumission</th>
                                <th style={{ ...thStyle, width: 60 }}>•••</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: "60px 24px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                                        Aucune déclaration trouvée.
                                    </td>
                                </tr>
                            ) : paginated.map((a) => (
                                <tr key={a.id}
                                    style={{ borderBottom: `1px solid #f3f4f6` }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ ...tdStyle, fontFamily: "monospace", color: C.orange, fontWeight: 600 }}>
                                        {a.reference || "—"}
                                    </td>
                                    <td style={tdStyle}>{a.annee || "—"}</td>
                                    <td style={tdStyle}>{a.structureFiscale || "CDI YAOUNDE 2"}</td>
                                    <td style={tdStyle}><StatutBadge statut={a.statut} /></td>
                                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>
                                        {a.montantBrut > 0 ? Number(a.montantBrut).toLocaleString("fr-FR") : "0"}
                                    </td>
                                    <td style={tdStyle}>{fmtDate(a.date)}</td>
                                    {/* ─── Passe les données réelles à ActionMenu ─── */}
                                    <ActionMenu declaration={a} contribuable={contribuable} />
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 24px", borderTop: `1px solid ${C.border}`,
                    background: C.white, flexWrap: "wrap", gap: 12,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#6b7280" }}>
                        Rows per page:
                        <select value={rowsPerPage}
                                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                style={{ border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 13, cursor: "pointer", outline: "none" }}>
                            {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280" }}>
                        <span>{filtered.length === 0 ? "0" : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}</span>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                style={{ width: 32, height: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: "none", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "#d1d5db" : "#374151" }}>
                            ‹
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                style={{ width: 32, height: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: "none", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: currentPage === totalPages ? "#d1d5db" : "#374151" }}>
                            ›
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
