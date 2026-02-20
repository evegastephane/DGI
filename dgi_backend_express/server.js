const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3001;

// ─── MIDDLEWARES ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── CHARGEMENT DE LA BASE DE DONNÉES JSON ────────────────────────────────────
// db.json joue le rôle de la base de données.
// Toutes les modifications sont en mémoire — au redémarrage les données originales reviennent.
const DB_PATH = path.join(__dirname, 'db.json');
let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const nextId = (entity) => ++db._counters[entity];

const paginate = (array, page = 1, size = 20) => {
    const p = parseInt(page), s = parseInt(size);
    const start = (p - 1) * s;
    return {
        content: array.slice(start, start + s),
        totalElements: array.length,
        totalPages: Math.ceil(array.length / s),
        currentPage: p,
        pageSize: s,
    };
};

const success = (res, data, status = 200) =>
    res.status(status).json({ success: true, data, timestamp: new Date().toISOString() });

const error = (res, message, status = 400) =>
    res.status(status).json({ success: false, message, timestamp: new Date().toISOString() });

// ─── SIMULATION DÉLAI RÉSEAU (comme un vrai backend distant) ─────────────────
app.use((req, res, next) => {
    setTimeout(next, Math.floor(Math.random() * 150) + 50); // 50–200 ms
});

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════════════════════════════
app.get('/', (req, res) => {
    res.json({
        application: "Simulateur Backend Fiscal DGI",
        version: "1.0.0",
        status: "UP",
        timestamp: new Date().toISOString(),
        routes: [
            "GET    /api/contribuables",
            "GET    /api/contribuables/:id",
            "POST   /api/contribuables",
            "PUT    /api/contribuables/:id",
            "DELETE /api/contribuables/:id",
            "GET    /api/contribuables/:id/declarations",
            "GET    /api/contribuables/:id/avis-imposition",
            "GET    /api/contribuables/:id/notifications",
            "GET    /api/contribuables/:id/AMR",
            "GET    /api/contribuables/:id/etablissements",
            "---",
            "GET    /api/communes",
            "POST   /api/communes",
            "---",
            "GET    /api/etablissements",
            "GET    /api/etablissements/:id",
            "POST   /api/etablissements",
            "PUT    /api/etablissements/:id",
            "---",
            "GET    /api/declarations",
            "GET    /api/declarations/:id",
            "POST   /api/declarations",
            "PUT    /api/declarations/:id",
            "PATCH  /api/declarations/:id/statut",
            "GET    /api/declarations/:id/paiements",
            "---",
            "GET    /api/paiements",
            "GET    /api/paiements/:id",
            "POST   /api/paiements",
            "GET    /api/paiements/:id/beneficiaires",
            "---",
            "GET    /api/avis-imposition",
            "GET    /api/avis-imposition/:id",
            "---",
            "GET    /api/AMR",
            "GET    /api/AMR/:id",
            "POST   /api/AMR",
            "PATCH  /api/AMR/:id/statut",
            "---",
            "GET    /api/notifications",
            "PATCH  /api/notifications/:id/lire",
            "PATCH  /api/notifications/lire-tout",
            "---",
            "GET    /api/dashboard/stats",
            "GET    /api/dashboard/recettes-par-commune",
            "GET    /api/dashboard/declarations-par-type",
            "---",
            "POST   /api/fiscal/calculer-patente",
            "POST   /api/fiscal/calculer-TDL",
        ],
    });
});

