package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class Contribuable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idContribuable;
    private String niu;
    private String email;
    private String nomBeneficiaire;
    private String prenom;
    private String raisonSociale;
    private String telephone;
    private String regimeFiscal;
    private String structureFiscale;
    private LocalDate dateImmatriculation;
    private String statut;
    private Long idCommune;

    // ─── Getters ─────────────────────────────────────────────────────────────
    public Long    getIdContribuable()     { return idContribuable; }
    public String  getNiu()                { return niu; }
    public String  getEmail()              { return email; }
    public String  getNomBeneficiaire()    { return nomBeneficiaire; }
    public String  getPrenom()             { return prenom; }
    public String  getRaisonSociale()      { return raisonSociale; }
    public String  getTelephone()          { return telephone; }
    public String  getRegimeFiscal()       { return regimeFiscal; }
    public String  getStructureFiscale()   { return structureFiscale; }
    public LocalDate getDateImmatriculation() { return dateImmatriculation; }
    public String  getStatut()             { return statut; }
    public Long    getIdCommune()          { return idCommune; }

    // ─── Setters ─────────────────────────────────────────────────────────────
    public void setIdContribuable(Long idContribuable)         { this.idContribuable = idContribuable; }
    public void setNiu(String niu)                             { this.niu = niu; }
    public void setEmail(String email)                         { this.email = email; }
    public void setNomBeneficiaire(String nomBeneficiaire)     { this.nomBeneficiaire = nomBeneficiaire; }
    public void setPrenom(String prenom)                       { this.prenom = prenom; }
    public void setRaisonSociale(String raisonSociale)         { this.raisonSociale = raisonSociale; }
    public void setTelephone(String telephone)                 { this.telephone = telephone; }
    public void setRegimeFiscal(String regimeFiscal)           { this.regimeFiscal = regimeFiscal; }
    public void setStructureFiscale(String structureFiscale)   { this.structureFiscale = structureFiscale; }
    public void setDateImmatriculation(LocalDate d)            { this.dateImmatriculation = d; }
    public void setStatut(String statut)                       { this.statut = statut; }
    public void setIdCommune(Long idCommune)                   { this.idCommune = idCommune; }
}