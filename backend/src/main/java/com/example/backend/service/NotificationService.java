package com.example.backend.service;

import com.example.backend.model.Notification;
import com.example.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired private NotificationRepository repository;

    public List<Notification> findAll() { return repository.findAll(); }

    public List<Notification> findAll(Long idContribuable, String statut) {
        if (idContribuable != null && statut != null)
            return repository.findByIdContribuableAndStatut(idContribuable, statut.toUpperCase());
        if (idContribuable != null)
            return repository.findByIdContribuableOrderByDateCreationDesc(idContribuable);
        if (statut != null) return repository.findByStatut(statut.toUpperCase());
        return repository.findAll();
    }

    public Optional<Notification> findById(Long id) { return repository.findById(id); }

    public Notification save(Notification notification) { return repository.save(notification); }

    public Optional<Notification> marquerLu(Long id) {
        return repository.findById(id).map(n -> {
            n.setStatut("LU");
            return repository.save(n);
        });
    }

    public void marquerToutLu(Long idContribuable) {
        List<Notification> notifs = idContribuable != null
                ? repository.findByIdContribuable(idContribuable)
                : repository.findAll();
        notifs.forEach(n -> n.setStatut("LU"));
        repository.saveAll(notifs);
    }

    public long countNonLues(Long idContribuable) {
        return idContribuable != null
                ? repository.countByIdContribuableAndStatut(idContribuable, "NON_LU")
                : repository.countByStatut("NON_LU");
    }

    public void deleteById(Long id) { repository.deleteById(id); }

    /** Vérifie si une notif de ce type existe déjà pour cette déclaration (évite les doublons) */
    public boolean existsByIdDeclarationAndType(Long idDeclaration, String type) {
        return repository.existsByIdDeclarationAndType(idDeclaration, type);
    }
}