app.get('/api/health', (req, res) => {
    success(res, {
        status: "UP",
        database: "JSON_FILE",
        entities: Object.keys(db).filter((k) => k !== '_counters').length,
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// CONTRIBUABLES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/contribuables', (req, res) => {
    let results = [...db.contribuables];
    const { statut, NIU, nom, page, size } = req.query;
    if (statut) results = results.filter((c) => c.statut === statut.toUpperCase());
    if (NIU)    results = results.filter((c) => c.NIU.toLowerCase().includes(NIU.toLowerCase()));
    if (nom)    results = results.filter((c) =>
        c.nom_beneficiaire.toLowerCase().includes(nom.toLowerCase()) ||
        c.prenom.toLowerCase().includes(nom.toLowerCase()) ||
        c.raison_sociale.toLowerCase().includes(nom.toLowerCase())
    );
    success(res, paginate(results, page, size));
});

app.get('/api/contribuables/:id', (req, res) => {
    const c = db.contribuables.find((c) => c.id_contribuable === parseInt(req.params.id));
    if (!c) return error(res, "Contribuable introuvable", 404);
    const commune = db.communes.find((com) => com.id_commune === c.id_commune);
    success(res, { ...c, commune });
});

app.post('/api/contribuables', (req, res) => {
    const { NIU, email } = req.body;
    if (!NIU || !email) return error(res, "NIU et email sont obligatoires");
    if (db.contribuables.find((c) => c.NIU === NIU))
        return error(res, "Un contribuable avec ce NIU existe déjà", 409);
    const nouveau = {
        id_contribuable: nextId('contribuable'),
        ...req.body,
        date_immatriculation: new Date().toISOString().split('T')[0],
        statut: "ACTIF",
    };
    db.contribuables.push(nouveau);
    success(res, nouveau, 201);
});

app.put('/api/contribuables/:id', (req, res) => {
    const idx = db.contribuables.findIndex((c) => c.id_contribuable === parseInt(req.params.id));
    if (idx === -1) return error(res, "Contribuable introuvable", 404);
    db.contribuables[idx] = { ...db.contribuables[idx], ...req.body, id_contribuable: parseInt(req.params.id) };
    success(res, db.contribuables[idx]);
});

app.delete('/api/contribuables/:id', (req, res) => {
    const idx = db.contribuables.findIndex((c) => c.id_contribuable === parseInt(req.params.id));
    if (idx === -1) return error(res, "Contribuable introuvable", 404);
    db.contribuables[idx].statut = "SUPPRIME";
    success(res, { message: "Contribuable désactivé avec succès" });
});

// ── Relations ──────────────────────────────────────────────────────────────────
app.get('/api/contribuables/:id/declarations', (req, res) => {
    const id = parseInt(req.params.id);
    if (!db.contribuables.find((c) => c.id_contribuable === id))
        return error(res, "Contribuable introuvable", 404);
    success(res, db.declarations.filter((d) => d.id_contribuable === id));
});

app.get('/api/contribuables/:id/avis-imposition', (req, res) => {
    const id = parseInt(req.params.id);
    success(res, db.avis_imposition.filter((a) => a.id_contribuable === id));
});

app.get('/api/contribuables/:id/notifications', (req, res) => {
    const id = parseInt(req.params.id);
    const notifs = db.notifications
        .filter((n) => n.id_contribuable === id)
        .sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    success(res, notifs);
});

app.get('/api/contribuables/:id/AMR', (req, res) => {
    const id = parseInt(req.params.id);
    success(res, db.AMR.filter((a) => a.id_contribuable === id));
});

app.get('/api/contribuables/:id/etablissements', (req, res) => {
    const id = parseInt(req.params.id);
    success(res, db.etablissements.filter((e) => e.id_contribuable === id));
});

// ══════════════════════════════════════════════════════════════════════════════
// COMMUNES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/communes', (req, res) => {
    let results = [...db.communes];
    if (req.query.type) results = results.filter((c) => c.type_commune === req.query.type.toUpperCase());
    success(res, results);
});

app.post('/api/communes', (req, res) => {
    const nouveau = { id_commune: nextId('commune'), ...req.body };
    db.communes.push(nouveau);
    success(res, nouveau, 201);
});

// ══════════════════════════════════════════════════════════════════════════════
// ETABLISSEMENTS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/etablissements', (req, res) => {
    let results = [...db.etablissements];
    if (req.query.id_contribuable) results = results.filter((e) => e.id_contribuable === parseInt(req.query.id_contribuable));
    if (req.query.id_commune)      results = results.filter((e) => e.id_commune      === parseInt(req.query.id_commune));
    success(res, paginate(results, req.query.page, req.query.size));
});

