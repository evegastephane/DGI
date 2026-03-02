package com.example.backend.service;
import com.example.backend.model.AvisImposition;
import com.example.backend.repository.AvisImpositionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class AvisImpositionService {
    @Autowired private AvisImpositionRepository repository;

    /** Retourne tous les avis, avec filtres optionnels */
    public List<AvisImposition> findAll(Long idContribuable, Integer anneeFiscale) {
        if (idContribuable != null && anneeFiscale != null)
            return repository.findByIdContribuableAndAnneeFiscale(idContribuable, anneeFiscale);
        if (idContribuable != null)
            return repository.findByIdContribuable(idContribuable);
        if (anneeFiscale != null)
            return repository.findByAnneeFiscale(anneeFiscale);
        return repository.findAll();
    }

    public List<AvisImposition> findAll() { return repository.findAll(); }
    public List<AvisImposition> findByIdContribuable(Long idContribuable) {
        return repository.findByIdContribuable(idContribuable);
    }
    public Optional<AvisImposition> findById(Long id) { return repository.findById(id); }
    public AvisImposition save(AvisImposition entity) { return repository.save(entity); }
    public boolean existsByIdDeclaration(Long idDeclaration) {
        return repository.existsByIdDeclaration(idDeclaration);
    }
    public void deleteById(Long id) { repository.deleteById(id); }
}