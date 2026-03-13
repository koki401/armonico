import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../app/assets/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PlatillosService {
  constructor(readonly http: HttpClient) {}

  getPlatillosActivos(): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const url = `${apiUrl}/platillos/listar`;

    return this.http.get(url, { headers });
  }

  cambiarEstadoPlatillo(idPlatillo: number, nuevoEstado: boolean): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    const params = new HttpParams().set('activo', String(nuevoEstado));
    return this.http.patch(`${apiUrl}/platillos/${idPlatillo}/activo`, null, {
      headers,
      params,
    });
  }

  crearPlatillo(body: any): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${apiUrl}/platillos`, body, {
      headers,
    });
  }

  actualizarPlatillo(idPlatillo: number, body: any) {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.patch(`${apiUrl}/platillos/${idPlatillo}`, body, { headers });
  }

  editarCategoria(
    idPlatillo: number,
    body: any
  ): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.patch(`${apiUrl}/platillos/receta`, body, { headers });
  }
}
