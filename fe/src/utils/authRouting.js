const AUTH_ROUTES = new Set(['/login', '/register', '/callback']);

export function userHasRole(user, expectedRole) {
    const roles = Array.isArray(user?.roles)
        ? user.roles
        : user?.role
            ? [user.role]
            : [];

    return roles.some(
        (role) => String(role).replace(/^ROLE_/, '') === expectedRole,
    );
}

export function defaultAuthenticatedRoute(user) {
    if (userHasRole(user, 'CUSTOMER')) return '/dashboard';
    if (userHasRole(user, 'OWNER')) return '/owner/dashboard';
    return '/';
}

export function postLoginRoute(user, returnTo) {
    const fallback = defaultAuthenticatedRoute(user);

    if (
        typeof returnTo !== 'string'
        || !returnTo.startsWith('/')
        || returnTo.startsWith('//')
    ) {
        return fallback;
    }

    const pathname = returnTo.split(/[?#]/, 1)[0];
    if (returnTo === '/' || AUTH_ROUTES.has(pathname)) {
        return fallback;
    }

    if (
        (pathname === '/dashboard' || pathname.startsWith('/dashboard/'))
        && !userHasRole(user, 'CUSTOMER')
    ) {
        return fallback;
    }
    if (pathname.startsWith('/owner/') && !userHasRole(user, 'OWNER')) {
        return fallback;
    }

    return returnTo;
}
