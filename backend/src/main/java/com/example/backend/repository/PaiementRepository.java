package com.example.backend.repository;

import com.example.backend.model.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {

    // ── Utilisé par le Dashboard ──────────────────────────────────────────
    // Ancienne query corrigée : p.statut → p.statutPaiement
    @Query("SELECT COALESCE(SUM(p.montantPaye), 0) FROM Paiement p WHERE p.statutPaiement = 'SUCCESS'")
    Double sumTotalRecouvert();

    // ── Filtres utiles ────────────────────────────────────────────────────
    List<Paiement> findByStatutPaiement(String statutPaiement);

    List<Paiement> findByAnneeFiscale(Integer anneeFiscale);

    List<Paiement> findByReferenceDeclaration(String referenceDeclaration);
}