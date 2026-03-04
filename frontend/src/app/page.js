"use client";

import { useState, useEffect, useCallback } from "react";
import C from "../app/lib/utils/colors";

// ── Layout ────────────────────────────────────────────────────────────────
import Sidebar from "../app/components/layout/Sidebar";
import Header  from "../app/components/layout/Header";
import Footer  from "../app/components/layout/Footer";

// ── Pages ─────────────────────────────────────────────────────────────────
import PageDashboard          from "../app/dashboard/page";
import PageListeDesAvis from "../app/avis/page";
import { PageStep1, PageStep2 } from "../app/declaration/page";
import MesDeclarations from "./components/declarations/MesDeclarations";
import ListePaiementsPage from "./Paiements/page";
import PageListeDesAMRs from "./AMR/page";
import PageNotifications from "./notifications/page";
import PageMonProfil from "./Profile/page";
import PageAuthentifier from "./authentifier/page";
import TabAjoutEtablissement from "./components/declarations/TabAjoutEtablissement";

// ── API ───────────────────────────────────────────────────────────────────
import { getNotifications, CURRENT_USER_ID } from "./lib/api/contribuableApi";

// ═══════════════════════════════════════════════════════════════════════════
// page.js — Point d'entrée principal
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
    const [page, setPage]   = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [declarationContext, setDeclarationContext] = useState({});
    const [draftAEditer, setDraftAEditer] = useState(null); // déclaration DRAFT en cours d'édition
    const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

    // ── Compteur de notifications non lues (badge cloche) ─────────────────
    const [notifCount, setNotifCount] = useState(0);
    const [notifRefreshKey, setNotifRefreshKey] = useState(0);

    const refreshNotifCount = useCallback(async () => {
        try {
            const notifs = await getNotifications(CURRENT_USER_ID);
            setNotifCount(notifs.filter((n) => !n.lu).length);
        } catch {
            // silencieux — le badge restera à 0 si le backend est inaccessible
        }
    }, []);

    // Charger au démarrage
    useEffect(() => {
        refreshNotifCount();
    }, [refreshNotifCount]);

    // Rafraîchir le badge toutes les 30 secondes (polling léger)
    useEffect(() => {
        const interval = setInterval(refreshNotifCount, 30000);
        return () => clearInterval(interval);
    }, [refreshNotifCount]);

    // Appelé depuis TabRecapitulatif après soumission réussie → refresh dashboard + notifs
    // Ouvrir l'édition d'un brouillon existant
    const onModifierDraft = (decl) => {
        setDraftAEditer(decl);
        setDeclarationContext({ exercice: String(decl.annee || new Date().getFullYear()) });
        setPage("step2");
    };

    const onDeclarationSoumise = () => {
        setDashboardRefreshKey(k => k + 1);
        // Refresh badge + page notifications avec un léger délai pour laisser le backend créer la notif
        setTimeout(() => {
            refreshNotifCount();
            setNotifRefreshKey(k => k + 1);
        }, 800);
        setDraftAEditer(null);
        setPage("dashboard");
    };

    return (
        <div style={{
            display: "flex",
            minHeight: "100vh",
            fontFamily: "'Segoe UI', Arial, sans-serif",
            background: C.bg,
        }}>

            {/* ── Sidebar (masquée quand sidebarOpen = false) ── */}
            {sidebarOpen && (
                <Sidebar
                    page={page}
                    setPage={setPage}
                    setSidebarOpen={setSidebarOpen}
                />
            )}

            {/* ── Zone principale ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                <Header
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    notifCount={notifCount}
                    onNotifCountChange={setNotifCount}
                    setPage={setPage}
                    refreshKey={notifRefreshKey}
                />

                {/* Rendu conditionnel de la page active */}
                {page === "dashboard"   && <PageDashboard setPage={setPage} refreshKey={dashboardRefreshKey} />}
                {page === "declaration" && <PageStep1 setPage={setPage} setDeclarationContext={setDeclarationContext} />}
                {page === "mesDeclarations" && <MesDeclarations setPage={setPage} onModifierDraft={onModifierDraft} />}
                {page === "step2"       && <PageStep2 setPage={setPage} declarationContext={declarationContext} onDeclarationSoumise={onDeclarationSoumise} draftAEditer={draftAEditer} />}
                {page === "avis" && <PageListeDesAvis setPage={setPage} />}
                {page === "Paiements" && <ListePaiementsPage setPage={setPage} />}
                {page === "AMR" && <PageListeDesAMRs setPage={setPage} />}
                {page === "notifications" && (
                    <PageNotifications
                        setPage={setPage}
                        refreshKey={notifRefreshKey}
                        onNotifRead={refreshNotifCount}
                    />
                )}
                {page === "Profile" && <PageMonProfil setPage={setPage} />}
                {page === "authentifier" && <PageAuthentifier setPage={setPage} />}
                {page === "ajoutEtablissement" && <TabAjoutEtablissement setPage={setPage} />}

                <Footer />
            </div>
        </div>
    );
}