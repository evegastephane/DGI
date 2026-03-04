"use client";

import { useState, useEffect, useRef } from "react";
import C from "../../lib/utils/colors";
import { CURRENT_USER_ID } from "../../lib/api/contribuableApi";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const fetchEtablissements = async () => {
    const res = await fetch(`${BASE_URL}/contribuables/${CURRENT_USER_ID}/etablissements`);
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    const json = await res.json();
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : [];
};

const apiCreer = async (body) => {
    const res = await fetch(`${BASE_URL}/etablissements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(t || `Erreur HTTP ${res.status}`); }
    return res.json();
};

const apiModifier = async (id, body) => {
    const res = await fetch(`${BASE_URL}/etablissements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(t || `Erreur HTTP ${res.status}`); }
    return res.json();
};

const apiSupprimer = async (id) => {
    const res = await fetch(`${BASE_URL}/etablissements/${id}`, { method: "DELETE" });
    if (!res.ok) { const t = await res.text().catch(() => ""); throw new Error(t || `Erreur HTTP ${res.status}`); }
};

// ─── Communes ──────────────────────────────────────────────────────────────
const COMMUNES_CAMEROUN = [
    "Yaoundé 1","Yaoundé 2","Yaoundé 3","Yaoundé 4","Yaoundé 5","Yaoundé 6",
    "Douala 1","Douala 2","Douala 3","Douala 4","Douala 5",
    "Bafoussam 1","Bafoussam 2","Bafoussam 3",
    "Bamenda 1","Bamenda 2","Bamenda 3",
    "Garoua 1","Garoua 2","Garoua 3",
    "Maroua 1","Maroua 2","Maroua 3",
    "Ngaoundéré 1","Ngaoundéré 2","Ngaoundéré 3",
    "Bertoua 1","Bertoua 2","Ebolowa 1","Ebolowa 2",
    "Buea","Limbe 1","Kumba 1","Kribi 1","Mbalmayo","Dschang","Foumban",
].sort();

const VIDE = {
    nomEtablissement: "",
    typeActivites: "",
    commune: "",
    localisation: "",
    margeAdministree: "",
    caAutresActivites: "",
    caBoissonsAlcoolisees: "",
    caBoissonsNonAlcoolisees: "",
    caArmesEtMunitions: "",
    caJeuxEtDivertissement: "",
};

// ─── Icônes ────────────────────────────────────────────────────────────────
const IconBuilding = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
    </svg>
);
const IconPlus = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);
const IconTrash = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
);
const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);
const IconEdit2 = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);
const IconChevron = ({ down }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
         style={{ transform: down ? "none" : "rotate(180deg)", transition: "0.2s" }}>
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);

