"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import C from "../../lib/utils/colors";
import Spinner from "../../components/ui/Spinner";
import { getEtablissements, CURRENT_USER_ID } from "../../lib/api/contribuableApi";
import { creerDeclaration, modifierDeclaration } from "../../lib/api/declarationApi";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";

// ─── Liste des communes du Cameroun ──────────────────────────────────────────
const COMMUNES_CAMEROUN = [
    "Yaoundé 1", "Yaoundé 2", "Yaoundé 3", "Yaoundé 4", "Yaoundé 5", "Yaoundé 6",
    "Douala 1", "Douala 2", "Douala 3", "Douala 4", "Douala 5",
    "Bafoussam 1", "Bafoussam 2", "Bafoussam 3",
    "Bamenda 1", "Bamenda 2", "Bamenda 3",
    "Garoua 1", "Garoua 2", "Garoua 3",
    "Maroua 1", "Maroua 2", "Maroua 3",
    "Ngaoundéré 1", "Ngaoundéré 2", "Ngaoundéré 3",
    "Bertoua 1", "Bertoua 2",
    "Ebolowa 1", "Ebolowa 2",
    "Buea", "Limbe 1", "Limbe 2", "Limbe 3",
    "Kumba 1", "Kumba 2", "Kumba 3",
    "Edéa 1", "Edéa 2",
    "Kribi 1", "Kribi 2",
    "Loum", "Nkongsamba 1", "Nkongsamba 2", "Nkongsamba 3",
    "Mbalmayo", "Sangmélima", "Dschang", "Foumban",
    "Mbouda", "Bafang", "Bangangté", "Bali",
    "Wum", "Nkambe", "Fundong",
    "Batouri", "Abong-Mbang", "Yokadouma",
    "Meiganga", "Tibati", "Banyo",
    "Guider", "Kaélé", "Mora", "Yagoua",
    "Kousséri", "Maroua Rural", "Mokolo",
].sort();

const COLONNES = [
    { key: "nom_etablissement",                   label: "Nom Établissement",          calcul: false, numeric: false },
    { key: "type_activites",                      label: "Type d'activités",            calcul: false, numeric: false },
    { key: "commune",                             label: "Commune",                     calcul: false, numeric: false, isCommune: true },
    { key: "localisation",                        label: "Localisation",                calcul: false, numeric: false },
    { key: "montant_marge_administree",           label: "Marge administrée",           calcul: false, numeric: true  },
    { key: "CA_autres_activites",                 label: "CA autres activités",         calcul: false, numeric: true  },
    { key: "CA_boissons_non_alcoolisees",         label: "CA boissons non alcoolisées", calcul: false, numeric: true  },
    { key: "CA_boissons_alcoolisees",             label: "CA boissons alcoolisées",     calcul: false, numeric: true  },
    { key: "CA_armes_et_munitions",               label: "CA armes & munitions",        calcul: false, numeric: true  },
    { key: "CA_jeux_de_hasard_et_divertissement", label: "CA jeux & divertissement",    calcul: false, numeric: true  },
    { key: "Total_CA",                            label: "Total CA",                    calcul: true,  numeric: true  },
];

const CHAMPS_CA = [
    "CA_autres_activites",
    "CA_boissons_non_alcoolisees",
    "CA_boissons_alcoolisees",
    "CA_armes_et_munitions",
    "CA_jeux_de_hasard_et_divertissement",
];

const ligneVide = (id) => ({
    id,
    nom_etablissement: "", type_activites: "", commune: "", localisation: "",
    montant_marge_administree: "", CA_autres_activites: "",
    CA_boissons_non_alcoolisees: "", CA_boissons_alcoolisees: "",
    CA_armes_et_munitions: "", CA_jeux_de_hasard_et_divertissement: "",
    Total_CA: "", _nouveau: true,
});

const calcTotalCA = (l) => CHAMPS_CA.reduce((acc, k) => acc + (parseFloat(l[k]) || 0), 0);

