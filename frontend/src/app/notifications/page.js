"use client";

import { useState, useEffect } from "react";
import C from "../lib/utils/colors";
import { getNotifications, marquerNotificationLue, marquerToutesLues, CURRENT_USER_ID } from "../lib/api/contribuableApi";

// ─── Badge priorité ───────────────────────────────────────────────────────
function BadgePriorite({ priorite }) {
    const map = {
        haute:   { label: "Haute Priorité",  bg: "#FEE2E2", color: "#DC2626" },
        normale: { label: "Priorité Normale", bg: "#FEF3C7", color: "#D97706" },
        basse:   { label: "Basse Priorité",   bg: "#DBEAFE", color: "#1D4ED8" },
    };
    const s = map[priorite] ?? map.normale;
    return (
        <span style={{
            fontSize: 12, fontWeight: 600, padding: "3px 10px",
            borderRadius: 12, background: s.bg, color: s.color,
            display: "inline-block",
        }}>
            {s.label}
        </span>
    );
}

// ─── Avatar expéditeur ────────────────────────────────────────────────────
function Avatar({ expediteur }) {
    const couleurs = ["#7C3AED", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444"];
    const idx      = (expediteur ?? "DGI").charCodeAt(0) % couleurs.length;
    const initiales = (expediteur ?? "DGI").slice(0, 3).toUpperCase();
    return (
        <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: couleurs[idx],
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#fff",
        }}>
            {initiales}
        </div>
    );
}

// ─── Formatage date ───────────────────────────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
}

// ─── Carte notification ───────────────────────────────────────────────────
function CarteNotification({ notif, selectionne, onClick, onMarquerLu }) {
    return (
        <div
            onClick={onClick}
            style={{
                display: "flex", gap: 16, padding: "20px 0",
                borderBottom: `1px solid #F3F4F6`, cursor: "pointer",
                background: selectionne ? C.orangeBg : "transparent",
                transition: "background 0.15s",
                opacity: notif.lu ? 0.65 : 1,
            }}
            onMouseEnter={(e) => { if (!selectionne) e.currentTarget.style.background = "#FAFAFA"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = selectionne ? C.orangeBg : "transparent"; }}
        >
            <Avatar expediteur={notif.expediteur} />

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <BadgePriorite priorite={notif.priorite} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.orange, whiteSpace: "nowrap", marginLeft: 12 }}>
                        {formatDate(notif.date)}
                    </span>
                </div>

                <div style={{ fontSize: 15, fontWeight: notif.lu ? 400 : 600, color: C.textDark, marginBottom: 6 }}>
                    {notif.titre}
                </div>

                <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.6 }}>
                    {notif.message}
                </div>

                {selectionne && !notif.lu && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onMarquerLu(notif.id); }}
                        style={{
                            marginTop: 12, padding: "7px 16px",
                            background: C.orange, color: C.white,
                            border: "none", borderRadius: 6,
                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#E09510")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = C.orange)}
                    >
                        Marquer comme lu
                    </button>
                )}
            </div>

            {!notif.lu && (
                <div style={{
                    width: 9, height: 9, borderRadius: "50%",
                    background: C.orange, flexShrink: 0, marginTop: 6,
                }} />
            )}
        </div>
    );
}

