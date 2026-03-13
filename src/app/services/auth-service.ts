import { Injectable } from '@angular/core';
import { Role } from '../model/role';

interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
  activo: boolean;
  roles: Role[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly CANDIDATE_KEYS = ['auth', 'usuario']; // por si guardas como 'auth' o 'usuario'

  private readAuthRaw(): any | null {
    for (const k of this.CANDIDATE_KEYS) {
      const raw = localStorage.getItem(k);
      if (raw) {
        try { return JSON.parse(raw); } catch { return null; }
      }
    }
    return null;
  }

  /** Devuelve el objeto { token, usuario } o solo {usuario} según cómo se guardó */
  private getAuthObj(): any | null {
    return this.readAuthRaw();
  }

  getUsuario(): Usuario | null {
    const a = this.getAuthObj();
    if (!a) return null;
    // Soporta ambos formatos: { token, usuario:{...} } ó { idUsuario, nombre, roles, ... }
    return a.usuario ?? a;
  }

  getRoles(): Role[] {
    return this.getUsuario()?.roles ?? [];
  }

  hasRole(...allowed: Role[]): boolean {
    const mine = this.getRoles();
    return allowed.some(r => mine.includes(r));
  }

  isLoggedIn(): boolean {
    return !!this.getUsuario();
  }

  logout(): void {
    this.CANDIDATE_KEYS.forEach(k => localStorage.removeItem(k));
  }
}
