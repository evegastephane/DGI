package com.example.backend.controller;
import com.example.backend.model.Commune;
import com.example.backend.service.CommuneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController
@RequestMapping("/api/communes")
@CrossOrigin(origins = "*")
public class CommuneController {
    @Autowired private CommuneService service;
    @GetMapping public List<Commune> getAll() { return service.findAll(); }
    @GetMapping("/{id}") public ResponseEntity<Commune> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    @PostMapping public Commune create(@RequestBody Commune entity) { return service.save(entity); }
    @PutMapping("/{id}") public ResponseEntity<Commune> update(@PathVariable Long id, @RequestBody Commune entity) {
        return service.findById(id).map(existing -> {
            entity.setIdCommune(id);
            return ResponseEntity.ok(service.save(entity));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id); return ResponseEntity.ok().build();
    }
}