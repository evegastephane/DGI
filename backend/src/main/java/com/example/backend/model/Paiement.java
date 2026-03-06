package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPaiement;

    // ── Référence de la déclaration ou de l'avis associé ─────────────────
    private String referenceDeclaration;

    // ── Référence du paiement (reçue de Harmony 2 après confirmation) ─────
    private String referencePaiement;

    // ── Année fiscale concernée ───────────────────────────────────────────
    private Integer anneeFiscale;

    // ── Structure fiscale (ex : CDI YAOUNDE 1) ───────────────────────────
    private String structureFiscale;

    // ── Montant total dû ─────────────────────────────────────────────────
    private Double montantAPayer;

    // ── Montant effectivement payé (0 tant qu'IN_PROGRESS) ───────────────
    private Double montantPaye;

    // ── Statut : IN_PROGRESS | SUCCESS | FAILED | PENDING | PAID … ───────
    private String statutPaiement;

    // ── Mode de paiement (ex : Orange Money, MTN MoMo…) ──────────────────
    private String modePaiement;

    // ── Date/heure de confirmation du paiement ────────────────────────────
    private LocalDateTime payeLe;

    // ── Date de création de l'enregistrement ─────────────────────────────
    private LocalDateTime datePaiement;

    @PrePersist
    public void prePersist() {
        if (datePaiement == null) datePaiement = LocalDateTime.now();
    }
}