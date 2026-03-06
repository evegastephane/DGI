package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class Contribuable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idContribuable;

    private String niu;
    private String email;
    private String nomBeneficiaire;
    private String prenom;
    private String raisonSociale;
    private LocalDate dateImmatriculation;
    private String statut;
    private Long idCommune;

    // Champs ajoutés pour AvisGeneratorUtil
    private String telephone;
    private String structureFiscale;
    private String regimeFiscal;
    private String adresse;
    private String ville;
    private String secteurActivite;
}