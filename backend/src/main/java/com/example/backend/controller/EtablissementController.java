package com.example.backend.controller;
import com.example.backend.model.Etablissement;
import com.example.backend.service.EtablissementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/etablissements")
@CrossOrigin(origins = "*")
public class EtablissementController {
    @Autowired private EtablissementService service;
    @GetMapping public List<Etablissement> getAll() { return service.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Etablissement> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public Etablissement create(@RequestBody Etablissement entity) { return service.save(entity); }
    @PutMapping("/{id}") public ResponseEntity<Etablissement> update(@PathVariable Long id, @RequestBody Etablissement entity) {
        return service.findById(id).map(existing -> {
            entity.setIdEtablissement(id);
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id); return ResponseEntity.ok().build();
    }
}
