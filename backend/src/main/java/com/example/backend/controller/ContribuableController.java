package com.example.backend.controller;

import com.example.backend.model.Contribuable;
import com.example.backend.service.ContribuableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contribuables")
@CrossOrigin(origins = "*")
public class ContribuableController {

    @Autowired
    private ContribuableService service;

    @GetMapping
    public List<Contribuable> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contribuable> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Contribuable create(@RequestBody Contribuable entity) {
        return service.save(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contribuable> update(@PathVariable Long id, @RequestBody Contribuable entity) {
        return service.findById(id)
                .map(existing -> {
                    entity.setIdContribuable(id);
                    return ResponseEntity.ok(service.save(entity));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
