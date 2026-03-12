"use client";

import { useState, useRef, useEffect } from "react";
import C from "../lib/utils/colors";
import { getAMRs, CURRENT_USER_ID } from "../lib/api/contribuableApi";
import { ChevDown, ChevUp } from "../components/ui/Icons";

// ─── Colonnes ─────────────────────────────────────────────────────────────
const COLUMNS_MISE_EN_DEMEURE = [
    { key: "anneeFiscale",     label: "Année fiscale"       },
    { key: "reference",        label: "Réf. AMR"            },
    { key: "numeroAMR",        label: "N° AMR"              },
    { key: "statut",           label: "Statut"              },
    { key: "motif",            label: "Motif"               },
    { key: "montantInitial",   label: "Montant initial"     },
    { key: "montantTotal",     label: "Montant total"       },
    { key: "dateEmission",     label: "Date d'émission"     },
];

const COLUMNS_AMR_VALIDEES = [
    { key: "anneeFiscale",     label: "Année fiscale"       },
    { key: "reference",        label: "Réf. AMR"            },
    { key: "numeroAMR",        label: "N° AMR"              },
    { key: "statut",           label: "Statut"              },
    { key: "motif",            label: "Motif"               },
    { key: "montantInitial",   label: "Montant initial"     },
    { key: "montantMajorations", label: "Majorations (10%)" },
    { key: "montantTotal",     label: "Montant total"       },
    { key: "dateEmission",     label: "Date d'émission"     },
];

const EXERCICE_OPTIONS = [
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
    { value: "2023", label: "2023" },
    { value: "2022", label: "2022" },
];

const STATUT_OPTIONS_MISE = [
    { value: "EN_COURS",  label: "EN COURS"  },
    { value: "CLOTUREE",  label: "CLÔTURÉE"  },
    { value: "ANNULEE",   label: "ANNULÉE"   },
    { value: "CONTESTE",  label: "CONTESTÉ"  },
];

const STATUT_OPTIONS_AMR = [
    { value: "VALIDEE",   label: "VALIDÉE"   },
    { value: "REJETEE",   label: "REJETÉE"   },
    { value: "EN_COURS",  label: "EN COURS"  },
    { value: "APURE",     label: "APURÉ"     },
];

const ROWS_OPTIONS = [10, 25, 50];

// ─── Helpers ──────────────────────────────────────────────────────────────
const formatMontant = (v) =>
    v != null ? `${Number(v).toLocaleString("fr-FR")} FCFA` : "—";

// ─── Styles communs tableau (identiques à MesDeclarations) ────────────────
const thS = {
    padding: "0", textAlign: "left", fontSize: 13,
    fontWeight: 500, color: "#6B7280", borderBottom: `1px solid #E5E7EB`,
    whiteSpace: "nowrap", background: "#fff", position: "relative",
};
const tdS = { padding: "18px 20px", fontSize: 14, color: "#111827", verticalAlign: "middle" };

// ─── ColHeader avec menu tri/filtre (identique à MesDeclarations) ─────────
function ColHeader({ label, colKey, sortConfig, onSort, hiddenCols, onHide }) {
    const [open, setOpen]   = useState(false);
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

    const menuItems = [
        {
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
            label: "Sort by ASC",
            onClick: () => { onSort(colKey, "asc"); setOpen(false); },
        },
        {
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>,
            label: "Sort by DESC",
            onClick: () => { onSort(colKey, "desc"); setOpen(false); },
        },
        { divider: true },
        {
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
            label: "Filter",
            onClick: () => setOpen(false),
        },
        { divider: true },
        {
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
            label: "Hide column",
            onClick: () => { onHide(colKey); setOpen(false); },
        },
        {
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
            label: "Manage columns",
            onClick: () => setOpen(false),
        },
    ];

    return (
        <th style={thS}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "13px 12px 13px 20px" }}>
                <span>{label}</span>
                {isActive && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5">
                        {isAsc ? <path d="M12 19V5M5 12l7-7 7 7"/> : <path d="M12 5v14M5 12l7 7 7-7"/>}
                    </svg>
                )}
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
                        }}>⋮</button>
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