// ─── Page principale ──────────────────────────────────────────────────────
export default function PageNotifications({ refreshKey = 0, onNotifRead }) {
    const [ongletActif,   setOngletActif]   = useState("toutes");
    const [notifications, setNotifications] = useState([]);
    const [selectionneId, setSelectionneId] = useState(null);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState(null);

    // ── Chargement initial depuis le backend ──────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getNotifications(CURRENT_USER_ID);
                // Trier du plus récent au plus ancien
                data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                setNotifications(data);
            } catch (err) {
                console.error("Erreur chargement notifications:", err);
                setError("Impossible de charger les notifications.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [refreshKey]);

    const nonLues = notifications.filter((n) => !n.lu);

    const listeAffichee = ongletActif === "toutes" ? notifications : nonLues;

    // ── Marquer une notification comme lue (appel API + mise à jour locale) ─
    const handleMarquerLu = async (id) => {
        try {
            await marquerNotificationLue(id);
            setNotifications((prev) =>
                prev.map((n) => n.id === id ? { ...n, lu: true } : n)
            );
            setSelectionneId(null);
            // Mettre à jour le badge dans le header
            if (onNotifRead) onNotifRead();
        } catch (err) {
            console.error("Erreur marquer lu:", err);
        }
    };

    // ── Marquer toutes comme lues ─────────────────────────────────────────
    const handleMarquerToutesLues = async () => {
        try {
            await marquerToutesLues(CURRENT_USER_ID);
            setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
            if (onNotifRead) onNotifRead();
        } catch (err) {
            console.error("Erreur marquer toutes lues:", err);
        }
    };

    const onglets = [
        { key: "toutes",   label: "Toutes" },
        { key: "non_lues", label: `Non Lues(${nonLues.length})` },
    ];

    return (
        <main style={{ flex: 1, background: "#F3F4F6", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "28px", width: "87%" }}>
                <div style={{
                    background: C.white, borderRadius: 10,
                    padding: "28px 32px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>

                    {/* ── En-tête ── */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", color: C.textDark }}>
                                Notifications
                            </h1>
                            <p style={{ fontSize: 13, color: C.textMid, margin: "0 0 24px" }}>
                                NB: Pour marquer une notification comme lue, veuillez cliquer dessus, puis sur le bouton &quot;Marquer comme lu&quot;.
                            </p>
                        </div>
                        {nonLues.length > 0 && (
                            <button
                                onClick={handleMarquerToutesLues}
                                style={{
                                    padding: "8px 16px", fontSize: 13, fontWeight: 600,
                                    background: "none", border: `1px solid ${C.orange}`,
                                    color: C.orange, borderRadius: 8, cursor: "pointer",
                                    whiteSpace: "nowrap"
                                }}
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    {/* ── Onglets ── */}
                    <div style={{ display: "flex", gap: 0, borderBottom: `1.5px solid #E5E7EB`, marginBottom: 0 }}>
                        {onglets.map((o) => {
                            const actif = ongletActif === o.key;
                            return (
                                <button
                                    key={o.key}
                                    onClick={() => { setOngletActif(o.key); setSelectionneId(null); }}
                                    style={{
                                        padding: "10px 20px", border: "none", background: "none",
                                        cursor: "pointer", fontSize: 14,
                                        fontWeight: actif ? 700 : 400,
                                        color: actif ? C.orange : C.textGrey,
                                        borderBottom: actif ? `2.5px solid ${C.orange}` : "2.5px solid transparent",
                                        marginBottom: -1.5, transition: "all 0.15s",
                                    }}
                                    onMouseEnter={(e) => { if (!actif) e.currentTarget.style.color = C.textDark; }}
                                    onMouseLeave={(e) => { if (!actif) e.currentTarget.style.color = C.textGrey; }}
                                >
                                    {o.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Contenu ── */}
                    {loading ? (
                        <div style={{ padding: "60px 0", textAlign: "center", color: C.textGrey, fontSize: 14 }}>
                            Chargement des notifications…
                        </div>
                    ) : error ? (
                        <div style={{ padding: "40px 0", textAlign: "center", color: "#DC2626", fontSize: 14 }}>
                            {error}
                        </div>
                    ) : listeAffichee.length === 0 ? (
                        <div style={{ padding: "60px 0", textAlign: "center", color: C.textGrey, fontSize: 14 }}>
                            Aucune notification{ongletActif === "non_lues" ? " non lue" : ""}.
                        </div>
                    ) : (
                        listeAffichee.map((notif) => (
                            <CarteNotification
                                key={notif.id}
                                notif={notif}
                                selectionne={selectionneId === notif.id}
                                onClick={() => setSelectionneId(selectionneId === notif.id ? null : notif.id)}
                                onMarquerLu={handleMarquerLu}
                            />
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}