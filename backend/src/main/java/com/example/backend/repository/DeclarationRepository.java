package com.example.backend.repository;

import com.example.backend.model.Declaration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeclarationRepository extends JpaRepository<Declaration, Long> {

    List<Declaration> findByIdContribuable(Long idContribuable);

    long countByStatut(String statut);

    long countByIdContribuable(Long idContribuable);

    long countByTypeDeclaration(String typeDeclaration);

    List<Declaration> findByStatut(String statut);

    List<Declaration> findByIdContribuableAndStatut(Long idContribuable, String statut);

    // Somme des montants par type de déclaration
    @Query("SELECT COALESCE(SUM(d.montantAPayer), 0) FROM Declaration d WHERE d.typeDeclaration = :type")
    Double sumMontantByType(@Param("type") String type);

    // Somme de tous les montants
    @Query("SELECT COALESCE(SUM(d.montantAPayer), 0) FROM Declaration d")
    Double sumMontantTotal();

    // Somme des montants par statut
    @Query("SELECT COALESCE(SUM(d.montantAPayer), 0) FROM Declaration d WHERE d.statut = :statut")
    Double sumMontantByStatut(@Param("statut") String statut);

    // Somme des montants par contribuable
    @Query("SELECT COALESCE(SUM(d.montantAPayer), 0) FROM Declaration d WHERE d.idContribuable = :idContribuable")
    Double sumMontantByIdContribuable(@Param("idContribuable") Long idContribuable);
}