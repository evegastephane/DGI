package com.example.backend.service;

import com.example.backend.model.Contribuable;
import com.example.backend.repository.ContribuableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ContribuableService {
    @Autowired
    private ContribuableRepository repository;

    public List<Contribuable> findAll() {
        return repository.findAll();
    }

    public Optional<Contribuable> findById(Long id) {
        return repository.findById(id);
    }

    public Contribuable save(Contribuable entity) {
        return repository.save(entity);
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
