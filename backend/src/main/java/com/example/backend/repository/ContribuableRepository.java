package com.example.backend.repository;

import com.example.backend.model.Contribuable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContribuableRepository extends JpaRepository<Contribuable, Long> {
    Optional<Contribuable> findByNiu(String niu);
    boolean existsByNiu(String niu);
    List<Contribuable> findByStatut(String statut);
    List<Contribuable> findByIdCommune(Long idCommune);
}
