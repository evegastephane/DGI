package com.example.backend.repository;
import com.example.backend.model.Commune;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface CommuneRepository extends JpaRepository<Commune, Long> {}
