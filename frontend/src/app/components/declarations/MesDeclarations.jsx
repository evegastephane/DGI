"use client";

import { useState, useEffect, useRef } from "react";
import C from "../../lib/utils/colors";
import { CURRENT_USER_ID, getContribuable } from "../../lib/api/contribuableApi";
import { getDeclarations, soumettreDraft, modifierDeclaration } from "@/app/lib/api/declarationApi";
import { generateAvisPDF, downloadPDF } from "../../lib/utils/generateAvisPDF";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// ─── Styles communs (identiques à liste des avis) ─────────────────────────────
const thS = {
    padding: "13px 16px", textAlign: "left", fontSize: 12,
    fontWeight: 700, color: "#6B7280", borderBottom: `2px solid ${C.border}`,
    whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em",
    background: "#F9FAFB",
};
const tdS = { padding: "14px 16px", fontSize: 13, color: "#374151", verticalAlign: "middle" };

const ROWS_OPTIONS = [10, 25, 50];
const STATUT_OPTIONS = [
    { value: "SUBMITTED", label: "SUBMITTED" },
    { value: "DRAFT",     label: "DRAFT"     },
    { value: "PAYE",      label: "PAYÉ"      },
    { value: "APURE",     label: "APURÉ"     },
];

// ─── Badge statut ─────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
    const MAP = {
        SUBMITTED: { bg: "#FFF7ED", color: "#C2410C", border: "1px solid #FDBA74" },
        DRAFT:     { bg: "#F3F4F6", color: "#6B7280", border: "1px solid #D1D5DB" },
        PAYE:      { bg: "#F0FDF4", color: "#15803D", border: "1px solid #86EFAC" },
        APURE:     { bg: "#EFF6FF", color: "#1D4ED8", border: "1px solid #93C5FD" },
        VALIDEE:   { bg: "#FFF7ED", color: "#C2410C", border: "1px solid #FDBA74" },
    };
    const s = MAP[statut?.toUpperCase()] || MAP.DRAFT;
    const label = statut?.toUpperCase() === "VALIDEE" ? "SUBMITTED" : (statut?.toUpperCase() || "DRAFT");
    return (
        <span style={{
            ...s, padding: "3px 12px", borderRadius: 999,
            fontSize: 11, fontWeight: 700, display: "inline-block",
            textTransform: "uppercase", letterSpacing: "0.06em",
        }}>{label}</span>
    );
}

