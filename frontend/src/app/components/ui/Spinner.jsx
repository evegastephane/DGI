export default function Spinner({ size = 80 }) {
    const center      = size / 2;
    const orbitRadius = size * 0.35;
    const dotRadius   = size * 0.063;
    const fontSize    = size * 0.13;

    return (
        <div style={{ position: "relative", width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
                {Array.from({ length: 12 }).map((_, i) => {
                    const angle   = (i * 30 * Math.PI) / 180;
                    const x       = center + orbitRadius * Math.sin(angle);
                    const y       = center - orbitRadius * Math.cos(angle);
                    const opacity = (i + 1) / 12;
                    return <circle key={i} cx={x} cy={y} r={dotRadius} fill="#F59E0B" opacity={opacity} />;
                })}
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize, fontWeight: "700", color: "#92400E" }}>
                DGI
            </div>
        </div>
    );
}