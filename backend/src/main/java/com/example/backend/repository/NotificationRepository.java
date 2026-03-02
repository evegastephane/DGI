package com.example.backend.repository;

import com.example.backend.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByIdContribuable(Long idContribuable);
    List<Notification> findByIdContribuableOrderByDateCreationDesc(Long idContribuable);
    List<Notification> findByStatut(String statut);
    List<Notification> findByIdContribuableAndStatut(Long idContribuable, String statut);
    long countByStatut(String statut);
    long countByIdContribuableAndStatut(Long idContribuable, String statut);

    /** Vérifie si une notification de ce type existe déjà pour cette déclaration */
    boolean existsByIdDeclarationAndType(Long idDeclaration, String type);
}