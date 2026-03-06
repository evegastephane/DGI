package com.example.backend.service;

import com.example.backend.model.Paiement;
import com.example.backend.repository.PaiementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PaiementService {

    @Autowired
    private PaiementRepository repository;

    public List<Paiement> findAll()                    { return repository.findAll(); }
    public Optional<Paiement> findById(Long id)        { return repository.findById(id); }
    public Paiement save(Paiement entity)              { return repository.save(entity); }
    public void deleteById(Long id)                    { repository.deleteById(id); }

    /**
     * Applique une mise à jour partielle (PATCH) sur un paiement existant.
     * Seuls les champs présents dans la map sont modifiés.
     */
    public void applyPatch(Paiement p, Map<String, Object> updates) {
        if (updates.containsKey("statutPaiement"))
            p.setStatutPaiement((String) updates.get("statutPaiement"));

        if (updates.containsKey("referencePaiement"))
            p.setReferencePaiement((String) updates.get("referencePaiement"));

        if (updates.containsKey("montantPaye")) {
            Object v = updates.get("montantPaye");
            if (v instanceof Number) p.setMontantPaye(((Number) v).doubleValue());
        }

        if (updates.containsKey("montantAPayer")) {
            Object v = updates.get("montantAPayer");
            if (v instanceof Number) p.setMontantAPayer(((Number) v).doubleValue());
        }

        if (updates.containsKey("modePaiement"))
            p.setModePaiement((String) updates.get("modePaiement"));

        if (updates.containsKey("structureFiscale"))
            p.setStructureFiscale((String) updates.get("structureFiscale"));

        if (updates.containsKey("payeLe")) {
            Object v = updates.get("payeLe");
            if (v instanceof String && !((String) v).isBlank()) {
                try {
                    p.setPayeLe(LocalDateTime.parse(((String) v).replace("Z", "")));
                } catch (Exception ignored) {}
            }
        }
    }
}