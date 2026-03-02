package com.example.backend.controller;

import com.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired private ContribuableRepository contribuableRepository;
    @Autowired private DeclarationRepository declarationRepository;
    @Autowired private AvisImpositionRepository avisRepository;
    @Autowired private AMRRepository amrRepository;
    @Autowired private PaiementRepository paiementRepository;
    @Autowired private NotificationRepository notificationRepository;

    // GET /api/dashboard/stats?id_contribuable=1
    // Si id_contribuable fourni → stats filtrées pour ce contribuable
    // Sinon → stats globales
    @GetMapping("/stats")
    public Map<String, Object> getStats(
            @RequestParam(required = false) Long id_contribuable) {

        Map<String, Object> stats = new HashMap<>();

        // ── Déclarations ──────────────────────────────────────────────────
        long totalDecl, validees, enCours, rejetees;

        if (id_contribuable != null) {
            var decls = declarationRepository.findByIdContribuable(id_contribuable);
            totalDecl = decls.size();
            validees  = decls.stream().filter(d -> "VALIDEE".equalsIgnoreCase(d.getStatut())).count();
            enCours   = decls.stream().filter(d -> "EN_COURS".equalsIgnoreCase(d.getStatut())).count();
            rejetees  = decls.stream().filter(d -> "REJETEE".equalsIgnoreCase(d.getStatut())).count();
        } else {
            totalDecl = declarationRepository.count();
            validees  = declarationRepository.countByStatut("VALIDEE");
            enCours   = declarationRepository.countByStatut("EN_COURS");
            rejetees  = declarationRepository.countByStatut("REJETEE");
        }

        long tauxValid = totalDecl > 0 ? Math.round((validees * 100.0) / totalDecl) : 0;
        Map<String, Object> decl = new HashMap<>();
        decl.put("total",           totalDecl);
        decl.put("validees",        validees);
        decl.put("en_cours",        enCours);
        decl.put("rejetees",        rejetees);
        decl.put("taux_validation", tauxValid);
        stats.put("declarations", decl);

        // ── Avis d'imposition ─────────────────────────────────────────────
        long avisTotal, avisPayes, avisNonPayes;

        if (id_contribuable != null) {
            var avisList = avisRepository.findByIdContribuable(id_contribuable);
            avisTotal    = avisList.size();
            avisPayes    = avisList.stream().filter(a -> "PAYE".equalsIgnoreCase(a.getStatut())).count();
            avisNonPayes = avisList.stream().filter(a -> "NON_PAYE".equalsIgnoreCase(a.getStatut())).count();
        } else {
            avisTotal    = avisRepository.count();
            avisPayes    = avisRepository.countByStatut("PAYE");
            avisNonPayes = avisRepository.countByStatut("NON_PAYE");
        }

        Map<String, Object> avis = new HashMap<>();
        avis.put("total",     avisTotal);
        avis.put("payes",     avisPayes);
        avis.put("non_payes", avisNonPayes);
        stats.put("avis", avis);

        // ── AMR ───────────────────────────────────────────────────────────
        long amrTotal, amrEnCours;
        double amrMontant;

        if (id_contribuable != null) {
            var amrList = amrRepository.findByIdContribuable(id_contribuable);
            amrTotal   = amrList.size();
            amrEnCours = amrList.stream().filter(a -> "EN_COURS".equalsIgnoreCase(a.getStatut())).count();
            amrMontant = amrList.stream()
                    .filter(a -> "EN_COURS".equalsIgnoreCase(a.getStatut()))
                    .mapToDouble(a -> a.getMontantTotal() != null ? a.getMontantTotal() : 0.0)
                    .sum();
        } else {
            amrTotal   = amrRepository.count();
            amrEnCours = amrRepository.countByStatut("EN_COURS");
            amrMontant = amrRepository.sumMontantEnCours();
        }

        Map<String, Object> amr = new HashMap<>();
        amr.put("total",         amrTotal);
        amr.put("en_cours",      amrEnCours);
        amr.put("montant_total", amrMontant);
        stats.put("AMR", amr);

        // ── Recettes ──────────────────────────────────────────────────────
        Map<String, Object> recettes = new HashMap<>();
        recettes.put("total_recouvre", paiementRepository.sumTotalRecouvert());
        stats.put("recettes", recettes);

        // ── Notifications ─────────────────────────────────────────────────
        Map<String, Object> notifs = new HashMap<>();
        if (id_contribuable != null) {
            notifs.put("non_lues", notificationRepository.countByIdContribuableAndStatut(id_contribuable, "NON_LU"));
        } else {
            notifs.put("non_lues", notificationRepository.countByStatut("NON_LU"));
        }
        stats.put("notifications", notifs);

        // ── Contribuables ─────────────────────────────────────────────────
        stats.put("contribuables_total", contribuableRepository.count());

        return stats;
    }

    // GET /api/dashboard/declarations-par-type
    @GetMapping("/declarations-par-type")
    public List<Map<String, Object>> getDeclarationsParType() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (String type : List.of("PATENTE", "IGS", "TDL", "LICENCE")) {
            Map<String, Object> item = new HashMap<>();
            item.put("type",          type);
            item.put("count",         declarationRepository.countByTypeDeclaration(type));
            item.put("montant_total", declarationRepository.sumMontantByType(type));
            result.add(item);
        }
        return result;
    }
}