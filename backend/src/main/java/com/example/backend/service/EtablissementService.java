package com.example.backend.service;
import com.example.backend.model.Etablissement;
import com.example.backend.repository.EtablissementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
@Service
public class EtablissementService {
    @Autowired private EtablissementRepository repository;
    public List<Etablissement> findAll() { return repository.findAll(); }
    public Optional<Etablissement> findById(Long id) { return repository.findById(id); }
    public Etablissement save(Etablissement entity) { return repository.save(entity); }
    public void deleteById(Long id) { repository.deleteById(id); }
}