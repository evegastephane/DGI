package com.example.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/fiscal")
@CrossOrigin(origins = "*")
public class FiscalController {

    // ─── Logique fiscale ──────────────────────────────────────────────────

    /**
     * Retourne le taux d'imposition selon la structure fiscale :
     *  - CGA  → 0.0  (exonéré pendant 1 an)
     *  - DGE  → 0.002 (0,2 %)
     *  - autre → 0.00156 (taux patente standard)
     */
    private double getTauxImpot(String structureFiscale) {
        if (structureFiscale == null) return 0.00156;
        String sf = structureFiscale.toUpperCase();
        if (sf.contains("CGA"))  return 0.0;
        if (sf.contains("DGE"))  return 0.002;
        return 0.00156;
    }

    private double calculerImpot(double montant, String structureFiscale) {
        return montant * getTauxImpot(structureFiscale);
    }

    // ─── Endpoints ────────────────────────────────────────────────────────

    @PostMapping("/calculer-patente")
    public Map<String, Object> calculerPatente(@RequestBody Map<String, Object> request) {
        Double ca          = Double.valueOf(request.get("chiffre_affaire").toString());
        String typeActivite = (String) request.get("type_activite");

        double taux    = "INDUSTRIE".equals(typeActivite) ? 0.025
                : "PRESTATION_SERVICE".equals(typeActivite) ? 0.035
                : 0.03;
        double droit   = ca * taux;
        double centimes = droit * 0.10;

        Map<String, Object> response = new HashMap<>();
        response.put("chiffre_affaire",       ca);
        response.put("taux_applique",         (taux * 100) + "%");
        response.put("droit_patente",         droit);
        response.put("centimes_additionnels", centimes);
        response.put("montant_total",         droit + centimes);
        return response;
    }

    @PostMapping("/calculer-TDL")
    public Map<String, Object> calculerTDL(@RequestBody Map<String, Object> request) {
        Double surface = Double.valueOf(request.get("surface_m2").toString());
        double tarif   = 2500;

        Map<String, Object> response = new HashMap<>();
        response.put("surface_m2",   surface);
        response.put("tarif_m2",     tarif);
        response.put("montant_TDL",  surface * tarif);
        return response;
    }

    /**
     * GET /api/fiscal/taux-impot?structureFiscale=DGE
     */
    @GetMapping("/taux-impot")
    public Map<String, Object> getTauxImpotEndpoint(
            @RequestParam(required = false) String structureFiscale) {

        double taux        = getTauxImpot(structureFiscale);
        String centre      = "AUTRE";
        String description = "Taux standard";

        if (structureFiscale != null) {
            String sf = structureFiscale.toUpperCase();
            if (sf.contains("CGA")) {
                centre      = "CGA";
                description = "Adhérant CGA — Exonéré d'impôt sur 1 an";
            } else if (sf.contains("DGE")) {
                centre      = "DGE";
                description = "Contribuable DGE — Taux préférentiel 0,2%";
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("structureFiscale", structureFiscale);
        response.put("centre",           centre);
        response.put("tauxImpot",        taux);
        response.put("tauxPourcentage",  (taux * 100) + "%");
        response.put("description",      description);
        response.put("exonere",          taux == 0.0);
        return response;
    }

    /**
     * POST /api/fiscal/calculer-impot
     */
    @PostMapping("/calculer-impot")
    public Map<String, Object> calculerImpotEndpoint(@RequestBody Map<String, Object> request) {
        Double montant         = Double.valueOf(request.get("montant").toString());
        String structureFiscale = (String) request.get("structureFiscale");
        double taux            = getTauxImpot(structureFiscale);
        double impot           = calculerImpot(montant, structureFiscale);

        Map<String, Object> response = new HashMap<>();
        response.put("montantBase",      montant);
        response.put("structureFiscale", structureFiscale);
        response.put("tauxImpot",        taux);
        response.put("montantImpot",     impot);
        response.put("montantNet",       montant - impot);
        return response;
    }
}