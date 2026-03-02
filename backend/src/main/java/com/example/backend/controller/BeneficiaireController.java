package com.example.backend.controller;
import com.example.backend.model.Beneficiaire;
import com.example.backend.service.BeneficiaireService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/beneficiaires")
@CrossOrigin(origins = "*")
public class BeneficiaireController {
    @Autowired private BeneficiaireService service;
    @GetMapping public List<Beneficiaire> getAll() { return service.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Beneficiaire> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public Beneficiaire create(@RequestBody Beneficiaire entity) { return service.save(entity); }
    @PutMapping("/{id}") public ResponseEntity<Beneficiaire> update(@PathVariable Long id, @RequestBody Beneficiaire entity) {
        return service.findById(id).map(existing -> {
            entity.setIdBeneficiaire(id);
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id); return ResponseEntity.ok().build();
    }
}
