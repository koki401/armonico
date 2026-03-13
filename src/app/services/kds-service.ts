import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../app/assets/environments/environment';

export interface PedidoDetalleResponse {
  idDetalle: number;
  idPlatillo: number;
  cantidad: number;
  precioUnitario: number;
  nota?: string | null;
  estadoCocina: number;
  nombrePlatillo: string | null;
  tiempoMin: number;
}

export interface PedidoResponse {
  idPedido: number;
  fechaCreacion: string;
  idTipo?: number | null;
  idMesa?: number | null;
  idCliente?: number | null;
  idMesero?: number | null;
  estadoActual: number;
  notaGeneral?: string | null;
  detalles: PedidoDetalleResponse[];
  tiempoMin?: number | null;
}

export interface PlatilloLite {
  idPlatillo: number;
  nombre: string;
  precioVenta?: number;
  imagen?: string;
}

export interface EstadoPedido {
  idEstado: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class KdsService {
  constructor(readonly http: HttpClient) {}

  // --- Helpers ---
  private baseHost(): string {
    return environment.production ? 'https://armonico.fly.dev' : '/api';
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  private slug(s: string) {
    return s.trim().toLowerCase().replace(/\s+/g, '_');
  }

  listarPorEstado(estado?: number | null): Observable<PedidoResponse[]> {
    const apiUrl = this.baseHost();
    const headers = this.authHeaders();
    const params =
      estado == null ? new HttpParams() : new HttpParams().set('valor', String(estado));

    return this.http.get<PedidoResponse[]>(`${apiUrl}/pedidos/estado`, { headers, params });
  }

  cambiarEstado(idPedido: number, nuevoEstado: number) {
    const apiUrl = this.baseHost();
    const headers = this.authHeaders();

    return this.http.patch<void>(
      `${apiUrl}/pedidos/${idPedido}/estado`,
      { estadoActual: nuevoEstado },
      { headers }
    );
  }

  // --- Estados ---
  listarEstadosMap(): Observable<Record<string, number>> {
    const apiUrl = this.baseHost();
    const headers = this.authHeaders();

    return this.http.get<EstadoPedido[]>(`${apiUrl}/estados-pedido`, { headers }).pipe(
      map((arr) => {
        const out: Record<string, number> = {};
        for (const e of arr) out[this.slug(e.nombre)] = e.idEstado;
        return out;
      })
    );
  }

  getPlatillosPorIds(ids: number[]) {
    const apiUrl = this.baseHost();
    const headers = this.authHeaders();

    // evita llamada si no hay IDs
    if (!ids || ids.length === 0) {
      return new Observable<Record<number, PlatilloLite>>((obs) => {
        obs.next({});
        obs.complete();
      });
    }

    const qs = ids.join(',');
    return this.http
      .get<PlatilloLite[]>(`${apiUrl}/platillos/buscar-por-ids`, {
        headers,
        params: new HttpParams().set('ids', qs),
      })
      .pipe(
        map((arr) => {
          const out: Record<number, PlatilloLite> = {};
          for (const p of arr) out[p.idPlatillo] = p;
          return out;
        })
      );
  }

  listarDashboard(fecha?: string) {
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }

    const url = `${apiUrl}/kpi/dashboard`;

    return this.http.get(url, { headers ,params });
  }

}
