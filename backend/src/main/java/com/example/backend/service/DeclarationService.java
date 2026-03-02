package com.example.backend.service;

import com.example.backend.model.AvisImposition;
import com.example.backend.model.Declaration;
import com.example.backend.model.Notification;
import com.example.backend.repository.AvisImpositionRepository;
import com.example.backend.repository.DeclarationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DeclarationService {

    @Autowired private DeclarationRepository repository;
    @Autowired private AvisImpositionRepository avisImpositionRepository;
    @Autowired private NotificationService notificationService;

    public List<Declaration> findAll() { return repository.findAll(); }

    public List<Declaration> findByIdContribuable(Long idContribuable) {
        return repository.findByIdContribuable(idContribuable);
    }

    public Optional<Declaration> findById(Long id) { return repository.findById(id); }

    @Transactional
    public Declaration save(Declaration entity) {

        // ── Référence auto ────────────────────────────────────────────────────
        if (entity.getReferenceDeclaration() == null || entity.getReferenceDeclaration().isBlank()) {
            entity.setReferenceDeclaration("AV-GNR-" + System.currentTimeMillis());
        }

        // ── Date déclaration ──────────────────────────────────────────────────
        if (entity.getDateDeclaration() == null) {
            entity.setDateDeclaration(LocalDate.now());
        }

        // ── Date soumission ───────────────────────────────────────────────────
        boolean estSoumise = "SUBMITTED".equalsIgnoreCase(entity.getStatut());
        if (estSoumise && entity.getDateSoumission() == null) {
            entity.setDateSoumission(LocalDate.now());
        }

        Declaration saved = repository.save(entity);

        // ── Avis d'imposition (PATENTE uniquement, une seule fois) ────────────
        boolean estPatente = "PATENTE".equalsIgnoreCase(saved.getTypeDeclaration());
        boolean dejaAvis   = avisImpositionRepository.existsByIdDeclaration(saved.getIdDeclaration());

        if (estSoumise && estPatente && !dejaAvis) {
            AvisImposition avis = new AvisImposition();
            avis.setIdDeclaration(saved.getIdDeclaration());
            avis.setIdContribuable(saved.getIdContribuable());
            avis.setMontant(saved.getMontantAPayer());
            avis.setReference("AVIS-" + saved.getReferenceDeclaration());
            avis.setDateReception(LocalDate.now());
            avis.setDateNotification(LocalDate.now());
            avis.setStatut("EMIS");
            avis.setRibReceveur("CDI-YAOUNDE2");
            avis.setAnneeFiscale(saved.getAnneeFiscale());
            avis.setTypeDeclaration(saved.getTypeDeclaration());
            avisImpositionRepository.save(avis);
        }

        // ── Notification automatique à chaque soumission ─────────────────────
        // On crée une notification dès que le statut passe à SUBMITTED,
        // qu'il s'agisse d'une création ou d'une modification (brouillon → soumis).
        // La vérification dejaNotif empêche les doublons si save() est appelé 2x.
        if (estSoumise && saved.getIdContribuable() != null) {
            boolean dejaNotif = notificationService.existsByIdDeclarationAndType(
                    saved.getIdDeclaration(), "SOUMISSION"
            );
            if (!dejaNotif) {
                String type     = saved.getTypeDeclaration() != null
                        ? saved.getTypeDeclaration() : "Déclaration";
                String annee    = saved.getAnneeFiscale() != null
                        ? saved.getAnneeFiscale().toString() : "—";
                String ref      = saved.getReferenceDeclaration();

                Notification notif = new Notification();
                notif.setIdContribuable(saved.getIdContribuable());
                notif.setIdDeclaration(saved.getIdDeclaration());
                notif.setType("SOUMISSION");
                notif.setPriorite("HAUTE");
                notif.setExpediteur("DGI");
                notif.setTitre("DGI - Soumission de la déclaration pré-remplie");
                notif.setContenu(
                        "Votre déclaration pré-remplie de l'" + type +
                                " reference " + ref +
                                " pour le compte de l'exercice fiscale " + annee +
                                " a été soumise avec succès!"
                );
                notif.setDateCreation(LocalDate.now());
                notif.setStatut("NON_LU");
                notificationService.save(notif);
            }
        }

        return saved;
    }

    public void deleteById(Long id) { repository.deleteById(id); }
}