app.get('/api/etablissements/:id', (req, res) => {
    const e = db.etablissements.find((e) => e.id_etablissement === parseInt(req.params.id));
    if (!e) return error(res, "Etablissement introuvable", 404);
    success(res, e);
});

app.post('/api/etablissements', (req, res) => {
    const nouveau = { id_etablissement: nextId('etablissement'), ...req.body };
    db.etablissements.push(nouveau);
    success(res, nouveau, 201);
});

app.put('/api/etablissements/:id', (req, res) => {
    const idx = db.etablissements.findIndex((e) => e.id_etablissement === parseInt(req.params.id));
    if (idx === -1) return error(res, "Etablissement introuvable", 404);
    db.etablissements[idx] = { ...db.etablissements[idx], ...req.body, id_etablissement: parseInt(req.params.id) };
    success(res, db.etablissements[idx]);
});

// ══════════════════════════════════════════════════════════════════════════════
// DÉCLARATIONS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/declarations', (req, res) => {
    let results = [...db.declarations];
    const { statut, type_declaration, annee_fiscale, id_contribuable } = req.query;
    if (statut)           results = results.filter((d) => d.statut           === statut.toUpperCase());
    if (type_declaration) results = results.filter((d) => d.type_declaration === type_declaration.toUpperCase());
    if (annee_fiscale)    results = results.filter((d) => d.annee_fiscale    === parseInt(annee_fiscale));
    if (id_contribuable)  results = results.filter((d) => d.id_contribuable  === parseInt(id_contribuable));

    const enriched = results.map((d) => {
        const c = db.contribuables.find((c) => c.id_contribuable === d.id_contribuable);
        return { ...d, contribuable: c ? `${c.prenom} ${c.nom_beneficiaire}` : null };
    });
    success(res, paginate(enriched, req.query.page, req.query.size));
});

app.get('/api/declarations/:id', (req, res) => {
    const d = db.declarations.find((d) => d.id_declaration === parseInt(req.params.id));
    if (!d) return error(res, "Déclaration introuvable", 404);
    const contribuable  = db.contribuables.find((c)  => c.id_contribuable  === d.id_contribuable);
    const etablissement = db.etablissements.find((e) => e.id_etablissement === d.id_etablissement);
    const paiements     = db.paiements.filter((p)    => p.id_declaration   === d.id_declaration);
    success(res, { ...d, contribuable, etablissement, paiements });
});

app.post('/api/declarations', (req, res) => {
    const { id_contribuable, type_declaration, annee_fiscale } = req.body;
    if (!id_contribuable || !type_declaration) return error(res, "id_contribuable et type_declaration sont obligatoires");

    const contribuable = db.contribuables.find((c) => c.id_contribuable === parseInt(id_contribuable));
    if (!contribuable) return error(res, "Contribuable introuvable", 404);

    const id = nextId('declaration');
    const nouveau = {
        id_declaration: id,
        type_declaration: type_declaration.toUpperCase(),
        date_declaration: new Date().toISOString().split('T')[0],
        statut: "EN_COURS",
        reference_declaration: `DEC-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`,
        date_soumission: new Date().toISOString().split('T')[0],
        annee_fiscale: annee_fiscale || new Date().getFullYear(),
        ...req.body,
        id_contribuable: parseInt(id_contribuable),
    };
    db.declarations.push(nouveau);

    db.notifications.push({
        id_notification: nextId('notification'),
        titre: "Déclaration soumise",
        statut: "NON_LU",
        contenu: `Votre déclaration ${nouveau.reference_declaration} a été soumise avec succès.`,
        id_contribuable: parseInt(id_contribuable),
        date_creation: new Date().toISOString().split('T')[0],
    });

    success(res, nouveau, 201);
});

