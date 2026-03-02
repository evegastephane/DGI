package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class Paiement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long idPaiement;
    private String referencePaiement;
    private LocalDate datePaiement;
    private String statut;
    private String modePaiement;
    private Double montantPaye;
    private Long idDeclaration;
}
