"use client";

import { useState, useEffect } from "react";
import C from "../lib/utils/colors";
import { DonutChart, ItemCard, VoirPlus } from "../components/ui/Widgets";
import { EyeIcon, InfoIcon, CloseIcon, TrendIcon, DropIcon } from "../components/ui/Icons";
import { getDashboardStats, getDeclarationsParType } from "../lib/api/dashboardApi";
import {getAvisImposition, getDeclarations} from "../lib/api/declarationApi"; // adapte si nom différent
import { CURRENT_USER_ID } from "../lib/api/contribuableApi";

// ─── PageDashboard ─────────────────────────────────────────────────────────
export default function PageDashboard({ setPage }) {
    const [banniereVisible, setBanniereVisible] = useState(true);

    // ── États des données backend
    const [stats, setStats]               = useState(null);
    const [dprListe, setDprListe]         = useState([]);
    const [amrListe, setAmrListe]         = useState([]);
    const [declaParType, setDeclaParType] = useState([]);

    // ── États de chargement / erreur
    const [loading, setLoading] = useState(true);
    const [erreur,  setErreur]  = useState(null);

    // ── Fetch au montage
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setErreur(null);
            try {
                const [statsRes, declsRes, amrRes, parTypeRes] = await Promise.all([
                    getDashboardStats(CURRENT_USER_ID),
                    getDeclarations(CURRENT_USER_ID),
                    getAvisImposition(CURRENT_USER_ID),
                    getDeclarationsParType(),
                ]);

                setStats(statsRes);
                setDprListe(Array.isArray(declsRes) ? declsRes : declsRes?.content ?? []);
                setAmrListe(Array.isArray(amrRes)   ? amrRes   : amrRes?.content   ?? []);
                setDeclaParType(Array.isArray(parTypeRes) ? parTypeRes : []);
            } catch (err) {
                console.error("Erreur chargement dashboard:", err);
                setErreur("Impossible de charger les données. Vérifiez que le serveur est démarré.");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    // ── Valeurs dérivées depuis stats backend
    const dprGenerees  = stats?.declarations?.total     ?? "—";
    const dprSoumises  = stats?.declarations?.validees  ?? "—";
    const tauxSoumises = stats?.declarations?.taux_validation ?? 0;
    const tauxGenerees = stats && stats.declarations?.total > 0
        ? Math.round((stats.declarations.validees / stats.declarations.total) * 100)
        : 0;

    // ── Avis: on prend les déclarations avec statut VALIDEE comme "avis"
    const avisListe = dprListe.filter(d => d.statut === "VALIDEE");

    // ─── Écran de chargement ───────────────────────────────────────────────
    if (loading) {
        return (
            <main style={{ padding: "24px", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: C.textGrey }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                    <p style={{ fontSize: 14 }}>Chargement du tableau de bord…</p>
                </div>
            </main>
        );
    }

    // ─── Écran d'erreur ───────────────────────────────────────────────────
    if (erreur) {
        return (
            <main style={{ padding: "24px", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", maxWidth: 400 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                    <p style={{ color: "#c0392b", fontWeight: 600, marginBottom: 8 }}>Erreur de connexion</p>
                    <p style={{ fontSize: 13, color: C.textGrey, marginBottom: 16 }}>{erreur}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ background: C.orange, color: C.white, border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                    >
                        Réessayer
                    </button>
                </div>
            </main>
        );
    }

    // ─── Rendu principal ──────────────────────────────────────────────────
    return (
        <main style={{ padding: "24px 24px 40px", flex: 1 }}>

            {/* ── En-tête + sélecteur exercice ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Tableau de Bord</h1>
                <div style={{ border: "1px solid #c4c4c4", borderRadius: 4, padding: "6px 12px", background: C.white, width: 250, height: 52 }}>
                    <div style={{ fontSize: 11, color: "#777" }}>Exercice</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>EXERCICE 2025</span>
                        <DropIcon />
                    </div>
                </div>
            </div>

            {/* ── Bouton CTA ── */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button
                    onClick={() => setPage("declaration")}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: C.orange, color: C.white, border: "none", borderRadius: 6, padding: "10px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                >
                    <EyeIcon /> Consulter votre Déclaration
                </button>
            </div>

            {/* ── Bannière info (fermable) ── */}
            {banniereVisible && (
                <div style={{ background: "#F9D192", borderRadius: 8, padding: "14px 40px 14px 14px", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 24, position: "relative" }}>
                    <span style={{ color: C.orangeText, flexShrink: 0 }}><InfoIcon /></span>
                    <div>
                        <p style={{ fontWeight: 700, color: C.orangeText, margin: "0 0 4px", fontSize: 16 }}>Info</p>
                        <p style={{ color: C.orangeText, margin: 0, fontSize: 13, lineHeight: 1.6 }}>
                            Bienvenue sur votre espace fiscal. Vos données sont synchronisées en temps réel avec le serveur.
                        </p>
                    </div>
                    <button
                        onClick={() => setBanniereVisible(false)}
                        style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none", color: C.orangeText, cursor: "pointer" }}
                    >
                        <CloseIcon />
                    </button>
                </div>
            )}

            {/* ── Cartes statistiques ── */}
            <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>

                {/* DPR Générées */}
                <div style={{ background: C.white, borderRadius: 10, padding: "20px", flex: 1, minWidth: 200, boxShadow: C.shadow, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📁</div>
                    <div>
                        <p style={{ color: C.textGrey, margin: "0 0 6px", fontSize: 14 }}>DPR Générées</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{dprGenerees}</p>
                            <span style={{ fontSize: 13 }}>
                                {tauxGenerees}%
                                <span style={{ color: C.textDark, fontWeight: 400 }}> Total des DPR</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* DPR Soumises */}
                <div style={{ background: C.white, borderRadius: 10, padding: "20px", flex: 1, minWidth: 200, boxShadow: C.shadow, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FFBC2B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📋</div>
                    <div>
                        <p style={{ color: C.textGrey, margin: "0 0 6px", fontSize: 14 }}>DPR Soumises</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{dprSoumises}</p>
                            <span style={{ fontSize: 13, color: "#DEA400", display: "flex", alignItems: "center", gap: 3 }}>
                                <TrendIcon />{tauxSoumises}%
                                <span style={{ color: C.textDark }}> des DPR générées</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Donut + Liste DPR ── */}
            <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
                <div style={{ background: C.white, borderRadius: 10, padding: "20px 24px", width: 340, flexShrink: 0, boxShadow: C.shadow }}>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 16px" }}>Statut des Avis</p>
                    {/* On passe les données réelles au DonutChart si votre composant l'accepte */}
                    <DonutChart data={declaParType} />
                </div>

                <div style={{ background: C.white, borderRadius: 10, padding: "20px 24px", flex: 1, minWidth: 280, boxShadow: C.shadow, display: "flex", flexDirection: "column", gap: 12 }}>
                    <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>Liste des DPR générées</p>
                    <p style={{ fontSize: 13, color: C.textMid, textAlign: "right", margin: 0 }}>
                        showing {dprListe.length} of {stats?.declarations?.total ?? dprListe.length} rows
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {dprListe.length === 0 ? (
                            <EmptyState message="Aucune déclaration trouvée" />
                        ) : (
                            dprListe.map((d) => (
                                <ItemCard
                                    key={d.id_declaration ?? d.reference_declaration}
                                    reference={d.reference_declaration}
                                    annee={d.annee_fiscale}
                                    statut={d.statut}
                                />
                            ))
                        )}
                    </div>
                    <VoirPlus />
                </div>
            </div>

            {/* ── Avis + AMR ── */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                    { titre: "Liste des Avis", items: avisListe },
                    { titre: "Liste des AMR",  items: amrListe  },
                ].map(({ titre, items }) => (
                    <div key={titre} style={{ background: C.white, borderRadius: 10, padding: "20px 24px", flex: 1, minWidth: 280, boxShadow: C.shadow, display: "flex", flexDirection: "column", gap: 12 }}>
                        <p style={{ fontWeight: 600, fontSize: 15, margin: 0 }}>{titre}</p>
                        <p style={{ fontSize: 13, color: C.textMid, textAlign: "right", margin: 0 }}>
                            showing {items.length} of {items.length} rows
                        </p>
                        {items.length === 0 ? (
                            <EmptyState message="Aucune donnée à afficher pour le moment" />
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {items.map((a) => (
                                    <ItemCard
                                        key={a.id_declaration ?? a.id_AMR ?? a.reference_declaration ?? a.numero_AMR}
                                        reference={a.reference_declaration ?? `AMR-${a.numero_AMR}`}
                                        annee={a.annee_fiscale ?? new Date(a.date_emission).getFullYear()}
                                        statut={a.statut}
                                    />
                                ))}
                            </div>
                        )}
                        <VoirPlus />
                    </div>
                ))}
            </div>
        </main>
    );
}

// ─── Composant réutilisable : état vide ──────────────────────────────────────
function EmptyState({ message }) {
    return (
        <div style={{ border: `1px solid #e5e7eb`, borderRadius: 8, padding: "28px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
            {message}
        </div>
    );
}