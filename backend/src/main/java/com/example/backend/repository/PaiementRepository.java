package com.example.backend.repository;

import com.example.backend.model.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    List<Paiement> findByIdDeclaration(Long idDeclaration);
    List<Paiement> findByStatut(String statut);

    @Query("SELECT COALESCE(SUM(p.montantPaye), 0) FROM Paiement p WHERE p.statut = 'EFFECTUE'")
    Double sumTotalRecouvert();

    @Query("SELECT COALESCE(SUM(p.montantPaye), 0) FROM Paiement p WHERE p.idDeclaration = :idDeclaration")
    Double sumByDeclaration(Long idDeclaration);
}
