"use client";

import C from "../../lib/utils/colors";
import { MenuIcon, BellIcon, UserIcon, GlobeIcon, DropIcon } from "../../components/ui/Icons";

// ─── Header ────────────────────────────────────────────────────────────────
// Props :
//   sidebarOpen    → état courant de la sidebar
//   setSidebarOpen → toggle la sidebar
//   notifCount     → nombre de notifications non lues (badge)

export default function Header({ sidebarOpen, setSidebarOpen, notifCount = 0 }) {
    return (
        <header style={{
            background: C.white,
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            padding: "0 20px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 100,
        }}>
            {/* Bouton hamburger — toggle sidebar */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMid }}
            >
                <MenuIcon />
            </button>

            <div style={{ flex: 1 }} />

            {/* Cloche avec badge notifications */}
            <div style={{ position: "relative", marginRight: 8 }}>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "#555", lineHeight: 0 }}>
                    <BellIcon size={24} />
                </button>
                {notifCount > 0 && (
                    <span style={{
                        position: "absolute", top: -2, right: -2,
                        background: C.red, color: C.white, borderRadius: "50%",
                        width: 18, height: 18, fontSize: 10,
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                    }}>
            {notifCount}
          </span>
                )}
            </div>

            {/* Avatar utilisateur */}
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#555", lineHeight: 0, marginRight: 8 }}>
                <UserIcon />
            </button>

            {/* Sélecteur de langue */}
            <div style={{
                display: "flex", alignItems: "center", gap: 4,
                border: `1px solid ${C.border}`, borderRadius: 4,
                padding: "5px 10px", fontSize: 13, color: C.textMid, cursor: "pointer",
            }}>
                <GlobeIcon /> <span>Français</span> <DropIcon />
            </div>
        </header>
    );
}