"use client";

import { useState, useEffect } from "react";
import C from "../../lib/utils/colors";
import { getContribuable } from "../../lib/api/contribuableApi";
import {
    HomeIcon, DashIcon, TaskIcon, CardIcon, ReceiptIcon,
    ListIcon, BellIcon, GearIcon, DocIcon, ExitIcon,
    ChevDown, ChevUp, CloseIcon,
} from "../../components/ui/Icons";



// ─── Sidebar ───────────────────────────────────────────────────────────────
// Props :
//   page          → quelle page est active ("dashboard" | "declaration" | "step2")
//   setPage       → changer de page
//   setSidebarOpen→ fermer la sidebar
export default function Sidebar({ page, setPage, setSidebarOpen }) {
    const [irppOpen,        setIrppOpen]        = useState(true);
    const [notifOpen,       setNotifOpen]        = useState(false);
    const [profileExpanded, setProfileExpanded]  = useState(true);

    // ── Données contribuable depuis l'API ──────────────────────────────────
    const [profil, setProfil] = useState(null);

    useEffect(() => {
        getContribuable()
            .then(setProfil)
            .catch(() => {
                // Fallback si le backend n'est pas démarré
                setProfil({
                    NIU: "NIU123456789",
                    prenom: "Jean",
                    nom_beneficiaire: "Dupont",
                    raison_sociale: "Dupont & Fils",
                    email: "jean.dupont@example.cm",
                    telephone: "+237 690 000 001",
                    regimeFiscal: "NON PROFESSIONNEL",
                    commune: { nom_commune: "Yaoundé I" },
                });
            });
    }, []);

    const initiales = profil
        ? `${profil.prenom?.[0] ?? ""}${profil.nom_beneficiaire?.[0] ?? ""}`.toUpperCase()
        : "..";

    const navBtn = (isActive) => ({
        display: "flex", alignItems: "center", justifyContent: "space-between",
        width: "100%", padding: "12px 20px", border: "none", cursor: "pointer",
        textAlign: "left", fontSize: 14,
        background: isActive ? C.orange : "transparent",
        color:      isActive ? C.white  : C.textMid,
        fontWeight: isActive ? 600 : 400,
    });

    const subBtn = (isActive) => ({
        display: "block", width: "100%", padding: "10px 20px 10px 52px",
        border: "none", cursor: "pointer", textAlign: "left", fontSize: 14,
        background: isActive ? C.orange : "transparent",
        color:      isActive ? C.white  : C.textMid,
        fontWeight: isActive ? 600 : 400,
    });

    const onDeclaration = page === "declaration" || page === "step2";

    return (
        <nav style={{ width: 270, minHeight: "100vh", background: C.white, display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "2px 0 6px rgba(0,0,0,0.08)", overflowY: "auto", position: "sticky", top: 0, maxHeight: "100vh", padding: "5px" }}>

            {/* ── Bloc profil orange ── */}
            <div style={{ background: C.orange, padding: "16px 16px 20px", marginBottom: 6, borderRadius: 10 }}>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    {/* Avatar */}
                    <div style={{ position: "relative" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 20 }}>
                            {initiales}
                        </div>
                        <span style={{ position: "absolute", bottom: 3, right: 3, width: 13, height: 13, borderRadius: "50%", background: "#22c55e", border: `2px solid ${C.orange}` }} />
                    </div>

                    {/* Nom */}
                    <div style={{ textAlign: "center" }}>
                        <p style={{ color: C.white, fontWeight: 700, margin: 0, fontSize: 14 }}>
                            {profil?.NIU ?? "Chargement..."}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                            <p style={{ color: C.white, margin: 0, fontSize: 12 }}>
                                {profil ? `${profil.prenom} ${profil.nom_beneficiaire}` : "..."}
                            </p>
                            <button onClick={() => setProfileExpanded(!profileExpanded)} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", padding: 0 }}>
                                {profileExpanded ? <ChevUp /> : <ChevDown />}
                            </button>
                        </div>
                    </div>

                    <button style={{ border: `2px solid ${C.white}`, color: C.white, background: "transparent", borderRadius: 6, padding: "10px 0", fontSize: 16, fontWeight: 700, letterSpacing: 1, cursor: "pointer", width: "90%", textAlign: "center" }}>
                        CONTRIBUABLE
                    </button>

                    {/* Détails dépliables */}
                    {profileExpanded && profil && (
                        <div style={{ width: "100%", marginTop: 4 }}>
                            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.4)", margin: "6px 0 10px" }} />
                            <div style={{ fontSize: 12, color: C.white, lineHeight: 2.1 }}>
                                <div>NIU: {profil.NIU}</div>
                                <div>Structure: {profil.structure ?? profil.regimeFiscal ?? "—"}</div>
                                <div>Commune: {profil.commune?.nom_commune ?? "—"}</div>
                                <div>Tél: {profil.telephone}</div>
                                <div>Email: {profil.email}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Navigation ── */}
            <div style={{ flex: 1 }}>
                <button style={ }>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><HomeIcon /> Accueil</span>
                </button>
                <button style={navBtn(page === "dashboard")} onClick={() => setPage("dashboard")}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><DashIcon /> Tableau de Bord</span>
                </button>

                <button style={navBtn(onDeclaration)} onClick={() => setIrppOpen(!irppOpen)}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><TaskIcon /> Déclaration IRPP</span>
                    {irppOpen ? <ChevUp /> : <ChevDown />}
                </button>
                {irppOpen && (<>
                    <button style={subBtn(onDeclaration)} onClick={() => setPage("declaration")}>Nouvelle Declaration</button>
                    <button style={subBtn(false)}>Mes Déclarations</button>
                    <button style={subBtn(false)}>Authentifier un document</button>
                </>)}

                <button style={navBtn(false)}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><CardIcon /> Liste des Paiements</span></button>
                <button style={navBtn(false)}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><ReceiptIcon /> Liste des Avis</span></button>
                <button style={navBtn(false)}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><ListIcon /> Liste des AMRs</span></button>

                <button style={navBtn(false)} onClick={() => setNotifOpen(!notifOpen)}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}><BellIcon /> Notifications</span>
                    {notifOpen ? <ChevUp /> : <ChevDown />}
                </button>
                {notifOpen && (<>
                    <button style={subBtn(false)}>Toutes</button>
                    <button style={subBtn(false)}>Non Lues</button>
                </>)}

                <button style={navBtn(false)}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><GearIcon /> Mon profil</span></button>
                <button style={navBtn(false)}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><DocIcon /> Documents Fiscaux</span></button>
                <button style={navBtn(false)}><span style={{ display: "flex", alignItems: "center", gap: 10 }}><ExitIcon /> Déconnexion</span></button>
            </div>
        </nav>
    );
}