// ─── Badge statut AMR ─────────────────────────────────────────────────────
function Badge({ statut }) {
    const map = {
        EN_COURS:  { label: "EN COURS",  bg: "#FEF3C7", color: "#D97706" },
        CLOTUREE:  { label: "CLÔTURÉE",  bg: "#DCFCE7", color: "#16A34A" },
        ANNULEE:   { label: "ANNULÉE",   bg: "#FEE2E2", color: "#DC2626" },
        VALIDEE:   { label: "VALIDÉE",   bg: "#DCFCE7", color: "#16A34A" },
        REJETEE:   { label: "REJETÉE",   bg: "#FEE2E2", color: "#DC2626" },
        APURE:     { label: "APURÉ",     bg: "#DBEAFE", color: "#1D4ED8" },
        CONTESTO:  { label: "CONTESTÉ",  bg: "#FFF7ED", color: "#C2410C" },
        CONTESTE:  { label: "CONTESTÉ",  bg: "#FFF7ED", color: "#C2410C" },
    };
    const s = map[statut?.toUpperCase()] ?? { label: statut?.toUpperCase() ?? "—", bg: "#F3F4F6", color: "#6B7280" };
    return (
        <span style={{
            background: s.bg, color: s.color,
            padding: "5px 16px", borderRadius: 999,
            fontSize: 12, fontWeight: 700, display: "inline-block",
            textTransform: "uppercase", letterSpacing: "0.05em",
        }}>{s.label}</span>
    );
}

