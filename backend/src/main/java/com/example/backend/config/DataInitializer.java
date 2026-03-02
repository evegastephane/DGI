package com.example.backend.config;

import com.example.backend.model.Contribuable;
import com.example.backend.repository.ContribuableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ContribuableRepository contribuableRepository;

    @Override
    public void run(String... args) {
        if (contribuableRepository.count() > 0) {
            System.out.println("✅ DataInitializer : contribuables déjà présents.");
            return;
        }

        System.out.println("📦 DataInitializer : insertion des 3 contribuables...");

        // ── Contribuable 1 : KUATE KAMGA HUBERT ──────────────────────────────
        Contribuable c1 = new Contribuable();
        c1.setNiu("P010516013357K");
        c1.setEmail("P010516013357K@impots.cm");
        c1.setNomBeneficiaire("KUATE KAMGA HUBERT");
        c1.setPrenom("KUATE");
        c1.setRaisonSociale("KUATE KAMGA HUBERT SARL");
        c1.setTelephone("237698155183");
        c1.setRegimeFiscal("NON PROFESSIONNEL");
        c1.setStructureFiscale("CDI YAOUNDE 2");
        c1.setDateImmatriculation(LocalDate.of(2018, 3, 15));
        c1.setStatut("ACTIF");
        c1.setIdCommune(1L);
        contribuableRepository.save(c1);

        // ── Contribuable 2 : ATCHONKEU SERAPHIN ──────────────────────────────
        Contribuable c2 = new Contribuable();
        c2.setNiu("P018116987119W");
        c2.setEmail("P018116987119W@impots.cm");
        c2.setNomBeneficiaire("ATCHONKEU SERAPHIN");
        c2.setPrenom("ATCHONKEU");
        c2.setRaisonSociale("ATCHONKEU ET FILS");
        c2.setTelephone("237677234512");
        c2.setRegimeFiscal("REEL");
        c2.setStructureFiscale("CDI NDE");
        c2.setDateImmatriculation(LocalDate.of(2019, 7, 22));
        c2.setStatut("ACTIF");
        c2.setIdCommune(1L);
        contribuableRepository.save(c2);

        // ── Contribuable 3 : NGUEMO TAMBA CLAUDE ALEXIS ──────────────────────
        Contribuable c3 = new Contribuable();
        c3.setNiu("P029045678231M");
        c3.setEmail("P029045678231M@impots.cm");
        c3.setNomBeneficiaire("NGUEMO TAMBA CLAUDE ALEXIS");
        c3.setPrenom("NGUEMO");
        c3.setRaisonSociale("NGUEMO COMMERCE GENERAL");
        c3.setTelephone("237655987341");
        c3.setRegimeFiscal("NON PROFESSIONNEL");
        c3.setStructureFiscale("CDI YAOUNDE 1");
        c3.setDateImmatriculation(LocalDate.of(2020, 11, 10));
        c3.setStatut("ACTIF");
        c3.setIdCommune(1L);
        contribuableRepository.save(c3);

        System.out.println("✅ 3 contribuables créés !");
    }
}