app.put('/api/declarations/:id', (req, res) => {
    const idx = db.declarations.findIndex((d) => d.id_declaration === parseInt(req.params.id));
    if (idx === -1) return error(res, "Déclaration introuvable", 404);
    db.declarations[idx] = { ...db.declarations[idx], ...req.body, id_declaration: parseInt(req.params.id) };
    success(res, db.declarations[idx]);
});

app.patch('/api/declarations/:id/statut', (req, res) => {
    const idx = db.declarations.findIndex((d) => d.id_declaration === parseInt(req.params.id));
    if (idx === -1) return error(res, "Déclaration introuvable", 404);

    const { statut, motif_rejet } = req.body;
    const statutsValides = ["EN_COURS", "VALIDEE", "REJETEE", "ANNULEE"];
    if (!statutsValides.includes(statut)) return error(res, `Statut invalide. Valeurs: ${statutsValides.join(', ')}`);

    const ancienStatut  = db.declarations[idx].statut;
    db.declarations[idx].statut = statut;
    const ref           = db.declarations[idx].reference_declaration;
    const id_contribuable = db.declarations[idx].id_contribuable;

    const messages = {
        VALIDEE: `Votre déclaration ${ref} a été validée.`,
        REJETEE: `Votre déclaration ${ref} a été rejetée. Motif: ${motif_rejet || 'Non précisé'}`,
        ANNULEE: `Votre déclaration ${ref} a été annulée.`,
    };
    if (messages[statut]) {
        db.notifications.push({
            id_notification: nextId('notification'), titre: `Déclaration ${statut.toLowerCase()}`,
            statut: "NON_LU", contenu: messages[statut],
            id_contribuable, date_creation: new Date().toISOString().split('T')[0],
        });
    }

    // Validation → création automatique d'un avis d'imposition
    if (statut === "VALIDEE" && ancienStatut !== "VALIDEE") {
        const idAvis = nextId('avis');
        db.avis_imposition.push({
            id_avis: idAvis,
            reference: `AV-GNR-${Date.now()}`,
            RIB_receveur: "CM21 00000 00000 000000000000 00",
            date_reception: new Date().toISOString().split('T')[0],
            date_notification: new Date().toISOString().split('T')[0],
            montant: db.declarations[idx].montant_a_payer || 0,
            statut: "NON_PAYE",
            id_contribuable,
            id_declaration: parseInt(req.params.id),
        });
    }

    success(res, db.declarations[idx]);
});

app.get('/api/declarations/:id/paiements', (req, res) => {
    const id  = parseInt(req.params.id);
    const pays = db.paiements.filter((p) => p.id_declaration === id);
    const totalPaye = pays.reduce((sum, p) => sum + p.montant_paye, 0);
    const declaration = db.declarations.find((d) => d.id_declaration === id);
    success(res, {
        paiements: pays,
        totalPaye,
        resteAPayer: declaration ? Math.max(0, declaration.montant_a_payer - totalPaye) : null,
    });
});

// ══════════════════════════════════════════════════════════════════════════════
// PAIEMENTS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/paiements', (req, res) => {
    let results = [...db.paiements];
    if (req.query.statut)       results = results.filter((p) => p.statut       === req.query.statut.toUpperCase());
    if (req.query.mode_paiement)results = results.filter((p) => p.mode_paiement=== req.query.mode_paiement.toUpperCase());
    success(res, paginate(results, req.query.page, req.query.size));
});

app.get('/api/paiements/:id', (req, res) => {
    const p = db.paiements.find((p) => p.id_paiement === parseInt(req.params.id));
    if (!p) return error(res, "Paiement introuvable", 404);
    const beneficiaires = db.beneficiaires.filter((b) => b.id_paiement === p.id_paiement);
    success(res, { ...p, beneficiaires });
});

