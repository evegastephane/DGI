package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class Commune {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long idCommune;
    private String nomCommune;
    private String typeCommune;
}
