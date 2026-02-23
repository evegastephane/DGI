"use client";

import { useState } from "react";
import C from "../app/lib/utils/colors";

// ── Layout ────────────────────────────────────────────────────────────────
import Sidebar from "../app/components/layout/Sidebar";
import Header  from "../app/components/layout/Header";
import Footer  from "../app/components/layout/Footer";

// ── Pages ─────────────────────────────────────────────────────────────────
import PageDashboard          from "../app/dashboard/page";
import PageListeDesAvis from "../app/avis/page";
import { PageStep1, PageStep2 } from "../app/declaration/page";

// ── Données ───────────────────────────────────────────────────────────────
import mockData from "./data/mockData.json";


// ═══════════════════════════════════════════════════════════════════════════
// page.js — Point d'entrée principal
//
// Gestion de la navigation par état (pas de router Next.js ici)
// page peut valoir :
//   "dashboard"   → Tableau de bord
//   "declaration" → Étape 1 — choisir l'exercice
//   "step2"       → Étape 2 — formulaire Déclaration Patente
// ═══════════════════════════════════════════════════════════════════════════

export default function App() {
    const [page, setPage]   = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Nombre de notifications non lues → badge dans le header
    const notifCount = mockData.notifications.filter((n) => !n.lue).length;

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
                />

                {/* Rendu conditionnel de la page active */}
                {page === "dashboard"   && <PageDashboard setPage={setPage} />}
                {page === "declaration" && <PageStep1 setPage={setPage} />}
                {page === "step2"       && <PageStep2 setPage={setPage} />}
                {page === "avis" && <PageListeDesAvis setPage={setPage} />}

                <Footer />
            </div>
        </div>
    );
}