app.post('/api/paiements', (req, res) => {
    const { id_declaration, montant_paye, mode_paiement } = req.body;
    if (!id_declaration || !montant_paye || !mode_paiement)
        return error(res, "id_declaration, montant_paye et mode_paiement sont obligatoires");

    const declaration = db.declarations.find((d) => d.id_declaration === parseInt(id_declaration));
    if (!declaration) return error(res, "Déclaration introuvable", 404);
    if (declaration.statut !== "VALIDEE") return error(res, "Impossible de payer une déclaration non validée");

    const id = nextId('paiement');
    const nouveau = {
        id_paiement: id,
        reference_paiement: `PAY-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`,
        date_paiement: new Date().toISOString().split('T')[0],
        statut: "EFFECTUE",
        ...req.body,
        id_declaration: parseInt(id_declaration),
        montant_paye: parseFloat(montant_paye),
    };
    db.paiements.push(nouveau);

    // Ventilation automatique: 60% commune / 40% trésor
    const idB1 = nextId('beneficiaire');
    const idB2 = nextId('beneficiaire');
    db.beneficiaires.push(
        { id_beneficiaire: idB1, nom_beneficiaire: "Commune", pourcentage_ventilation: 60.0, montant_ventile: parseFloat(montant_paye) * 0.6, id_paiement: id },
        { id_beneficiaire: idB2, nom_beneficiaire: "Trésor Public", pourcentage_ventilation: 40.0, montant_ventile: parseFloat(montant_paye) * 0.4, id_paiement: id }
    );

    db.notifications.push({
        id_notification: nextId('notification'), titre: "Paiement confirmé", statut: "NON_LU",
        contenu: `Paiement ${nouveau.reference_paiement} de ${Number(montant_paye).toLocaleString()} FCFA confirmé.`,
        id_contribuable: declaration.id_contribuable,
        date_creation: new Date().toISOString().split('T')[0],
    });

    success(res, nouveau, 201);
});

app.get('/api/paiements/:id/beneficiaires', (req, res) => {
    success(res, db.beneficiaires.filter((b) => b.id_paiement === parseInt(req.params.id)));
});

// ══════════════════════════════════════════════════════════════════════════════
// AVIS D'IMPOSITION
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/avis-imposition', (req, res) => {
    let results = [...db.avis_imposition];
    if (req.query.id_contribuable) results = results.filter((a) => a.id_contribuable === parseInt(req.query.id_contribuable));
    if (req.query.statut)          results = results.filter((a) => a.statut === req.query.statut.toUpperCase());
    success(res, results);
});

app.get('/api/avis-imposition/:id', (req, res) => {
    const a = db.avis_imposition.find((a) => a.id_avis === parseInt(req.params.id));
    if (!a) return error(res, "Avis d'imposition introuvable", 404);
    const declaration  = db.declarations.find((d)  => d.id_declaration  === a.id_declaration);
    const contribuable = db.contribuables.find((c) => c.id_contribuable === a.id_contribuable);
    success(res, { ...a, declaration, contribuable });
});

// ══════════════════════════════════════════════════════════════════════════════
// AMR
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/AMR', (req, res) => {
    let results = [...db.AMR];
    if (req.query.statut)          results = results.filter((a) => a.statut         === req.query.statut.toUpperCase());
    if (req.query.id_contribuable) results = results.filter((a) => a.id_contribuable=== parseInt(req.query.id_contribuable));
    success(res, paginate(results, req.query.page, req.query.size));
});

app.get('/api/AMR/:id', (req, res) => {
    const a = db.AMR.find((a) => a.id_AMR === parseInt(req.params.id));
    if (!a) return error(res, "AMR introuvable", 404);
    const contribuable = db.contribuables.find((c) => c.id_contribuable === a.id_contribuable);
    success(res, { ...a, contribuable });
});

