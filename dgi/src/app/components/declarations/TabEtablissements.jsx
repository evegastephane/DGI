"use client";

import { useState, useEffect } from "react";
import C from "../../lib/utils/colors";
import { InfoIcon } from "../../components/ui/Icons";



// ─── Composant principal ───────────────────────────────────────────────────
// ─── Colonnes du tableau ───────────────────────────────────────────────────

const COLONNES = [
    { key: "nom_etablissement",                  label: "Nom Etablissement"         },
    { key: "type_activites",                     label: "Type d'activités"          },
    { key: "commune",                            label: "Communes"                  },
    { key: "localisation",                       label: "Localisation"              },
    { key: "montant_marge_administree",          label: "Montant Marge administrée" },
    { key: "CA_jeux_de_hasard_et_divertissement",label: "CA jeux de hasard"         },
    { key: "CA_boissons_non_alcoolisees",        label: "CA_boissons_non_alcoolisees"   },
    { key: "CA_boissons_alcoolisees",            label: "CA Boisson alcoolisés"     },
    { key: "CA_autres_activites",            label: "CA autres activités"     },
    { key: "CA_armes",            label: "CA armes"     },
];

const TOTALISABLES = [
    "CA_jeux_de_hasard_et_divertissement",
    "CA_boissons_non_alcoolisees",
    "CA_boissons_alcoolisees",
    "CA_autres_activites",
    "CA_armes",
];

const ligneVide = (id) => ({
    id, nom_etablissement: "", type_activites: "", commune: "", localisation: "",
    montant_marge_administree: "", CA_jeux_de_hasard_et_divertissement: "",
    CA_boissons_non_alcoolisees: "", CA_boissons_alcoolisees: "",CA_autres_activites: "", CA_armes: "",
    _nouveau: true, // flag : ligne ajoutée manuellement
});

// ─── Composant ─────────────────────────────────────────────────────────────
export default function TabEtablissements() {
    const [lignes,  setLignes]  = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Pré-charger les établissements existants ─────────────────────────────
    // ✅ MODIFIÉ : GET /api/contribuables/1/etablissements
    useEffect(() => {
        getEtablissements()
            .then((data) => {
                if (data.length > 0) {
                    // Mapper les champs API → état local
                    setLignes(data.map((e) => ({ ...e, id: e.id_etablissement })));
                } else {
                    setLignes([ligneVide(1), ligneVide(2)]);
                }
            })
            .catch(() => setLignes([ligneVide(1), ligneVide(2)]))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (id, champ, valeur) =>
        setLignes((prev) => prev.map((l) => l.id === id ? { ...l, [champ]: valeur } : l));

    const ajouterLigne = () =>
        setLignes((prev) => [...prev, ligneVide(Date.now())]);

    const supprimerLigne = (id) =>
        setLignes((prev) => prev.filter((l) => l.id !== id));

    const getTotal = (cle) =>
        lignes.reduce((acc, l) => acc + (parseFloat(l[cle]) || 0), 0);

    if (loading) return <Spinner />;

    return (
        <>
            {/* Bannière info */}
            <div style={{ background: C.orangeBg, borderRadius: 8, padding: "14px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20 }}>
                <span style={{ color: C.orangeText, flexShrink: 0, marginTop: 2 }}><InfoIcon /></span>
                <div>
                    <p style={{ fontWeight: 700, color: C.orangeText, margin: "0 0 4px", fontSize: 14 }}>Info</p>
                    <p style={{ color: C.orangeText, margin: 0, fontSize: 12, lineHeight: 1.6 }}>
                        Les établissements existants sont pré-remplis depuis votre dossier. Vous pouvez en ajouter ou supprimer.
                    </p>
                </div>
            </div>

            {/* Zone upload */}
            <div style={{ border: `2px dashed ${C.orange}`, borderRadius: 10, padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24, background: "#fffbf0", cursor: "pointer" }}>
                <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke={C.orange} strokeWidth="1.5">
                    <path d="M7 16a4 4 0 0 1-.88-7.903A5 5 0 1 1 15.9 6L16 6a5 5 0 0 1 1 9.9M15 13l-3-3m0 0-3 3m3-3v12" />
                </svg>
                <p style={{ color: C.orange, margin: 0, fontSize: 13, textAlign: "center" }}>
                    Glisser-déposer votre fichier ou{" "}
                    <span style={{ textDecoration: "underline", fontWeight: 600 }}>Télécharger l'annexe</span>
                </p>
            </div>

            {/* Titre */}
            <div style={{ background: C.orangeBg, borderRadius: 8, padding: "12px 20px", marginBottom: 20 }}>
        <span style={{ color: C.orange, fontWeight: 700, fontSize: 18, fontFamily: "monospace" }}>
          I - Liste des établissements
        </span>
            </div>

            {/* Tableau */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
                    <thead>
                    <tr style={{ background: "#f9fafb" }}>
                        <th style={{ padding: "10px 8px", borderBottom: `1px solid ${C.border}`, minWidth: 110 }}></th>
                        {COLONNES.map((c) => (
                            <th key={c.key} style={{ padding: "10px 6px", borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.textMid, textAlign: "center", fontSize: 11, minWidth: 110 }}>
                                {c.label}
                            </th>
                        ))}
                        <th style={{ width: 40 }}></th>
                    </tr>
                    </thead>
                    <tbody>
                    {lignes.map((ligne, idx) => (
                        <tr key={ligne.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                            <td style={{ padding: "6px 8px", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>
                                Etablissement {idx + 1}
                                {!ligne._nouveau && (
                                    <span style={{ marginLeft: 6, fontSize: 10, color: "#22c55e", fontWeight: 700 }}>✓ existant</span>
                                )}
                            </td>
                            {COLONNES.map((c) => (
                                <td key={c.key} style={{ padding: "5px 4px" }}>
                                    <input
                                        value={ligne[c.key] ?? ""}
                                        onChange={(e) => handleChange(ligne.id, c.key, e.target.value)}
                                        placeholder="..."
                                        style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 4, padding: "6px 8px", fontSize: 12, boxSizing: "border-box", background: ligne._nouveau ? C.white : "#f0fdf4" }}
                                    />
                                </td>
                            ))}
                            <td style={{ padding: "5px 4px", textAlign: "center" }}>
                                <button onClick={() => supprimerLigne(ligne.id)}
                                        style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16 }}>✕</button>
                            </td>
                        </tr>
                    ))}

                    {/* Ligne totaux */}
                    <tr style={{ background: "#fafafa" }}>
                        <td style={{ padding: "8px", fontWeight: 700, fontSize: 12 }}>Total</td>
                        {COLONNES.map((c) => (
                            <td key={c.key} style={{ padding: "5px 4px" }}>
                                {TOTALISABLES.includes(c.key) ? (
                                    <div style={{ border: `1px solid ${C.yellow}`, background: C.orangeBg, borderRadius: 4, padding: "6px 8px", fontSize: 12, textAlign: "right", minHeight: 30 }}>
                                        {getTotal(c.key) > 0 ? getTotal(c.key).toLocaleString("fr-FR") : ""}
                                    </div>
                                ) : <div style={{ minHeight: 30 }} />}
                            </td>
                        ))}
                        <td />
                    </tr>
                    </tbody>
                </table>
            </div>

            <button onClick={ajouterLigne}
                    style={{ marginTop: 14, border: `1px dashed ${C.orange}`, background: "#fffbf0", color: C.orange, borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                + Ajouter un établissement
            </button>
        </>
    );
}