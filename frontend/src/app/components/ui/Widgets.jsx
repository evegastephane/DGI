// ═══════════════════════════════════════════
// Tabs.jsx
// Onglets actif/inactif réutilisables
// ═══════════════════════════════════════════
import C from "../../lib/utils/colors";

export function Tabs({ tabs, active, onChange }) {
    return (
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
            {tabs.map(({ key, label }) => {
                const isActive = active === key;
                return (
                    <button key={key} onClick={() => onChange(key)} style={{
                        flex: 1, minWidth: 160, padding: "12px 20px",
                        border: "none", borderRadius: 0, cursor: "pointer",
                        textAlign: "center", fontSize: 13,
                        fontWeight:  isActive ? 600 : 500,
                        borderLeft:  isActive ? `4px solid ${C.orange}` : "4px solid #c8c8c8",
                        background:  isActive ? C.orangeBg : "#e8e8e8",
                        color:       isActive ? C.orange   : C.textGrey,
                        transition: "all 0.15s",
                    }}>
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

// ═══════════════════════════════════════════
// ItemCard.jsx
// Carte affichant référence + année fiscale
// ═══════════════════════════════════════════
import { ChevDown } from "../../components/ui/Icons";

export function ItemCard({ reference, annee }) {
    return (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
            <div>
                <p style={{ margin: 0, fontSize: 13, color: C.textGrey }}>
                    Référence : <b style={{ color: C.textDark }}>{reference}</b>
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textGrey }}>
                    Année fiscale: <b style={{ color: C.textDark }}>{annee}</b>
                </p>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 2, color: C.orangeHov, background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontSize: 14 }}>
                Visualiser <ChevDown />
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════
// VoirPlus.jsx
// Bouton "VOIR PLUS" aligné à droite
// ═══════════════════════════════════════════
export function VoirPlus() {
    return (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <a href="#" style={{ border: `1px solid ${C.textGrey}`, borderRadius: 4, padding: "6px 14px", fontSize: 12, fontWeight: 600, background: C.white, color: C.textDark, textDecoration: "none", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Voir Plus
            </a>
        </div>
    );
}

// ═══════════════════════════════════════════
// RecapCell.jsx
// Input cellule du tableau Récapitulatif
// readOnly=true → colonne "Total" calculée auto
// ═══════════════════════════════════════════
export function RecapCell({ value, onChange, readOnly = false }) {
    return (
        <input type="number" value={value} onChange={onChange} readOnly={readOnly}
               style={{
                   width: "100%", border: `1px solid ${C.yellow}`, borderRadius: 8,
                   padding: "14px 10px", fontSize: 13,
                   background: readOnly ? "#FFF7E0" : C.orangeBg,
                   color:      readOnly ? C.orangeText : C.textMid,
                   textAlign: "right", boxSizing: "border-box",
                   outline: "none", cursor: readOnly ? "default" : "text",
               }}
        />
    );
}

// ═══════════════════════════════════════════
// DonutChart.jsx
// Graphique SVG pur — Avis Payés / Non Payés
// ═══════════════════════════════════════════
export function DonutChart() {
    const r = 70, cx = 90, cy = 90, sw = 28;
    const circ     = 2 * Math.PI * r;
    const paidArc  = (58.8 / 100) * circ;
    const unpaidArc= (41.2 / 100) * circ;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
                {/* Fond */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eee" strokeWidth={sw} />
                {/* Arc vert — Payés */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#52C93F" strokeWidth={sw}
                        strokeDasharray={`${paidArc} ${circ}`}
                        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }} />
                {/* Arc rouge — Non Payés */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#FF2727" strokeWidth={sw}
                        strokeDasharray={`${unpaidArc} ${circ}`} strokeDashoffset={-paidArc}
                        style={{ transform: "rotate(-90deg)", transformOrigin: `${cx}px ${cy}px` }} />
                {/* Labels */}
                <text x="136" y="62"  textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">58.8%</text>
                <text x="46"  y="122" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">41.2%</text>
            </svg>
            {/* Légende */}
            <div style={{ display: "flex", gap: 20 }}>
                {[{ color: "#52C93F", label: "Avis Payés" }, { color: "#FF2727", label: "Avis Non Payés" }].map(({ color, label }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 16, height: 16, borderRadius: "50%", background: color, display: "inline-block" }} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}