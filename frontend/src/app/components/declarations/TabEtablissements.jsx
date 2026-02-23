"use client";

import { useState, useEffect, useCallback } from "react";
import C from "../../lib/utils/colors";
import { InfoIcon } from "../../components/ui/Icons";
import Spinner from "../../components/ui/Spinner";
import { getEtablissements } from "../../lib/api/contribuableApi";
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';

const COLONNES = [
    { key: "nom_etablissement", label: "Nom Etablissement" },
    { key: "type_activites", label: "Type d'activités" },
    { key: "commune", label: "Communes" },
    { key: "localisation", label: "Localisation" },
    { key: "montant_marge_administree", label: "Montant Marge administrée" },
    { key: "CA_jeux_de_hasard_et_divertissement", label: "CA jeux de hasard" },
    { key: "CA_boissons_non_alcoolisees", label: "CA_boissons_non_alcoolisees" },
    { key: "CA_boissons_alcoolisees", label: "CA Boisson alcoolisés" },
    { key: "CA_autres_activites", label: "CA autres activités" },
    { key: "CA_armes_et_munitions", label: "CA armes" },
    { key: "Total_CA", label: "Total CA" },
];

const TOTALISABLES = [
    "CA_jeux_de_hasard_et_divertissement",
    "CA_boissons_non_alcoolisees",
    "CA_boissons_alcoolisees",
    "CA_autres_activites",
    "CA_armes_et_munitions",
    "Total_CA",
];

const CHAMPS_POUR_TOTAL = ["CA_jeux_de_hasard_et_divertissement", "CA_boissons_non_alcoolisees", "CA_boissons_alcoolisees", "CA_autres_activites", "CA_armes_et_munitions"];

const ligneVide = (id) => ({
    id, nom_etablissement: "", type_activites: "", commune: "", localisation: "",
    montant_marge_administree: "", CA_jeux_de_hasard_et_divertissement: "",
    CA_boissons_non_alcoolisees: "", CA_boissons_alcoolisees: "", CA_autres_activites: "",
    CA_armes_et_munitions: "", Total_CA: "", _nouveau: true
});

