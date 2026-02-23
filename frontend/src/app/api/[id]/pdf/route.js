// src/app/api/avis/[id]/pdf/route.js
// ─── Route Next.js App Router — génère le PDF d'un avis d'imposition ──────
// GET /api/avis/:id/pdf → retourne un PDF binaire
//
// Dépendance : npm install pdfkit
// pdfkit fonctionne en Node.js (côté serveur Next.js) sans canvas.
//
// Données : récupérées depuis le backend Express (port 3001).
// Si backend indisponible → fallback sur mockData.

import PDFDocument from "pdfkit";
import mockData    from "@/app/data/mockData.json";

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt  = (n) => n != null ? Number(n).toLocaleString("fr-FR") : "0";
const date = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

// Récupère l'avis enrichi depuis le backend ou depuis mockData en fallback
async function fetchAvis(id) {
    try {
        const res  = await fetch(`http://localhost:3001/api/avis-imposition/${id}`, { cache: "no-store" });
        const json = await res.json();
        if (json.success) return json.data;
    } catch (_) { /* backend non disponible → fallback */ }

    // ── Fallback mockData ──────────────────────────────────────────────────
    const avis = mockData.avisListe.find((a) => a.id === id || String(a.id) === id);
    if (!avis) return null;

    const dpr = mockData.dprListe.find((d) => d.id === avis.dprId) ?? {};
    return {
        ...avis,
        reference:         avis.reference,
        date_reception:    avis.dateEmission,
        date_notification: avis.dateEmission,
        statut:            avis.statut === "paye" ? "PAYE" : "NON_PAYE",
        montant:           avis.montant,
        contribuable: {
            NIU:           mockData.utilisateur.niu,
            raison_sociale:mockData.utilisateur.nom,
            adresse:       "Yaoundé, Cameroun",
            telephone:     mockData.utilisateur.telephone,
            email:         mockData.utilisateur.email,
        },
        declaration: {
            reference_declaration: dpr.reference ?? "—",
            type_declaration:      "PATENTE",
            annee_fiscale:         avis.anneeFiscale,
            date_soumission:       dpr.dateSoumission,
            chiffre_affaire:       null,
            base_imposable:        null,
            montant_a_payer:       avis.montant,
        },
    };
}

// ─── Dessin d'un rectangle arrondi (pdfkit n'a pas roundRect natif) ───────
function roundRect(doc, x, y, w, h, r, fill, stroke) {
    doc.save();
    doc.roundedRect(x, y, w, h, r);
    if (fill)   { doc.fillColor(fill);   doc.fill();   }
    if (stroke) { doc.strokeColor(stroke); doc.stroke(); }
    doc.restore();
}

// ─── Ligne de tableau (label + valeur) ────────────────────────────────────
function tableLine(doc, y, label, value, highlight = false) {
    if (highlight) {
        doc.rect(40, y, 515, 26).fill("#FEF3C7");
    }
    doc.fillColor("#6B7280").fontSize(10).font("Helvetica")
        .text(label, 55, y + 7, { width: 200 });
    doc.fillColor("#111827").fontSize(10).font("Helvetica-Bold")
        .text(String(value ?? "—"), 265, y + 7, { width: 290 });
    doc.moveTo(40, y + 26).lineTo(555, y + 26).strokeColor("#F3F4F6").lineWidth(0.5).stroke();
    return y + 26;
}

// ─── En-tête de section ────────────────────────────────────────────────────
function sectionHeader(doc, y, titre) {
    doc.rect(40, y, 515, 24).fill("#F59E0B");
    doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold")
        .text(titre, 55, y + 6);
    return y + 24;
}