// ─── Outlined input (même style que liste des avis) ────────────────────────────
function OutlinedInput({ label, value, onClear, onClick, open, children }) {
    const isFilled = value && value.length > 0;
    return (
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
            <div onClick={onClick} style={{
                border: `1.5px solid ${open || isFilled ? C.orange : "#9CA3AF"}`,
                borderRadius: 4, padding: "14px 40px 6px 12px",
                background: C.white, cursor: "pointer", minHeight: 52,
                display: "flex", alignItems: "center",
            }}>
                <span style={{
                    position: "absolute", left: 10,
                    top: isFilled || open ? 4 : 16,
                    fontSize: isFilled || open ? 10 : 14,
                    color: open || isFilled ? C.orange : "#9CA3AF",
                    transition: "all 0.15s", pointerEvents: "none",
                    background: C.white, padding: "0 2px",
                }}>{label}</span>
                <span style={{
                    fontSize: 14, color: isFilled ? C.textDark : "transparent",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: "calc(100% - 10px)",
                }}>{value || "\u200b"}</span>
            </div>
            {isFilled && (
                <button onClick={(e) => { e.stopPropagation(); onClear(); }} style={{
                    position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16,
                }}>×</button>
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

// ─── Dropdown option list ─────────────────────────────────────────────────────
function DropdownList({ options, value, onChange, onClose }) {
    return (
        <div style={{
            position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0,
            background: C.white, border: `1px solid ${C.border}`,
            borderRadius: 4, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            zIndex: 100, overflow: "hidden",
        }}>
            {options.map((opt) => (
                <div key={opt.value} onClick={() => { onChange(opt.value); onClose(); }}
                     style={{
                         padding: "12px 16px", cursor: "pointer", fontSize: 13,
                         color: value === opt.value ? C.orange : C.textDark,
                         background: value === opt.value ? C.orangeBg : "transparent",
                         fontWeight: value === opt.value ? 700 : 400,
                         borderBottom: `1px solid #F3F4F6`,
                     }}
                     onMouseEnter={(e) => { if (value !== opt.value) e.currentTarget.style.background = "#F9FAFB"; }}
                     onMouseLeave={(e) => { e.currentTarget.style.background = value === opt.value ? C.orangeBg : "transparent"; }}>
                    {opt.label}
                </div>
            ))}
        </div>
    );
}

// ─── Boutons d'action DRAFT ────────────────────────────────────────────────────
function DraftActions({ declaration, onModifier, onSoumis }) {
    const [submitting, setSubmitting] = useState(false);

    const handleSoumettre = async () => {
        if (!window.confirm(`Soumettre la déclaration ${declaration.reference} ? Elle ne pourra plus être modifiée.`)) return;
        setSubmitting(true);
        try {
            await soumettreDraft(declaration.id);
            onSoumis();
        } catch (e) {
            alert("Erreur lors de la soumission : " + e.message);
        } finally { setSubmitting(false); }
    };

    return (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => onModifier(declaration)}
                    style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: C.white, color: C.orange, border: `1.5px solid ${C.orange}`,
                        borderRadius: 5, padding: "6px 14px", fontWeight: 600, fontSize: 12,
                        cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = C.orangeBg}
                    onMouseLeave={(e) => e.currentTarget.style.background = C.white}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Modifier
            </button>
            <button onClick={handleSoumettre} disabled={submitting}
                    style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: submitting ? "#F5C77E" : C.orange, color: "#fff",
                        border: "none", borderRadius: 5, padding: "6px 14px",
                        fontWeight: 600, fontSize: 12,
                        cursor: submitting ? "not-allowed" : "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = "#D97706"; }}
                    onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = C.orange; }}>
                {submitting ? "..." : (
                    <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                        Soumettre
                    </>
                )}
            </button>
        </div>
    );
}

