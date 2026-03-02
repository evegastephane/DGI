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
}
