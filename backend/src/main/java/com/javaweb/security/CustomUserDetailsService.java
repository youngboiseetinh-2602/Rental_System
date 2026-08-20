package com.javaweb.security;

import com.javaweb.entity.UserEntity;
import com.javaweb.enums.UserStatus;
import com.javaweb.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tải thông tin tài khoản từ cơ sở dữ liệu để Spring Security thực hiện xác thực.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.getRole() == null || user.getStatus() == null) {
            throw new UsernameNotFoundException("User account is not eligible for authentication");
        }

        return User.withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .disabled(user.getStatus() == UserStatus.INACTIVE)
                .accountLocked(user.getStatus() == UserStatus.LOCKED)
                .build();
    }
}
