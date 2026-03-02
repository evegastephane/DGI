package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class AMR {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long idAmr;
    private Long numeroAmr;
    private LocalDate dateEmission;
    private Double montantInitial;
    private Double montantMajorations;
    private Double montantTotal;
    private String statut;
    private String motif;
    private Long idContribuable;
}
