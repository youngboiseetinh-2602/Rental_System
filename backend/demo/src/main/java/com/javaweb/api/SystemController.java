package com.javaweb.api;

import io.imagekit.client.ImageKitClient;
import io.imagekit.models.files.FileUploadParams;
import io.imagekit.models.files.FileUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private static final long MAX_AVATAR_SIZE = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

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

    @PostMapping(
            value = "/avatar",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadAvatar(
            @RequestPart("file") MultipartFile file
    ) throws Exception {
        return uploadImage(file, "/rental-room/avatars", "avatar");
    }

    @PostMapping(
            value = "/property-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadPropertyImage(
            @RequestPart("file") MultipartFile file
    ) throws Exception {
        return uploadImage(file, "/rental-room/properties", "property");
    }

    private ResponseEntity<Map<String, String>> uploadImage(
            MultipartFile file,
            String folder,
            String prefix
    ) throws Exception {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Vui lòng chọn một tệp ảnh."));
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Ảnh đại diện không được vượt quá 5 MB."));
        }
        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Định dạng ảnh không được hỗ trợ."));
        }

        String originalName = file.getOriginalFilename();
        String safeName = originalName == null
                ? "avatar"
                : originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        FileUploadParams params = FileUploadParams.builder()
                .file(file.getBytes())
                .fileName(prefix + "-" + System.currentTimeMillis() + "-" + safeName)
                .folder(folder)
                .useUniqueFileName(true)
                .build();
        FileUploadResponse upload = imageKitClient.files().upload(params);
        String uploadedUrl = upload.url().orElseThrow(
                () -> new IllegalStateException(
                        "ImageKit did not return an uploaded file URL."
                )
        );

        return ResponseEntity.ok(Map.of("url", uploadedUrl));
    }
}
