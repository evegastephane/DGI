package com.example.backend.controller;

import com.example.backend.model.Paiement;
import com.example.backend.service.PaiementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
@CrossOrigin(origins = "*")
public class PaiementController {

    @Autowired
    private PaiementService service;

    // ── GET /api/paiements  →  liste complète ────────────────────────────
    @GetMapping
    public List<Paiement> getAll() {
        return service.findAll();
    }

    // ── GET /api/paiements/{id} ──────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<Paiement> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── POST /api/paiements  →  créer un paiement ────────────────────────
    @PostMapping
    public Paiement create(@RequestBody Paiement entity) {
        return service.save(entity);
    }

    // ── PUT /api/paiements/{id}  →  remplacement complet ─────────────────
    @PutMapping("/{id}")
    public ResponseEntity<Paiement> update(@PathVariable Long id, @RequestBody Paiement entity) {
        return service.findById(id).map(existing -> {
            entity.setIdPaiement(id);
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── PATCH /api/paiements/{id}  →  mise à jour partielle ──────────────
    // Utilisé pour passer IN_PROGRESS → SUCCESS ou FAILED sans écraser tous les champs
    @PatchMapping("/{id}")
    public ResponseEntity<Paiement> patch(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return service.findById(id).map(existing -> {
            service.applyPatch(existing, updates);
            return ResponseEntity.ok(service.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── DELETE /api/paiements/{id} ───────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}