// ══════════════════════════════════════════════════════════════════════════
// HANDLER GET
// ══════════════════════════════════════════════════════════════════════════
export async function GET(request, { params }) {
    const { id } = params;

    // 1. Récupérer les données
    const avis = await fetchAvis(id);
    if (!avis) {
        return new Response(JSON.stringify({ error: "Avis introuvable" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
        });
    }

    // 2. Créer le document PDF en mémoire
    return new Promise((resolve) => {
        const doc    = new PDFDocument({ size: "A4", margin: 0 });
        const chunks = [];

        doc.on("data",  (chunk) => chunks.push(chunk));
        doc.on("end", () => {
            const pdf = Buffer.concat(chunks);
            resolve(
                new Response(pdf, {
                    status: 200,
                    headers: {
                        "Content-Type":        "application/pdf",
                        "Content-Disposition": `attachment; filename="avis-${avis.reference ?? id}.pdf"`,
                        "Content-Length":      pdf.length.toString(),
                    },
                })
            );
        });

        // ── PAGE ──────────────────────────────────────────────────────────────
        const PAGE_W = 595, MARGIN = 40;

        // ── 3a. Bandeau orange supérieur ──────────────────────────────────────
        doc.rect(0, 0, PAGE_W, 72).fill("#F59E0B");

        // Logo DGI (cercle blanc)
        doc.circle(70, 36, 26).fill("#ffffff");
        doc.fillColor("#F59E0B").fontSize(11).font("Helvetica-Bold").text("DGI", 55, 29);
        doc.fillColor("#F59E0B").fontSize(6).font("Helvetica").text("IMPÔTS", 55, 42);

        // Titre dans le bandeau
        doc.fillColor("#ffffff").fontSize(16).font("Helvetica-Bold")
            .text("AVIS D'IMPOSITION", 110, 20);
        doc.fillColor("#FEF3C7").fontSize(9).font("Helvetica")
            .text("Direction Générale des Impôts — République du Cameroun", 110, 42);

        // Référence avis (droite du bandeau)
        doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold")
            .text(avis.reference ?? "—", PAGE_W - 220, 20, { width: 200, align: "right" });
        doc.fillColor("#FEF3C7").fontSize(8).font("Helvetica")
            .text(`Émis le : ${date(avis.date_notification ?? avis.date_reception)}`, PAGE_W - 220, 36, { width: 200, align: "right" });

        let y = 90;

        // ── 3b. Section Contribuable ───────────────────────────────────────────
        y = sectionHeader(doc, y, "INFORMATIONS CONTRIBUABLE");
        y = tableLine(doc, y, "NIU",              avis.contribuable?.NIU);
        y = tableLine(doc, y, "Raison sociale",   avis.contribuable?.raison_sociale, true);
        y = tableLine(doc, y, "Adresse",          avis.contribuable?.adresse);
        y = tableLine(doc, y, "Téléphone",        avis.contribuable?.telephone, true);
        y = tableLine(doc, y, "Email",            avis.contribuable?.email);
        y = tableLine(doc, y, "Structure fiscale","CDI DOUALA 4", true);

        y += 16;

        // ── 3c. Section Déclaration liée ──────────────────────────────────────
        y = sectionHeader(doc, y, "DÉCLARATION ASSOCIÉE");
        y = tableLine(doc, y, "Référence déclaration", avis.declaration?.reference_declaration);
        y = tableLine(doc, y, "Type d'impôt",          avis.declaration?.type_declaration ?? "PATENTE", true);
        y = tableLine(doc, y, "Année fiscale",          avis.declaration?.annee_fiscale ?? avis.anneeFiscale);
        y = tableLine(doc, y, "Date de soumission",     date(avis.declaration?.date_soumission), true);
        if (avis.declaration?.chiffre_affaire) {
            y = tableLine(doc, y, "Chiffre d'affaires",  `${fmt(avis.declaration.chiffre_affaire)} FCFA`);
        }
        if (avis.declaration?.base_imposable) {
            y = tableLine(doc, y, "Base imposable",      `${fmt(avis.declaration.base_imposable)} FCFA`, true);
        }

        y += 16;

        // ── 3d. Section Détails de l'avis ─────────────────────────────────────
        y = sectionHeader(doc, y, "DÉTAILS DE L'AVIS");
        y = tableLine(doc, y, "Référence avis",      avis.reference);
        y = tableLine(doc, y, "Date de réception",   date(avis.date_reception), true);
        y = tableLine(doc, y, "Date de notification",date(avis.date_notification));
        y = tableLine(doc, y, "RIB Receveur",         avis.RIB_receveur ?? "CM21 10005 00001 000123456789 01", true);

        // Statut avec couleur
        const isPaye = avis.statut === "PAYE" || avis.statut === "paye";
        y = tableLine(doc, y, "Statut", isPaye ? "✓ Payé" : "⚠ Non payé");
        // Coloriser uniquement la valeur statut
        doc.rect(263, y - 26, 290, 26).fill(isPaye ? "#F0FDF4" : "#FEF2F2");
        doc.fillColor(isPaye ? "#16A34A" : "#DC2626").fontSize(10).font("Helvetica-Bold")
            .text(isPaye ? "Payé" : "Non payé", 265, y - 19, { width: 290 });

        y += 16;

        // ── 3e. Bloc montant ──────────────────────────────────────────────────
        doc.rect(MARGIN, y, 515, 64).fill("#FEF3C7");
        doc.fillColor("#92400E").fontSize(11).font("Helvetica-Bold")
            .text("MONTANT À PAYER", MARGIN, y + 10, { width: 515, align: "center" });
        doc.fillColor("#F59E0B").fontSize(26).font("Helvetica-Bold")
            .text(`${fmt(avis.montant ?? avis.declaration?.montant_a_payer ?? 0)} FCFA`, MARGIN, y + 28, { width: 515, align: "center" });

        y += 80;

        // ── 3f. Pied de page ──────────────────────────────────────────────────
        // Ligne de séparation
        doc.moveTo(MARGIN, y).lineTo(555, y).strokeColor("#E5E7EB").lineWidth(1).stroke();
        y += 10;

        doc.fillColor("#9CA3AF").fontSize(8).font("Helvetica")
            .text(
                `Document généré automatiquement par le Système d'Information Fiscale DGI — ${date(new Date().toISOString())}`,
                MARGIN, y, { width: 515, align: "center" }
            );
        doc.fillColor("#9CA3AF").fontSize(8)
            .text("Pour toute réclamation, veuillez contacter votre centre des impôts.", MARGIN, y + 14, { width: 515, align: "center" });

        doc.end();
    });
}