import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';
import { Inventory } from './pages/inventory/inventory';
import { Menu } from './pages/menu/menu';
import { PuntoVenta } from './pages/punto-venta/punto-venta';
import { KDS } from './pages/kds/kds';
import { Role } from './model/role';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] as Role[] }
  },
  {
    path: 'inventary',
    component: Inventory,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] as Role[] }
  },
  {
    path: 'menu',
    component: Menu,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'COCINA','CAJERO'] as Role[] }
  },
  {
    path: 'punto-venta',
    component: PuntoVenta,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'CAJERO', 'MESERO','COCINA'] as Role[] }
  },
  {
    path: 'kds',
    component: KDS,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'COCINA','CAJERO'] as Role[] }
  },

  { path: '**', redirectTo: 'login', pathMatch: 'full' },
];
