import C from "../../lib/utils/colors";

// ─── Footer ────────────────────────────────────────────────────────────────
export default function Footer() {
    return (
        <footer style={{
            padding: "14px 24px",
            textAlign: "center",
            fontSize: 13,
            color: C.textMid,
            borderTop: `1px solid ${C.border}`,
            background: C.white,
        }}>
            Copyright © <strong>Direction Générale des Impôts</strong> 2026
        </footer>
    );
}