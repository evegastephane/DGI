package com.example.backend.controller;

import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/fiscal")
@CrossOrigin(origins = "*")
public class FiscalController {

    @PostMapping("/calculer-patente")
    public Map<String, Object> calculerPatente(@RequestBody Map<String, Object> request) {
        Double ca = Double.valueOf(request.get("chiffre_affaire").toString());
        String typeActivite = (String) request.get("type_activite");

        double taux = "INDUSTRIE".equals(typeActivite) ? 0.025 : "PRESTATION_SERVICE".equals(typeActivite) ? 0.035 : 0.03;
        double droit = ca * taux;
        double centimes = droit * 0.10;

        Map<String, Object> response = new HashMap<>();
        response.put("chiffre_affaire", ca);
        response.put("taux_applique", (taux * 100) + "%");
        response.put("droit_patente", droit);
        response.put("centimes_additionnels", centimes);
        response.put("montant_total", droit + centimes);
        return response;
    }

    @PostMapping("/calculer-TDL")
    public Map<String, Object> calculerTDL(@RequestBody Map<String, Object> request) {
        Double surface = Double.valueOf(request.get("surface_m2").toString());
        double tarif = 2500;

        Map<String, Object> response = new HashMap<>();
        response.put("surface_m2", surface);
        response.put("tarif_m2", tarif);
        response.put("montant_TDL", surface * tarif);
        return response;
    }
}