app.post('/api/AMR', (req, res) => {
    const { id_contribuable, motif, montant_initial } = req.body;
    if (!id_contribuable || !motif || !montant_initial)
        return error(res, "id_contribuable, motif et montant_initial sont obligatoires");
    if (!db.contribuables.find((c) => c.id_contribuable === parseInt(id_contribuable)))
        return error(res, "Contribuable introuvable", 404);

    const id = nextId('AMR');
    const majorations = parseFloat(montant_initial) * 0.10;
    const nouveau = {
        id_AMR: id,
        numero_AMR: parseInt(`2024${String(id).padStart(4, '0')}`),
        date_emission: new Date().toISOString().split('T')[0],
        montant_initial: parseFloat(montant_initial),
        montant_majorations: majorations,
        montant_total: parseFloat(montant_initial) + majorations,
        statut: "EN_COURS",
        ...req.body,
        id_contribuable: parseInt(id_contribuable),
    };
    db.AMR.push(nouveau);

    db.notifications.push({
        id_notification: nextId('notification'), titre: "URGENT — Avis de Mise en Recouvrement", statut: "NON_LU",
        contenu: `Un AMR (N° ${nouveau.numero_AMR}) de ${nouveau.montant_total.toLocaleString()} FCFA a été émis contre vous.`,
        id_contribuable: parseInt(id_contribuable),
        date_creation: new Date().toISOString().split('T')[0],
    });

    success(res, nouveau, 201);
});

app.patch('/api/AMR/:id/statut', (req, res) => {
    const idx = db.AMR.findIndex((a) => a.id_AMR === parseInt(req.params.id));
    if (idx === -1) return error(res, "AMR introuvable", 404);
    const { statut } = req.body;
    const statutsValides = ["EN_COURS", "APURE", "CONTESTE", "ANNULE"];
    if (!statutsValides.includes(statut)) return error(res, `Statut invalide. Valeurs: ${statutsValides.join(', ')}`);
    db.AMR[idx].statut = statut;
    success(res, db.AMR[idx]);
});

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/notifications', (req, res) => {
    let results = [...db.notifications];
    if (req.query.id_contribuable) results = results.filter((n) => n.id_contribuable === parseInt(req.query.id_contribuable));
    if (req.query.statut)          results = results.filter((n) => n.statut === req.query.statut.toUpperCase());
    results.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    success(res, results);
});

app.patch('/api/notifications/:id/lire', (req, res) => {
    const idx = db.notifications.findIndex((n) => n.id_notification === parseInt(req.params.id));
    if (idx === -1) return error(res, "Notification introuvable", 404);
    db.notifications[idx].statut = "LU";
    success(res, db.notifications[idx]);
});

app.patch('/api/notifications/lire-tout', (req, res) => {
    const { id_contribuable } = req.body;
    db.notifications
        .filter((n) => !id_contribuable || n.id_contribuable === parseInt(id_contribuable))
        .forEach((n) => (n.statut = "LU"));
    success(res, { message: "Toutes les notifications marquées comme lues" });
});

// ══════════════════════════════════════════════════════════════════════════════
// TAXES SPÉCIFIQUES
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/licences', (req, res) => success(res, db.licences));
app.get('/api/patentes', (req, res) => success(res, db.patentes));
app.get('/api/TDL',     (req, res) => success(res, db.TDL));
app.get('/api/IGS',     (req, res) => success(res, db.IGS));

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD — STATISTIQUES MÉTIER
// ══════════════════════════════════════════════════════════════════════════════
app.get('/api/dashboard/stats', (req, res) => {
    const { id_contribuable } = req.query;

    // Stats globales (admin) ou filtrées (contribuable connecté)
    let declarations = db.declarations;
    let notifications = db.notifications;
    let amr = db.AMR;
    let avis = db.avis_imposition;

    if (id_contribuable) {
        const id = parseInt(id_contribuable);
        declarations = declarations.filter((d) => d.id_contribuable === id);
        notifications = notifications.filter((n) => n.id_contribuable === id);
        amr = amr.filter((a) => a.id_contribuable === id);
        avis = avis.filter((a) => a.id_contribuable === id);
    }

    const declarationsValidees = declarations.filter((d) => d.statut === "VALIDEE");
    const totalRecettes = db.paiements
        .filter((p) => {
            if (!id_contribuable) return p.statut === "EFFECTUE";
            const decl = declarationsValidees.find((d) => d.id_declaration === p.id_declaration);
            return decl && p.statut === "EFFECTUE";
        })
        .reduce((sum, p) => sum + p.montant_paye, 0);

    success(res, {
        declarations: {
            total: declarations.length,
            validees: declarationsValidees.length,
            en_cours: declarations.filter((d) => d.statut === "EN_COURS").length,
            rejetees: declarations.filter((d) => d.statut === "REJETEE").length,
            taux_validation: declarations.length
                ? Math.round((declarationsValidees.length / declarations.length) * 100)
                : 0,
        },
        avis: {
            total: avis.length,
            payes: avis.filter((a) => a.statut === "PAYE").length,
            non_payes: avis.filter((a) => a.statut === "NON_PAYE").length,
        },
        AMR: {
            total: amr.length,
            en_cours: amr.filter((a) => a.statut === "EN_COURS").length,
            montant_total: amr.filter((a) => a.statut === "EN_COURS").reduce((s, a) => s + a.montant_total, 0),
        },
        recettes: { total_recouvre: totalRecettes },
        notifications: { non_lues: notifications.filter((n) => n.statut === "NON_LU").length },
    });
});

