"use client";

import { useState, useRef, useEffect } from "react";
import C from "../lib/utils/colors";
import { getPaiements } from "../lib/api/PaiementsApi";
import { ChevDown, ChevUp } from "../components/ui/Icons";

// ─── Options filtres ──────────────────────────────────────────────────────
const STATUT_OPTIONS = [
    { value: "IN_PROGRESS", label: "PAIEMENT INITIE" },
    { value: "SUCCESS",     label: "ABOUTI"           },
    { value: "FAILED",      label: "ECHOUE"           },
    { value: "PENDING",     label: "EN ATTENTE"       },
    { value: "PAID",        label: "PAYE"             },
    { value: "REJECTED",    label: "REJETE"           },
    { value: "PARTIAL",     label: "PARTIEL"          },
];

const EXERCICE_OPTIONS = ["2025", "2024", "2023", "2022"];

const STATUT_MAP = {
    en_attente: "PENDING",
    paye:       "PAID",
    rejete:     "REJECTED",
    partiel:    "PARTIAL",
};

// ─── Colonnes ─────────────────────────────────────────────────────────────
const BASE_COLUMNS = [
    { key: "anneeFiscale",         label: "Année fiscale"            },
    { key: "structureFiscale",     label: "Structure Fiscale"        },
    { key: "referenceDeclaration", label: "Référence de déclaration" },
    { key: "referencePaiement",    label: "Référence paiement"       },
    { key: "statutPaiement",       label: "Statut du paiement"       },
    { key: "montantAPayer",        label: "Montant à payer"          },
    { key: "montantPaye",          label: "Montant payé"             },
    { key: "payeLe",               label: "Payé le"                  },
];

const ROWS_OPTIONS = [10, 25, 50];

// ─── Styles communs tableau ───────────────────────────────────────────────
const thS = {
    padding: "0", textAlign: "left", fontSize: 13,
    fontWeight: 500, color: "#6B7280", borderBottom: `1px solid #E5E7EB`,
    whiteSpace: "nowrap", background: "#fff", position: "relative",
};
const tdS = {
    padding: "18px 20px", fontSize: 14, color: "#111827",
    verticalAlign: "middle", whiteSpace: "nowrap",
};

