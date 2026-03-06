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

// ─── Input outlined avec label flottant ───────────────────────────────────
function OutlinedInput({ label, value, onClear, onClick, open, children }) {
    const isFilled = value && value.length > 0;
    return (
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <div
                onClick={onClick}
                style={{
                    border: `1.5px solid ${open || isFilled ? C.orange : "#9CA3AF"}`,
                    borderRadius: 4, padding: "14px 40px 6px 12px",
                    background: C.white, cursor: "pointer", minHeight: 52,
                    display: "flex", alignItems: "center",
                }}
            >
                <span style={{
                    position: "absolute", left: 10,
                    top: isFilled || open ? 4 : 16,
                    fontSize: isFilled || open ? 10 : 14,
                    color: open || isFilled ? C.orange : "#9CA3AF",
                    transition: "all 0.15s", pointerEvents: "none",
                    background: C.white, padding: "0 2px", fontFamily: "Arial, sans-serif",
                }}>
                    {label}
                </span>
                <span style={{
                    fontSize: 14, color: isFilled ? C.textDark : "transparent",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: "calc(100% - 10px)", display: "block",
                }}>
                    {value || "​"}
                </span>
            </div>
            {isFilled && (
                <button
                    onClick={(e) => { e.stopPropagation(); onClear(); }}
                    style={{
                        position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", cursor: "pointer",
                        color: "#9CA3AF", fontSize: 16, lineHeight: 1, padding: "0 2px",
                    }}
                >×</button>
            )}
            <span style={{
                position: "absolute", right: 8, top: "50%",
                transform: `translateY(-50%) ${open ? "rotate(180deg)" : ""}`,
                pointerEvents: "none", color: "#9CA3AF", fontSize: 12, transition: "transform 0.15s",
            }}>▼</span>
            {children}
        </div>
    );
}

