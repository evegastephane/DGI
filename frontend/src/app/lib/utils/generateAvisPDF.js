// src/lib/utils/generateAvisPDF.js
// ─── Génération de l'Avis d'imposition PDF avec pdf-lib ───────────────────

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// ─── Couleurs ─────────────────────────────────────────────────────────────────
const NOIR  = rgb(0, 0, 0);
const GRIS  = rgb(0.4, 0.4, 0.4);

// ─── IMPORTANT : nettoyer tout caractère non-WinAnsi avant d'écrire ───────────
// toLocaleString("fr-FR") insère des espaces 0x202f (narrow no-break space)
// que pdf-lib ne peut pas encoder → on remplace par espace normal
function safe(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/\u202f/g, " ")   // narrow no-break space → espace
        .replace(/\u00a0/g, " ")   // no-break space → espace
        .replace(/[^\x00-\xFF]/g, " "); // tout autre char non-latin → espace
}

// ─── Formater un nombre sans espaces insécables ───────────────────────────────
function fmt(n) {
    if (!n && n !== 0) return "0";
    // Formater manuellement : groupes de 3 séparés par un espace normal
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ─── Convertir un nombre en lettres (FCFA) ───────────────────────────────────
function nombreEnLettres(n) {
    const u = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
        "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
        "dix-sept", "dix-huit", "dix-neuf"];
    const d = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante",
        "soixante", "quatre-vingt", "quatre-vingt"];

    if (n === 0) return "zero";
    if (n < 0)   return "moins " + nombreEnLettres(-n);

    let result = "";
    if (n >= 1_000_000) {
        const m = Math.floor(n / 1_000_000);
        result += (m === 1 ? "un million" : nombreEnLettres(m) + " millions") + " ";
        n %= 1_000_000;
    }
    if (n >= 1_000) {
        const k = Math.floor(n / 1_000);
        result += (k === 1 ? "mille" : nombreEnLettres(k) + " mille") + " ";
        n %= 1_000;
    }
    if (n >= 100) {
        const c = Math.floor(n / 100);
        result += (c === 1 ? "cent" : u[c] + " cent") + (n % 100 === 0 && c > 1 ? "s" : "") + " ";
        n %= 100;
    }
    if (n > 0) {
        if (n < 20) {
            result += u[n];
        } else {
            const di = Math.floor(n / 10);
            const un = n % 10;
            if (di === 7 || di === 9) {
                result += d[di] + (un === 1 && di === 7 ? "-et-" : "-") + u[10 + un];
            } else {
                result += d[di] + (un === 1 && di < 8 ? "-et-" : un > 0 ? "-" : "") + (un > 0 ? u[un] : "");
            }
        }
    }
    return result.trim();
}

function montantEnLettres(montant) {
    const n = Math.round(montant);
    const lettres = nombreEnLettres(n);
    return "/// " + lettres.charAt(0).toUpperCase() + lettres.slice(1) + " FCFA ///";
}

// ─── Calcul des lignes de l'avis ──────────────────────────────────────────────
function calculerLignes(montantTotal) {
    const m = montantTotal || 0;
    // Distribution approximative basée sur le document de référence
    const patente       = Math.round(m * 0.30);
    const licenceComm   = Math.round(m * 0.236);
    const partFeicom    = Math.round(m * 0.059);
    const redevAudio    = Math.round(m * 0.295);
    const fraisAssiette = m - patente - licenceComm - partFeicom - redevAudio;

    return [
        {
            num: 1,
            libelle: "Etat (Frais d'assiette) sur patente",
            imputation: "4752401",
            intitule: "Frais d'assiette et de recouvrement",
            montant: Math.max(0, fraisAssiette),
        },
        {
            num: 2,
            libelle: "Patente",
            imputation: "421102330CC",
            intitule: "Chambre de commerce",
            montant: patente,
        },
        {
            num: 3,
            libelle: "Patente",
            imputation: "421102330A",
            intitule: "Commune",
            montant: licenceComm,
        },
        {
            num: 4,
            libelle: "LICENCE - PART COMMUNE",
            imputation: "421102330 C",
            intitule: "Commune",
            montant: Math.round(m * 0.12),
        },
        {
            num: 5,
            libelle: "Part FEICOM sur patente",
            imputation: "38 012 480 024",
            intitule: "Feicom",
            montant: partFeicom,
        },
        {
            num: 6,
            libelle: "Redevance Audiovisuelle sur patente",
            imputation: "44310100700",
            intitule: "CRTV",
            montant: redevAudio,
        },
    ];
}

