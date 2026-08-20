package com.javaweb.api;

import io.imagekit.client.ImageKitClient;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {
    private final ImageKitClient imageKitClient;

    @Value("${imagekit.public-key}")
    private String publicKey;

    @Value("${imagekit.url-endpoint}")
    private String urlEndpoint;

    @GetMapping("/imagekit/auth")
    public ResponseEntity<Map<String, Object>> getImageKitAuth() {

        Map<String, Object> response = new HashMap<>(
                imageKitClient.helper()
                        .getAuthenticationParameters(null, null)
        );

        response.put("publicKey", publicKey);
        response.put("urlEndpoint", urlEndpoint);

        return ResponseEntity.ok(response);
    }
}
