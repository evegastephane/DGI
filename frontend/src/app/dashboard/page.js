'use client';

import React, { useState, useEffect } from 'react';
import {
    Info, Folder, ClipboardList, Eye, X,
    ChevronDown, ChevronUp, Bell,
    CheckCircle, XCircle, DollarSign
} from 'lucide-react';
import {
    getDashboardStats, getAvis, getAMRs, CURRENT_USER_ID
} from '../lib/api/contribuableApi';
import { getDeclarations } from '../lib/api/declarationApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatMontant = (n) =>
    n != null ? new Intl.NumberFormat('fr-FR').format(n) + ' FCFA' : '—';

const statutBadge = (statut) => {
    const map = {
        EN_COURS:  { background: '#fefce8', color: '#a16207', border: '1px solid #fde047' },
        VALIDEE:   { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
        REJETEE:   { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' },
        ANNULEE:   { background: '#f9fafb', color: '#6b7280', border: '1px solid #d1d5db' },
        PAYE:      { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
        NON_PAYE:  { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' },
        APURE:     { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd' },
        CONTESTE:  { background: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74' },
        SOUMISE:   { background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' },
    };
    return map[statut] || { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
};

const statutLabel = (statut) => {
    const map = {
        EN_COURS: 'En cours', VALIDEE: 'Validée', REJETEE: 'Rejetée',
        ANNULEE: 'Annulée', PAYE: 'Payé', NON_PAYE: 'Non payé',
        APURE: 'Apuré', CONTESTE: 'Contesté', SOUMISE: 'Soumise',
    };
    return map[statut] || statut;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
    page: {
        minWidth: "100%",
        margin: '0 auto',
        padding: '24px 32px 80px',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        color: '#111827',
        background: '#f4f6f9',
        minHeight: '100vh',
    },
    card: {
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: 24,
    },
    cardstat: {
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: 24,
        minWidth: 450,
    },
    cardlistedpr: {
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: 24,
        minWidth: "206.5%",
    },
    statCard: {
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        padding: 24,
        flex: 1,
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 20,
    },
    grid3: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
    },
    grid4: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
    },
    row: { display: 'flex', alignItems: 'center', gap: 12 },
    between: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    badge: (statut) => ({
        ...statutBadge(statut),
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        display: 'inline-block',
    }),
    btn: {
        background: '#f39200',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '10px 20px',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        transition: 'background 0.15s',
    },
    btnconsdec: {
        background: '#f39200',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        padding: '10px 20px',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        transition: 'background 0.15s',
        width: 260,
        height: 45,
        position: 'relative',
        left: "75.5%",
    },
    linkBtn: {
        background: 'none',
        border: '1px solid #d1d5db',
        borderRadius: 6,
        padding: '6px 16px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        color: '#374151',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'background 0.15s',
    },
    iconBox: (bg) => ({
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    }),
    skeleton: {
        background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 12,
    },
};

// ─── Donut Chart DYNAMIQUE ────────────────────────────────────────────────────
function DonutChart({ payes, nonPayes, total }) {
    // On utilise les vrais chiffres passés en props
    const totalAvis  = total > 0 ? total : (payes + nonPayes);
    const pct        = totalAvis > 0 ? Math.round((payes / totalAvis) * 100) : 0;
    const r          = 15.9155;
    const circ       = 2 * Math.PI * r;
    const greenLen   = totalAvis > 0 ? (payes / totalAvis) * circ : 0;
    const redLen     = circ - greenLen;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 180, height: 180 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
                    {totalAvis === 0 ? (
                        <circle cx="18" cy="18" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5"
                                strokeDasharray={`${circ} 0`} />
                    ) : (
                        <>
                            <circle cx="18" cy="18" r={r} fill="none" stroke="#22c55e" strokeWidth="5"
                                    strokeDasharray={`${greenLen} ${redLen}`} strokeLinecap="round" />
                            {nonPayes > 0 && (
                                <circle cx="18" cy="18" r={r} fill="none" stroke="#ef4444" strokeWidth="5"
                                        strokeDasharray={`${redLen} ${greenLen}`}
                                        strokeDashoffset={-greenLen}
                                        strokeLinecap="round" />
                            )}
                        </>
                    )}
                </svg>
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{pct}%</span>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Payés</span>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
                <div style={S.row}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Avis Payés</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{payes}</p>
                    </div>
                </div>
                <div style={S.row}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                    <div>
                        <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>Avis Non Payés</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{nonPayes}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor, label, value, sub, subColor }) {
    return (
        <div style={S.statCard}>
            <div style={S.iconBox(iconBg)}>
                <Icon size={22} color={iconColor} />
            </div>
            <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, margin: '0 0 4px' }}>{label}</p>
                <div style={{ ...S.between }}>
                    <span style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>{value}</span>
                    {sub && <span style={{ fontSize: 12, fontWeight: 600, color: subColor || '#9ca3af' }}>{sub}</span>}
                </div>
            </div>
        </div>
    );
}

// ─── Row expandable ───────────────────────────────────────────────────────────
function ExpandableRow({ item, isExpanded, onToggle, renderDetail }) {
    return (
        <div style={{ borderBottom: '1px solid #f3f4f6' }}>
            <div
                onClick={onToggle}
                style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 8px', cursor: 'pointer',
                    borderRadius: 8, transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                        Référence : <strong style={{ color: '#111827' }}>{item.reference}</strong>
                    </p>
                    {item.annee && (
                        <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                            Année fiscale : <strong style={{ color: '#111827' }}>{item.annee}</strong>
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={S.badge(item.statut)}>{statutLabel(item.statut)}</span>
                    <button style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#f58220', fontSize: 13, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 4
                    }}>
                        Visualiser {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div style={{ margin: '0 8px 12px', background: '#f9fafb', borderRadius: 10, padding: 14 }}>
                    {renderDetail(item)}
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 0', borderBottom: '1px solid #f3f4f6'
        }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{value || '—'}</span>
        </div>
    );
}

function EmptyState({ label }) {
    return (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
            <ClipboardList size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontSize: 13, margin: 0 }}>{label}</p>
        </div>
    );
}

function SectionHeader({ title, count }) {
    return (
        <div style={{ ...S.between, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{title}</h3>
            <span style={{
                fontSize: 12, color: '#6b7280', background: '#f3f4f6',
                padding: '3px 10px', borderRadius: 999, fontWeight: 500
            }}>
                {Math.min(count, 3)} / {count}
            </span>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard({ refreshKey = 0, setPage }) {
    const [expandedDpr, setExpandedDpr]   = useState(null);
    const [expandedAvis, setExpandedAvis] = useState(null);
    const [expandedAmr, setExpandedAmr]   = useState(null);
    const [infoBannerVisible, setInfoBannerVisible] = useState(true);
    const [exercice, setExercice]         = useState('2025');

    const [stats, setStats]       = useState(null);
    const [dprs, setDprs]         = useState([]);
    const [avisList, setAvisList] = useState([]);
    const [amrsList, setAmrsList] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const annee = parseInt(exercice);
                // Promise.allSettled : chaque requête échoue indépendamment
                const [statsRes, dprsRes, avisRes, amrsRes] = await Promise.allSettled([
                    getDashboardStats(CURRENT_USER_ID, annee),
                    getDeclarations(CURRENT_USER_ID),
                    getAvis({ id_contribuable: CURRENT_USER_ID }),
                    getAMRs({ id_contribuable: CURRENT_USER_ID }),
                ]);

                const statsData = statsRes.status === 'fulfilled' ? statsRes.value : null;
                const dprsData  = dprsRes.status  === 'fulfilled' ? dprsRes.value  : [];
                const avisData  = avisRes.status  === 'fulfilled' ? avisRes.value  : [];
                const amrsData  = amrsRes.status  === 'fulfilled' ? amrsRes.value  : [];

                setStats(statsData);

                // Filtrer les déclarations par année
                const dprsFiltered = dprsData.filter(d => String(d.annee) === String(exercice));
                setDprs(dprsFiltered);

                // Filtrer les avis par année
                const avisAll = avisData.filter(a =>
                    !a.annee || a.annee === '—' || String(a.annee) === String(exercice)
                );
                setAvisList(avisAll);

                // Filtrer les AMR (pas de champ année dans AMR, on affiche tout)
                setAmrsList(amrsData);

            } catch (err) {
                console.error('Erreur chargement dashboard:', err);
                setError('Impossible de charger les données. Vérifiez que le backend est démarré.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [exercice, refreshKey]);

    if (loading) {
        return (
            <div style={S.page}>
                <div style={{ ...S.between, marginBottom: 24 }}>
                    <div style={{ ...S.skeleton, height: 32, width: 200 }} />
                    <div style={{ ...S.skeleton, height: 44, width: 260 }} />
                </div>
                <div style={{ ...S.grid2, marginBottom: 20 }}>
                    {[...Array(2)].map((_, i) => (
                        <div key={i} style={{ ...S.skeleton, height: 120 }} />
                    ))}
                </div>
                <div style={{ ...S.grid2 }}>
                    <div style={{ ...S.skeleton, height: 320 }} />
                    <div style={{ ...S.skeleton, height: 320 }} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ ...S.page, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
                <div style={{
                    background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 16,
                    padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
                }}>
                    <XCircle size={48} color="#ef4444" />
                    <p style={{ color: '#b91c1c', fontWeight: 500, margin: 0 }}>{error}</p>
                    <button onClick={() => window.location.reload()} style={{ ...S.btn, background: '#dc2626' }}>
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    // ── Calculs corrects pour les StatCards ──────────────────────────────────
    // DPR Générées = toutes les déclarations de l'année (pas avisTotal)
    const dprGenerees  = dprs.length;
    // DPR Soumises = déclarations avec statut VALIDEE ou EN_COURS ou SOUMISE
    const dprSoumises  = dprs.filter(d =>
        ['VALIDEE', 'EN_COURS', 'SOUMISE', 'SUBMITTED'].includes((d.statut || '').toUpperCase())
    ).length;
    const pctSoumises  = dprGenerees > 0
        ? ((dprSoumises / dprGenerees) * 100).toFixed(0) : 0;

    // Donut : on compte les avis payés et non payés depuis la liste réelle
    const avisPayes    = avisList.filter(a => ['PAYE', 'PAID'].includes((a.statut || '').toUpperCase())).length;
    const avisNonPayes = avisList.filter(a => ['NON_PAYE', 'EMIS', 'SUBMITTED', 'EN_ATTENTE'].includes((a.statut || '').toUpperCase())).length;
    const avisTotal    = avisList.length;

    return (
        <div style={S.page}>

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div style={{ ...S.between, marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 23, fontWeight: 700, margin: 0, color: 'black', letterSpacing: '-0.5px' }}>
                        Tableau de Bord
                    </h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                        <label style={{
                            position: 'absolute', top: 6, left: 12, fontSize: 11,
                            color: 'black', background: '#f4f6f9', padding: '0 4px', zIndex: 1, fontWeight: 500
                        }}>Exercice</label>
                        <select
                            value={exercice}
                            onChange={(e) => setExercice(e.target.value)}
                            style={{
                                border: '1px solid #d1d5db', borderRadius: 4, padding: '10px 16px',
                                fontSize: 12, fontWeight: 500, background: 'transparent', minWidth: 215,
                                cursor: 'pointer', outline: 'none', color: 'black', height: 50, position: 'relative',
                                top: 15,
                            }}
                        >
                            {[2025, 2024, 2023, 2022].map(y => (
                                <option key={y} value={y}>EXERCICE {y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div style={{position: 'relative', minWidth: '100%', justifyContent: 'flex-end', alignItems: 'right'}}>
                <button style={S.btnconsdec}>
                    <Eye size={16} />
                    Consulter votre Déclaration
                </button>
            </div>

            {/* ── Bannière info ───────────────────────────────────────────────── */}
            {infoBannerVisible && (
                <div style={{
                    background: '#F9D192', border: '1px solid #f8d099', borderRadius: 6,
                    padding: '13px 13px', display: 'flex', alignItems: 'flex-start', gap: 14,
                    position: 'relative', marginBottom: 24,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', top: 15,
                }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: '50%', background: '#c88d3d',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        color: '#F9D192', fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 400,
                    }}>
                        i
                    </div>
                    <div style={{ flex: 1, paddingRight: 24 }}>
                        <h3 style={{ color: '#a66a22', fontWeight: 700, fontSize: 17, margin: '0 0 4px' }}>Info</h3>
                        <p style={{ color: '#a66a22', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
                            Madame, Mademoiselle, Monsieur, la déclaration de l'Impôt sur les Revenus des Personnes
                            Physiques que vous allez souscrire est importante pour vous-même et pour le Cameroun.
                            Elle constitue un acte fondamental par lequel vous exprimez à juste titre votre
                            appartenance à la collectivité nationale.
                        </p>
                    </div>
                    <button
                        onClick={() => setInfoBannerVisible(false)}
                        style={{
                            position: 'absolute', top: 12, right: 12, background: 'none',
                            border: 'none', cursor: 'pointer', color: '#a66a22', padding: 4
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* ── 2 Stats Cards (DPR réelles) ─────────────────────────────────── */}
            <div style={{ ...S.grid2, marginBottom: 24, marginTop: 20 }}>
                <StatCard
                    icon={Folder}
                    iconBg="#dbeafe"
                    iconColor="#3b82f6"
                    label="DPR Générées"
                    value={dprGenerees}
                    sub={`${dprGenerees} déclaration(s) pour ${exercice}`}
                    subColor="#6b7280"
                />
                <StatCard
                    icon={ClipboardList}
                    iconBg="#fef9c3"
                    iconColor="#ca8a04"
                    label="DPR Soumises"
                    value={dprSoumises}
                    sub={dprGenerees > 0 ? `^ ${pctSoumises}% des DPR générées` : 'Aucune DPR'}
                    subColor="#f58220"
                />
            </div>

            {/* ── Section milieu : Donut + Liste DPR ─────────────────────────── */}
            <div style={{ ...S.grid3, marginBottom: 24, minHeight: 420 }}>

                {/* Statut des Avis — Donut DYNAMIQUE */}
                <div style={S.cardstat}>
                    <div style={{ ...S.between, marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                                Statut des Avis
                            </h3>
                            <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                                Total : {avisTotal} avis · exercice {exercice}
                            </p>
                        </div>
                        {(stats?.notifsNonLues ?? 0) > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: '#fff7ed', border: '1px solid #fed7aa',
                                borderRadius: 999, padding: '4px 12px'
                            }}>
                                <Bell size={14} color="#f97316" />
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#ea580c' }}>
                                    {stats.notifsNonLues} non lues
                                </span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                        <DonutChart
                            payes={avisPayes}
                            nonPayes={avisNonPayes}
                            total={avisTotal}
                        />
                    </div>
                    {(stats?.totalRecouvert ?? 0) > 0 && (
                        <div style={{
                            marginTop: 16, background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10
                        }}>
                            <DollarSign size={16} color="#16a34a" />
                            <div>
                                <p style={{ fontSize: 11, color: '#15803d', fontWeight: 500, margin: 0 }}>
                                    Total recouvré
                                </p>
                                <p style={{ fontSize: 14, fontWeight: 700, color: '#15803d', margin: 0 }}>
                                    {formatMontant(stats.totalRecouvert)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Liste des DPR */}
                <div style={{ ...S.cardlistedpr, display: 'flex', flexDirection: 'column' }}>
                    <SectionHeader title="Liste des déclarations générées" count={dprs.length} />
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 280 }}>
                        {dprs.length === 0 ? (
                            <EmptyState label="Aucune déclaration pour cet exercice" />
                        ) : (
                            dprs.slice(0, 3).map((dpr) => (
                                <ExpandableRow
                                    key={dpr.id}
                                    item={dpr}
                                    isExpanded={expandedDpr === dpr.id}
                                    onToggle={() => setExpandedDpr(expandedDpr === dpr.id ? null : dpr.id)}
                                    renderDetail={(d) => (<>
                                        <DetailRow label="Référence" value={d.reference} />
                                        <DetailRow label="Type" value={d.type} />
                                        <DetailRow label="Année fiscale" value={d.annee} />
                                        <DetailRow label="Statut" value={<span style={S.badge(d.statut)}>{statutLabel(d.statut)}</span>} />
                                        <DetailRow label="Montant à payer" value={d.montant} />
                                        <DetailRow label="Date déclaration" value={d.dateDeclaration} />
                                    </>)}
                                />
                            ))
                        )}
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
                        <button style={S.linkBtn} onClick={() => setPage && setPage('mesDeclarations')}>
                            VOIR PLUS
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Section basse : Avis + AMR ──────────────────────────────────── */}
            <div style={S.grid2}>

                {/* Liste des Avis */}
                <div style={{ ...S.card, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
                    <SectionHeader title="Liste des Avis" count={avisList.length} />
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 280 }}>
                        {avisList.length === 0 ? (
                            <EmptyState label="Aucun avis pour cet exercice" />
                        ) : (
                            avisList.slice(0, 3).map((avis) => (
                                <ExpandableRow
                                    key={avis.id}
                                    item={avis}
                                    isExpanded={expandedAvis === avis.id}
                                    onToggle={() => setExpandedAvis(expandedAvis === avis.id ? null : avis.id)}
                                    renderDetail={(a) => (<>
                                        <DetailRow label="Référence" value={a.reference} />
                                        <DetailRow label="Année fiscale" value={a.annee} />
                                        <DetailRow label="Structure Fiscale" value={a.structure || 'DGI'} />
                                        <DetailRow label="Statut" value={
                                            <span style={{
                                                background: a.statut === 'PAYE' ? '#f0fdf4' : '#fff7ed',
                                                color: a.statut === 'PAYE' ? '#15803d' : '#c2410c',
                                                border: `1px solid ${a.statut === 'PAYE' ? '#86efac' : '#fdba74'}`,
                                                padding: '3px 12px', borderRadius: 999,
                                                fontSize: 11, fontWeight: 700, display: 'inline-block',
                                            }}>
                                                {a.statut === 'PAYE' ? 'PAYÉ' : a.statut === 'EMIS' ? 'ÉMIS' : a.statut || 'ÉMIS'}
                                            </span>
                                        } />
                                        <DetailRow label="Date" value={
                                            a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '—'
                                        } />
                                        <DetailRow label="Montant" value={a.montant} />
                                    </>)}
                                />
                            ))
                        )}
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
                        <button style={S.linkBtn} onClick={() => setPage && setPage('avis')}>
                            VOIR PLUS
                        </button>
                    </div>
                </div>

                {/* Liste des AMR */}
                <div style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ ...S.between, marginBottom: 16 }}>
                        <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
                                Liste des AMR
                            </h3>
                            {(stats?.amrEnCours ?? 0) > 0 && (
                                <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 500, margin: '2px 0 0' }}>
                                    [!] {stats.amrEnCours} AMR en cours · {formatMontant(stats.amrMontantTotal)}
                                </p>
                            )}
                        </div>
                        <span style={{
                            fontSize: 12, color: '#6b7280', background: '#f3f4f6',
                            padding: '3px 10px', borderRadius: 999, fontWeight: 500
                        }}>
                            {Math.min(amrsList.length, 3)} / {amrsList.length}
                        </span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 280 }}>
                        {amrsList.length === 0 ? (
                            <EmptyState label="Aucune donnée AMR pour cet exercice" />
                        ) : (
                            amrsList.slice(0, 3).map((amr) => (
                                <ExpandableRow
                                    key={amr.id}
                                    item={{ ...amr, annee: null }}
                                    isExpanded={expandedAmr === amr.id}
                                    onToggle={() => setExpandedAmr(expandedAmr === amr.id ? null : amr.id)}
                                    renderDetail={(a) => (<>
                                        <DetailRow label="N° AMR" value={a.numeroAMR} />
                                        <DetailRow label="Motif" value={a.motif} />
                                        <DetailRow label="Montant initial" value={formatMontant(a.montantInitial)} />
                                        <DetailRow label="Majorations (10%)" value={formatMontant(a.montantMajorations)} />
                                        <DetailRow label="Montant total" value={a.montantTotal} />
                                        <DetailRow label="Date d'émission" value={a.dateEmission} />
                                        <DetailRow label="Statut" value={<span style={S.badge(a.statut)}>{statutLabel(a.statut)}</span>} />
                                    </>)}
                                />
                            ))
                        )}
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
                        <button style={S.linkBtn} onClick={() => setPage && setPage('amr')}>
                            VOIR PLUS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}