export default function TabEtablissements() {
    const [lignes, setLignes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fileName, setFileName] = useState(""); // État pour le nom du fichier

    const readExcel = (file) => {
        setFileName(file.name); // On enregistre le nom du fichier
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet);

            const nouvellesLignes = rows.map((row, index) => {
                let l = ligneVide(Date.now() + index);
                COLONNES.forEach(col => {
                    if (row[col.label]) l[col.key] = row[col.label];
                });
                const somme = CHAMPS_POUR_TOTAL.reduce((acc, k) => acc + (parseFloat(l[k]) || 0), 0);
                l.Total_CA = somme > 0 ? somme : "";
                return l;
            });

            setLignes(prev => [...prev.filter(l => l.nom_etablissement !== ""), ...nouvellesLignes]);
        };
        reader.readAsBinaryString(file);
    };

    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            readExcel(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
    });

    useEffect(() => {
        getEtablissements()
            .then((data) => {
                if (data && data.length > 0) {
                    setLignes(data.map((e) => ({ ...e, id: e.id_etablissement })));
                } else {
                    setLignes([ligneVide(Date.now()), ligneVide(Date.now() + 1)]);
                }
            })
            .catch(() => setLignes([ligneVide(Date.now()), ligneVide(Date.now() + 1)]))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (id, champ, valeur) => {
        setLignes((prev) => {
            const nouvellesLignes = prev.map((l) => {
                if (l.id === id) {
                    const ligneMaj = { ...l, [champ]: valeur };
                    if (CHAMPS_POUR_TOTAL.includes(champ) || champ === "Total_CA") {
                        const somme = CHAMPS_POUR_TOTAL.reduce((acc, k) => acc + (parseFloat(ligneMaj[k]) || 0), 0);
                        ligneMaj.Total_CA = somme > 0 ? somme : "";
                    }
                    return ligneMaj;
                }
                return l;
            });
            const ligneActuelle = nouvellesLignes.find(l => l.id === id);
            const estDerniereLigne = nouvellesLignes[nouvellesLignes.length - 1].id === id;
            const estRemplie = COLONNES.every(col => {
                const val = ligneActuelle[col.key];
                return val !== undefined && val !== null && val.toString().trim() !== "";
            });
            if (estDerniereLigne && estRemplie) return [...nouvellesLignes, ligneVide(Date.now())];
            return nouvellesLignes;
        });
    };

    const ajouterLigne = () => setLignes((prev) => [...prev, ligneVide(Date.now())]);
    const supprimerLigne = (id) => setLignes((prev) => prev.filter((l) => l.id !== id));
    const getTotal = (cle) => lignes.reduce((acc, l) => acc + (parseFloat(l[cle]) || 0), 0);

    if (loading) return <Spinner />;

    return (
        <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                <div
                    {...getRootProps()}
                    style={{
                        border: `2px dashed ${C.orange}`,
                        borderRadius: 10,
                        padding: "32px 20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        background: isDragActive ? "#f0f7ff" : "#fffbf0",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                    }}
                >
                    <input {...getInputProps()} />
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke={C.orange} strokeWidth="1.5">
                        <path d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0-3 3m3-3v12" />
                    </svg>
                    <p style={{ color: C.orange, margin: "10px 0 0", fontSize: 13, textAlign: "center" }}>
                        {isDragActive ? "Lâchez pour importer" : "Glisser-déposer le fichier rempli ici"}
                    </p>
                    {/* Information sur le fichier chargé */}
                    {fileName && (
                        <div style={{ marginTop: 12, padding: "12px 24px", background: "#dcfce7", color: "#166534", borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
                            ✓ Fichier chargé : {fileName}
                        </div>
                    )}
                </div>

                <a
                    href="/modele.xlsx"
                    download="Modele_Declaration_Etablissements.xlsx"
                    style={{
                        alignSelf: "center",
                        fontSize: 12,
                        color: C.orange,
                        textDecoration: "underline",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                >
                    Télécharger la feuille de calcul modèle (.xlsx)
                </a>
            </div>

            <div style={{ background: C.orangeBg, borderRadius: 8, padding: "12px 20px", marginBottom: 20 }}>
                <span style={{ color: C.orange, fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}>I - Liste des établissements</span>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 1000 }}>
                    <thead>
                    <tr style={{ background: "#f9fafb" }}>
                        <th style={{ padding: "10px 8px", borderBottom: `1px solid ${C.border}`, minWidth: 110 }}></th>
                        {COLONNES.map((c) => (
                            <th key={c.key} style={{ padding: "10px 6px", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.textMid, textAlign: "center", fontSize: 11 }}>{c.label}</th>
                        ))}
                        <th style={{ width: 40 }}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {lignes.map((ligne, idx) => (
                        <tr key={ligne.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: "6px 8px", fontWeight: 500 }}>Etablissement {idx + 1}</td>
                            {COLONNES.map((c) => (
                                <td key={c.key} style={{ padding: "5px 4px" }}>
                                    <input
                                        value={ligne[c.key] ?? ""}
                                        onChange={(e) => handleChange(ligne.id, c.key, e.target.value)}
                                        disabled={c.key === "Total_CA"}
                                        style={{
                                            width: "100%",
                                            border: c.key === "Total_CA" ? `1px solid ${C.yellow}` : `1px solid ${C.border}`,
                                            borderRadius: 4,
                                            padding: "6px 8px",
                                            fontSize: 12,
                                            background: c.key === "Total_CA" ? C.orangeBg : "white",
                                            textAlign: TOTALISABLES.includes(c.key) ? "right" : "left",
                                            fontWeight: c.key === "Total_CA" ? 600 : 400
                                        }}
                                    />
                                </td>
                            ))}
                            <td style={{ textAlign: "center" }}>
                                <button onClick={() => supprimerLigne(ligne.id)} style={{ color: C.red, background: "none", border: "none", cursor: "pointer" }}>✕</button>
                            </td>
                        </tr>
                    ))}

                    {/* Ligne Totale avec couleurs corrigées */}
                    <tr style={{ background: "#fafafa", borderTop: `2px solid ${C.border}` }}>
                        <td style={{ padding: "10px 8px", fontWeight: 700, color: C.textDark }}>Total Général</td>
                        {COLONNES.map((c) => (
                            <td key={c.key} style={{ padding: "8px 4px" }}>
                                {TOTALISABLES.includes(c.key) ? (
                                    <div style={{
                                        border: `1px solid ${C.yellow}`,
                                        background: C.orangeBg,
                                        borderRadius: 4,
                                        padding: "6px 8px",
                                        fontSize: 12,
                                        textAlign: "right",
                                        fontWeight: 700,
                                        color: C.orangeText || C.orange
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

            <button onClick={ajouterLigne} style={{ marginTop: 14, border: `1px dashed ${C.orange}`, background: "#fffbf0", color: C.orange, borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                + Ajouter une ligne
            </button>
        </>
    );
}