package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class Declaration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDeclaration;
    private String typeDeclaration;
    private LocalDate dateDeclaration;
    private String statut;
    private String referenceDeclaration;
    private LocalDate dateSoumission;
    private Integer anneeFiscale;
    private Double montantAPayer;
    private Long idContribuable;
    private Long idEtablissement;
}