// ─── Select commune ─────────────────────────────────────────────────────────
function CommuneSelect({ value, onChange }) {
    const [open, setOpen]     = useState(false);
    const [search, setSearch] = useState("");
    const ref                 = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const filtered = COMMUNES_CAMEROUN.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

    return (
        <div ref={ref} style={{ position: "relative" }}>
            <div onClick={() => { setOpen((o) => !o); setSearch(""); }}
                 style={{
                     border: `1.5px solid ${open ? C.orange : "#E5E7EB"}`,
                     borderRadius: 8, padding: "11px 14px",
                     background: "#fff", cursor: "pointer",
                     display: "flex", justifyContent: "space-between", alignItems: "center",
                     fontSize: 14, color: value ? C.textDark : "#9CA3AF",
                     transition: "border-color 0.15s",
                     boxShadow: open ? `0 0 0 3px rgba(242,148,0,0.12)` : "none",
                 }}>
                <span>{value || "Sélectionner une commune…"}</span>
                <IconChevron down={open} />
            </div>
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                    zIndex: 200, background: "#fff", border: `1.5px solid ${C.border}`,
                    borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    maxHeight: 220, display: "flex", flexDirection: "column", overflow: "hidden",
                }}>
                    <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}` }}>
                        <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                               onClick={(e) => e.stopPropagation()} placeholder="Rechercher une commune…"
                               style={{
                                   width: "100%", border: `1px solid ${C.border}`, borderRadius: 6,
                                   padding: "7px 10px", fontSize: 13, outline: "none",
                                   boxSizing: "border-box", background: "#F9FAFB",
                               }} />
                    </div>
                    <div style={{ overflowY: "auto", flex: 1 }}>
                        {filtered.length === 0 ? (
                            <p style={{ padding: "12px 16px", color: "#9CA3AF", fontSize: 13, margin: 0 }}>Aucun résultat</p>
                        ) : filtered.map((c) => (
                            <div key={c} onClick={() => { onChange(c); setOpen(false); }}
                                 style={{
                                     padding: "10px 14px", fontSize: 14, cursor: "pointer",
                                     background: value === c ? "#FEF3C7" : "transparent",
                                     color: value === c ? C.orange : C.textDark,
                                     fontWeight: value === c ? 600 : 400,
                                 }}
                                 onMouseEnter={(e) => { if (value !== c) e.currentTarget.style.background = "#F9FAFB"; }}
                                 onMouseLeave={(e) => { e.currentTarget.style.background = value === c ? "#FEF3C7" : "transparent"; }}>
                                {c}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Champ label flottant ──────────────────────────────────────────────────
function Champ({ label, value, onChange, type = "text", placeholder = "" }) {
    const [focus, setFocus] = useState(false);
    const isNum = type === "number";
    const active = focus || !!value;

    return (
        <div style={{ position: "relative", marginBottom: 20 }}>
            <label style={{
                position: "absolute", left: 14,
                top: active ? -9 : 12,
                fontSize: active ? 11 : 14,
                color: focus ? C.orange : active ? "#6B7280" : "#9CA3AF",
                background: active ? "#fff" : "transparent",
                padding: active ? "0 4px" : "0",
                pointerEvents: "none", zIndex: 1,
                transition: "all 0.15s",
                fontWeight: active ? 500 : 400,
            }}>{label}</label>
            <input
                type={isNum ? "text" : type}
                inputMode={isNum ? "decimal" : undefined}
                value={value}
                onChange={(e) => {
                    if (isNum) {
                        const clean = e.target.value.replace(/[^0-9.]/g, "").replace(/(\\..*)\\./, "$1");
                        onChange(clean);
                    } else {
                        onChange(e.target.value);
                    }
                }}
                placeholder={focus ? (placeholder || (isNum ? "0" : "")) : ""}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                style={{
                    width: "100%", border: `1.5px solid ${focus ? C.orange : "#E5E7EB"}`,
                    borderRadius: 8, padding: "12px 14px",
                    fontSize: 14, color: C.textDark, background: "#fff",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    boxShadow: focus ? `0 0 0 3px rgba(242,148,0,0.12)` : "none",
                    textAlign: isNum ? "right" : "left",
                }}
            />
            {isNum && value && (
                <span style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    fontSize: 12, color: "#9CA3AF", pointerEvents: "none",
                }}>FCFA</span>
            )}
        </div>
    );
}

// ─── Composant principal ───────────────────────────────────────────────────
export default function TabAjoutEtablissement({ declarationContext }) {
    const [etablissements, setEtablissements] = useState([]);
    const [selectionne,    setSelectionne]    = useState(null); // index ou null
    const [form,           setForm]           = useState(VIDE);
    const [loading,        setLoading]        = useState(true);
    const [saving,         setSaving]         = useState(false);
    const [succes,         setSucces]         = useState(false);
    const [succesMsg,      setSuccesMsg]      = useState("");
    const [erreur,         setErreur]         = useState(null);
    const [supprimant,     setSupprimant]     = useState(false);

    const charger = () =>
        fetchEtablissements()
            .then((data) => setEtablissements(Array.isArray(data) ? data : []))
            .catch(() => setEtablissements([]));

    useEffect(() => {
        charger().finally(() => setLoading(false));
    }, []); // eslint-disable-line

    const setChamp = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

    // Mapper un objet établissement backend → état du formulaire
    const mapVersForm = (e) => ({
        nomEtablissement:         e.nom || e.nomEtablissement || "",
        typeActivites:            e.typeActivites    || "",
        commune:                  e.commune?.nomCommune || e.commune?.nom_commune || (typeof e.commune === "string" ? e.commune : "") || "",
        localisation:             e.adresse          || e.localisation || "",
        margeAdministree:         e.montantMargeAdministree    != null ? String(e.montantMargeAdministree)    : "",
        caAutresActivites:        e.caAutresActivites          != null ? String(e.caAutresActivites)          : "",
        caBoissonsAlcoolisees:    e.caBoissonsAlcoolisees       != null ? String(e.caBoissonsAlcoolisees)      : "",
        caBoissonsNonAlcoolisees: e.caBoissonsNonAlcoolisees    != null ? String(e.caBoissonsNonAlcoolisees)   : "",
        caArmesEtMunitions:       e.caArmesEtMunitions          != null ? String(e.caArmesEtMunitions)         : "",
        caJeuxEtDivertissement:   e.caJeuxEtDivertissement      != null ? String(e.caJeuxEtDivertissement)     : "",
    });

    // Mapper le formulaire → payload API
    const mapVersApi = (f, idContribuable) => ({
        nom:                         f.nomEtablissement,
        idContribuable:              idContribuable,
        typeActivites:               f.typeActivites               || null,
        commune:                     f.commune                     || null,
        adresse:                     f.localisation                || null,
        montantMargeAdministree:     parseFloat(f.margeAdministree)         || 0,
        caAutresActivites:           parseFloat(f.caAutresActivites)        || 0,
        caBoissonsAlcoolisees:       parseFloat(f.caBoissonsAlcoolisees)    || 0,
        caBoissonsNonAlcoolisees:    parseFloat(f.caBoissonsNonAlcoolisees) || 0,
        caArmesEtMunitions:          parseFloat(f.caArmesEtMunitions)       || 0,
        caJeuxEtDivertissement:      parseFloat(f.caJeuxEtDivertissement)   || 0,
    });

    const handleSelectionner = (idx) => {
        setSelectionne(idx);
        setForm(mapVersForm(etablissements[idx]));
        setSucces(false); setErreur(null);
    };

    const handleNouvel = () => {
        setSelectionne(null); setForm(VIDE); setSucces(false); setErreur(null);
    };

    // ── Créer ──────────────────────────────────────────────────────────────
    const handleEnregistrer = async () => {
        if (!form.nomEtablissement.trim()) { setErreur("Le nom de l'établissement est obligatoire."); return; }
        setSaving(true); setErreur(null); setSucces(false);
        try {
            await apiCreer(mapVersApi(form, CURRENT_USER_ID));
            await charger();
            setSuccesMsg("Établissement créé avec succès !");
            setSucces(true); setSelectionne(null); setForm(VIDE);
        } catch (e) {
            setErreur(e.message || "Erreur lors de l'enregistrement.");
        } finally { setSaving(false); }
    };

    // ── Modifier ───────────────────────────────────────────────────────────
    const handleModifier = async () => {
        if (!form.nomEtablissement.trim()) { setErreur("Le nom de l'établissement est obligatoire."); return; }
        const id = etablissements[selectionne]?.idEtablissement;
        if (!id) { setErreur("Impossible de trouver l'identifiant de cet établissement."); return; }
        setSaving(true); setErreur(null); setSucces(false);
        try {
            await apiModifier(id, { ...mapVersApi(form, CURRENT_USER_ID), idEtablissement: id });
            await charger();
            setSuccesMsg("Informations mises à jour avec succès !");
            setSucces(true);
        } catch (e) {
            setErreur(e.message || "Erreur lors de la modification.");
        } finally { setSaving(false); }
    };

    // ── Supprimer ──────────────────────────────────────────────────────────
    const handleSupprimer = async (e2) => {
        e2.stopPropagation();
        const id = etablissements[selectionne]?.idEtablissement;
        if (!id) return;
        if (!window.confirm(`Supprimer « ${etablissements[selectionne]?.nom || form.nomEtablissement} » ? Cette action est irréversible.`)) return;
        setSupprimant(true); setErreur(null);
        try {
            await apiSupprimer(id);
            await charger();
            setSelectionne(null); setForm(VIDE);
        } catch (e) {
            setErreur(e.message || "Erreur lors de la suppression.");
        } finally { setSupprimant(false); }
    };

    const totalCA = [
        parseFloat(form.caAutresActivites)        || 0,
        parseFloat(form.caBoissonsAlcoolisees)     || 0,
        parseFloat(form.caBoissonsNonAlcoolisees)  || 0,
        parseFloat(form.caArmesEtMunitions)        || 0,
        parseFloat(form.caJeuxEtDivertissement)    || 0,
    ].reduce((a, b) => a + b, 0);
    const margeVal = parseFloat(form.margeAdministree) || 0;
    const fmt = (n) => n > 0 ? n.toLocaleString("fr-FR") + " FCFA" : "—";

    if (loading) return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <div style={{ textAlign: "center", color: "#9CA3AF" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                <p style={{ fontSize: 14 }}>Chargement des établissements…</p>
            </div>
        </div>
    );

    const modeEdition = selectionne !== null;
    const nomActuel = modeEdition
        ? (etablissements[selectionne]?.nom || etablissements[selectionne]?.nomEtablissement || `Établissement ${selectionne + 1}`)
        : "Nouvel établissement";

    return (
        <div style={{ background: "#F3F4F6", minHeight: "100vh", paddingBottom: 100 }}>

            {/* ── En-tête ── */}
            <div style={{ background: "#fff", padding: "20px 32px", borderBottom: "1px solid #E5E7EB", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "#9CA3AF" }}>Déclaration Patente</span>
                    <span style={{ color: "#D1D5DB" }}>›</span>
                    <span style={{ fontSize: 13, color: C.orange, fontWeight: 600 }}>Gestion des Établissements</span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>
                    Gestion des Établissements
                </h1>
            </div>

            <div style={{ display: "flex", gap: 24, padding: "0 32px", alignItems: "flex-start" }}>

                {/* ══ COLONNE GAUCHE ══ */}
                <div style={{ width: 280, flexShrink: 0 }}>

                    <button onClick={handleNouvel} style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        width: "100%", padding: "13px 16px",
                        background: C.orange, color: "#fff",
                        border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14,
                        cursor: "pointer", marginBottom: 16,
                        boxShadow: "0 4px 12px rgba(242,148,0,0.35)",
                        transition: "all 0.15s",
                    }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#D97706"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = C.orange; e.currentTarget.style.transform = "none"; }}>
                        <IconPlus /> Nouvel Établissement
                    </button>

                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                            <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                Établissements ({etablissements.length})
                            </h3>
                        </div>

                        {etablissements.length === 0 ? (
                            <div style={{ padding: "40px 20px", textAlign: "center" }}>
                                <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
                                <p style={{ fontSize: 13, color: "#9CA3AF", margin: 0 }}>Aucun établissement enregistré</p>
                                <p style={{ fontSize: 12, color: "#D1D5DB", marginTop: 4 }}>Cliquez sur « Nouvel Établissement »</p>
                            </div>
                        ) : (
                            etablissements.map((e, idx) => {
                                const nom  = e.nom || e.nomEtablissement || `Établissement ${idx + 1}`;
                                const actif = selectionne === idx;
                                const communeAff = typeof e.commune === "string" ? e.commune : e.commune?.nomCommune || "";
                                return (
                                    <div key={e.idEtablissement || idx}
                                         onClick={() => handleSelectionner(idx)}
                                         style={{
                                             display: "flex", alignItems: "center", justifyContent: "space-between",
                                             padding: "13px 16px", cursor: "pointer",
                                             borderLeft: actif ? `3px solid ${C.orange}` : "3px solid transparent",
                                             background: actif ? "#FEF9EC" : "#fff",
                                             borderBottom: "1px solid #F3F4F6",
                                             transition: "all 0.15s",
                                         }}
                                         onMouseEnter={(e2) => { if (!actif) e2.currentTarget.style.background = "#FAFAFA"; }}
                                         onMouseLeave={(e2) => { e2.currentTarget.style.background = actif ? "#FEF9EC" : "#fff"; }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                                background: actif ? "#FEF3C7" : "#F3F4F6",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                color: actif ? C.orange : "#9CA3AF",
                                            }}>
                                                <IconBuilding />
                                            </div>
                                            <div style={{ overflow: "hidden" }}>
                                                <p style={{ fontSize: 13, fontWeight: actif ? 700 : 500, color: actif ? C.orange : "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {nom}
                                                </p>
                                                {communeAff && (
                                                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>{communeAff}</p>
                                                )}
                                            </div>
                                        </div>
                                        {/* Seulement le bouton supprimer dans la liste */}
                                        {actif && (
                                            <button
                                                onClick={handleSupprimer}
                                                disabled={supprimant}
                                                title="Supprimer cet établissement"
                                                style={{
                                                    background: "#FEE2E2", color: "#EF4444",
                                                    border: "none", borderRadius: 6,
                                                    width: 28, height: 28, flexShrink: 0,
                                                    cursor: supprimant ? "not-allowed" : "pointer",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    opacity: supprimant ? 0.5 : 1,
                                                }}
                                                onMouseEnter={(e2) => { e2.currentTarget.style.background = "#EF4444"; e2.currentTarget.style.color = "#fff"; }}
                                                onMouseLeave={(e2) => { e2.currentTarget.style.background = "#FEE2E2"; e2.currentTarget.style.color = "#EF4444"; }}>
                                                {supprimant ? "…" : <IconTrash />}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ══ COLONNE DROITE : Formulaire ══ */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>

                        {/* En-tête formulaire */}
                        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", gap: 12, background: modeEdition ? "#FEF9EC" : "#FAFAFA" }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: C.orange }}>
                                {modeEdition ? <IconEdit2 /> : <IconBuilding />}
                            </div>
                            <div>
                                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{nomActuel}</h2>
                                <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
                                    {modeEdition ? "Modifiez les informations puis cliquez sur « Modifier les informations »" : "Remplissez les informations ci-dessous"}
                                </p>
                            </div>
                        </div>

                        <div style={{ padding: "24px" }}>

                            {/* ── Section 1 : Informations générales ── */}
                            <div style={{ marginBottom: 28 }}>
                                <SectionTitre label="Informations générales" />
                                <Champ label="Nom de l'établissement *" value={form.nomEtablissement} onChange={setChamp("nomEtablissement")} />
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                                    <Champ label="Type d'activités" value={form.typeActivites} onChange={setChamp("typeActivites")} />
                                    <div style={{ marginBottom: 20 }}>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#6B7280", marginBottom: 6 }}>Commune</label>
                                        <CommuneSelect value={form.commune} onChange={setChamp("commune")} />
                                    </div>
                                </div>
                                <Champ label="Localisation / Adresse" value={form.localisation} onChange={setChamp("localisation")} />
                            </div>

                            {/* ── Section 2 : Données financières ── */}
                            <div style={{ marginBottom: 24 }}>
                                <SectionTitre label="Données financières" />

                                {/* Mini totaux */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
                                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 4px", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Total CA</p>
                                        <p style={{ fontSize: 18, fontWeight: 700, color: totalCA > 0 ? C.orange : "#D1D5DB", margin: 0 }}>{fmt(totalCA)}</p>
                                    </div>
                                    <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
                                        <p style={{ fontSize: 11, color: "#9CA3AF", margin: "0 0 4px", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Marge administrée</p>
                                        <p style={{ fontSize: 18, fontWeight: 700, color: margeVal > 0 ? C.orange : "#D1D5DB", margin: 0 }}>{fmt(margeVal)}</p>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
                                    <Champ label="Marge administrée"           value={form.margeAdministree}         onChange={setChamp("margeAdministree")}         type="number" />
                                    <Champ label="CA autres activités"         value={form.caAutresActivites}         onChange={setChamp("caAutresActivites")}         type="number" />
                                    <Champ label="CA Boissons alcoolisées"      value={form.caBoissonsAlcoolisees}     onChange={setChamp("caBoissonsAlcoolisees")}     type="number" />
                                    <Champ label="CA Boissons non alcoolisées"  value={form.caBoissonsNonAlcoolisees}  onChange={setChamp("caBoissonsNonAlcoolisees")}  type="number" />
                                    <Champ label="CA Armes & Munitions"         value={form.caArmesEtMunitions}        onChange={setChamp("caArmesEtMunitions")}        type="number" />
                                    <Champ label="CA Jeux & Divertissement"     value={form.caJeuxEtDivertissement}    onChange={setChamp("caJeuxEtDivertissement")}    type="number" />
                                </div>
                            </div>

                            {/* ── Alertes ── */}
                            {succes && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, marginBottom: 16 }}>
                                    <span style={{ color: "#16A34A", display: "flex" }}><IconCheck /></span>
                                    <span style={{ fontSize: 14, color: "#15803D", fontWeight: 600 }}>{succesMsg}</span>
                                </div>
                            )}
                            {erreur && (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, marginBottom: 16 }}>
                                    <span style={{ fontSize: 16 }}>⚠</span>
                                    <span style={{ fontSize: 14, color: "#DC2626" }}>{erreur}</span>
                                </div>
                            )}

                            {/* ── Boutons actions ── */}
                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button onClick={handleNouvel} style={{
                                    background: "#fff", color: "#374151",
                                    border: "1.5px solid #E5E7EB", borderRadius: 8,
                                    padding: "11px 20px", fontWeight: 600, fontSize: 14,
                                    cursor: "pointer", transition: "all 0.15s",
                                }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                                    Annuler
                                </button>

                                {modeEdition ? (
                                    <button onClick={handleModifier} disabled={saving} style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        background: saving ? "#F5C77E" : C.orange, color: "#fff",
                                        border: "none", borderRadius: 8,
                                        padding: "11px 28px", fontWeight: 700, fontSize: 14,
                                        cursor: saving ? "not-allowed" : "pointer",
                                        boxShadow: saving ? "none" : "0 4px 12px rgba(242,148,0,0.3)",
                                        transition: "all 0.15s",
                                    }}
                                            onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.background = "#D97706"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                                            onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.background = C.orange; e.currentTarget.style.transform = "none"; }}}>
                                        {saving ? "Modification…" : (<><IconEdit2 /> Modifier les informations</>)}
                                    </button>
                                ) : (
                                    <button onClick={handleEnregistrer} disabled={saving} style={{
                                        display: "flex", alignItems: "center", gap: 8,
                                        background: saving ? "#F5C77E" : C.orange, color: "#fff",
                                        border: "none", borderRadius: 8,
                                        padding: "11px 28px", fontWeight: 700, fontSize: 14,
                                        cursor: saving ? "not-allowed" : "pointer",
                                        boxShadow: saving ? "none" : "0 4px 12px rgba(242,148,0,0.3)",
                                        transition: "all 0.15s",
                                    }}
                                            onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.background = "#D97706"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                                            onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.background = C.orange; e.currentTarget.style.transform = "none"; }}}>
                                        {saving ? "Enregistrement…" : (<><IconCheck /> Enregistrer</>)}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Petit composant séparateur de section ─────────────────────────────────
function SectionTitre({ label }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <div style={{ height: 1, flex: 1, background: "#F3F4F6" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>{label}</span>
            <div style={{ height: 1, flex: 1, background: "#F3F4F6" }} />
        </div>
    );
}