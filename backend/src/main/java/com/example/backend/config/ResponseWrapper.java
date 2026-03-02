package com.example.backend.config;

import org.jspecify.annotations.NonNull;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * ResponseWrapper
 *
 * Enveloppe toutes les réponses JSON dans { success, data, timestamp }.
 *
 * Changement par rapport à l'original :
 *  - Exclusion des réponses byte[] (PDF binaire) pour éviter de corrompre
 *    le contenu du fichier téléchargé.
 *  - Exclusion si Content-Type est application/pdf ou octet-stream.
 */
@ControllerAdvice(basePackages = "com.example.backend.controller")
public class ResponseWrapper implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(@NonNull MethodParameter returnType,
                            @NonNull Class<? extends HttpMessageConverter<?>> converterType) {
        // Ne pas intervenir si la méthode retourne byte[] ou ResponseEntity<byte[]>
        Class<?> type = returnType.getParameterType();
        if (type.equals(byte[].class)) return false;
        if (type.equals(ResponseEntity.class)) {
            // Inspecter le type générique si possible
            // On laisse passer — le check sur le body se fait dans beforeBodyWrite
        }
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body,
                                  @NonNull MethodParameter returnType,
                                  @NonNull MediaType selectedContentType,
                                  @NonNull Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  @NonNull ServerHttpRequest request,
                                  @NonNull ServerHttpResponse response) {

        // ── Ne pas envelopper le PDF binaire ──────────────────────────────────
        if (body instanceof byte[])                            return body;
        if (MediaType.APPLICATION_PDF.equals(selectedContentType))  return body;
        if (MediaType.APPLICATION_OCTET_STREAM.equals(selectedContentType)) return body;

        // ── Ne pas double-envelopper ──────────────────────────────────────────
        if (body instanceof Map && ((Map<?, ?>) body).containsKey("success")) return body;

        // ── Enveloppage standard ──────────────────────────────────────────────
        Map<String, Object> wrapped = new HashMap<>();
        wrapped.put("success",   true);
        wrapped.put("data",      body);
        wrapped.put("timestamp", LocalDateTime.now());
        return wrapped;
    }
}