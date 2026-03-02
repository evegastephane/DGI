package com.example.backend.service;

import com.example.backend.model.Beneficiaire;
import com.example.backend.model.Declaration;
import com.example.backend.model.Notification;
import com.example.backend.model.Paiement;
import com.example.backend.repository.BeneficiaireRepository;
import com.example.backend.repository.DeclarationRepository;
import com.example.backend.repository.NotificationRepository;
import com.example.backend.repository.PaiementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PaiementService {

    @Autowired private PaiementRepository repository;
    @Autowired private BeneficiaireRepository beneficiaireRepository;
    @Autowired private DeclarationRepository declarationRepository;
    @Autowired private NotificationRepository notificationRepository;

    public List<Paiement> findAll() { return repository.findAll(); }
    public Optional<Paiement> findById(Long id) { return repository.findById(id); }
    public List<Paiement> findByDeclaration(Long idDeclaration) { return repository.findByIdDeclaration(idDeclaration); }

    @Transactional
    public Paiement save(Paiement paiement) {
        // Vérifier que la déclaration est VALIDEE
        Declaration declaration = declarationRepository.findById(paiement.getIdDeclaration())
            .orElseThrow(() -> new RuntimeException("Déclaration introuvable (id=" + paiement.getIdDeclaration() + ")"));

        if (!"VALIDEE".equalsIgnoreCase(declaration.getStatut()))
            throw new RuntimeException("Impossible de payer : la déclaration doit être à l'état VALIDEE.");

        paiement.setDatePaiement(LocalDate.now());
        paiement.setStatut("EFFECTUE");
        Paiement saved = repository.save(paiement);

        // Génération de la référence paiement
        saved.setReferencePaiement("PAY-" + LocalDate.now().getYear() + "-" + String.format("%05d", saved.getIdPaiement()));
        repository.save(saved);

        // Ventilation automatique : 60% Commune / 40% Trésor
        Beneficiaire commune = new Beneficiaire();
        commune.setNomBeneficiaire("Commune");
        commune.setPourcentageVentilation(60.0);
        commune.setMontantVentile(paiement.getMontantPaye() * 0.60);
        commune.setIdPaiement(saved.getIdPaiement());
        beneficiaireRepository.save(commune);

        Beneficiaire tresor = new Beneficiaire();
        tresor.setNomBeneficiaire("Trésor Public");
        tresor.setPourcentageVentilation(40.0);
        tresor.setMontantVentile(paiement.getMontantPaye() * 0.40);
        tresor.setIdPaiement(saved.getIdPaiement());
        beneficiaireRepository.save(tresor);

        // Notification de confirmation
        if (declaration.getIdContribuable() != null) {
            Notification n = new Notification();
            n.setTitre("Paiement reçu");
            n.setContenu("Votre paiement " + saved.getReferencePaiement() + " de " +
                String.format("%,.0f", paiement.getMontantPaye()) + " FCFA a bien été enregistré.");
            n.setStatut("NON_LU");
            n.setDateCreation(LocalDate.now());
            n.setIdContribuable(declaration.getIdContribuable());
            notificationRepository.save(n);
        }

        return saved;
    }

    public void deleteById(Long id) { repository.deleteById(id); }
}
