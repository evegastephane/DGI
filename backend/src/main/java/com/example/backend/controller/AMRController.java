package com.example.backend.controller;

import com.example.backend.model.AMR;
import com.example.backend.service.AMRService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/amr")
@CrossOrigin(origins = "*")
public class AMRController {

    @Autowired private AMRService service;

    // GET /api/amr?statut=EN_COURS&id_contribuable=1
    @GetMapping
    public List<AMR> getAll(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) Long id_contribuable) {
        return service.findAll(statut, id_contribuable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AMR> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AMR entity) {
        try {
            return ResponseEntity.status(201).body(service.save(entity));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody AMR entity) {
        return service.findById(id).map(existing -> {
            entity.setIdAmr(id);
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }

    // PATCH /api/amr/{id}/statut  body: { "statut": "APURE" }
    @PatchMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statut = body.get("statut");
        if (statut == null) return ResponseEntity.badRequest().body(Map.of("message", "Le champ 'statut' est requis"));
        try {
            return service.changerStatut(id, statut)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
