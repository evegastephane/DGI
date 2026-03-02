package com.example.backend.controller;

import com.example.backend.model.Paiement;
import com.example.backend.repository.BeneficiaireRepository;
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

    @Autowired private PaiementService service;
    @Autowired private BeneficiaireRepository beneficiaireRepository;

    @GetMapping
    public List<Paiement> getAll() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Paiement> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // GET /api/paiements/{id}/beneficiaires
    @GetMapping("/{id}/beneficiaires")
    public ResponseEntity<?> getBeneficiaires(@PathVariable Long id) {
        return ResponseEntity.ok(beneficiaireRepository.findByIdPaiement(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Paiement entity) {
        try {
            return ResponseEntity.status(201).body(service.save(entity));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Paiement> update(@PathVariable Long id, @RequestBody Paiement entity) {
        return service.findById(id).map(existing -> {
            entity.setIdPaiement(id);
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
