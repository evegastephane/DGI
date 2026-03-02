package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idNotification;

    private Long idContribuable;

    /** Référence à la déclaration ayant généré cette notification (peut être null) */
    private Long idDeclaration;

    /** Type : SOUMISSION | REJET | VALIDATION | INFO */
    private String type;

    /** Priorité : HAUTE | NORMALE | BASSE */
    private String priorite;

    /** Expéditeur affiché (ex: "DGI") */
    private String expediteur;

    private String titre;
    private String contenu;
    private LocalDate dateCreation;

    /** Statut : NON_LU | LU */
    private String statut;
}