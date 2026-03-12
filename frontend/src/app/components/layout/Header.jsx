"use client";

import { useState, useEffect, useRef } from "react";
import C from "../../lib/utils/colors";
import { MenuIcon, BellIcon, UserIcon, GlobeIcon, DropIcon } from "../../components/ui/Icons";
import { getNotifications, marquerNotificationLue, marquerToutesLues, getContribuable, CURRENT_USER_ID } from "../../lib/api/contribuableApi";

// ─── Formatage date courte ─────────────────────────────────────────────────
function formatDateCourte(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" });
}

// ─── Badge priorité ────────────────────────────────────────────────────────
function BadgePriorite({ priorite }) {
    const map = {
        haute:   { label: "Haute Priorité", bg: "#FEE2E2", color: "#DC2626" },
        normale: { label: "Priorité Normale", bg: "#FEF3C7", color: "#D97706" },
        basse:   { label: "Basse Priorité",  bg: "#DBEAFE", color: "#1D4ED8" },
    };
    const s = map[(priorite || "normale").toLowerCase()] ?? map.normale;
    return (
        <span style={{
            fontSize: 11, fontWeight: 600, padding: "2px 8px",
            borderRadius: 10, background: s.bg, color: s.color,
            display: "inline-block", whiteSpace: "nowrap",
        }}>
            {s.label}
        </span>
    );
}

// ─── Avatar expéditeur ─────────────────────────────────────────────────────
function Avatar({ expediteur }) {
    const couleurs = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];
    const str = expediteur ?? "DGI";
    const idx = str.charCodeAt(0) % couleurs.length;
    return (
        <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: couleurs[idx],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#fff",
        }}>
            {str.slice(0, 3).toUpperCase()}
        </div>
    );
}

