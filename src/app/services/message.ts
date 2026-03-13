import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class MessageService {
  constructor(readonly snack: MatSnackBar) {}

  private open(msg: string, panelClass: string[], cfg?: MatSnackBarConfig) {
    this.snack.open(msg, 'Cerrar', {
      duration: 3500,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass,
      ...cfg
    });
  }

  success(msg: string) { this.open(msg, ['snack-success']); }
  error(msg: string)   { this.open(msg, ['snack-error'], { duration: 5000 }); }
  info(msg: string)    { this.open(msg, ['snack-info']); }
  warn(msg: string)    { this.open(msg, ['snack-warn']); }
}
