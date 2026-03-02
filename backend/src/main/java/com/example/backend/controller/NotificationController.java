package com.example.backend.controller;

import com.example.backend.model.Notification;
import com.example.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired private NotificationService service;

    // GET /api/notifications?id_contribuable=1&statut=NON_LU
    @GetMapping
    public List<Notification> getAll(
            @RequestParam(required = false) Long id_contribuable,
            @RequestParam(required = false) String statut) {
        return service.findAll(id_contribuable, statut);
    }

    // GET /api/notifications/count?id_contribuable=1
    @GetMapping("/count")
    public Map<String, Long> countNonLues(@RequestParam(required = false) Long id_contribuable) {
        return Map.of("non_lues", service.countNonLues(id_contribuable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notification> getById(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Notification create(@RequestBody Notification entity) { return service.save(entity); }

    // PATCH /api/notifications/{id}/lire
    @PatchMapping("/{id}/lire")
    public ResponseEntity<?> marquerLu(@PathVariable Long id) {
        return service.marquerLu(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // PATCH /api/notifications/lire-tout   body (optionnel): { "id_contribuable": 1 }
    @PatchMapping("/lire-tout")
    public ResponseEntity<Map<String, String>> marquerToutLu(
            @RequestBody(required = false) Map<String, Object> body) {
        Long idContribuable = null;
        if (body != null && body.containsKey("id_contribuable"))
            idContribuable = Long.parseLong(body.get("id_contribuable").toString());
        service.marquerToutLu(idContribuable);
        return ResponseEntity.ok(Map.of("message", "Toutes les notifications ont été marquées comme lues."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
