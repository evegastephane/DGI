package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class Beneficiaire {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long idBeneficiaire;
    private String nomBeneficiaire;
    private Double pourcentageVentilation;
    private Double montantVentile;
    private Long idPaiement;
}
