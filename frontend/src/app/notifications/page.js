"use client";

import { useState } from "react";
import C from "../lib/utils/colors";
import mockData from "../data/mockData.json";

// ─── Données de notifications depuis mockData ─────────────────────────────
// mockData.notifications : tableau d'objets { id, titre, message, date, priorite, lu, expediteur }
// priorite : "haute" | "normale" | "basse"
// lu : boolean

// ─── Badge priorité ───────────────────────────────────────────────────────
function BadgePriorite({ priorite }) {
    const map = {
        haute:   { label: "Haute Priorité", bg: "#FEE2E2", color: "#DC2626" },
        normale: { label: "Priorité Normale", bg: "#FEF3C7", color: "#D97706" },
        basse:   { label: "Basse Priorité",  bg: "#DBEAFE", color: "#1D4ED8" },
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
    // Couleur déterministe selon l'expéditeur
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
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        .replace(".", "");
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
            {/* Avatar */}
            <Avatar expediteur={notif.expediteur} />

            {/* Contenu */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {/* Badge + date sur la même ligne */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <BadgePriorite priorite={notif.priorite} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.orange, whiteSpace: "nowrap", marginLeft: 12 }}>
                        {formatDate(notif.date)}
                    </span>
                </div>

                {/* Titre */}
                <div style={{ fontSize: 15, fontWeight: notif.lu ? 400 : 600, color: C.textDark, marginBottom: 6 }}>
                    {notif.titre}
                </div>

                {/* Message */}
                <div style={{ fontSize: 14, color: C.textMid, lineHeight: 1.6 }}>
                    {notif.message}
                </div>

                {/* Bouton Marquer comme lu — visible seulement si sélectionnée et non lue */}
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

            {/* Point non-lu */}
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
export default function PageNotifications() {
    const [ongletActif,    setOngletActif]    = useState("toutes");
    const [notifications,  setNotifications]  = useState(mockData.notifications ?? []);
    const [selectionneId,  setSelectionneId]  = useState(null);

    const nonLues = notifications.filter((n) => !n.lu);

    const listeAffichee = ongletActif === "toutes"
        ? notifications
        : nonLues;

    const handleMarquerLu = (id) => {
        setNotifications((prev) =>
            prev.map((n) => n.id === id ? { ...n, lu: true } : n)
        );
        setSelectionneId(null);
    };

    const onglets = [
        { key: "toutes",   label: "Toutes"                      },
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
                    <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", color: C.textDark }}>
                        Notifications
                    </h1>
                    <p style={{ fontSize: 13, color: C.textMid, margin: "0 0 24px" }}>
                        NB: Pour marquer une notification comme lue, veuillez cliquer dessus, puis sur le bouton &quot;Marquer comme lu&quot;.
                    </p>

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

                    {/* ── Liste des notifications ── */}
                    <div>
                        {listeAffichee.length === 0 ? (
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
            </div>
        </main>
    );
}