// ─── Checkbox orange ──────────────────────────────────────────────────────
function OrangeCheckbox({ checked, onChange }) {
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

// ─── Select Exercice — label flottant + options "EXERCICE YYYY" ───────────
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
                            style={{
                                position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer",
                                color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "2px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>×</button>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                     style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`, transition: "transform 0.2s", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden",
                }}>
                    {options.map((opt) => (
                        <div key={opt.value ?? opt}
                             onClick={() => { onChange(opt.value ?? opt); setOpen(false); }}
                             style={{
                                 padding: "13px 16px", fontSize: 14, cursor: "pointer",
                                 color: "#374151", fontWeight: 400,
                                 borderBottom: `1px solid #F3F4F6`, background: "transparent",
                             }}
                             onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                             onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            EXERCICE {opt.value ?? opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Select Statut — label flottant + checkboxes ──────────────────────────
function StatutSelect({ label, value, onChange, options }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const isFilled = value && value.length > 0;

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
                <span style={{
                    fontSize: 14, color: isFilled ? "#111827" : "transparent",
                    marginTop: 4,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: "calc(100% - 40px)",
                }}>
                    {isFilled ? value : "\u200b"}
                </span>
                {isFilled && (
                    <button onClick={(e) => { e.stopPropagation(); onChange([]); }}
                            style={{
                                position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)",
                                background: "none", border: "none", cursor: "pointer",
                                color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "2px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>×</button>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                     style={{ position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`, transition: "transform 0.2s", pointerEvents: "none" }}>
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
                    background: "#fff", border: `1px solid #E5E7EB`,
                    borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden",
                }}>
                    {/* Tout */}
                    <div onClick={() => onChange([])}
                         style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", cursor: "pointer", borderBottom: `1px solid #F3F4F6`, background: "transparent" }}
                         onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                         onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <span style={{
                            width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                            border: `2px solid ${!isFilled ? "#F59E0B" : "#D1D5DB"}`,
                            background: !isFilled ? "#FFF7ED" : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {!isFilled && (
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </span>
                        <span style={{ fontSize: 14, color: "#9CA3AF", fontWeight: !isFilled ? 500 : 400 }}>Tout</span>
                    </div>
                    {options.map((opt) => {
                        const checked = Array.isArray(value) && value.length === 1 && value[0] === opt.value;
                        return (
                            <div key={opt.value}
                                 onClick={() => { onChange([opt.value]); setOpen(false); }}
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

// ─── Badge statut paiement ────────────────────────────────────────────────
function Badge({ statut }) {
    const map = {
        "IN_PROGRESS":   { label: "PAIEMENT INITIE",  bg: "#FEF3C7", color: "#D97706" },
        "SUCCESS":       { label: "ABOUTI",            bg: "#DCFCE7", color: "#16A34A" },
        "FAILED":        { label: "ECHOUE",            bg: "#FEE2E2", color: "#DC2626" },
        "PAID":          { label: "PAYE",              bg: "#DCFCE7", color: "#16A34A" },
        "PENDING":       { label: "EN ATTENTE",        bg: "#FEF9C3", color: "#92400E" },
        "REJECTED":      { label: "REJETE",            bg: "#FEE2E2", color: "#DC2626" },
        "PARTIAL":       { label: "PARTIEL",           bg: "#DBEAFE", color: "#1D4ED8" },
        "paye":          { label: "PAYE",              bg: "#DCFCE7", color: "#16A34A" },
        "en_attente":    { label: "EN ATTENTE",        bg: "#FEF9C3", color: "#92400E" },
        "partiel":       { label: "PARTIEL",           bg: "#DBEAFE", color: "#1D4ED8" },
        "rejete":        { label: "REJETE",            bg: "#FEE2E2", color: "#DC2626" },
        "EFFECTUE":      { label: "EFFECTUE",          bg: "#DCFCE7", color: "#16A34A" },
        "INITIE":        { label: "PAIEMENT INITIE",   bg: "#FEF3C7", color: "#D97706" },
    };
    const s = map[statut] ?? { label: statut?.toUpperCase() ?? "—", bg: "#F3F4F6", color: "#6B7280" };
    return (
        <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 999,
            background: s.bg, color: s.color, display: "inline-block",
            textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
            {s.label}
        </span>
    );
}

// ─── Icônes SVG ───────────────────────────────────────────────────────────
const IcoUp     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
const IcoDown   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;
const IcoFilter = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
const IcoHide   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
const IcoCols   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>;

// ─── Menu contextuel de colonne ───────────────────────────────────────────
function ColumnMenu({ colKey, onSort, onHide, onManage, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [onClose]);

    const item = (onClick, icon, label) => (
        <button onClick={onClick}
                style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "11px 16px", border: "none", background: "transparent",
                    cursor: "pointer", fontSize: 13, color: "#374151", textAlign: "left",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <span style={{ color: "#9CA3AF", display: "flex" }}>{icon}</span>
            {label}
        </button>
    );

    return (
        <div ref={ref} style={{
            position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 400,
            background: "#fff", border: `1px solid #E5E7EB`,
            borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.13)", minWidth: 200, overflow: "hidden",
        }}>
            {item(() => { onSort(colKey, "asc");  onClose(); }, <IcoUp />,     "Sort by ASC"    )}
            {item(() => { onSort(colKey, "desc"); onClose(); }, <IcoDown />,   "Sort by DESC"   )}
            <div style={{ height: 1, background: "#F3F4F6", margin: "2px 0" }} />
            {item(() => onClose(),                              <IcoFilter />, "Filter"         )}
            <div style={{ height: 1, background: "#F3F4F6", margin: "2px 0" }} />
            {item(() => { onHide(colKey); onClose(); },         <IcoHide />,   "Hide column"    )}
            {item(() => { onManage(); onClose(); },             <IcoCols />,   "Manage columns" )}
        </div>
    );
}

// ─── Modal Manage Columns ─────────────────────────────────────────────────
function ManageColumnsModal({ allColumns, hiddenCols, onToggle, onClose }) {
    return (
        <div onClick={onClose} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                background: "#fff", borderRadius: 10, width: 380, maxWidth: "90vw",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid #E5E7EB` }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Gérer les colonnes</span>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6B7280" }}>×</button>
                </div>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {allColumns.map((col) => (
                        <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#111827" }}>
                            <OrangeCheckbox checked={!hiddenCols.includes(col.key)} onChange={() => onToggle(col.key)} />
                            {col.label}
                        </label>
                    ))}
                </div>
                <div style={{ padding: "12px 20px", borderTop: `1px solid #E5E7EB`, display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "8px 22px", background: C.orange, color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function PageListeDesPaiements() {
    const [rechercheOuverte, setRechercheOuverte] = useState(false);
    const [exerciceSaisi,    setExerciceSaisi]    = useState("");
    const [statutsSelec,     setStatutsSelec]     = useState([]);

    // Valeurs "en attente" — appliquées uniquement au clic sur Rechercher
    const [pendingExercice,  setPendingExercice]  = useState("");
    const [pendingStatuts,   setPendingStatuts]   = useState([]);

    const [sortKey,          setSortKey]          = useState(null);
    const [sortDir,          setSortDir]          = useState("asc");
    const [hiddenCols,       setHiddenCols]       = useState([]);
    const [openMenu,         setOpenMenu]         = useState(null);
    const [manageOpen,       setManageOpen]       = useState(false);
    const [paiementsFiltres, setPaiementsFiltres] = useState([]);
    const [totalPaiements,   setTotalPaiements]   = useState(0);
    const [loading,          setLoading]          = useState(true);

    const [rowsPerPage,  setRowsPerPage]  = useState(10);
    const [currentPage,  setCurrentPage]  = useState(1);

    // ── Chargement initial depuis l'API ──
    useEffect(() => {
        setLoading(true);
        getPaiements()
            .then((data) => {
                setPaiementsFiltres(data);
                setTotalPaiements(data.length);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // ── Auto-rafraîchissement si des paiements sont IN_PROGRESS ──
    useEffect(() => {
        const hasInProgress = paiementsFiltres.some(
            (p) => p.statutPaiement === "IN_PROGRESS" || p.statut === "INITIE"
        );
        if (!hasInProgress) return;

        const interval = setInterval(async () => {
            try {
                const data = await getPaiements();
                setPaiementsFiltres(data);
                setTotalPaiements(data.length);
            } catch (e) {
                console.error("Auto-refresh erreur:", e);
            }
        }, 8000);

        return () => clearInterval(interval);
    }, [paiementsFiltres]);

    const handleSort    = (key, dir) => { setSortKey(key); setSortDir(dir); };
    const handleHide    = (key) => setHiddenCols((p) => [...p, key]);
    const toggleCol     = (key) => setHiddenCols((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);

    // ── Recherche au clic uniquement ──
    const handleRechercher = async () => {
        setExerciceSaisi(pendingExercice);
        setStatutsSelec(pendingStatuts);
        try {
            setLoading(true);
            const result = await getPaiements({
                anneeFiscale: pendingExercice ? parseInt(pendingExercice) : undefined,
                statuts:      pendingStatuts.length > 0 ? pendingStatuts : undefined,
                sortKey:      sortKey ?? undefined,
                sortDir:      sortDir,
            });
            setPaiementsFiltres(result);
        } catch (err) {
            console.error("Erreur lors de la recherche :", err);
        } finally {
            setLoading(false);
            setCurrentPage(1);
        }
    };

    const sorted = [...paiementsFiltres].sort((a, b) => {
        if (!sortKey) return 0;
        const va = a[sortKey] ?? ""; const vb = b[sortKey] ?? "";
        return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
    const paginated  = sorted.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const visibleColumns = BASE_COLUMNS.filter((c) => !hiddenCols.includes(c.key));

    const statutAffiche = pendingStatuts.length > 0 ? pendingStatuts.join(", ") : "";

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column" }}>

            {/* ── Titre ── */}
            <div style={{ background: "#fff", marginTop: "20px", marginLeft: "18px", width: "96%", padding: "20px 16px", borderBottom: `1px solid #E5E7EB`, borderRadius: "5px", height: "60px" }}>
                <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: "#111827", padding: "0px 0px" }}>Liste des Paiements</h1>
            </div>

            {/* ── Recherche avancée ── */}
            <div style={{ background: "#fff", width: "96%", marginLeft: "18px", marginTop: 15, border: `1px solid #E5E7EB`, borderRadius: 0 }}>
                <button onClick={() => setRechercheOuverte(!rechercheOuverte)}
                        style={{
                            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "18px 24px", background: "none", border: "none", cursor: "pointer",
                            fontSize: 15, color: "#374151", fontWeight: 500,
                        }}>
                    <span>Recherche avancée</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                         style={{ transform: rechercheOuverte ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </button>

                {rechercheOuverte && (
                    <div style={{ padding: "0 24px 20px", display: "flex", gap: 12, alignItems: "center" }}>

                        {/* Exercice */}
                        <ExerciceSelect
                            label="Exercice"
                            value={pendingExercice}
                            onChange={(v) => setPendingExercice(v)}
                            options={EXERCICE_OPTIONS.map(v => ({ value: v, label: v }))}
                        />

                        {/* Statut */}
                        <StatutSelect
                            label="Statut"
                            value={pendingStatuts}
                            onChange={(v) => setPendingStatuts(v)}
                            options={STATUT_OPTIONS}
                        />

                        {/* Bouton RECHERCHER */}
                        <button
                            onClick={handleRechercher}
                            style={{
                                flex: 1,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                background: "#fff", color: "#F59E0B",
                                border: `1.5px solid #F59E0B`, borderRadius: 4,
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

            {/* ── Compteur rows ── */}
            <div style={{ padding: "12px 24px", textAlign: "right", fontSize: 13, color: "black" }}>
                {loading ? "Chargement..." : (
                    <span>
                        showing {paginated.length} of {sorted.length} rows
                        {paiementsFiltres.some(p => p.statutPaiement === "IN_PROGRESS" || p.statut === "INITIE") && (
                            <span style={{ marginLeft: 12, color: "#D97706", fontWeight: 600 }}>
                                — Actualisation automatique en cours...
                            </span>
                        )}
                    </span>
                )}
            </div>

            {/* ── Tableau ── */}
            <div style={{ background: "#fff", borderRadius: 0, border: `1px solid #E5E7EB`, overflow: "hidden", width: "96%", marginLeft: "18px" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                        <thead>
                        <tr style={{ borderBottom: `1px solid #E5E7EB` }}>
                            {visibleColumns.map((col) => (
                                <th key={col.key} style={thS}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "13px 12px 13px 20px",
                                    }}
                                         onMouseEnter={(e) => { const btn = e.currentTarget.querySelector(".col-menu-btn"); if (btn) btn.style.color = "#6B7280"; }}
                                         onMouseLeave={(e) => { const btn = e.currentTarget.querySelector(".col-menu-btn"); if (btn && openMenu !== col.key) btn.style.color = "transparent"; }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            {col.label}
                                            {sortKey === col.key && (
                                                <span style={{ color: "#F59E0B" }}>
                                                    {sortDir === "asc" ? <IcoUp /> : <IcoDown />}
                                                </span>
                                            )}
                                        </span>
                                        <button
                                            className="col-menu-btn"
                                            onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === col.key ? null : col.key); }}
                                            style={{
                                                background: "none", border: "none", cursor: "pointer",
                                                padding: "2px 4px", borderRadius: 3, marginLeft: "auto",
                                                color: openMenu === col.key ? "#6B7280" : "transparent",
                                                transition: "color 0.15s",
                                                fontSize: 16, lineHeight: 1, letterSpacing: 1,
                                            }}>⋮</button>
                                    </div>
                                    {openMenu === col.key && (
                                        <ColumnMenu
                                            colKey={col.key}
                                            onSort={handleSort}
                                            onHide={handleHide}
                                            onManage={() => setManageOpen(true)}
                                            onClose={() => setOpenMenu(null)}
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={visibleColumns.length} style={{ padding: "60px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                                    Chargement des paiements...
                                </td>
                            </tr>
                        ) : paginated.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} style={{ padding: "60px 20px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                                    {exerciceSaisi
                                        ? `Aucun paiement trouvé pour l'exercice ${exerciceSaisi}.`
                                        : "Aucun paiement ne correspond aux critères sélectionnés."
                                    }
                                </td>
                            </tr>
                        ) : (
                            paginated.map((paiement, i) => (
                                <LignePaiement
                                    key={paiement.id ?? i}
                                    paiement={paiement}
                                    visibleColumns={visibleColumns}
                                    tdStyle={tdS}
                                />
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

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

            {/* ── Modal Manage Columns ── */}
            {manageOpen && (
                <ManageColumnsModal
                    allColumns={BASE_COLUMNS}
                    hiddenCols={hiddenCols}
                    onToggle={toggleCol}
                    onClose={() => setManageOpen(false)}
                />
            )}
        </main>
    );
}

// ─── Ligne du tableau ─────────────────────────────────────────────────────
function LignePaiement({ paiement, visibleColumns, tdStyle }) {
    const getCellValue = (col) => {
        switch (col.key) {
            case "statutPaiement":
                return <Badge statut={paiement.statutPaiement} />;
            case "montantAPayer":
            case "montantPaye":
                return paiement[col.key] != null
                    ? `${Number(paiement[col.key]).toLocaleString("fr-FR")} FCFA`
                    : "—";
            case "payeLe":
                if (!paiement.payeLe) return "—";
                return new Date(paiement.payeLe).toLocaleString("fr-FR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                });
            default:
                const valeur = paiement[col.key];
                if (typeof valeur === "number" && isNaN(valeur)) return "—";
                return valeur ?? "—";
        }
    };

    return (
        <tr style={{ borderBottom: `1px solid #F3F4F6`, transition: "background 0.1s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            {visibleColumns.map((col) => (
                <td key={col.key} style={tdStyle}>{getCellValue(col)}</td>
            ))}
        </tr>
    );
}