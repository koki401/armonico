import { Injectable } from '@angular/core';
import { HttpClient , HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../app/assets/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  constructor(readonly http: HttpClient) {}

  categorias(): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${apiUrl}/categorias`, { headers });
  }

  productos(): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${apiUrl}/productos`, { headers });
  }

  kardex(): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.get(`${apiUrl}/kardex/listar`, { headers });
  }

  registrarMovimiento(data: any): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${apiUrl}/kardex/registrar`, data, { headers });
  }

  registrarProducto(data: any): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${apiUrl}/productos/crear`, data, { headers });
  }

  modificarProducto(id: number, data: any): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.patch(`${apiUrl}/productos/modificar/${id}`, data, { headers });
  }

  registrarProveedor(data: any): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${apiUrl}/proveedores`, data, { headers });
  }

  registrarCategorias(data: any): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${apiUrl}/categorias`, data, { headers });
  }
}
