package com.example.backend.controller;

import com.example.backend.model.Declaration;
import com.example.backend.service.DeclarationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class DeclarationController {

    @Autowired
    private DeclarationService service;

    // ─── Liste toutes les déclarations ────────────────────────────────────────
    @GetMapping("/api/declarations")
    public List<Declaration> getAll() {
        return service.findAll();
    }

    // ─── Déclarations d'un contribuable ───────────────────────────────────────
    @GetMapping("/api/contribuables/{idContribuable}/declarations")
    public List<Declaration> getByContribuable(@PathVariable Long idContribuable) {
        return service.findByIdContribuable(idContribuable);
    }

    // ─── Détail d'une déclaration ─────────────────────────────────────────────
    @GetMapping("/api/declarations/{id}")
    public ResponseEntity<Declaration> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Créer une déclaration (+ génère un Avis si type = PATENTE) ───────────
    @PostMapping("/api/declarations")
    public Declaration create(@RequestBody Declaration entity) {
        return service.save(entity);
    }

    // ─── Modifier une déclaration ─────────────────────────────────────────────
    @PutMapping("/api/declarations/{id}")
    public ResponseEntity<Declaration> update(@PathVariable Long id, @RequestBody Declaration entity) {
        return service.findById(id)
                .map(existing -> {
                    entity.setIdDeclaration(id);
                    return ResponseEntity.ok(service.save(entity));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ─── Supprimer une déclaration ────────────────────────────────────────────
    @DeleteMapping("/api/declarations/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

