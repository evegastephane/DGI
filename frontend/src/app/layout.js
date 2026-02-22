import "./globals.css";

export const metadata = {
    title: "DGI — Portail Contribuable",
    description: "Portail de déclaration IRPP — Direction Générale des Impôts",
};

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
        <body>{children}</body>
        </html>
    );
}