const thStyle = {
    padding: "14px 12px", fontWeight: 600, color: C.textMid,
    textAlign: "center", fontSize: 11, borderBottom: `2px solid ${C.border}`,
    background: "#f9fafb", whiteSpace: "nowrap",
};
const cellInput = (isOrange) => ({
    width: "100%", border: `1px solid ${isOrange ? C.yellow : C.border}`,
    borderRadius: 4, padding: "10px 12px", fontSize: 13,
    background: isOrange ? C.orangeBg : C.white,
    color: isOrange ? C.orangeText : C.textDark,
    fontWeight: isOrange ? 700 : 400,
    textAlign: isOrange ? "right" : "left",
    outline: "none",
    boxSizing: "border-box",
});

// ─── Dropdown Commune (portal via fixed position pour échapper à l'overflow du tableau) ──
function CommuneDropdown({ value, onChange }) {
    const [open, setOpen]       = useState(false);
    const [search, setSearch]   = useState("");
    const [rect,  setRect]      = useState(null);
    const triggerRef            = useRef(null);
    const dropRef               = useRef(null);

    // Recalcule la position du trigger pour placer le dropdown en fixed
    const openDropdown = () => {
        if (triggerRef.current) {
            const r = triggerRef.current.getBoundingClientRect();
            setRect(r);
        }
        setOpen(true);
        setSearch("");
    };

    useEffect(() => {
        if (!open) return;
        const h = (e) => {
            const inTrigger = triggerRef.current && triggerRef.current.contains(e.target);
            const inDrop    = dropRef.current    && dropRef.current.contains(e.target);
            if (!inTrigger && !inDrop) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    const filtered = COMMUNES_CAMEROUN.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {/* Bouton trigger */}
            <div
                ref={triggerRef}
                onClick={() => open ? setOpen(false) : openDropdown()}
                style={{
                    ...cellInput(false),
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: "pointer", userSelect: "none",
                    border: `1px solid ${open ? C.orange : C.border}`,
                }}
            >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: value ? C.textDark : "#9CA3AF" }}>
                    {value || "Sélectionner…"}
                </span>
                <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 4, transform: open ? "rotate(180deg)" : "none", transition: "0.15s" }}>▼</span>
            </div>

            {/* Dropdown en position fixed : indépendant de tout overflow parent */}
            {open && rect && (
                <div
                    ref={dropRef}
                    style={{
                        position: "fixed",
                        top: rect.bottom + 2,
                        left: rect.left,
                        width: Math.max(rect.width, 220),
                        zIndex: 9999,
                        background: C.white,
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                        maxHeight: 220,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Rechercher…"
                            style={{
                                width: "100%", border: `1px solid ${C.border}`,
                                borderRadius: 4, padding: "5px 8px", fontSize: 12, outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                    <div style={{ overflowY: "auto", flex: 1 }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: "10px 12px", fontSize: 12, color: "#9CA3AF" }}>Aucun résultat</div>
                        ) : filtered.map((c) => (
                            <div
                                key={c}
                                onClick={() => { onChange(c); setOpen(false); }}
                                style={{
                                    padding: "9px 12px", fontSize: 12, cursor: "pointer",
                                    background: value === c ? C.orangeBg : "transparent",
                                    color: value === c ? C.orange : C.textDark,
                                    fontWeight: value === c ? 600 : 400,
                                }}
                                onMouseEnter={(e) => { if (value !== c) e.currentTarget.style.background = "#f9fafb"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = value === c ? C.orangeBg : "transparent"; }}
                            >
                                {c}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

export default function TabEtablissements({
                                              lignes,
                                              setLignes,
                                              onSuivant,
                                              declarationContext,
                                              idDeclaration,
                                              onEnregistreDraft,
                                          }) {
    const [loading,       setLoading]       = useState(true);
    const [fileName,      setFileName]      = useState("");
    const [saveLoading,   setSaveLoading]   = useState(false);
    const [saveSucces,    setSaveSucces]    = useState(false);
    const [saveErreur,    setSaveErreur]    = useState(null);
    const [estEnregistre, setEstEnregistre] = useState(false);

    // Pré-charge les établissements au montage.
    // Toutes les lignes sont immédiatement modifiables et une ligne vide
    // est toujours présente à la fin pour pouvoir ajouter de nouveaux établissements.
    useEffect(() => {
        getEtablissements()
            .then((data) => {
                if (data && data.length > 0) {
                    const lignesPrechargees = data.map((e, idx) => {
                        const ca_autres      = e.caAutresActivites         != null ? String(e.caAutresActivites)         : "";
                        const ca_boissons_na = e.caBoissonsNonAlcoolisees   != null ? String(e.caBoissonsNonAlcoolisees)  : "";
                        const ca_boissons_a  = e.caBoissonsAlcoolisees       != null ? String(e.caBoissonsAlcoolisees)     : "";
                        const ca_armes       = e.caArmesEtMunitions          != null ? String(e.caArmesEtMunitions)        : "";
                        const ca_jeux        = e.caJeuxEtDivertissement       != null ? String(e.caJeuxEtDivertissement)   : "";
                        const total = (parseFloat(ca_autres) || 0) + (parseFloat(ca_boissons_na) || 0) +
                            (parseFloat(ca_boissons_a) || 0) + (parseFloat(ca_armes) || 0) +
                            (parseFloat(ca_jeux) || 0);
                        return {
                            // ID stable : utilise l'idEtablissement réel, ou un index négatif unique
                            id: e.idEtablissement ? `etab-${e.idEtablissement}` : `etab-idx-${idx}`,
                            _nouveau: false,
                            nom_etablissement:                   e.nom || e.nomEtablissement || "",
                            type_activites:                      e.typeActivites || e.type_activites || "",
                            commune:                             typeof e.commune === "string" ? e.commune : (e.commune?.nomCommune || e.commune?.nom_commune || ""),
                            localisation:                        e.adresse || e.localisation || "",
                            montant_marge_administree:           e.montantMargeAdministree != null ? String(e.montantMargeAdministree) : "",
                            CA_autres_activites:                 ca_autres,
                            CA_boissons_non_alcoolisees:         ca_boissons_na,
                            CA_boissons_alcoolisees:             ca_boissons_a,
                            CA_armes_et_munitions:               ca_armes,
                            CA_jeux_de_hasard_et_divertissement: ca_jeux,
                            Total_CA:                            total > 0 ? String(total) : "",
                        };
                    });
                    // Ajouter deux lignes vides à la fin pour les nouveaux ajouts
                    setLignes([
                        ...lignesPrechargees,
                        ligneVide(Date.now()),
                        ligneVide(Date.now() + 1),
                    ]);
                } else {
                    setLignes([ligneVide(Date.now()), ligneVide(Date.now() + 1)]);
                }
            })
            .catch(() => {
                if (lignes.length === 0) {
                    setLignes([ligneVide(Date.now()), ligneVide(Date.now() + 1)]);
                }
            })
            .finally(() => setLoading(false));
    }, []); // eslint-disable-line

    const totalCA = lignes.reduce((acc, l) => acc + (parseFloat(l.Total_CA) || 0), 0);

    const handleEnregistrer = async () => {
        setSaveLoading(true);
        setSaveErreur(null);
        setSaveSucces(false);
        try {
            const payload = {
                idContribuable:  CURRENT_USER_ID,
                typeDeclaration: "PATENTE",
                anneeFiscale:    parseInt(declarationContext?.exercice || "2025"),
                montantAPayer:   totalCA,
                statut:          "DRAFT",
            };
            let result;
            if (idDeclaration) {
                result = await modifierDeclaration(idDeclaration, { ...payload, idDeclaration });
            } else {
                result = await creerDeclaration(payload);
            }
            if (onEnregistreDraft) onEnregistreDraft(result.idDeclaration || result.id);
            setSaveSucces(true);
            setEstEnregistre(true);
            setTimeout(() => setSaveSucces(false), 3000);
        } catch (e) {
            setSaveErreur(e.message);
        } finally {
            setSaveLoading(false);
        }
    };

    const readExcel = (file) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const wb   = XLSX.read(e.target.result, { type: "binary" });
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            const nouvelles = rows.map((row, i) => {
                const l = ligneVide(Date.now() + i);
                COLONNES.forEach((col) => { if (row[col.label] !== undefined) l[col.key] = row[col.label]; });
                l.Total_CA = calcTotalCA(l) || "";
                return l;
            });
            setLignes((prev) => [...prev.filter((l) => l.nom_etablissement !== ""), ...nouvelles]);
        };
        reader.readAsBinaryString(file);
    };

    const onDrop = useCallback((files) => { if (files[0]) readExcel(files[0]); }, []); // eslint-disable-line
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, multiple: false,
        accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    });

    const handleChange = (id, champ, valeur) => {
        setEstEnregistre(false);
        setLignes((prev) => {
            const updated = prev.map((l) => {
                if (l.id !== id) return l;
                const maj = { ...l, [champ]: valeur };
                const total = calcTotalCA(maj);
                maj.Total_CA = total > 0 ? String(total) : "";
                return maj;
            });
            const last = updated[updated.length - 1];
            // Auto-ajout : dès qu'on commence à remplir la dernière ligne, ajouter une nouvelle ligne vide
            const derniereModifiee = last.id === id;
            const derniereLigneARemplissage = derniereModifiee && valeur.trim() !== "" && last.nom_etablissement.trim() !== "";
            if (derniereLigneARemplissage) {
                return [...updated, ligneVide(Date.now())];
            }
            return updated;
        });
    };

    // ── Forcer uniquement les chiffres dans les champs numériques ─────────────
    const handleNumericChange = (id, champ, valeur) => {
        const clean = valeur.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
        handleChange(id, champ, clean);
    };

    const supprimerLigne = (id) => setLignes((prev) => prev.filter((l) => l.id !== id));
    const getTotal       = (cle) => lignes.reduce((acc, l) => acc + (parseFloat(l[cle]) || 0), 0);

    if (loading) return <Spinner />;

    return (
        <div style={{ paddingTop: 20 }}>

            {/* Zone import Excel */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                <div {...getRootProps()} style={{
                    border: `2px dashed ${C.orange}`, borderRadius: 10, padding: "28px 20px",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    background: isDragActive ? "#f0f7ff" : "#fffbf0", cursor: "pointer",
                }}>
                    <input {...getInputProps()} />
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke={C.orange} strokeWidth="1.5">
                        <path d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0-3 3m3-3v12" />
                    </svg>
                    <p style={{ color: C.orange, margin: "8px 0 0", fontSize: 13, textAlign: "center" }}>
                        {isDragActive ? "Lâchez pour importer" : "Glisser-déposer le fichier .xlsx ici ou cliquer"}
                    </p>
                    {fileName && (
                        <div style={{ marginTop: 10, padding: "8px 20px", background: "#dcfce7", color: "#166534", borderRadius: 5, fontSize: 12, fontWeight: 600 }}>
                            ✓ {fileName}
                        </div>
                    )}
                </div>
                <a href="/modele.xlsx" download="Modele_Declaration_Etablissements.xlsx"
                   style={{ alignSelf: "center", fontSize: 12, color: C.orange, textDecoration: "underline", fontWeight: 600 }}>
                    Télécharger la feuille de calcul modèle (.xlsx)
                </a>
            </div>

            {/* Titre section */}
            <div style={{ background: C.orangeBg, borderRadius: 8, padding: "12px 20px", marginBottom: 20 }}>
                <span style={{ color: C.orange, fontWeight: 700, fontSize: 17, fontFamily: "monospace" }}>
                    I — Liste des établissements
                </span>
            </div>

            {/* Tableau */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 2200 }}>
                    <thead>
                    <tr>
                        <th style={{ ...thStyle, minWidth: 180, textAlign: "left" }}></th>
                        {COLONNES.map((c) => (
                            <th key={c.key} style={{
                                ...thStyle,
                                background: c.calcul ? C.orangeBg : "#f9fafb",
                                color: c.calcul ? C.orangeText : C.textMid,
                                minWidth: 200,
                            }}>
                                {c.label}
                                {c.calcul && <span style={{ fontSize: 10, display: "block", fontWeight: 400 }}>auto-calculé</span>}
                            </th>
                        ))}
                        <th style={{ ...thStyle, width: 36 }}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {lignes.map((ligne, idx) => (
                        <tr key={ligne.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: "10px 12px", fontWeight: 600, fontSize: 13, color: C.textMid, whiteSpace: "nowrap" }}>
                                Établissement {idx + 1}
                            </td>
                            {COLONNES.map((c) => (
                                <td key={c.key} style={{ padding: "6px 6px" }}>
                                    {c.calcul ? (
                                        <input
                                            value={ligne[c.key] ?? ""}
                                            disabled
                                            placeholder="auto"
                                            style={cellInput(true)}
                                        />
                                    ) : c.isCommune ? (
                                        <CommuneDropdown
                                            value={ligne[c.key] ?? ""}
                                            onChange={(val) => handleChange(ligne.id, c.key, val)}
                                        />
                                    ) : c.numeric ? (
                                        <input
                                            value={ligne[c.key] ?? ""}
                                            onChange={(e) => handleNumericChange(ligne.id, c.key, e.target.value)}
                                            placeholder="0"
                                            inputMode="decimal"
                                            style={{ ...cellInput(false), textAlign: "right" }}
                                        />
                                    ) : (
                                        <input
                                            value={ligne[c.key] ?? ""}
                                            onChange={(e) => handleChange(ligne.id, c.key, e.target.value)}
                                            style={cellInput(false)}
                                        />
                                    )}
                                </td>
                            ))}
                            <td style={{ textAlign: "center", padding: "0 4px" }}>
                                {lignes.length > 1 && (
                                    <button onClick={() => supprimerLigne(ligne.id)}
                                            style={{ color: C.red, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
                                        ✕
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}

                    {/* Ligne totaux */}
                    <tr style={{ background: "#fafafa", borderTop: `2px solid ${C.border}` }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: C.textDark, fontSize: 13 }}>Total Général</td>
                        {COLONNES.map((c) => (
                            <td key={c.key} style={{ padding: "4px 6px" }}>
                                {(c.calcul || CHAMPS_CA.includes(c.key) || c.key === "montant_marge_administree") ? (
                                    <div style={{
                                        border: `1px solid ${C.yellow}`, background: C.orangeBg, borderRadius: 4,
                                        padding: "8px 12px", fontSize: 13, textAlign: "right",
                                        fontWeight: 700, color: C.orangeText,
                                    }}>
                                        {getTotal(c.key) > 0 ? getTotal(c.key).toLocaleString("fr-FR") : "0"}
                                    </div>
                                ) : null}
                            </td>
                        ))}
                        <td></td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* Feedback */}
            {saveSucces && (
                <div style={{
                    marginTop: 16, padding: "12px 18px", background: "#f0fdf4",
                    border: "1px solid #86efac", borderRadius: 8, color: "#15803d",
                    fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
                }}>
                    ✅ Brouillon enregistré avec succès
                    {idDeclaration && <span style={{ fontWeight: 400, color: "#166534" }}>— vous pouvez continuer vers le récapitulatif</span>}
                </div>
            )}
            {saveErreur && (
                <div style={{
                    marginTop: 16, padding: "12px 18px", background: "#fef2f2",
                    border: "1px solid #fca5a5", borderRadius: 8, color: "#b91c1c", fontSize: 13,
                }}>
                    ⚠ {saveErreur}
                </div>
            )}

            {/* Boutons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
                <button
                    onClick={handleEnregistrer}
                    disabled={saveLoading}
                    style={{
                        display: "flex", alignItems: "center", gap: 8,
                        border: `1.5px solid ${C.orange}`, background: C.white,
                        color: C.orange, borderRadius: 6, padding: "11px 28px",
                        fontWeight: 700, fontSize: 14,
                        cursor: saveLoading ? "not-allowed" : "pointer",
                        opacity: saveLoading ? 0.7 : 1,
                    }}
                >
                    {saveLoading ? "Enregistrement..." : " Enregistrer"}
                </button>
                <button
                    onClick={() => {
                        if (!estEnregistre) {
                            alert("⚠ Veuillez enregistrer vos données avant de continuer.\nCliquez sur « Enregistrer » pour sauvegarder vos établissements.");
                            return;
                        }
                        onSuivant();
                    }}
                    style={{
                        background: C.orange, color: C.white, border: "none",
                        borderRadius: 8, padding: "11px 36px", fontWeight: 700,
                        fontSize: 14, cursor: "pointer",
                    }}
                >
                    Suivant →
                </button>
            </div>
        </div>
    );
}