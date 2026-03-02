package com.example.backend.service;
import com.example.backend.model.Beneficiaire;
import com.example.backend.repository.BeneficiaireRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
@Service
public class BeneficiaireService {
    @Autowired private BeneficiaireRepository repository;
    public List<Beneficiaire> findAll() { return repository.findAll(); }
    public Optional<Beneficiaire> findById(Long id) { return repository.findById(id); }
    public Beneficiaire save(Beneficiaire entity) { return repository.save(entity); }
    public void deleteById(Long id) { repository.deleteById(id); }
}