// ─── Badge statut paiement ────────────────────────────────────────────────
function Badge({ statut }) {
    // Clés en minuscules ET en majuscules pour compatibilité backend/frontend
    const map = {
        // Statuts paiement mobile
        "IN_PROGRESS":   { label: "PAIEMENT INITIE",  bg: "#FEF3C7", color: "#D97706" },
        "SUCCESS":       { label: "ABOUTI",            bg: "#DCFCE7", color: "#16A34A" },
        "FAILED":        { label: "ECHOUE",            bg: "#FEE2E2", color: "#DC2626" },
        // Anciens statuts backend
        "PAID":          { label: "PAYE",              bg: "#DCFCE7", color: "#16A34A" },
        "PENDING":       { label: "EN ATTENTE",        bg: "#FEF9C3", color: "#92400E" },
        "REJECTED":      { label: "REJETE",            bg: "#FEE2E2", color: "#DC2626" },
        "PARTIAL":       { label: "PARTIEL",           bg: "#DBEAFE", color: "#1D4ED8" },
        // Formes FR (legacy)
        "paye":          { label: "PAYE",              bg: "#DCFCE7", color: "#16A34A" },
        "en_attente":    { label: "EN ATTENTE",        bg: "#FEF9C3", color: "#92400E" },
        "partiel":       { label: "PARTIEL",           bg: "#DBEAFE", color: "#1D4ED8" },
        "rejete":        { label: "REJETE",            bg: "#FEE2E2", color: "#DC2626" },
        // Backend legacy
        "EFFECTUE":      { label: "EFFECTUE",          bg: "#DCFCE7", color: "#16A34A" },
        "INITIE":        { label: "PAIEMENT INITIE",   bg: "#FEF3C7", color: "#D97706" },
    };
    const s = map[statut] ?? { label: statut?.toUpperCase() ?? "—", bg: "#F3F4F6", color: "#6B7280" };
    return (
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12, background: s.bg, color: s.color }}>
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
        <button
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 16px", border: "none", background: "transparent",
                cursor: "pointer", fontSize: 13, color: C.textDark, textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.orangeBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
            {icon} {label}
        </button>
    );

    return (
        <div ref={ref} style={{
            position: "absolute", top: "calc(100% + 2px)", left: 0, zIndex: 999,
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 200, overflow: "hidden",
        }}>
            {item(() => { onSort(colKey, "asc");  onClose(); }, <IcoUp />,     "Sort by ASC"    )}
            {item(() => { onSort(colKey, "desc"); onClose(); }, <IcoDown />,   "Sort by DESC"   )}
            <div style={{ borderTop: `1px solid #F3F4F6`, margin: "4px 0" }} />
            {item(() => onClose(),                              <IcoFilter />, "Filter"         )}
            <div style={{ borderTop: `1px solid #F3F4F6`, margin: "4px 0" }} />
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
                background: C.white, borderRadius: 10, width: 380, maxWidth: "90vw",
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: C.textDark }}>Gérer les colonnes</span>
                    <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textGrey }}>X</button>
                </div>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {allColumns.map((col) => (
                        <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: C.textDark }}>
                            <OrangeCheckbox checked={!hiddenCols.includes(col.key)} onChange={() => onToggle(col.key)} />
                            {col.label}
                        </label>
                    ))}
                </div>
                <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "8px 22px", background: C.orange, color: C.white, border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}>
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
    const [exerciceOpen,     setExerciceOpen]     = useState(false);
    const [statutOpen,       setStatutOpen]       = useState(false);
    const [statutsSelec,     setStatutsSelec]     = useState([]);
    const [sortKey,          setSortKey]          = useState(null);
    const [sortDir,          setSortDir]          = useState("asc");
    const [hiddenCols,       setHiddenCols]       = useState([]);
    const [openMenu,         setOpenMenu]         = useState(null);
    const [manageOpen,       setManageOpen]       = useState(false);
    const [paiementsFiltres, setPaiementsFiltres] = useState([]);
    const [totalPaiements,   setTotalPaiements]   = useState(0);
    const [loading,          setLoading]          = useState(true);

    const exerciceRef = useRef(null);
    const statutRef   = useRef(null);

    // ── Fermer les dropdowns au clic extérieur ──
    useEffect(() => {
        const h = (e) => {
            if (exerciceRef.current && !exerciceRef.current.contains(e.target)) setExerciceOpen(false);
            if (statutRef.current   && !statutRef.current.contains(e.target))   setStatutOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

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
    // La liste se met à jour toutes les 8s tant qu'un paiement est en cours
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

    const toggleStatut  = (val) => setStatutsSelec((p) => p.includes(val) ? p.filter((s) => s !== val) : [...p, val]);
    const toggleTout    = () => setStatutsSelec([]);
    const statutAffiche = statutsSelec.length > 0 ? statutsSelec.join(", ") : "";
    const handleSort    = (key, dir) => { setSortKey(key); setSortDir(dir); };
    const handleHide    = (key) => setHiddenCols((p) => [...p, key]);
    const toggleCol     = (key) => setHiddenCols((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);

    // ── Recherche avec filtres ──
    const handleRechercher = async () => {
        try {
            setLoading(true);
            const result = await getPaiements({
                anneeFiscale: exerciceSaisi ? parseInt(exerciceSaisi) : undefined,
                statuts:      statutsSelec,
                sortKey:      sortKey ?? undefined,
                sortDir:      sortDir,
            });
            setPaiementsFiltres(result);
        } catch (err) {
            console.error("Erreur lors de la recherche :", err);
        } finally {
            setLoading(false);
        }
    };

    // ── Reset filtre exercice ──
    const handleClearExercice = async () => {
        setExerciceSaisi("");
        try {
            setLoading(true);
            const result = await getPaiements({ statuts: statutsSelec });
            setPaiementsFiltres(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sorted = [...paiementsFiltres].sort((a, b) => {
        if (!sortKey) return 0;
        const va = a[sortKey] ?? ""; const vb = b[sortKey] ?? "";
        return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

    const visibleColumns = BASE_COLUMNS.filter((c) => !hiddenCols.includes(c.key));

    const thStyle = {
        padding: 0, textAlign: "left", fontSize: 13, fontWeight: 500,
        color: C.textMid, background: C.white,
        borderBottom: `2px solid #E5E7EB`, borderRight: `1px solid #E5E7EB`,
        position: "relative", whiteSpace: "nowrap",
    };
    const tdStyle = {
        padding: "14px 20px", fontSize: 14, color: C.textDark,
        borderBottom: `1px solid #F3F4F6`, verticalAlign: "middle", whiteSpace: "nowrap",
    };

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column" }}>

            {/* ── Titre ── */}
            <div style={{ background: C.white, marginTop:"20px", marginLeft: "18px", width:"96%", padding: "20px 16px", borderBottom: `1px solid #E5E7EB`, borderRadius:'5px', height: "60px" }}>
                <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: C.textDark, padding: "0px 0px" }}>Liste des Paiements</h1>
            </div>

            <div style={{ padding: "25px 0 40px" }}>

                {/* ── Recherche avancée ── */}
                <div style={{ background: C.white, width:"96%", marginLeft: "18px" }}>
                    <div
                        onClick={() => setRechercheOuverte(!rechercheOuverte)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 28px", cursor: "pointer", userSelect: "none" }}
                    >
                        <span style={{ fontWeight: 600, fontSize: 16, color: C.textDark, marginLeft: "-15px" }}>Recherche avancée</span>
                        <span style={{ fontSize: 18, color: C.textGrey }}>{rechercheOuverte ? <ChevUp /> : <ChevDown />}</span>
                    </div>

                    {rechercheOuverte && (
                        <div style={{ display: "flex", gap: 16, padding: "4px 28px 24px", alignItems: "flex-end", flexWrap: "wrap" }}>

                            {/* Exercice */}
                            <div ref={exerciceRef} style={{ flex: 1, minWidth: 200, position: "relative" }}>
                                <OutlinedInput
                                    label="Exercice"
                                    value={exerciceSaisi ? `EXERCICE ${exerciceSaisi}` : ""}
                                    onClear={handleClearExercice}
                                    onClick={() => setExerciceOpen(!exerciceOpen)}
                                    open={exerciceOpen}
                                >

                                    {exerciceOpen && (
                                        <div style={{
                                            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                                            background: C.white, border: `1px solid ${C.border}`,
                                            borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden",
                                        }}>

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

                            {/* Statut */}
                            <div ref={statutRef} style={{ flex: 1, minWidth: 200, position: "relative" }}>
                                <OutlinedInput
                                    label="Statut"
                                    value={statutAffiche}
                                    onClear={() => setStatutsSelec([])}
                                    onClick={() => setStatutOpen(!statutOpen)}
                                    open={statutOpen}
                                >
                                    {statutOpen && (
                                        <div style={{
                                            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
                                            background: C.white, border: `1px solid ${C.border}`,
                                            borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden",
                                        }}>
                                            <div
                                                onClick={toggleTout}
                                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", borderBottom: `1px solid #F3F4F6` }}
                                                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                            >
                                                <OrangeCheckbox checked={statutsSelec.length === 0} onChange={toggleTout} />
                                                <span style={{ fontSize: 14, color: C.textMid }}>Tout</span>
                                            </div>
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

                            {/* Bouton RECHERCHER */}
                            <button
                                onClick={handleRechercher}
                                style={{
                                    flex: 1, minWidth: 180, display: "flex", alignItems: "center", justifyContent: "center",
                                    gap: 8, border: `1.5px solid ${C.orange}`, background: C.white,
                                    color: C.orange, borderRadius: 4, padding: "14px 20px",
                                    fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.8, height: 52,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = C.orangeBg)}
                                onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
                            >
                                RECHERCHER
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Compteur rows ── */}
                <div style={{ background: "#F3F4F6", padding: "10px 28px", textAlign: "right", fontSize: 13, color: C.textGrey }}>
                    {loading ? "Chargement..." : (
                        <span>
                            {sorted.length} sur {totalPaiements} paiements
                            {paiementsFiltres.some(p => p.statutPaiement === "IN_PROGRESS" || p.statut === "INITIE") && (
                                <span style={{ marginLeft: 12, color: "#D97706", fontWeight: 600 }}>
                                    — Actualisation automatique en cours...
                                </span>
                            )}
                        </span>
                    )}
                </div>

                {/* ── Tableau ── */}
                <div style={{ background: C.white, overflowX: "auto", width:"96%", marginLeft: "18px", border:'1px solid lightGray' }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                        <thead>
                        <tr>
                            {visibleColumns.map((col) => (
                                <th key={col.key} style={thStyle}>
                                    <div
                                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", gap: 6, fontSize: 11 }}
                                        onMouseEnter={(e) => { const btn = e.currentTarget.querySelector(".col-menu-btn"); if (btn) btn.style.opacity = "1"; }}
                                        onMouseLeave={(e) => { const btn = e.currentTarget.querySelector(".col-menu-btn"); if (btn && openMenu !== col.key) btn.style.opacity = "0"; }}
                                    >
                                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            {col.label}
                                            {sortKey === col.key && (
                                                <span style={{ color: C.orange }}>
                                                    {sortDir === "asc" ? <IcoUp /> : <IcoDown />}
                                                </span>
                                            )}
                                        </span>
                                        <button
                                            className="col-menu-btn"
                                            onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === col.key ? null : col.key); }}
                                            style={{
                                                background: "none", border: "none", cursor: "pointer",
                                                color: C.textGrey, padding: "2px 4px", borderRadius: 4,
                                                opacity: openMenu === col.key ? "1" : "0",
                                                transition: "opacity 0.15s", fontSize: 18, lineHeight: 1,
                                            }}
                                        >⋮</button>
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
                                <td colSpan={visibleColumns.length} style={{ padding: "60px 20px", textAlign: "center", color: C.textGrey, fontSize: 14 }}>
                                    Chargement des paiements...
                                </td>
                            </tr>
                        ) : sorted.length === 0 ? (
                            <tr>
                                <td colSpan={visibleColumns.length} style={{ padding: "60px 20px", textAlign: "center", color: C.textGrey, fontSize: 14 }}>
                                    Aucun paiement ne correspond aux critères sélectionnés.
                                </td>
                            </tr>
                        ) : (
                            sorted.map((paiement, i) => (
                                <LignePaiement
                                    key={paiement.id ?? i}
                                    paiement={paiement}
                                    visibleColumns={visibleColumns}
                                    tdStyle={tdStyle}
                                />
                            ))
                        )}
                        </tbody>
                    </table>
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
                // Si c'est un nombre et que c'est NaN, on affiche un tiret
                if (typeof valeur === 'number' && isNaN(valeur)) return "—";
                // Sinon, on affiche la valeur ou un tiret si null/undefined
                return valeur ?? "—";
        }
    };

    return (
        <tr
            style={{ borderBottom: `1px solid #F3F4F6` }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#FFFBF4")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
            {visibleColumns.map((col) => (
                <td key={col.key} style={tdStyle}>{getCellValue(col)}</td>
            ))}
        </tr>
    );
}