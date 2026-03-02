package com.example.backend.service;

import com.example.backend.model.AMR;
import com.example.backend.model.Notification;
import com.example.backend.repository.AMRRepository;
import com.example.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AMRService {

    @Autowired private AMRRepository repository;
    @Autowired private NotificationRepository notificationRepository;

    public List<AMR> findAll() { return repository.findAll(); }

    public List<AMR> findAll(String statut, Long idContribuable) {
        if (idContribuable != null && statut != null)
            return repository.findByIdContribuableAndStatut(idContribuable, statut.toUpperCase());
        if (idContribuable != null) return repository.findByIdContribuable(idContribuable);
        if (statut != null) return repository.findByStatut(statut.toUpperCase());
        return repository.findAll();
    }

    public Optional<AMR> findById(Long id) { return repository.findById(id); }

    public List<AMR> findByContribuable(Long idContribuable) {
        return repository.findByIdContribuable(idContribuable);
    }

    @Transactional
    public AMR save(AMR amr) {
        if (amr.getDateEmission() == null) amr.setDateEmission(LocalDate.now());
        if (amr.getStatut() == null) amr.setStatut("EN_COURS");

        // Calcul automatique des majorations (10%)
        if (amr.getMontantInitial() != null) {
            double majorations = amr.getMontantInitial() * 0.10;
            amr.setMontantMajorations(majorations);
            amr.setMontantTotal(amr.getMontantInitial() + majorations);
        }

        AMR saved = repository.save(amr);

        // Génération automatique du numéro AMR
        if (saved.getNumeroAmr() == null) {
            saved.setNumeroAmr(Long.parseLong(LocalDate.now().getYear() + String.format("%04d", saved.getIdAmr())));
            repository.save(saved);
        }

        // Notification URGENT au contribuable
        if (saved.getIdContribuable() != null) {
            Notification n = new Notification();
            n.setTitre("⚠️ URGENT — Avis de Mise en Recouvrement");
            n.setContenu("Un AMR N°" + saved.getNumeroAmr() + " d'un montant de " +
                String.format("%,.0f", saved.getMontantTotal()) + " FCFA a été émis à votre encontre.");
            n.setStatut("NON_LU");
            n.setDateCreation(LocalDate.now());
            n.setIdContribuable(saved.getIdContribuable());
            notificationRepository.save(n);
        }

        return saved;
    }

    public Optional<AMR> changerStatut(Long id, String statut) {
        List<String> valides = List.of("EN_COURS", "APURE", "CONTESTE", "ANNULE");
        if (!valides.contains(statut.toUpperCase()))
            throw new RuntimeException("Statut invalide. Valeurs acceptées : " + valides);
        return repository.findById(id).map(amr -> {
            amr.setStatut(statut.toUpperCase());
            return repository.save(amr);
        });
    }

    public void deleteById(Long id) { repository.deleteById(id); }
}
