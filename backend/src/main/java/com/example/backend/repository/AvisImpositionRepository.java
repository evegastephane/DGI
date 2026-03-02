package com.example.backend.repository;

import com.example.backend.model.AvisImposition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AvisImpositionRepository extends JpaRepository<AvisImposition, Long> {

    boolean existsByIdDeclaration(Long idDeclaration);

    List<AvisImposition> findByIdContribuable(Long idContribuable);
    List<AvisImposition> findByStatut(String statut);
    List<AvisImposition> findByAnneeFiscale(Integer anneeFiscale);
    List<AvisImposition> findByIdContribuableAndStatut(Long idContribuable, String statut);

    // Filtre combiné contribuable + année ← nouveau
    List<AvisImposition> findByIdContribuableAndAnneeFiscale(Long idContribuable, Integer anneeFiscale);

    long countByStatut(String statut);
    long countByIdContribuable(Long idContribuable);
    long countByIdContribuableAndStatut(Long idContribuable, String statut);
}