// ─── Fonction principale ──────────────────────────────────────────────────────
export async function generateAvisPDF(declaration, contribuable = {}) {
    const pdfDoc = await PDFDocument.create();
    const page   = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const fontR = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontI = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // ── Helpers ────────────────────────────────────────────────────────────
    const txt = (str, x, y, { font = fontR, size = 9, color = NOIR } = {}) => {
        const s = safe(str);
        if (!s) return;
        page.drawText(s, { x, y: height - y, font, size, color });
    };

    const hline = (x1, y1, x2, { thickness = 0.5, color = NOIR } = {}) =>
        page.drawLine({ start: { x: x1, y: height - y1 }, end: { x: x2, y: height - y1 }, thickness, color });

    const box = (x, y, w, h, { fill, border = NOIR, bw = 0.5 } = {}) => {
        if (fill) page.drawRectangle({ x, y: height - y - h, width: w, height: h, color: fill });
        page.drawRectangle({ x, y: height - y - h, width: w, height: h, borderColor: border, borderWidth: bw });
    };

    const marg = 42;
    let Y = 32;

    // ════════════════════════════════════════════════════════════════════════
    // EN-TETE
    // ════════════════════════════════════════════════════════════════════════
    txt("REPUBLIQUE DU CAMEROUN",            marg,            Y,      { font: fontB, size: 8 });
    txt("Paix - Travail - Patrie",           marg,            Y + 11, { size: 7.5 });
    txt("MINISTERE DES FINANCES",            marg,            Y + 21, { font: fontB, size: 7.5 });
    txt("DIRECTION GENERALE DES IMPOTS",     marg,            Y + 31, { font: fontB, size: 7.5 });

    txt("REPUBLIC OF CAMEROON",              width - 210,     Y,      { font: fontB, size: 8 });
    txt("Peace - Work - Fatherland",         width - 197,     Y + 11, { size: 7.5 });
    txt("MINISTRY OF FINANCE",              width - 183,     Y + 21, { font: fontB, size: 7.5 });
    txt("DIRECTORATE GENERAL OF TAXATION",  width - 225,     Y + 31, { font: fontB, size: 7.5 });

    // Logo texte centré
    txt("DGI", width / 2 - 12, Y + 16, { font: fontB, size: 20, color: rgb(0.1, 0.4, 0.15) });

    Y += 46;
    hline(marg, Y, width - marg, { thickness: 0.8 });
    Y += 7;

    // Structure fiscale
    txt("CENTRE REGIONAL DES IMPOTS",                    marg,          Y + 7,  { size: 8 });
    txt(safe(declaration.structureFiscale || "CDI YAOUNDE 2"), marg,    Y + 17, { font: fontB, size: 8 });
    txt("[Declaration receptionnee]",                    width - 175,   Y + 7,  { size: 8, color: GRIS });
    Y += 30;
    hline(marg, Y, width - marg, { thickness: 0.3 });
    Y += 12;

    // ════════════════════════════════════════════════════════════════════════
    // TITRE
    // ════════════════════════════════════════════════════════════════════════
    const titre = "AVIS D'IMPOSITION";
    const titreW = fontB.widthOfTextAtSize(titre, 20);
    txt(titre, (width - titreW) / 2, Y + 16, { font: fontB, size: 20 });
    Y += 30;

    // ════════════════════════════════════════════════════════════════════════
    // INFOS DÉCLARATION
    // ════════════════════════════════════════════════════════════════════════
    const ref      = safe(declaration.reference || "—");
    const niu      = safe(contribuable?.NIU || contribuable?.niu || "—");
    const nomRaw   = contribuable?.nom_beneficiaire || contribuable?.nomBeneficiaire
        || contribuable?.nom || contribuable?.prenom || "—";
    const nom      = safe(nomRaw).toUpperCase();
    const struct   = safe(declaration.structureFiscale || "CDI YAOUNDE 2");
    const annee    = declaration.annee || new Date().getFullYear();
    const dateDecl = declaration.date
        ? safe(new Date(declaration.date).toLocaleDateString("fr-FR"))
        : "—";
    const rib      = safe(declaration.ribReceveur || "12001004531111111111104");

    // Ligne N° déclaration centrée en gras
    const refLine  = "N  declaration : " + ref;
    const refW     = fontB.widthOfTextAtSize(refLine, 10);
    txt("N  declaration : " + ref, (width - refW) / 2, Y, { font: fontB, size: 10 });
    Y += 16;

    // NIU
    txt("NIU :",                  marg,       Y, { font: fontB, size: 8.5 });
    txt(niu,                      marg + 32,  Y, { font: fontI, size: 8.5 });
    Y += 12;

    // Nom
    txt("Nom/Raison sociale :",   marg,       Y, { font: fontB, size: 8.5 });
    txt(nom,                      marg + 100, Y, { font: fontI, size: 8.5 });
    Y += 12;

    // Objet
    txt("Objet :",                marg,       Y, { font: fontB, size: 8.5 });
    txt("IMPOTS, DROITS ET TAXES SUR LE REVENU (" + annee + ")", marg + 42, Y, { font: fontB, size: 8.5 });
    Y += 12;

    // Dates + Rattachement sur 2 colonnes
    const col2 = width / 2 + 10;
    txt("Date declaration :",     marg,       Y, { font: fontB, size: 8.5 });
    txt(dateDecl,                 marg + 90,  Y, { font: fontI, size: 8.5 });
    txt("Date signature :",       col2,       Y, { font: fontB, size: 8.5 });
    Y += 12;

    txt("Rattachement :",         marg,       Y, { font: fontB, size: 8.5 });
    txt(struct,                   marg + 74,  Y, { font: fontI, size: 8.5 });
    txt("Date notification :",    col2,       Y, { font: fontB, size: 8.5 });
    Y += 12;

    txt("Reference :",            marg,       Y, { font: fontB, size: 8.5 });
    txt(ref,                      marg + 58,  Y, { font: fontI, size: 8.5 });
    Y += 18;

    // RIB centré + gras
    const ribLine = "RIB du receveur : " + rib;
    const ribW    = fontB.widthOfTextAtSize(ribLine, 9.5);
    txt(ribLine, (width - ribW) / 2, Y, { font: fontB, size: 9.5 });
    Y += 18;

    // ════════════════════════════════════════════════════════════════════════
    // TABLEAU
    // ════════════════════════════════════════════════════════════════════════
    const tW     = width - 2 * marg;
    const colW   = [22, 170, 95, 165, 63]; // N°, Libellé, Imputation, Intitulé, Montant
    const rowH   = 20;

    // positions x colonnes
    const colX = colW.reduce((acc, w, i) => {
        acc.push(i === 0 ? marg : acc[i - 1] + colW[i - 1]);
        return acc;
    }, []);

    // En-tête tableau
    box(marg, Y, tW, rowH, { fill: rgb(0.12, 0.12, 0.12), bw: 0 });
    const headers = ["N ", "Libelle impots, droits et taxes", "Imputation", "Intitule", "Montant"];
    headers.forEach((h, i) => txt(h, colX[i] + 3, Y + 13, { font: fontB, size: 7.5, color: rgb(1, 1, 1) }));
    Y += rowH;

    // Lignes données
    const lignes      = calculerLignes(declaration.montantBrut || 0);
    const totalMontant = declaration.montantBrut || 0;

    lignes.forEach((row, idx) => {
        const bg = idx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.97, 0.97, 0.97);
        box(marg, Y, tW, rowH, { fill: bg, border: rgb(0.82, 0.82, 0.82), bw: 0.3 });

        // Séparateurs verticaux
        let cx = marg;
        colW.forEach((w) => {
            cx += w;
            page.drawLine({
                start: { x: cx, y: height - Y },
                end:   { x: cx, y: height - Y - rowH },
                thickness: 0.3, color: rgb(0.75, 0.75, 0.75),
            });
        });

        txt(String(row.num),          colX[0] + 7,  Y + 13, { size: 8.5 });
        txt(row.libelle,              colX[1] + 3,  Y + 13, { size: 7.5 });
        txt(row.imputation,           colX[2] + 3,  Y + 13, { size: 7.5 });
        txt(row.intitule,             colX[3] + 3,  Y + 13, { size: 7.5 });

        // Montant aligné à droite
        const mStr = fmt(row.montant);
        const mW   = fontR.widthOfTextAtSize(mStr, 8.5);
        txt(mStr, colX[4] + colW[4] - mW - 4, Y + 13, { size: 8.5 });

        Y += rowH;
    });

    // Ligne Total
    box(marg, Y, tW, rowH + 2, { fill: rgb(0.88, 0.88, 0.88), border: NOIR, bw: 0.8 });
    txt("Total :", colX[3] + 3, Y + 14, { font: fontB, size: 10 });
    const totalStr = fmt(totalMontant);
    const totalW   = fontB.widthOfTextAtSize(totalStr, 11);
    txt(totalStr, colX[4] + colW[4] - totalW - 4, Y + 14, { font: fontB, size: 11 });
    Y += rowH + 2;

    // ════════════════════════════════════════════════════════════════════════
    // MONTANT EN LETTRES
    // ════════════════════════════════════════════════════════════════════════
    Y += 14;
    const lettres  = montantEnLettres(totalMontant);
    const lettresW = fontB.widthOfTextAtSize(lettres, 9);
    txt(lettres, (width - lettresW) / 2, Y, { font: fontB, size: 9 });

    // ════════════════════════════════════════════════════════════════════════
    // PIED DE PAGE
    // ════════════════════════════════════════════════════════════════════════
    const now = new Date().toLocaleString("fr-FR").replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
    page.drawText("Edite sur Harmony le " + safe(now), {
        x: marg, y: 20, font: fontR, size: 7, color: GRIS,
    });
    page.drawText("1 / 1", {
        x: width - marg - 20, y: 20, font: fontR, size: 7, color: GRIS,
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

// ─── Déclencher le téléchargement ────────────────────────────────────────────
export function downloadPDF(bytes, filename) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}