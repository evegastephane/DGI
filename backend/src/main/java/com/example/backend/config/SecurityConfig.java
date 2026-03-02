package com.example.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Désactive la protection CSRF (indispensable pour faire des requêtes POST/PUT/DELETE depuis Postman ou React)
                .csrf(csrf -> csrf.disable())

                // 2. Autorise TOUTES les requêtes sans demander de mot de passe (désactive le 401 Unauthorized)
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                );

        return http.build();
    }
}