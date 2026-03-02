package com.example.backend.repository;

import com.example.backend.model.AMR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AMRRepository extends JpaRepository<AMR, Long> {
    List<AMR> findByIdContribuable(Long idContribuable);
    List<AMR> findByStatut(String statut);
    List<AMR> findByIdContribuableAndStatut(Long idContribuable, String statut);
    long countByStatut(String statut);

    @Query("SELECT COALESCE(SUM(a.montantTotal), 0) FROM AMR a WHERE a.statut = 'EN_COURS'")
    Double sumMontantEnCours();
}
