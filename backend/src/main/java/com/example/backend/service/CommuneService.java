package com.example.backend.service;
import com.example.backend.model.Commune;
import com.example.backend.repository.CommuneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
@Service
public class CommuneService {
    @Autowired private CommuneRepository repository;
    public List<Commune> findAll() { return repository.findAll(); }
    public Optional<Commune> findById(Long id) { return repository.findById(id); }
    public Commune save(Commune entity) { return repository.save(entity); }
    public void deleteById(Long id) { repository.deleteById(id); }
}