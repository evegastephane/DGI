"use client";

import { useState, useEffect } from "react";
import C from "../../lib/utils/colors";
import { getContribuable, CURRENT_USER_ID } from "../../lib/api/contribuableApi";
import {
    HomeIcon, DashIcon, TaskIcon, CardIcon, ReceiptIcon,
    ListIcon, BellIcon, GearIcon, DocIcon, ExitIcon,
    ChevDown, ChevUp, CloseIcon,
} from "../../components/ui/Icons";

export default function Sidebar({ page, setPage, setSidebarOpen }) {
    const [irppOpen,        setIrppOpen]        = useState(false);
    const [notifOpen,       setNotifOpen]        = useState(false);
    const [profileExpanded, setProfileExpanded]  = useState(false);
    const [profil,          setProfil]           = useState(null);
    const [loadingProfil,   setLoadingProfil]    = useState(true);

    // ── Charger le contribuable depuis le backend ───────────────────────────
    useEffect(() => {
        setLoadingProfil(true);
        getContribuable(CURRENT_USER_ID)
            .then(setProfil)
            .catch(() => {
                // Fallback local si backend indisponible
                setProfil({
                    NIU:              "—",
                    prenom:           "Contribuable",
                    nom_beneficiaire: "",
                    raison_sociale:   "—",
                    email:            "—",
                    telephone:        "—",
                    statut:           "ACTIF",
                    regimeFiscal:     "—",
                    commune:          { nom_commune: "—" },
                });
            })
            .finally(() => setLoadingProfil(false));
    }, []);

    // ── Initiales avatar ─────────────────────────────────────────────────────
    const initiales = profil
        ? `${(profil.prenom?.[0] ?? "")}${(profil.nom_beneficiaire?.[0] ?? "")}`.toUpperCase()
        : "··";

    // ── Nom affiché ───────────────────────────────────────────────────────────
    const nomComplet = profil
        ? `${profil.prenom ?? ""} ${profil.nom_beneficiaire ?? ""}`.trim()
        : "";

    // ── Styles navigation — nouveau design ────────────────────────────────────
    const navBtn = (isActive) => ({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "calc(100% - 16px)", margin: "0 8px",
        padding: "12px 12px", border: "none", cursor: "pointer",
        borderRadius: 8, textAlign: "left", fontSize: 15,
        background: isActive ? C.orange : "transparent",
        color:      isActive ? C.white  : "#374151",
        fontWeight: isActive ? 600 : 400,
        boxShadow:  isActive ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
        transition: "background 0.15s",
    });

    const navBtnPlain = (isActive) => ({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%",
        padding: "12px 24px", border: "none", cursor: "pointer",
        borderRadius: 0, textAlign: "left", fontSize: 15,
        background: isActive ? C.orange : "transparent",
        color:      isActive ? C.white  : "#374151",
        fontWeight: isActive ? 600 : 400,
        transition: "background 0.15s",
    });

    const subBtn = (isActive) => ({
        display: "block", width: "100%", padding: "10px 24px 10px 56px",
        border: "none", cursor: "pointer", textAlign: "left", fontSize: 14,
        borderRadius: 0,
        background: isActive ? C.orange : "transparent",
        color:      isActive ? C.white  : "#4B5563",
        fontWeight: isActive ? 600 : 400,
        transition: "background 0.15s",
    });

    const onDeclaration = page === "declaration" || page === "step2" || page === "ajoutEtablissement";

    return (
        <nav style={{
            width: 254, minHeight: "100vh", background: C.white,
            display: "flex", flexDirection: "column", flexShrink: 0,
            boxShadow: "4px 0 10px rgba(0,0,0,0.05)", overflowY: "auto",
            position: "sticky", top: 0, maxHeight: "100vh", zIndex: 20,
        }}>

            {/* ── Bloc profil orange — nouveau design ── */}
            <div style={{
                background: C.orange, padding: "24px 20px",
                margin: "4px 4px 16px", borderRadius: 7,
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
                {/* Avatar */}
                <div style={{ position: "relative" }}>
                    <div style={{
                        width: 55, height: 55, borderRadius: "50%",
                        background: "#BDBDBD",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: C.white, fontWeight: 700, fontSize: 22,
                        border: "none",
                    }}>
                        {loadingProfil ? "··" : initiales}
                    </div>
                    {/* Indicateur en ligne */}
                    <span style={{
                        position: "absolute", bottom: 2, right: 2,
                        width: 14, height: 14, borderRadius: "50%",
                        background: "#22c55e", border: "2px solid #fff",
                    }} />
                </div>

                {/* NIU + Nom */}
                <div style={{ textAlign: "center" }}>
                    {loadingProfil ? (
                        <p style={{ color: "rgba(255,255,255,0.7)", margin: 0, fontSize: 13 }}>
                            Chargement...
                        </p>
                    ) : (
                        <>
                            <div
                                onClick={() => setProfileExpanded(!profileExpanded)}
                                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}
                            >
                                <p style={{ color: C.white, fontWeight: 700, margin: 0, fontSize: 15, letterSpacing: 0 }}>
                                    {profil?.NIU ?? "—"}
                                </p>
                                {profileExpanded ? <ChevUp /> : <ChevDown />}
                            </div>
                            <p style={{ color: "rgba(255,255,255,0.9)", margin: "2px 0 0", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
                                {nomComplet || "—"}
                            </p>
                        </>
                    )}
                </div>

                {/* Badge rôle */}
                <button style={{
                    border: `1px solid rgba(255,255,255,0.8)`, color: C.white,
                    background: "transparent", borderRadius: 6,
                    padding: "13px 13px 13px", fontSize: 14, fontWeight: 500,
                    letterSpacing: 1, cursor: "default", width: "100%", textAlign: "center",
                }}>
                    CONTRIBUABLE
                </button>

                {/* Détails dépliables */}
                {profileExpanded && profil && (
                    <div style={{ width: "100%", marginTop: 4 }}>
                        <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.3)", margin: "6px 0 12px" }} />
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.95)", display: "flex", flexDirection: "column", gap: 10 }}>
                            <InfoRow label="NIU"              value={profil.NIU} />
                            <InfoRow label="Régime fiscal"    value={profil.regimeFiscal} />
                            <InfoRow label="Structure Fiscale" value={profil.structureFiscale || profil.raison_sociale || "CDI YAOUNDE 2"} />
                            <InfoRow label="Phone number"     value={profil.telephone} />
                            <InfoRow label="Email"            value={profil.email} />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Navigation ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 16 }}>

                <button style={navBtn(page === "dashboard")} onClick={() => setPage("dashboard")}
                        onMouseEnter={(e) => { if (page !== "dashboard") e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseLeave={(e) => { if (page !== "dashboard") e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><DashIcon /> Tableau de Bord</span>
                </button>

                {/* Déclaration Patente — sous-menu */}
                <button style={navBtnPlain(onDeclaration || page === "mesDeclarations" || page === "authentifier")}
                        onClick={() => setIrppOpen(!irppOpen)}
                        onMouseEnter={(e) => { if (!onDeclaration) e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseLeave={(e) => { if (!onDeclaration) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><TaskIcon /> Déclaration Patente</span>
                    {irppOpen ? <ChevUp /> : <ChevDown />}
                </button>
                {irppOpen && (
                    <>
                        <button style={subBtn(onDeclaration)}              onClick={() => setPage("declaration")}
                                onMouseEnter={(e) => { if (!onDeclaration) e.currentTarget.style.background = "#f9fafb"; }}
                                onMouseLeave={(e) => { if (!onDeclaration) e.currentTarget.style.background = "transparent"; }}>Nouvelle Déclaration</button>
                        <button style={subBtn(page === "mesDeclarations")} onClick={() => setPage("mesDeclarations")}
                                onMouseEnter={(e) => { if (page !== "mesDeclarations") e.currentTarget.style.background = "#f9fafb"; }}
                                onMouseLeave={(e) => { if (page !== "mesDeclarations") e.currentTarget.style.background = "transparent"; }}>Mes Déclarations</button>
                        <button style={subBtn(page === "authentifier")}    onClick={() => setPage("authentifier")}
                                onMouseEnter={(e) => { if (page !== "authentifier") e.currentTarget.style.background = "#f9fafb"; }}
                                onMouseLeave={(e) => { if (page !== "authentifier") e.currentTarget.style.background = "transparent"; }}>Authentifier un document</button>
                        <button style={subBtn(page === "ajoutEtablissement")} onClick={() => setPage("ajoutEtablissement")}
                                onMouseEnter={(e) => { if (page !== "ajoutEtablissement") e.currentTarget.style.background = "#f9fafb"; }}
                                onMouseLeave={(e) => { if (page !== "ajoutEtablissement") e.currentTarget.style.background = "transparent"; }}>Ajouter Établissement</button>
                    </>
                )}

                <button style={navBtn(page === "Paiements")} onClick={() => setPage("Paiements")}
                        onMouseEnter={(e) => { if (page !== "Paiements") e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseLeave={(e) => { if (page !== "Paiements") e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><CardIcon /> Liste des Paiements</span>
                </button>

                <button style={navBtnPlain(page === "avis")} onClick={() => setPage("avis")}
                        onMouseEnter={(e) => { if (page !== "avis") e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseLeave={(e) => { if (page !== "avis") e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><ReceiptIcon /> Liste des Avis</span>
                </button>

                <button style={navBtnPlain(page === "AMR")} onClick={() => setPage("AMR")}
                        onMouseEnter={(e) => { if (page !== "AMR") e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseLeave={(e) => { if (page !== "AMR") e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><ListIcon /> Liste des AMRs</span>
                </button>

                {/* Notifications — sous-menu */}
                <button style={navBtn(page === "notifications" || notifOpen)} onClick={() => setNotifOpen(!notifOpen)}
                        onMouseEnter={(e) => { if (page !== "notifications") e.currentTarget.style.background = notifOpen ? C.orange : "#f9fafb"; }}
                        onMouseLeave={(e) => { if (page !== "notifications") e.currentTarget.style.background = notifOpen ? C.orange : "transparent"; }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><BellIcon /> Notifications</span>
                    {notifOpen ? <ChevUp /> : <ChevDown />}
                </button>
                {notifOpen && (
                    <button style={subBtn(page === "notifications")} onClick={() => setPage("notifications")}
                            onMouseEnter={(e) => { if (page !== "notifications") e.currentTarget.style.background = "#f9fafb"; }}
                            onMouseLeave={(e) => { if (page !== "notifications") e.currentTarget.style.background = "transparent"; }}>
                        Consulter vos notifications
                    </button>
                )}

                <button style={navBtnPlain(page === "Profile")} onClick={() => setPage("Profile")}
                        onMouseEnter={(e) => { if (page !== "Profile") e.currentTarget.style.background = "#f9fafb"; }}
                        onMouseLeave={(e) => { if (page !== "Profile") e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><GearIcon /> Mon profil</span>
                </button>

                <button style={navBtnPlain(false)}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><DocIcon /> Documents Fiscaux</span>
                </button>

                {/* Séparateur */}
                <div style={{ borderTop: `1px solid #e5e7eb`, margin: "8px 16px" }} />

                <button style={{ ...navBtnPlain(false), color: "#ef4444" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><ExitIcon /> Déconnexion</span>
                </button>
            </div>
        </nav>
    );
}

// ─── Composant ligne infos profil ─────────────────────────────────────────────
function InfoRow({ label, value }) {
    return (
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ fontWeight: 700, flexShrink: 0, minWidth: 72 }}>{label} :</span>
            <span style={{ wordBreak: "break-all", opacity: 0.9 }}>{value || "—"}</span>
        </div>
    );
}