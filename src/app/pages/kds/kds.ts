// src/app/pages/kds/kds.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { KdsService, PedidoResponse } from '../../services/kds-service';
import { MatButtonModule } from '@angular/material/button';
import { interval, Subscription } from 'rxjs';
import { Layout } from '../../shared/layout/layout';
import { MatIconModule } from '@angular/material/icon';

type EstadoIds = {
  nuevo: number;
  en_proceso: number;
  listo: number;
  entregado?: number;
  cancelado?: number;
};

@Component({
  selector: 'app-kds',
  standalone: true,
  templateUrl: './kds.html',
  styleUrls: ['./kds.scss'],
  imports: [CommonModule, MatButtonModule, Layout,MatIconModule],
})
export class KDS implements OnInit, OnDestroy {
  private sub?: Subscription;

  estadoIds = signal<EstadoIds>({
    nuevo: 1,
    en_proceso: 2,
    listo: 3,
    entregado: 4,
    cancelado: 5,
  });

  // Listas por columna (¡nunca null!)
  nuevas = signal<PedidoResponse[]>([]);
  enPrep = signal<PedidoResponse[]>([]);
  listas = signal<PedidoResponse[]>([]);

  // Contadores seguros
  totalNuevas = computed(() => (this.nuevas() ?? []).length);
  totalEnProceso = computed(() => (this.enPrep() ?? []).length);
  totalListas = computed(() => (this.listas() ?? []).length);

  constructor(private api: KdsService) {}

  ngOnInit(): void {
    this.api.listarEstadosMap().subscribe({
      next: (m: any) => {
        this.estadoIds.set({
          nuevo: m['nuevo'] ?? 1,
          en_proceso: m['en_proceso'] ?? 2,
          listo: m['listo'] ?? 3,
          entregado: m['entregado'] ?? 4,
          cancelado: m['cancelado'] ?? 5,
        });
        this.loadAll();
      },
      error: () => this.loadAll(),
    });

    this.sub = interval(1000000).subscribe(() => this.loadAll());
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  loadAll(): void {
    const ids = this.estadoIds();

    this.api.listarPorEstado(ids.nuevo).subscribe({
      next: (r: any) => this.nuevas.set(r ?? []),
      error: () => this.nuevas.set([]),
    });

    this.api.listarPorEstado(ids.en_proceso).subscribe({
      next: (r: any) => this.enPrep.set(r ?? []),
      error: () => this.enPrep.set([]),
    });

    this.api.listarPorEstado(ids.listo).subscribe({
      next: (r: any) => this.listas.set(r ?? []),
      error: () => this.listas.set([]),
    });
  }

  actionFor(p: PedidoResponse): { text: string; next?: number } {
    const e = this.estadoIds();
    if (p.estadoActual === e.nuevo) return { text: 'Comenzar Preparación', next: e.en_proceso };
    if (p.estadoActual === e.en_proceso) return { text: 'Marcar como Lista', next: e.listo };
    if (p.estadoActual === e.listo) return { text: 'Confirmar Entrega', next: e.entregado };
    return { text: 'Sin acción' };
  }

  doAction(p: PedidoResponse) {
    const a = this.actionFor(p);
    if (!a.next) return;
    this.api.cambiarEstado(p.idPedido, a.next).subscribe({
      next: () => this.loadAll(),
    });
  }

  pad(n: number): string {
    return String(n).padStart(3, '0');
  }

  etiquetaMesa(p: PedidoResponse): string {
    return p.idMesa ? `Mesa ${p.idMesa}` : 'Orden';
  }

  transcurridoMinutos(p: PedidoResponse): number {
    const t = new Date(p.fechaCreacion).getTime();
    return Math.max(0, Math.floor((Date.now() - t) / 60000));
  }

  estimadoMinutos(p: PedidoResponse): number {
    if (p.tiempoMin != null) return p.tiempoMin!;

    const total = (p.detalles ?? []).reduce((acc, d) => {
      const tiempo = d.tiempoMin ?? 0; 
      return acc + tiempo;
    }, 0);
    const tiempoTotal = total > 0 ? total : 8;

    return Math.min(45, Math.max(8, tiempoTotal));
  }

  estaAtrasada(p: PedidoResponse): boolean {
    return this.transcurridoMinutos(p) > this.estimadoMinutos(p);
  }

  primerChip(p: PedidoResponse): string | null {
    const notaItem = p.detalles?.find((d: any) => !!d.nota)?.nota ?? null;
    return notaItem ?? (p.notaGeneral || null);
  }

  trackByPedido = (_: number, p: PedidoResponse) => p.idPedido;

  pillText(estadoId: number): string {
    const e = this.estadoIds();
    if (estadoId === e.nuevo) return 'nuevo';
    if (estadoId === e.en_proceso) return 'preparando';
    if (estadoId === e.listo) return 'listo';
    if (estadoId === e.entregado) return 'entregado';
    if (estadoId === e.cancelado) return 'cancelado';
    return '';
  }

  pillClass(estadoId: number): string {
    const e = this.estadoIds();
    if (estadoId === e.nuevo) return 'pill pill--new';
    if (estadoId === e.en_proceso) return 'pill pill--prep';
    if (estadoId === e.listo) return 'pill pill--done';
    if (estadoId === e.entregado) return 'pill pill--ent';
    if (estadoId === e.cancelado) return 'pill pill--cancel';
    return 'pill';
  }
}
