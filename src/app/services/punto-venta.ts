import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../app/assets/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PuntoVentaService {
  constructor(readonly http: HttpClient) {}

  getServicios(): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const url = `${apiUrl}/estados-pedido`;

    return this.http.get(url, { headers });
  }

  getTipos(): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const url = `${apiUrl}/tipos-pedido`;

    return this.http.get(url, { headers });
  }

  getMesas(): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    const url = `${apiUrl}/mesas/activas`;

    return this.http.get(url, { headers });
  }

  guardarPedido(body: any): Observable<any> {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${apiUrl}/pedidos`, body, {
      headers,
    });
  }

  guardarPedidoDetalle(idPedido:any,body:any): Observable<any>{
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
    return this.http.post(`${apiUrl}/pedidos-detalle/${idPedido}/detalles`, body, {
      headers,
    });
  }

}
