import { Component, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';
import { NgIf, CurrencyPipe } from '@angular/common';
import { forkJoin } from 'rxjs';

interface DashboardSummary {
  fecha: string;
  totalDia: number;
  promedioMin: number;
  completadas: number;
  activas: number;
  porcentajeCompVsAct: number;
}

import {
  faRightFromBracket,
  faHouse,
  faCartShopping,
  faBars,
  faBoxes,
  faChartBar,
  faUsers,
  faGear,
  faFile,
  faBell,
  faDollarSign,
  faCheckCircle,
  faClock,
  faTriangleExclamation,
  faIdCardClip,
  faBoxOpen,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { Layout } from '../../shared/layout/layout';
import { KdsService } from '../../services/kds-service';
import { MessageService } from '../../services/message';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FontAwesomeModule, Layout, NgIf, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  faLogout = faRightFromBracket;
  faHome = faHouse;
  faCart = faCartShopping;
  faMenu = faBars;
  faProducts = faBoxes;
  faStats = faChartBar;
  faUsers = faUsers;
  faSettings = faGear;
  faFile = faFile;
  faBell = faBell;
  faDollarIcon = faDollarSign;
  faCheck = faCheckCircle;
  faClock = faClock;
  faWarning = faTriangleExclamation;
  faIdCardClip = faIdCardClip;
  faGear = faGear;
  faBoxOpen = faBoxOpen;
  faCircleInfo = faCircleInfo;

  private readonly timeZone = 'America/Guatemala';

  usuario: any = null;
  notifications = false;

  // Resúmenes
  resumenHoy?: DashboardSummary;
  resumenAyer?: DashboardSummary;

  // Comparativos
  totalDiaDiff?: number; // hoy - ayer
  totalDiaAvg?: number; // promedio entre hoy y ayer
  completadasMsg?: string; // "+ totalN que ayer" | "- totalN que ayer" | "igual que ayer"
  promedioMinMsg?: string; // "mayor por N" | "menor por N" | "igual que ayer"
  totalDiaDiffPct?: number; // cambio porcentual de totalDia (hoy vs ayer)

  // Alias para compatibilidad con plantillas que usan "resumen"
  get resumen(): DashboardSummary | undefined {
    return this.resumenHoy;
  }

  constructor(
    readonly router: Router,
    readonly kdsService: KdsService,
    readonly msg: MessageService
  ) {}

  ngOnInit() {
    const ayerStr = this.formatDateTz(new Date(Date.now() - 24 * 60 * 60 * 1000), this.timeZone);

    forkJoin({
      hoy: this.kdsService.listarDashboard(),
      ayer: this.kdsService.listarDashboard(ayerStr),
    }).subscribe({
      next: ({ hoy, ayer }) => {
        // Validar y asignar HOY
        if (this.isDashboardSummary(hoy) && this.valoresValidos(hoy)) {
          this.resumenHoy = hoy;
        } else {
          this.msg.error('Datos inválidos para el dashboard de hoy');
        }

        // Validar y asignar AYER
        if (this.isDashboardSummary(ayer) && this.valoresValidos(ayer)) {
          this.resumenAyer = ayer;
        } else {
          this.msg.error('Datos inválidos para el dashboard de ayer');
        }

        // Calcular comparativos
        this.actualizarComparativos();

        if (this.resumenHoy || this.resumenAyer) {
          this.msg.info('Datos del dashboard cargados');
        }
      },
      error: (err) => {
        console.error(err);
        this.msg.error('Fallo al cargar datos del dashboard');
      },
    });

    const data = localStorage.getItem('usuario');
    if (data) this.usuario = JSON.parse(data);
  }

  // ===== Comparativos =====
  private actualizarComparativos(): void {
    if (!this.resumenHoy || !this.resumenAyer) return;

    // totalDia: diferencia y promedio
    const diffTotal = this.resumenHoy.totalDia - this.resumenAyer.totalDia;
    const avgTotal = (this.resumenHoy.totalDia + this.resumenAyer.totalDia) / 2;

    this.totalDiaDiff = Number(diffTotal.toFixed(2));
    this.totalDiaAvg = Number(avgTotal.toFixed(2));

    this.totalDiaDiffPct = this.porcentajeCambio(
      this.resumenHoy.totalDia,
      this.resumenAyer.totalDia
    );

    console.log(this.totalDiaDiffPct);
    

    // completadas: mensaje con + / - total{n} que ayer
    const deltaComp = this.resumenHoy.completadas - this.resumenAyer.completadas;
    if (deltaComp > 0) {
      this.completadasMsg = `+ total ${deltaComp} que ayer`;
    } else if (deltaComp < 0) {
      this.completadasMsg = `- total ${Math.abs(deltaComp)} que ayer`;
    } else {
      this.completadasMsg = 'igual que ayer';
    }

    // promedioMin: mayor / menor vs ayer
    const deltaProm = Number(
      (this.resumenHoy.promedioMin - this.resumenAyer.promedioMin).toFixed(2)
    );
    if (deltaProm > 0) {
      this.promedioMinMsg = `- ${deltaProm} más lento`;
    } else if (deltaProm < 0) {
      this.promedioMinMsg = `+ ${Math.abs(deltaProm)} más rápido `;
    } else {
      this.promedioMinMsg = 'igual que ayer';
    }
  }

  // ===== Validaciones =====
  private isDashboardSummary(d: unknown): d is DashboardSummary {
    if (typeof d !== 'object' || d === null) return false;
    const o = d as any;
    return (
      typeof o.fecha === 'string' &&
      typeof o.totalDia === 'number' &&
      typeof o.promedioMin === 'number' &&
      typeof o.completadas === 'number' &&
      typeof o.activas === 'number' &&
      typeof o.porcentajeCompVsAct === 'number'
    );
  }
  private valoresValidos(d: DashboardSummary): boolean {
    return (
      Number.isFinite(d.totalDia) &&
      Number.isFinite(d.promedioMin) &&
      Number.isInteger(d.completadas) &&
      Number.isInteger(d.activas)
    );
  }

  // ===== Helpers de fecha =====
  private formatDateTz(d: Date, timeZone: string): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d); // YYYY-MM-DD
  }

  private porcentajeCambio(actual: number, anterior: number): number | undefined {
    if (!Number.isFinite(actual) || !Number.isFinite(anterior)) return undefined;
    if (anterior === 0) {
      if (actual === 0) return 0;
      return Infinity; // crecimiento desde cero
    }
    const pct = ((actual - anterior) / anterior) * 100;
    return Number(pct.toFixed(2));
  }
}
