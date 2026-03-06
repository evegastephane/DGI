package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class AvisImposition {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAvis;

    private String reference;
    private String ribReceveur;
    private LocalDate dateReception;
    private LocalDate dateNotification;
    private Double montant;
    private String statut;
    private LocalDate datePaiement;
    private Long idContribuable;
    private Long idDeclaration;

    // Champs ajoutés pour AvisGeneratorUtil
    private Integer anneeFiscale;
    private String structureFiscale;
    private String typeDeclaration;
}