// ─── Menu ··· pour non-DRAFT ──────────────────────────────────────────────────
function ActionMenu({ declaration, contribuable }) {
    const [open, setOpen]             = useState(false);
    const [downloading, setDownloading] = useState(false);
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

    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <button onClick={() => setOpen(!open)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 20, letterSpacing: 3, padding: "4px 6px", borderRadius: 4 }}>
                {downloading ? "..." : "•••"}
            </button>
            {open && (
                <div style={{
                    position: "absolute", right: 0, top: "100%", zIndex: 200,
                    background: C.white, border: `1px solid ${C.border}`,
                    borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 200, overflow: "hidden",
                }}>
                    {[
                        { label: downloading ? "Generation..." : "Télécharger l'avis", onClick: handleTelecharger, disabled: downloading },
                        { label: "Payer", onClick: () => setOpen(false), disabled: false },
                    ].map((item) => (
                        <button key={item.label} onClick={item.onClick} disabled={item.disabled}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                                    padding: "13px 16px", border: "none", background: "transparent",
                                    cursor: item.disabled ? "not-allowed" : "pointer", fontSize: 13,
                                    color: item.disabled ? "#9CA3AF" : C.textDark, textAlign: "left",
                                    borderBottom: `1px solid #F3F4F6`,
                                }}
                                onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = C.orangeBg; }}
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

    const [openAnnee,   setOpenAnnee]    = useState(false);
    const [openStatut,  setOpenStatut]   = useState(false);
    const [rechercheOpen, setRechercheOpen] = useState(false);

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

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "—";

    const ANNEE_OPTIONS = [...new Set(avis.map(a => String(a.annee)).filter(Boolean))].sort().reverse().map(v => ({ value: v, label: v }));

    return (
        <main style={{ padding: "24px 28px 60px", flex: 1, background: C.bg }}>
            {/* ── En-tête ── */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: C.textDark, margin: "0 0 4px" }}>
                    Mes Déclarations
                </h1>
                <p style={{ fontSize: 13, color: C.textGrey, margin: 0 }}>
                    Consultez, modifiez et soumettez vos déclarations de patente
                </p>
            </div>

            <div style={{
                background: C.white, borderRadius: 10,
                border: `1px solid ${C.border}`, overflow: "hidden",
                boxShadow: C.shadow,
            }}>
                {/* ── Barre de recherche avancée ── */}
                <div style={{ borderBottom: `1px solid ${C.border}` }}>
                    <button onClick={() => setRechercheOpen(!rechercheOpen)}
                            style={{
                                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "16px 24px", background: "none", border: "none", cursor: "pointer",
                                fontSize: 14, color: "#9CA3AF",
                            }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            Recherche avancée
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             style={{ transform: rechercheOpen ? "rotate(180deg)" : "none", transition: "0.2s" }}>
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>

                    {rechercheOpen && (
                        <div style={{ padding: "0 24px 20px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
                            {/* Référence — input texte libre */}
                            <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                                <input
                                    value={filtreRef}
                                    onChange={(e) => { setFiltreRef(e.target.value); setCurrentPage(1); }}
                                    placeholder=" "
                                    style={{
                                        width: "100%", boxSizing: "border-box",
                                        border: `1.5px solid ${filtreRef ? C.orange : "#9CA3AF"}`,
                                        borderRadius: 4, padding: "14px 36px 6px 12px",
                                        fontSize: 14, color: C.textDark, outline: "none",
                                        background: C.white, minHeight: 52,
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = C.orange}
                                    onBlur={(e) => e.target.style.borderColor = filtreRef ? C.orange : "#9CA3AF"}
                                />
                                <span style={{
                                    position: "absolute", left: 10, top: filtreRef ? 4 : 16,
                                    fontSize: filtreRef ? 10 : 14, color: filtreRef ? C.orange : "#9CA3AF",
                                    transition: "all 0.15s", pointerEvents: "none",
                                    background: C.white, padding: "0 2px",
                                }}>Référence</span>
                                {filtreRef && (
                                    <button onClick={() => { setFiltreRef(""); setCurrentPage(1); }}
                                            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16 }}>×</button>
                                )}
                            </div>

                            {/* Année */}
                            <OutlinedInput label="Année fiscale" value={filtreAnnee}
                                           onClear={() => { setFiltreAnnee(""); setCurrentPage(1); }}
                                           onClick={() => { setOpenAnnee(!openAnnee); setOpenStatut(false); }}
                                           open={openAnnee}>
                                {openAnnee && (
                                    <DropdownList
                                        options={[{ value: "", label: "Toutes" }, ...ANNEE_OPTIONS]}
                                        value={filtreAnnee}
                                        onChange={(v) => { setFiltreAnnee(v); setCurrentPage(1); }}
                                        onClose={() => setOpenAnnee(false)}
                                    />
                                )}
                            </OutlinedInput>

                            {/* Statut */}
                            <OutlinedInput label="Statut" value={filtreStatut}
                                           onClear={() => { setFiltreStatut(""); setCurrentPage(1); }}
                                           onClick={() => { setOpenStatut(!openStatut); setOpenAnnee(false); }}
                                           open={openStatut}>
                                {openStatut && (
                                    <DropdownList
                                        options={[{ value: "", label: "Tous" }, ...STATUT_OPTIONS]}
                                        value={filtreStatut}
                                        onChange={(v) => { setFiltreStatut(v); setCurrentPage(1); }}
                                        onClose={() => setOpenStatut(false)}
                                    />
                                )}
                            </OutlinedInput>

                            <button onClick={() => { setFiltreRef(""); setFiltreAnnee(""); setFiltreStatut(""); setCurrentPage(1); }}
                                    style={{
                                        background: "none", color: "#9CA3AF", border: `1px solid ${C.border}`,
                                        borderRadius: 4, padding: "10px 16px", fontSize: 13, cursor: "pointer", height: 52,
                                    }}>Réinitialiser</button>
                        </div>
                    )}
                </div>

                {/* ── Compteur ── */}
                <div style={{
                    padding: "10px 24px", textAlign: "right",
                    fontSize: 12, color: "#9CA3AF", background: "#F9FAFB",
                    borderBottom: `1px solid ${C.border}`,
                }}>
                    {paginated.length} sur {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
                </div>

                {/* ── Tableau ── */}
                {loading ? (
                    <div style={{ padding: "60px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>Chargement...</div>
                ) : error ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#B91C1C", fontSize: 13 }}>[!] {error}</div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                            <thead>
                            <tr>
                                <th style={thS}>Référence</th>
                                <th style={thS}>Année fiscale</th>
                                <th style={thS}>Structure fiscale</th>
                                <th style={thS}>Statut</th>
                                <th style={{ ...thS, textAlign: "right" }}>Montant</th>
                                <th style={thS}>Date</th>
                                <th style={{ ...thS, textAlign: "center" }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: "60px 24px", textAlign: "center", color: "#9CA3AF", fontSize: 14 }}>
                                        <div style={{ fontSize: 40, marginBottom: 12 }}></div>
                                        Aucune déclaration trouvée.
                                    </td>
                                </tr>
                            ) : paginated.map((a) => (
                                <tr key={a.id} style={{ borderBottom: `1px solid #F3F4F6` }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFA"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ ...tdS, fontFamily: "monospace", color: C.orange, fontWeight: 700 }}>
                                        {a.reference || "—"}
                                    </td>
                                    <td style={tdS}>{a.annee || "—"}</td>
                                    <td style={tdS}>{a.structureFiscale || "CDI YAOUNDE 2"}</td>
                                    <td style={tdS}><StatutBadge statut={a.statut} /></td>
                                    <td style={{ ...tdS, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                                        {a.montantBrut > 0 ? Number(a.montantBrut).toLocaleString("fr-FR") + " F" : "—"}
                                    </td>
                                    <td style={tdS}>{fmtDate(a.date)}</td>
                                    <td style={{ ...tdS, textAlign: "center" }}>
                                        {a.statut?.toUpperCase() === "DRAFT" ? (
                                            <DraftActions
                                                declaration={a}
                                                onModifier={(decl) => onModifierDraft && onModifierDraft(decl)}
                                                onSoumis={() => charger()}
                                            />
                                        ) : (
                                            <ActionMenu declaration={a} contribuable={contribuable} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination ── */}
                <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 24px", borderTop: `1px solid ${C.border}`,
                    background: C.white, flexWrap: "wrap", gap: 12,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#6B7280" }}>
                        Lignes par page :
                        <select value={rowsPerPage}
                                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                style={{ border: `1px solid ${C.border}`, borderRadius: 4, padding: "4px 8px", fontSize: 13, cursor: "pointer", outline: "none" }}>
                            {ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6B7280" }}>
                        <span>{filtered.length === 0 ? "0" : (currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)} sur {filtered.length}</span>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                style={{ width: 32, height: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: "none", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: currentPage === 1 ? "#D1D5DB" : "#374151", fontSize: 16 }}>‹</button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                style={{ width: 32, height: 32, borderRadius: 4, border: `1px solid ${C.border}`, background: "none", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: currentPage === totalPages ? "#D1D5DB" : "#374151", fontSize: 16 }}>›</button>
                    </div>
                </div>
            </div>
        </main>
    );
}