app.get('/api/dashboard/recettes-par-commune', (req, res) => {
    const data = db.communes.map((commune) => {
        const ids = db.contribuables.filter((c) => c.id_commune === commune.id_commune).map((c) => c.id_contribuable);
        const declIds = db.declarations.filter((d) => ids.includes(d.id_contribuable) && d.statut === "VALIDEE").map((d) => d.id_declaration);
        const recettes = db.paiements
            .filter((p) => declIds.includes(p.id_declaration) && p.statut === "EFFECTUE")
            .reduce((sum, p) => sum + p.montant_paye, 0);
        return { commune: commune.nom_commune, recettes, nb_contribuables: ids.length };
    });
    success(res, data);
});

app.get('/api/dashboard/declarations-par-type', (req, res) => {
    const types = ["PATENTE", "IGS", "TDL", "LICENCE"];
    const data  = types.map((type) => ({
        type,
        count: db.declarations.filter((d) => d.type_declaration === type).length,
        montant_total: db.declarations
            .filter((d) => d.type_declaration === type && d.statut === "VALIDEE")
            .reduce((sum, d) => sum + d.montant_a_payer, 0),
    }));
    success(res, data);
});

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL FISCAL
// ══════════════════════════════════════════════════════════════════════════════
app.post('/api/fiscal/calculer-patente', (req, res) => {
    const { chiffre_affaire, type_activite } = req.body;
    if (!chiffre_affaire) return error(res, "chiffre_affaire est obligatoire");
    const ca = parseFloat(chiffre_affaire);
    const taux = type_activite === "INDUSTRIE" ? 0.025 : type_activite === "PRESTATION_SERVICE" ? 0.035 : 0.03;
    const droit = ca * taux;
    const centimes = droit * 0.10;
    success(res, { chiffre_affaire: ca, taux_applique: `${taux * 100}%`, droit_patente: droit, centimes_additionnels: centimes, montant_total: droit + centimes });
});

app.post('/api/fiscal/calculer-TDL', (req, res) => {
    const { surface_m2, commune } = req.body;
    if (!surface_m2) return error(res, "surface_m2 est obligatoire");
    const communeObj = db.communes.find((c) => c.nom_commune === commune);
    const tarif = communeObj?.type_commune === "SEMI_URBAINE" ? 1500 : 2500;
    success(res, { surface_m2: parseFloat(surface_m2), tarif_m2: tarif, montant_TDL: parseFloat(surface_m2) * tarif });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    error(res, `Route '${req.method} ${req.path}' introuvable. Consultez GET / pour la liste.`, 404);
});

// ─── DÉMARRAGE ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║     🚀 SIMULATEUR BACKEND FISCAL DGI             ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  URL:    http://localhost:${PORT}                   ║`);
    console.log(`║  Health: http://localhost:${PORT}/api/health        ║`);
    console.log(`║  Stats:  http://localhost:${PORT}/api/dashboard/stats║`);
    console.log('╚══════════════════════════════════════════════════╝\n');
});