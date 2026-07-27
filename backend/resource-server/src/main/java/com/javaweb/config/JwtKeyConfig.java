package com.javaweb.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration(proxyBeanMethods = false)
public class JwtKeyConfig {

    private static final Logger LOGGER = LoggerFactory.getLogger(JwtKeyConfig.class);

    @Bean
    public JWKSource<SecurityContext> jwkSource(
            @Value("${authorization-server.jwt.private-key-path:}") String privateKeyPath,
            @Value("${authorization-server.jwt.public-key-path:}") String publicKeyPath,
            @Value("${authorization-server.jwt.key-id}") String configuredKeyId
    ) {
        boolean hasPrivateKey = StringUtils.hasText(privateKeyPath);
        boolean hasPublicKey = StringUtils.hasText(publicKeyPath);

        if (hasPrivateKey != hasPublicKey) {
            throw new IllegalStateException(
                    "Both AUTH_SERVER_PRIVATE_KEY_PATH and AUTH_SERVER_PUBLIC_KEY_PATH must be configured"
            );
        }

        KeyPair keyPair;
        String keyId;
        if (hasPrivateKey) {
            keyPair = loadRsaKeyPair(privateKeyPath, publicKeyPath);
            keyId = configuredKeyId;
        } else {
            LOGGER.warn(
                    "No persistent RSA key paths are configured; generated development keys "
                            + "will invalidate JWTs after restart"
            );
            keyPair = generateRsaKeyPair();
            keyId = UUID.randomUUID().toString();
        }

        RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
        RSAPrivateKey privateKey = (RSAPrivateKey) keyPair.getPrivate();
        RSAKey rsaKey = new RSAKey.Builder(publicKey)
                .privateKey(privateKey)
                .keyID(keyId)
                .build();

        return new ImmutableJWKSet<>(new JWKSet(rsaKey));
    }

    private KeyPair loadRsaKeyPair(String privateKeyPath, String publicKeyPath) {
        try {
            String privatePem = Files.readString(
                    Path.of(privateKeyPath).toAbsolutePath().normalize(),
                    StandardCharsets.UTF_8
            );
            String publicPem = Files.readString(
                    Path.of(publicKeyPath).toAbsolutePath().normalize(),
                    StandardCharsets.UTF_8
            );

            KeyFactory keyFactory = KeyFactory.getInstance("RSA");
            RSAPrivateKey privateKey = (RSAPrivateKey) keyFactory.generatePrivate(
                    new PKCS8EncodedKeySpec(decodePem(privatePem, "PRIVATE KEY"))
            );
            RSAPublicKey publicKey = (RSAPublicKey) keyFactory.generatePublic(
                    new X509EncodedKeySpec(decodePem(publicPem, "PUBLIC KEY"))
            );
            return new KeyPair(publicKey, privateKey);
        } catch (Exception exception) {
            throw new IllegalStateException("Could not load the configured RSA key pair", exception);
        }
    }

    private byte[] decodePem(String pem, String type) {
        String beginMarker = "-----BEGIN " + type + "-----";
        String endMarker = "-----END " + type + "-----";
        if (!pem.contains(beginMarker) || !pem.contains(endMarker)) {
            throw new IllegalArgumentException("Expected PEM block: " + type);
        }

        String encoded = pem
                .replace(beginMarker, "")
                .replace(endMarker, "")
                .replaceAll("\\s", "");
        return Base64.getDecoder().decode(encoded);
    }

    private KeyPair generateRsaKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (Exception exception) {
            throw new IllegalStateException("Could not generate an RSA key pair", exception);
        }
    }
}
