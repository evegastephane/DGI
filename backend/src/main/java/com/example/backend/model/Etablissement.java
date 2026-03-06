package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class Etablissement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idEtablissement;

    private Long   idContribuable;

    // ── Informations générales ─────────────────────────────────────────────
    private String nom;
    private String typeActivites;
    private String commune;
    private String adresse;

    // ── Données financières ────────────────────────────────────────────────
    private Double montantMargeAdministree;
    private Double caAutresActivites;
    private Double caBoissonsAlcoolisees;
    private Double caBoissonsNonAlcoolisees;
    private Double caArmesEtMunitions;
    private Double caJeuxEtDivertissement;
}