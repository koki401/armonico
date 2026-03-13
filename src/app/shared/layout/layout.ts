import { Component, OnInit } from '@angular/core';
import { Router,RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, LowerCasePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService } from '../../services/auth-service';
import { Role } from '../../model/role';
import {
  faBoxOpen,
  faBell,
  faGear,
  faIdCardClip,
  faRightFromBracket,
  faHouse,
  faShop,
  faKitchenSet,
  faBars,
  faChartSimple,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { LogoutDialogComponent } from '../../dialogs/logut-dialog/logut-dialog';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, LowerCasePipe,RouterLink,RouterLinkActive,MatDialogModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout implements OnInit {
  constructor(readonly router: Router,  readonly dialog: MatDialog,private auth: AuthService) {}
  usuario: any = null;
  

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    const data = localStorage.getItem('usuario');
    if (data) this.usuario = JSON.parse(data);
  }

  
  notifications = true;

  faBoxOpen = faBoxOpen;
  faBell = faBell;
  faGear = faGear;
  faIdCardClip = faIdCardClip;
  faLogout = faRightFromBracket;
  faHouse = faHouse;
  faShop = faShop;
  faKitchenSet = faKitchenSet;
  faBars = faBars;
  faBarChart = faChartSimple;
  faUsers = faUsers;

  


  can(roles: Role[]): boolean {
    return this.auth.hasRole(...roles);
  }

  onLogout(): void {
    const dialogRef = this.dialog.open(LogoutDialogComponent, {
      width: '400px',
      disableClose: false,
      autoFocus: true,
      panelClass: 'logout-dialog'
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        localStorage.removeItem('usuario');
        localStorage.removeItem("token");
        this.router.navigate(['/login']);
      }
    });
  }
}
