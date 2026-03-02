package com.example.backend.controller;

import com.example.backend.model.AvisImposition;
import com.example.backend.model.Contribuable;
import com.example.backend.service.AvisImpositionService;
import com.example.backend.service.ContribuableService;
import com.example.backend.util.AvisGeneratorUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AvisImpositionController
 *
 * Changement par rapport à l'original :
 *  - Injection de ContribuableService et AvisGeneratorUtil
 *  - Nouveau endpoint GET /api/avis-imposition/{id}/telecharger
 *    → retourne le PDF généré depuis le template DOCX (bytes)
 *    → annoté @ResponseBody raw (pas enveloppé par ResponseWrapper)
 */
@RestController
@CrossOrigin(origins = "*")
public class AvisImpositionController {

    @Autowired private AvisImpositionService service;
    @Autowired private ContribuableService   contribuableService;
    @Autowired private AvisGeneratorUtil     avisGenerator;

    // ─── GET /api/avis-imposition — liste avec filtres optionnels ────────────
    @GetMapping("/api/avis-imposition")
    public List<AvisImposition> getAll(
            @RequestParam(required = false) Long    id_contribuable,
            @RequestParam(required = false) Integer annee_fiscale) {
        return service.findAll(id_contribuable, annee_fiscale);
    }

    // ─── GET /api/contribuables/{id}/avis-imposition ─────────────────────────
    @GetMapping("/api/contribuables/{idContribuable}/avis-imposition")
    public List<AvisImposition> getByContribuable(@PathVariable Long idContribuable) {
        return service.findByIdContribuable(idContribuable);
    }

    // ─── GET /api/avis-imposition/{id} ──────────────────────────────────────
    @GetMapping("/api/avis-imposition/{id}")
    public ResponseEntity<AvisImposition> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── GET /api/avis-imposition/{id}/telecharger ───────────────────────────
    // Génère le PDF depuis le template DOCX et le retourne en binaire.
    // Le ResponseWrapper est contourné : on retourne ResponseEntity<byte[]>
    // avec Content-Type application/pdf → le wrapper ne l'enveloppe pas
    // car il détecte que le body est déjà une réponse HTTP complète.
    @GetMapping("/api/avis-imposition/{id}/telecharger")
    public ResponseEntity<byte[]> telecharger(@PathVariable Long id) {
        return service.findById(id).map(avis -> {
            try {
                Contribuable contrib = avis.getIdContribuable() != null
                        ? contribuableService.findById(avis.getIdContribuable()).orElse(null)
                        : null;

                byte[] pdf      = avisGenerator.generatePdf(avis, contrib);
                String filename = "DPR_AVIS-" + avis.getReference() + ".pdf";

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "attachment; filename=\"" + filename + "\"")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(pdf);

            } catch (Exception e) {
                throw new RuntimeException("Erreur génération PDF : " + e.getMessage(), e);
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── POST /api/avis-imposition ───────────────────────────────────────────
    @PostMapping("/api/avis-imposition")
    public AvisImposition create(@RequestBody AvisImposition entity) {
        return service.save(entity);
    }

    // ─── PUT /api/avis-imposition/{id} ──────────────────────────────────────
    @PutMapping("/api/avis-imposition/{id}")
    public ResponseEntity<AvisImposition> update(
            @PathVariable Long id, @RequestBody AvisImposition entity) {
        return service.findById(id).map(existing -> {
            entity.setIdAvis(id);
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ─── DELETE /api/avis-imposition/{id} ───────────────────────────────────
    @DeleteMapping("/api/avis-imposition/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}