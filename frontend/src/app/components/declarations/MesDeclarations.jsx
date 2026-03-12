"use client";

import { useState, useEffect, useRef } from "react";
import C from "../../lib/utils/colors";
import { CURRENT_USER_ID, getContribuable } from "../../lib/api/contribuableApi";
import { getDeclarations, soumettreDraft, modifierDeclaration } from "@/app/lib/api/declarationApi";
import { generateAvisPDF, downloadPDF } from "../../lib/utils/generateAvisPDF";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// ─── Styles communs ─────────────────────────────────────────────────────────────
const thS = {
    padding: "0", textAlign: "left", fontSize: 13,
    fontWeight: 500, color: "#6B7280", borderBottom: `1px solid #E5E7EB`,
    whiteSpace: "nowrap", background: "#fff", position: "relative",
};
const tdS = { padding: "18px 20px", fontSize: 14, color: "#111827", verticalAlign: "middle" };

const ROWS_OPTIONS = [10, 25, 50];
const STATUT_OPTIONS = [
    { value: "SUBMITTED", label: "SUBMITTED" },
    { value: "DRAFT",     label: "DRAFT"     },
    { value: "VALIDE",    label: "VALIDÉ"    },
    { value: "REJETE",    label: "REJETÉ"    },
];

// ─── ColHeader avec menu tri/filtre ──────────────────────────────────────────
function ColHeader({ label, colKey, sortConfig, onSort, hiddenCols, onHide, align }) {
    const [open, setOpen] = useState(false);
    const [hover, setHover] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    if (hiddenCols?.includes(colKey)) return null;

    const isActive = sortConfig?.key === colKey;
    const isAsc    = isActive && sortConfig.dir === "asc";
    const isDesc   = isActive && sortConfig.dir === "desc";

    const menuItems = [
        {
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            ),
            label: "Sort by ASC",
            onClick: () => { onSort(colKey, "asc"); setOpen(false); },
        },
        {
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            ),
            label: "Sort by DESC",
            onClick: () => { onSort(colKey, "desc"); setOpen(false); },
        },
        { divider: true },
        {
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            ),
            label: "Filter",
            onClick: () => setOpen(false),
        },
        { divider: true },
        {
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            ),
            label: "Hide column",
            onClick: () => { onHide(colKey); setOpen(false); },
        },
        {
            icon: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            ),
            label: "Manage columns",
            onClick: () => setOpen(false),
        },
    ];

    return (
        <th style={{ ...thS, textAlign: align || "left" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}>
            <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "13px 12px 13px 20px",
                justifyContent: align === "right" ? "flex-end" : "flex-start",
            }}>
                <span>{label}</span>
                {/* Sort indicator */}
                {isActive && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                        {isAsc
                            ? <path d="M12 19V5M5 12l7-7 7 7"/>
                            : <path d="M12 5v14M5 12l7 7 7-7"/>}
                    </svg>
                )}
                {/* ⋮ button */}
                <div ref={ref} style={{ position: "relative", marginLeft: "auto" }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                        style={{
                            background: "none", border: "none", cursor: "pointer",
                            padding: "2px 4px", borderRadius: 3,
                            color: open || hover ? "#6B7280" : "transparent",
                            transition: "color 0.15s",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 16, lineHeight: 1, letterSpacing: 1,
                        }}>
                        ⋮
                    </button>
                    {open && (
                        <div style={{
                            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 400,
                            background: "#fff", border: `1px solid #E5E7EB`,
                            borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
                            minWidth: 200, overflow: "hidden",
                        }}>
                            {menuItems.map((item, i) =>
                                item.divider ? (
                                    <div key={i} style={{ height: 1, background: "#F3F4F6", margin: "2px 0" }} />
                                ) : (
                                    <button key={item.label} onClick={item.onClick}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12,
                                                width: "100%", padding: "11px 16px",
                                                border: "none", background: "transparent",
                                                cursor: "pointer", fontSize: 13,
                                                color: "#374151", textAlign: "left",
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                        <span style={{ color: "#9CA3AF", display: "flex" }}>{item.icon}</span>
                                        {item.label}
                                    </button>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </th>
    );
}

// ─── Badge statut ────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
    const s = statut?.toUpperCase();
    if (s === "SUBMITTED" || s === "VALIDEE") {
        return (
            <span style={{
                background: "#F59E0B", color: "#fff",
                padding: "5px 16px", borderRadius: 999,
                fontSize: 12, fontWeight: 700, display: "inline-block",
                textTransform: "uppercase", letterSpacing: "0.05em",
            }}>SUBMITTED</span>
        );
    }
    if (s === "PAYE") {
        return (
            <span style={{
                background: "#F0FDF4", color: "#15803D", border: "1px solid #86EFAC",
                padding: "5px 16px", borderRadius: 999,
                fontSize: 12, fontWeight: 700, display: "inline-block",
                textTransform: "uppercase", letterSpacing: "0.05em",
            }}>PAYÉ</span>
        );
    }
    if (s === "APURE") {
        return (
            <span style={{
                background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #93C5FD",
                padding: "5px 16px", borderRadius: 999,
                fontSize: 12, fontWeight: 700, display: "inline-block",
                textTransform: "uppercase", letterSpacing: "0.05em",
            }}>APURÉ</span>
        );
    }
    // DRAFT default
    return (
        <span style={{
            background: "#F3F4F6", color: "#6B7280", border: "1px solid #D1D5DB",
            padding: "5px 16px", borderRadius: 999,
            fontSize: 12, fontWeight: 700, display: "inline-block",
            textTransform: "uppercase", letterSpacing: "0.05em",
        }}>DRAFT</span>
    );
}

// ─── Select Exercice — label flottant + options "EXERCICE YYYY" ───────────────
function ExerciceSelect({ label, value, onChange, options }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const isFilled = !!value;

    return (
        <div ref={ref} style={{ position: "relative", flex: 1 }}>
            {/* Trigger */}
            <div onClick={() => setOpen(!open)} style={{
                position: "relative", border: `1.5px solid ${open || isFilled ? "#F59E0B" : "#D1D5DB"}`,
                borderRadius: 4, height: 37, background: "#fff",
                cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", padding: "0 14px",
            }}>
                {/* Floating label */}
                <span style={{
                    position: "absolute", left: 12, top: open || isFilled ? -10 : "50%",
                    transform: open || isFilled ? "none" : "translateY(-50%)",
                    fontSize: open || isFilled ? 11 : 14,
                    color: open || isFilled ? "#F59E0B" : "#9CA3AF",
                    background: "#fff", padding: "0 4px",
                    transition: "all 0.15s", pointerEvents: "none", lineHeight: 1,
                }}>{label}</span>
                <span style={{ fontSize: 14, color: isFilled ? "#111827" : "transparent", marginTop: 4 }}>
                    {isFilled ? `EXERCICE ${value}` : "\u200b"}
                </span>
                {isFilled && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onChange(""); }}
                        style={{
                            position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer",
                            color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "2px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        ×
                    </button>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                     style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`, transition: "transform 0.2s", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200,
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.10)", overflow: "hidden",
                }}>
                    {options.map((opt) => (
                        <div key={opt.value}
                             onClick={() => { onChange(opt.value); setOpen(false); }}
                             style={{
                                 padding: "13px 16px", fontSize: 14, cursor: "pointer",
                                 color: "#374151", fontWeight: 400,
                                 borderBottom: `1px solid #F3F4F6`,
                                 background: "transparent",
                             }}
                             onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                             onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            EXERCICE {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Select Statut — label flottant + checkboxes ──────────────────────────────
function StatutSelect({ label, value, onChange, options }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const isFilled = !!value;
    const selected = options.find(o => o.value === value);

    return (
        <div ref={ref} style={{ position: "relative", flex: 1 }}>
            {/* Trigger */}
            <div onClick={() => setOpen(!open)} style={{
                position: "relative", border: `1.5px solid ${open || isFilled ? "#F59E0B" : "#D1D5DB"}`,
                borderRadius: 4, height: 37, background: "#fff",
                cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", padding: "0 14px",
            }}>
                {/* Floating label */}
                <span style={{
                    position: "absolute", left: 12, top: open || isFilled ? -10 : "50%",
                    transform: open || isFilled ? "none" : "translateY(-50%)",
                    fontSize: open || isFilled ? 11 : 14,
                    color: open || isFilled ? "#F59E0B" : "#9CA3AF",
                    background: "#fff", padding: "0 4px",
                    transition: "all 0.15s", pointerEvents: "none", lineHeight: 1,
                }}>{label}</span>
                <span style={{ fontSize: 14, color: isFilled ? "#111827" : "transparent", marginTop: 4 }}>
                    {selected?.label || "\u200b"}
                </span>
                {isFilled && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onChange(""); }}
                        style={{
                            position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer",
                            color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "2px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                        ×
                    </button>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                     style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`, transition: "transform 0.2s", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>

            {/* Dropdown avec checkboxes */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200,
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.10)", overflow: "hidden",
                }}>
                    {/* Option "Tout" */}
                    <div onClick={() => { onChange(""); setOpen(false); }}
                         style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", cursor: "pointer", borderBottom: `1px solid #F3F4F6`, background: "transparent" }}
                         onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                         onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        {/* Checkbox checked style for "Tout" when nothing selected */}
                        <span style={{
                            width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                            border: `2px solid ${!value ? "#F59E0B" : "#D1D5DB"}`,
                            background: !value ? "#FFF7ED" : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {!value && (
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </span>
                        <span style={{ fontSize: 14, color: "#9CA3AF", fontWeight: !value ? 500 : 400 }}>Tout</span>
                    </div>

                    {options.map((opt) => {
                        const checked = value === opt.value;
                        return (
                            <div key={opt.value}
                                 onClick={() => { onChange(opt.value); setOpen(false); }}
                                 style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", cursor: "pointer", borderBottom: `1px solid #F3F4F6`, background: "transparent" }}
                                 onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                                 onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                <span style={{
                                    width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                                    border: `2px solid ${checked ? "#F59E0B" : "#D1D5DB"}`,
                                    background: checked ? "#FFF7ED" : "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {checked && (
                                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6l3 3 5-5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </span>
                                <span style={{ fontSize: 14, color: "#374151", fontWeight: checked ? 500 : 400, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                    {opt.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Menu ··· actions ─────────────────────────────────────────────────────────
function ActionMenu({ declaration, contribuable, isDraft, onModifier, onSoumis }) {
    const [open, setOpen]               = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [submitting, setSubmitting]   = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const handleTelecharger = async () => {
        setOpen(false); setDownloading(true);
        try {
            const bytes = await generateAvisPDF(declaration, contribuable);
            downloadPDF(bytes, `avis-${declaration.reference || declaration.id}.pdf`);
        } catch (e) { alert("Erreur PDF : " + e.message); }
        finally { setDownloading(false); }
    };

    const handleSoumettre = async () => {
        setOpen(false);
        if (!window.confirm(`Soumettre la déclaration ${declaration.reference} ? Elle ne pourra plus être modifiée.`)) return;
        setSubmitting(true);
        try {
            await soumettreDraft(declaration.id);
            onSoumis && onSoumis();
        } catch (e) { alert("Erreur lors de la soumission : " + e.message); }
        finally { setSubmitting(false); }
    };

    const menuItems = isDraft ? [
        { label: "Modifier",   onClick: () => { setOpen(false); onModifier && onModifier(declaration); } },
        { label: submitting ? "Soumission..." : "Soumettre", onClick: handleSoumettre, disabled: submitting },
    ] : [
        { label: downloading ? "Génération..." : "Télécharger l'avis", onClick: handleTelecharger, disabled: downloading },
    ];

    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button onClick={() => setOpen(!open)}
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#9CA3AF", fontSize: 22, letterSpacing: 2,
                        padding: "4px 8px", borderRadius: 4, lineHeight: 1,
                        display: "flex", alignItems: "center",
                    }}>
                •••
            </button>
            {open && (
                <div style={{
                    position: "absolute", right: 0, top: "100%", zIndex: 300,
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    minWidth: 200, overflow: "hidden",
                }}>
                    {menuItems.map((item) => (
                        <button key={item.label} onClick={item.onClick} disabled={item.disabled}
                                style={{
                                    display: "flex", alignItems: "center", width: "100%",
                                    padding: "13px 16px", border: "none", background: "transparent",
                                    cursor: item.disabled ? "not-allowed" : "pointer", fontSize: 13,
                                    color: item.disabled ? "#9CA3AF" : "#374151", textAlign: "left",
                                    borderBottom: `1px solid #F3F4F6`,
                                }}
                                onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = "#FFF7ED"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MesDeclarations({ setPage, onModifierDraft }) {
    const [avis,         setAvis]         = useState([]);
    const [contribuable, setContribuable] = useState({});
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);

    const [filtreRef,    setFiltreRef]    = useState("");
    const [filtreAnnee,  setFiltreAnnee]  = useState("");
    const [filtreStatut, setFiltreStatut] = useState("");

    // Valeurs "en attente" — appliquées uniquement au clic sur Rechercher
    const [pendingAnnee,  setPendingAnnee]  = useState("");
    const [pendingStatut, setPendingStatut] = useState("");

    const [rechercheOpen, setRechercheOpen] = useState(false);

    const [sortConfig,   setSortConfig]   = useState(null); // { key, dir }
    const [hiddenCols,   setHiddenCols]   = useState([]);

    const [rowsPerPage,  setRowsPerPage]  = useState(10);
    const [currentPage,  setCurrentPage]  = useState(1);

    const charger = () => {
        setLoading(true);
        return Promise.all([
            getDeclarations(CURRENT_USER_ID),
            getContribuable(CURRENT_USER_ID).catch(() => ({})),
        ])
            .then(([decls, contrib]) => { setAvis(decls); setContribuable(contrib); })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { charger(); }, []); // eslint-disable-line

    const filtered = avis.filter((a) => {
        if (filtreRef    && !a.reference?.toLowerCase().includes(filtreRef.toLowerCase())) return false;
        if (filtreAnnee  && String(a.annee) !== filtreAnnee)                               return false;
        if (filtreStatut && a.statut?.toUpperCase() !== filtreStatut)                      return false;
        return true;
    });

    const sorted = sortConfig ? [...filtered].sort((a, b) => {
        const val = (item) => {
            if (sortConfig.key === "reference")       return item.reference || "";
            if (sortConfig.key === "annee")           return item.annee || 0;
            if (sortConfig.key === "structureFiscale") return item.structureFiscale || "";
            if (sortConfig.key === "statut")          return item.statut || "";
            if (sortConfig.key === "montantBrut")     return item.montantBrut || 0;
            if (sortConfig.key === "date")            return item.date || "";
            return "";
        };
        const va = val(a), vb = val(b);
        if (va < vb) return sortConfig.dir === "asc" ? -1 : 1;
        if (va > vb) return sortConfig.dir === "asc" ? 1 : -1;
        return 0;
    }) : filtered;

    const handleSort = (key, dir) => setSortConfig({ key, dir });
    const handleHide = (key) => setHiddenCols(prev => [...prev, key]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
    const paginated  = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) + " " +
        new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        : "--";

    const ANNEE_OPTIONS = [...new Set(avis.map(a => String(a.annee)).filter(Boolean))].sort().reverse().map(v => ({ value: v, label: v }));

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column", padding: "24px 24px" }}>

            {/* ── En-tête ── */}
            <div style={{ background: "#fff", borderRadius: 8, padding: "18px 24px", marginBottom: 16, border: `1px solid #E5E7EB` }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#111827" }}>Liste des Déclarations</h1>
            </div>

            {/* ── Recherche avancée ── */}
            <div style={{ background: "#fff", borderRadius: 0, border: `1px solid #E5E7EB`, marginBottom: 16 }}>
                <button onClick={() => setRechercheOpen(!rechercheOpen)}
                        style={{
                            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
                            fontSize: 15, color: "#374151", fontWeight: 500,
                        }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        Recherche avancée
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                         style={{ transform: rechercheOpen ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>

                {rechercheOpen && (
                    <div style={{ padding: "0 24px 20px", display: "flex", gap: 12, alignItems: "center" }}>
                        {/* Exercice */}
                        <ExerciceSelect
                            label="Exercice"
                            value={pendingAnnee}
                            onChange={(v) => setPendingAnnee(v)}
                            options={ANNEE_OPTIONS}
                        />

                        {/* Statut */}
                        <StatutSelect
                            label="Statut"
                            value={pendingStatut}
                            onChange={(v) => setPendingStatut(v)}
                            options={STATUT_OPTIONS}
                        />

                        {/* Bouton Rechercher */}
                        <button
                            onClick={() => { setFiltreAnnee(pendingAnnee); setFiltreStatut(pendingStatut); setCurrentPage(1); }}
                            style={{
                                flex: 1,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                background: "#fff", color: "#F59E0B",
                                border: `1.5px solid #F59E0B`, borderRadius: 6,
                                padding: "0 24px", height: 37, fontSize: 14,
                                fontWeight: 600, cursor: "pointer",
                                letterSpacing: "0.05em",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#FFF7ED"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            RECHERCHER
                        </button>
                    </div>
                )}
            </div>

            {/* Compteur */}
            <div style={{
                padding: "12px 24px", textAlign: "right",
                fontSize: 13, color: "black"
            }}>
                showing {paginated.length} of {sorted.length} rows
            </div>

            {/* ── Tableau ── */}
            <div style={{ background: "#fff", borderRadius: 0, border: `1px solid #E5E7EB`, overflow: "hidden" }}>

                {loading ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>Chargement...</div>
                ) : error ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#B91C1C", fontSize: 13 }}>[!] {error}</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                            <thead>
                            <tr style={{ borderBottom: `1px solid #E5E7EB` }}>
                                <ColHeader label="Référence de déclaration" colKey="reference"       sortConfig={sortConfig} onSort={handleSort} hiddenCols={hiddenCols} onHide={handleHide} />
                                <ColHeader label="Année fiscale"            colKey="annee"           sortConfig={sortConfig} onSort={handleSort} hiddenCols={hiddenCols} onHide={handleHide} />
                                <ColHeader label="Structure Fiscale"        colKey="structureFiscale" sortConfig={sortConfig} onSort={handleSort} hiddenCols={hiddenCols} onHide={handleHide} />
                                <ColHeader label="Statut"                   colKey="statut"          sortConfig={sortConfig} onSort={handleSort} hiddenCols={hiddenCols} onHide={handleHide} />
                                <ColHeader label="Montant à payer"          colKey="montantBrut"     sortConfig={sortConfig} onSort={handleSort} hiddenCols={hiddenCols} onHide={handleHide} align="right" />
                                <ColHeader label="Date de soumission"       colKey="date"            sortConfig={sortConfig} onSort={handleSort} hiddenCols={hiddenCols} onHide={handleHide} />
                                <th style={{ ...thS, textAlign: "center", padding: "13px 16px" }}>***</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: "60px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                                        Aucune déclaration trouvée.
                                    </td>
                                </tr>
                            ) : paginated.map((a) => {
                                const isDraft = a.statut?.toUpperCase() === "DRAFT";
                                return (
                                    <tr key={a.id}
                                        style={{ borderBottom: `1px solid #F3F4F6`, transition: "background 0.1s" }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                        <td style={{ ...tdS, fontFamily: "monospace", fontSize: 13, color: "#111827", fontWeight: 500, display: hiddenCols.includes("reference") ? "none" : undefined }}>
                                            {a.reference || "—"}
                                        </td>
                                        <td style={{ ...tdS, display: hiddenCols.includes("annee") ? "none" : undefined }}>{a.annee || "—"}</td>
                                        <td style={{ ...tdS, display: hiddenCols.includes("structureFiscale") ? "none" : undefined }}>{a.structureFiscale || "CDI YAOUNDE 1"}</td>
                                        <td style={{ ...tdS, display: hiddenCols.includes("statut") ? "none" : undefined }}><StatutBadge statut={a.statut} /></td>
                                        <td style={{ ...tdS, textAlign: "right", fontVariantNumeric: "tabular-nums", display: hiddenCols.includes("montantBrut") ? "none" : undefined }}>
                                            {a.montantBrut > 0 ? Number(a.montantBrut).toLocaleString("fr-FR") : "0"}
                                        </td>
                                        <td style={{ ...tdS, color: "#6B7280", display: hiddenCols.includes("date") ? "none" : undefined }}>
                                            {isDraft ? "--" : fmtDate(a.date)}
                                        </td>
                                        <td style={{ ...tdS, textAlign: "center" }}>
                                            <ActionMenu
                                                declaration={a}
                                                contribuable={contribuable}
                                                isDraft={isDraft}
                                                onModifier={(decl) => onModifierDraft && onModifierDraft(decl)}
                                                onSoumis={() => charger()}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination ── */}
                <div style={{
                    display: "flex", justifyContent: "flex-end", alignItems: "center",
                    padding: "12px 16px", borderTop: `1px solid #E5E7EB`,
                    background: "#fff", gap: 24,
                }}>
                    {/* Rows per page */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
                        <span style={{ whiteSpace: "nowrap" }}>Rows per page:</span>
                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                            <select value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    style={{
                                        appearance: "none", border: "none", background: "transparent",
                                        fontSize: 13, color: "#374151", cursor: "pointer",
                                        outline: "none", paddingRight: 18, fontWeight: 400,
                                    }}>
                                {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"
                                 style={{ position: "absolute", right: 0, pointerEvents: "none" }}>
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </div>
                    </div>

                    {/* Range info */}
                    <span style={{ fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>
                        {sorted.length === 0 ? "0" : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sorted.length)} of {sorted.length}
                    </span>

                    {/* Nav buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                style={{
                                    width: 28, height: 28, borderRadius: 4, border: "none",
                                    background: "none", cursor: currentPage === 1 ? "default" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: currentPage === 1 ? "#D1D5DB" : "#374151",
                                }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                style={{
                                    width: 28, height: 28, borderRadius: 4, border: "none",
                                    background: "none", cursor: currentPage === totalPages ? "default" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: currentPage === totalPages ? "#D1D5DB" : "#374151",
                                }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 18l6-6-6-6"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}