package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class Etablissement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long idEtablissement;
    private String nom;
    private Long idContribuable;
    private Long idCommune;

    // Champs additionnels pour la déclaration de patente
    private String typeActivites;
    private String commune;        // nom de la commune (texte libre)
    private String adresse;        // localisation / adresse
    private Double montantMargeAdministree;
    private Double caAutresActivites;
    private Double caBoissonsAlcoolisees;
    private Double caBoissonsNonAlcoolisees;
    private Double caArmesEtMunitions;
    private Double caJeuxEtDivertissement;
}