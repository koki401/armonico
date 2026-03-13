import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../app/assets/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoriaComboService {
  constructor(readonly http: HttpClient) {}

  obtenerCategorias(): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${apiUrl}/categoria-combos`, { headers });
  }

  obtenerCategoriasActivas(): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const url = `${apiUrl}/categoria-combos?soloActivas=true`;

    return this.http.get(url, { headers });
  }

  cambiarEstadoCategoria(idCategoria: number, nuevoEstado: boolean): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const params = new HttpParams().set('activo', String(nuevoEstado));

    return this.http.patch(`${apiUrl}/categoria-combos/${idCategoria}/activo`, null, {
      headers,
      params,
    });
  }

  editarCategoria(
    idCategoria: number,
    body: { nombre?: string; descripcion?: string; activo?: boolean }
  ): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.patch(`${apiUrl}/categoria-combos/${idCategoria}`, body, { headers });
  }

  crearCategoria(
    body: { nombre: string; descripcion?: string; activo?: boolean }
  ): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${apiUrl}/categoria-combos`, body, { headers });
  }
}