// ─── ExerciceSelect — identique à MesDeclarations ─────────────────────────
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
            <div onClick={() => setOpen(!open)} style={{
                position: "relative", border: `1.5px solid ${open || isFilled ? "#F59E0B" : "#D1D5DB"}`,
                borderRadius: 4, height: 37, background: "#fff",
                cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", padding: "0 14px",
            }}>
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
                    <button onClick={(e) => { e.stopPropagation(); onChange(""); }}
                            style={{ position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "2px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                     style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`, transition: "transform 0.2s", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200,
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.10)", overflow: "hidden",
                }}>
                    {options.map((opt) => (
                        <div key={opt.value}
                             onClick={() => { onChange(opt.value); setOpen(false); }}
                             style={{ padding: "13px 16px", fontSize: 14, cursor: "pointer", color: "#374151", fontWeight: 400, borderBottom: `1px solid #F3F4F6`, background: "transparent" }}
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

// ─── StatutSelect — identique à MesDeclarations ───────────────────────────
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
            <div onClick={() => setOpen(!open)} style={{
                position: "relative", border: `1.5px solid ${open || isFilled ? "#F59E0B" : "#D1D5DB"}`,
                borderRadius: 4, height: 37, background: "#fff",
                cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", padding: "0 14px",
            }}>
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
                    <button onClick={(e) => { e.stopPropagation(); onChange(""); }}
                            style={{ position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "2px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                     style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`, transition: "transform 0.2s", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200,
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.10)", overflow: "hidden",
                }}>
                    <div onClick={() => { onChange(""); setOpen(false); }}
                         style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", cursor: "pointer", borderBottom: `1px solid #F3F4F6`, background: "transparent" }}
                         onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                         onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <span style={{ width: 18, height: 18, borderRadius: 3, flexShrink: 0, border: `2px solid ${!value ? "#F59E0B" : "#D1D5DB"}`, background: !value ? "#FFF7ED" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {!value && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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
                                <span style={{ width: 18, height: 18, borderRadius: 3, flexShrink: 0, border: `2px solid ${checked ? "#F59E0B" : "#D1D5DB"}`, background: checked ? "#FFF7ED" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {checked && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
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

// ─── Onglet tableau ───────────────────────────────────────────────────────
function OngletTable({ allColumns, statutOptions, statutFiltreMise }) {
    const [rechercheOpen, setRechercheOpen] = useState(false);
    const [pendingAnnee,  setPendingAnnee]  = useState("");
    const [pendingStatut, setPendingStatut] = useState("");
    const [filtreAnnee,   setFiltreAnnee]   = useState("");
    const [filtreStatut,  setFiltreStatut]  = useState("");
    const [sortConfig,    setSortConfig]    = useState(null);
    const [hiddenCols,    setHiddenCols]    = useState([]);
    const [rowsPerPage,   setRowsPerPage]   = useState(10);
    const [currentPage,   setCurrentPage]   = useState(1);
    const [sourceData,    setSourceData]    = useState([]);
    const [loading,       setLoading]       = useState(true);

    useEffect(() => {
        setLoading(true);
        getAMRs({ id_contribuable: CURRENT_USER_ID })
            .then((data) => {
                const filtered = statutFiltreMise
                    ? data.filter(a => ["EN_COURS", "CLOTUREE", "ANNULEE", "CONTESTE"].includes(a.statut?.toUpperCase()))
                    : data.filter(a => ["VALIDEE", "REJETEE", "APURE"].includes(a.statut?.toUpperCase()));
                setSourceData(filtered);
            })
            .catch(() => setSourceData([]))
            .finally(() => setLoading(false));
    }, [statutFiltreMise]);

    const handleSort = (key, dir) => setSortConfig({ key, dir });
    const handleHide = (key) => setHiddenCols(prev => [...prev, key]);

    const filtered = sourceData.filter((a) => {
        if (filtreAnnee  && String(a.anneeFiscale) !== filtreAnnee) return false;
        if (filtreStatut && a.statut?.toUpperCase() !== filtreStatut) return false;
        return true;
    });

    const sorted = sortConfig ? [...filtered].sort((a, b) => {
        const va = a[sortConfig.key] ?? ""; const vb = b[sortConfig.key] ?? "";
        return sortConfig.dir === "asc"
            ? String(va).localeCompare(String(vb))
            : String(vb).localeCompare(String(va));
    }) : filtered;

    const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
    const paginated  = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const getCellValue = (col, row) => {
        switch (col.key) {
            case "statut":          return <Badge statut={row.statut} />;
            case "dateEmission":    return row.dateEmission ? new Date(row.dateEmission).toLocaleDateString("fr-FR") : "—";
            case "montantInitial":  return formatMontant(row.montantInitial);
            case "montantMajorations": return formatMontant(row.montantMajorations);
            case "montantTotal":    return <span style={{ fontWeight: 600, color: "#F59E0B" }}>{formatMontant(row.montantTotal)}</span>;
            case "reference":
            case "numeroAMR":       return <span style={{ fontFamily: "monospace", color: "#F59E0B", fontWeight: 600 }}>{row[col.key] ?? "—"}</span>;
            default:                return row[col.key] ?? "—";
        }
    };

    const visibleColumns = allColumns.filter(c => !hiddenCols.includes(c.key));

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column", padding: "0 24px" }}>

            {/* ── Recherche avancée — identique MesDeclarations ── */}
            <div style={{ background: "#fff", borderRadius: 0, border: `1px solid #E5E7EB`, marginBottom: 16 }}>
                <button onClick={() => setRechercheOpen(!rechercheOpen)}
                        style={{
                            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
                            fontSize: 15, color: "#374151", fontWeight: 500,
                        }}>
                    <span>Recherche avancée</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                         style={{ transform: rechercheOpen ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>

                {rechercheOpen && (
                    <div style={{ padding: "0 24px 20px", display: "flex", gap: 12, alignItems: "center" }}>
                        <ExerciceSelect
                            label="Exercice"
                            value={pendingAnnee}
                            onChange={setPendingAnnee}
                            options={EXERCICE_OPTIONS}
                        />
                        <StatutSelect
                            label="Statut"
                            value={pendingStatut}
                            onChange={setPendingStatut}
                            options={statutOptions}
                        />
                        <button
                            onClick={() => { setFiltreAnnee(pendingAnnee); setFiltreStatut(pendingStatut); setCurrentPage(1); }}
                            style={{
                                flex: 1,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                background: "#fff", color: "#F59E0B",
                                border: `1.5px solid #F59E0B`, borderRadius: 6,
                                padding: "0 24px", height: 37, fontSize: 14,
                                fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em",
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
            <div style={{ padding: "12px 24px", textAlign: "right", fontSize: 13, color: "black" }}>
                showing {paginated.length} of {sorted.length} rows
            </div>

            {/* ── Tableau — identique MesDeclarations ── */}
            <div style={{ background: "#fff", borderRadius: 0, border: `1px solid #E5E7EB`, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>Chargement...</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                            <thead>
                            <tr style={{ borderBottom: `1px solid #E5E7EB` }}>
                                {visibleColumns.map(col => (
                                    <ColHeader
                                        key={col.key}
                                        label={col.label}
                                        colKey={col.key}
                                        sortConfig={sortConfig}
                                        onSort={handleSort}
                                        hiddenCols={hiddenCols}
                                        onHide={handleHide}
                                    />
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={visibleColumns.length} style={{ padding: "60px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                                        Aucun AMR ne correspond aux critères sélectionnés.
                                    </td>
                                </tr>
                            ) : paginated.map((row, i) => (
                                <tr key={row.id ?? i}
                                    style={{ borderBottom: `1px solid #F3F4F6`, transition: "background 0.1s" }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                    {visibleColumns.map(col => (
                                        <td key={col.key} style={tdS}>
                                            {getCellValue(col, row)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
                        <span style={{ whiteSpace: "nowrap" }}>Rows per page:</span>
                        <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                            <select value={rowsPerPage}
                                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    style={{ appearance: "none", border: "none", background: "transparent", fontSize: 13, color: "#374151", cursor: "pointer", outline: "none", paddingRight: 18, fontWeight: 400 }}>
                                {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"
                                 style={{ position: "absolute", right: 0, pointerEvents: "none" }}>
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </div>
                    </div>
                    <span style={{ fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>
                        {sorted.length === 0 ? "0" : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, sorted.length)} of {sorted.length}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                style={{ width: 28, height: 28, borderRadius: 4, border: "none", background: "none", cursor: currentPage === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: currentPage === 1 ? "#D1D5DB" : "#374151" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                        </button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                style={{ width: 28, height: 28, borderRadius: 4, border: "none", background: "none", cursor: currentPage === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: currentPage === totalPages ? "#D1D5DB" : "#374151" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function PageListeDesAMRs() {
    const [ongletActif, setOngletActif] = useState("mise_en_demeure");

    const onglets = [
        { key: "mise_en_demeure", label: "Mise en demeure" },
        { key: "amr_validees",    label: "AMR validées"    },
    ];

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column" }}>

            {/* ── Titre ── */}
            <div style={{ background: "#fff", marginTop: "20px", marginLeft: "18px", width: "96%", padding: "20px 16px", borderBottom: `1px solid #E5E7EB`, borderRadius: "5px", height: "60px" }}>
                <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: "#111827", padding: "0px 0px" }}>Liste des AMRs</h1>
            </div>

            {/* ── Onglets ── */}
            <div style={{ background: "#fff", borderBottom: `1px solid #E5E7EB`, display: "flex", gap: 0, padding: "0 28px", width: "96%", marginLeft: "18px" }}>
                {onglets.map((o) => {
                    const actif = ongletActif === o.key;
                    return (
                        <button
                            key={o.key}
                            onClick={() => setOngletActif(o.key)}
                            style={{
                                padding: "14px 24px", border: "none", background: "none",
                                cursor: "pointer", fontSize: 14, fontWeight: actif ? 600 : 400,
                                color: actif ? "#111827" : "#6B7280",
                                borderBottom: actif ? `2px solid #F59E0B` : "2px solid transparent",
                                marginBottom: -1, transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { if (!actif) e.currentTarget.style.color = "#111827"; }}
                            onMouseLeave={(e) => { if (!actif) e.currentTarget.style.color = "#6B7280"; }}
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Contenu ── */}
            <div style={{ padding: "25px 0 40px" }}>
                {ongletActif === "mise_en_demeure" && (
                    <OngletTable
                        key="mise_en_demeure"
                        allColumns={COLUMNS_MISE_EN_DEMEURE}
                        statutOptions={STATUT_OPTIONS_MISE}
                        statutFiltreMise={true}
                    />
                )}
                {ongletActif === "amr_validees" && (
                    <OngletTable
                        key="amr_validees"
                        allColumns={COLUMNS_AMR_VALIDEES}
                        statutOptions={STATUT_OPTIONS_AMR}
                        statutFiltreMise={false}
                    />
                )}
            </div>
        </main>
    );
}