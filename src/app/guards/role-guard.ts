import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { Role } from '../model/role';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const expected: Role[] = (route.data?.['roles'] ?? []) as Role[];

  // Si la ruta no define roles, se permite
  if (!expected.length) return true;

  // Si no hay sesión o no cumple rol, redirige
  if (!auth.isLoggedIn() || !auth.hasRole(...expected)) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