// ─── Panneau dropdown notifications ───────────────────────────────────────
function NotifDropdown({ notifications, loading, onMarquerLu, onMarquerTous, onVoirTous }) {
    const [onglet, setOnglet] = useState("toutes");
    const nonLues = notifications.filter(n => !n.lu);
    const liste = onglet === "toutes" ? notifications : nonLues;

    return (
        <div style={{
            position: "absolute", top: "calc(100% + 12px)", right: 0,
            width: 400, maxHeight: 520,
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            border: "1px solid #e5e7eb",
            zIndex: 999,
            display: "flex", flexDirection: "column",
            overflow: "hidden",
        }}>
            {/* En-tête */}
            <div style={{ padding: "20px 20px 0" }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px", color: "#111827" }}>
                    Notifications
                </h3>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 14px", lineHeight: 1.5 }}>
                    NB: Pour marquer une notification comme lue, veuillez cliquer dessus, puis sur le bouton &quot;Marquer comme lu&quot;.
                </p>

                {/* Onglets */}
                <div style={{ display: "flex", borderBottom: "1.5px solid #e5e7eb" }}>
                    {[
                        { key: "toutes",   label: "Toutes" },
                        { key: "non_lues", label: `Non Lues(${nonLues.length})` },
                    ].map(o => {
                        const actif = onglet === o.key;
                        return (
                            <button key={o.key} onClick={() => setOnglet(o.key)} style={{
                                padding: "8px 16px", border: "none", background: "none",
                                cursor: "pointer", fontSize: 13,
                                fontWeight: actif ? 700 : 400,
                                color: actif ? C.orange : "#6b7280",
                                borderBottom: actif ? `2.5px solid ${C.orange}` : "2.5px solid transparent",
                                marginBottom: -1.5, transition: "all .15s",
                            }}>
                                {o.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Liste */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
                {loading ? (
                    <div style={{ padding: "32px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                        Chargement…
                    </div>
                ) : liste.length === 0 ? (
                    <div style={{ padding: "32px 0", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                        Aucune notification{onglet === "non_lues" ? " non lue" : ""}.
                    </div>
                ) : (
                    liste.map(n => (
                        <div key={n.id} style={{
                            display: "flex", gap: 12, padding: "14px 0",
                            borderBottom: "1px solid #f3f4f6",
                            opacity: n.lu ? 0.6 : 1,
                        }}>
                            <Avatar expediteur={n.expediteur} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                    <BadgePriorite priorite={n.priorite} />
                                    {!n.lu && (
                                        <span style={{
                                            width: 8, height: 8, borderRadius: "50%",
                                            background: C.orange, display: "inline-block", flexShrink: 0,
                                        }} />
                                    )}
                                    <span style={{ fontSize: 12, color: C.orange, marginLeft: "auto", whiteSpace: "nowrap" }}>
                                        {formatDateCourte(n.date)}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: n.lu ? 400 : 600, color: "#111827", marginBottom: 2 }}>
                                    {n.titre}
                                </div>
                                <div style={{ fontSize: 12, color: "#6b7280" }}>
                                    {n.expediteur === "DGI" ? "Direction Générale des Impôts" : n.expediteur}
                                </div>
                                {n.message && (
                                    <div style={{ fontSize: 12, color: "#374151", marginTop: 6, lineHeight: 1.5 }}>
                                        {n.message}
                                    </div>
                                )}
                                {!n.lu && (
                                    <button
                                        onClick={() => onMarquerLu(n.id)}
                                        style={{
                                            marginTop: 8, padding: "4px 12px",
                                            background: C.orange, color: "#fff",
                                            border: "none", borderRadius: 6,
                                            fontSize: 11, fontWeight: 600, cursor: "pointer",
                                        }}
                                    >
                                        Marquer comme lu
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pied */}
            <div style={{
                padding: "12px 20px",
                borderTop: "1px solid #f3f4f6",
                background: "#fafafa",
                display: "flex", justifyContent: "center",
            }}>
                <button
                    onClick={onVoirTous}
                    style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 13, fontWeight: 600, color: "#374151",
                        padding: "6px 16px", borderRadius: 8,
                        width: "100%",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                    Voir toutes les notifications
                </button>
            </div>
        </div>
    );
}

// ─── Dropdown utilisateur ──────────────────────────────────────────────────
function UserDropdown({ onParametrages, onDeconnexion, niu, email }) {
    return (
        <div style={{
            position: "absolute", top: "calc(100% + 12px)", right: 0,
            width: 280,
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            border: "1px solid #e5e7eb",
            zIndex: 999,
            overflow: "hidden",
        }}>
            {/* Profil */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px 14px" }}>
                <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "#f3f4f6", border: "1px solid #e5e7eb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#555", flexShrink: 0,
                }}>
                    <UserIcon />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.orange, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        P050517806522K
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        P050517806522K@impots.cm
                    </div>
                </div>
            </div>

            <div style={{ height: 1, background: "#f3f4f6" }} />

            {/* Paramètrages */}
            <button
                onClick={onParametrages}
                style={{
                    display: "flex", alignItems: "center", gap: 12,
                    width: "100%", padding: "13px 18px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, color: "#111827", fontWeight: 500,
                    textAlign: "left", transition: "background .12s", boxSizing: "border-box",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Paramètrages
            </button>

            <div style={{ height: 1, background: "#f3f4f6" }} />

            {/* Déconnexion */}
            <button
                onClick={onDeconnexion}
                style={{
                    display: "flex", alignItems: "center", gap: 12,
                    width: "100%", padding: "13px 18px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, color: "#111827", fontWeight: 500,
                    textAlign: "left", transition: "background .12s", boxSizing: "border-box",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Déconnexion
            </button>
        </div>
    );
}

// ─── Header principal ──────────────────────────────────────────────────────
export default function Header({ sidebarOpen, setSidebarOpen, notifCount = 0, onNotifCountChange, setPage, refreshKey = 0 }) {
    const [open,          setOpen]          = useState(false);
    const [userOpen,      setUserOpen]      = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading,       setLoading]       = useState(false);
    const [contribuable,  setContribuable]  = useState(null);
    const wrapperRef     = useRef(null);
    const userWrapperRef = useRef(null);

    // Charger le contribuable actif une seule fois au montage
    useEffect(() => {
        getContribuable(CURRENT_USER_ID)
            .then(data => setContribuable(data))
            .catch(() => {});
    }, []);

    const niu   = contribuable?.NIU   ?? contribuable?.niu   ?? "—";
    const email = contribuable?.email ?? "—";

    // Fermer les dropdowns en cliquant dehors
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
            if (userWrapperRef.current && !userWrapperRef.current.contains(e.target)) setUserOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Charger les notifications quand refreshKey change
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getNotifications(CURRENT_USER_ID);
                data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                setNotifications(data);
                if (onNotifCountChange) onNotifCountChange(data.filter(n => !n.lu).length);
            } catch {
                // silencieux
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [refreshKey]);

    const handleToggle = async () => {
        setUserOpen(false);
        setOpen(prev => !prev);
        if (!open) {
            setLoading(true);
            try {
                const data = await getNotifications(CURRENT_USER_ID);
                data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                setNotifications(data);
                if (onNotifCountChange) onNotifCountChange(data.filter(n => !n.lu).length);
            } catch {
                // silencieux
            } finally {
                setLoading(false);
            }
        }
    };

    const handleMarquerLu = async (id) => {
        try {
            await marquerNotificationLue(id);
            const updated = notifications.map(n => n.id === id ? { ...n, lu: true } : n);
            setNotifications(updated);
            if (onNotifCountChange) onNotifCountChange(updated.filter(n => !n.lu).length);
        } catch {
            // silencieux
        }
    };

    const handleMarquerTous = async () => {
        try {
            await marquerToutesLues(CURRENT_USER_ID);
            const updated = notifications.map(n => ({ ...n, lu: true }));
            setNotifications(updated);
            if (onNotifCountChange) onNotifCountChange(0);
        } catch {
            // silencieux
        }
    };

    const handleVoirTous = () => {
        setOpen(false);
        if (setPage) setPage("notifications");
    };

    const count = notifications.filter(n => !n.lu).length;

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
            marginLeft: 18,
            top: 0,
            zIndex: 100,
        }}>
            {/* Hamburger */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMid }}
            >
                <MenuIcon />
            </button>

            <div style={{ flex: 1 }} />

            {/* Cloche + dropdown notifications */}
            <div ref={wrapperRef} style={{ position: "relative", marginRight: 8 }}>
                <button
                    onClick={handleToggle}
                    style={{
                        background: open ? "#f3f4f6" : "none",
                        border: "none", cursor: "pointer",
                        color: "#555", lineHeight: 0,
                        borderRadius: "50%", width: 40, height: 40,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .15s",
                    }}
                >
                    <BellIcon size={24} />
                </button>
                {count > 0 && (
                    <span style={{
                        position: "absolute", top: 2, right: 2,
                        background: C.red, color: C.white, borderRadius: "50%",
                        width: 18, height: 18, fontSize: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, pointerEvents: "none",
                    }}>
                        {count > 99 ? "99+" : count}
                    </span>
                )}
                {open && (
                    <NotifDropdown
                        notifications={notifications}
                        loading={loading}
                        onMarquerLu={handleMarquerLu}
                        onMarquerTous={handleMarquerTous}
                        onVoirTous={handleVoirTous}
                    />
                )}
            </div>

            {/* Bonhomme + dropdown utilisateur */}
            <div ref={userWrapperRef} style={{ position: "relative", marginRight: 8 }}>
                <button
                    onClick={() => { setOpen(false); setUserOpen(prev => !prev); }}
                    style={{
                        background: userOpen ? "#f3f4f6" : "none",
                        border: "none", cursor: "pointer",
                        color: "#555", lineHeight: 0,
                        borderRadius: "50%", width: 40, height: 40,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background .15s",
                    }}
                >
                    <UserIcon />
                </button>
                {userOpen && (
                    <UserDropdown
                        niu={niu}
                        email={email}
                        onParametrages={() => { setUserOpen(false); if (setPage) setPage("Profile"); }}
                        onDeconnexion={() => { setUserOpen(false); /* logique déconnexion */ }}
                    />
                )}
            </div>

            {/* Langue */}
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