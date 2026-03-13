import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-proveedores-create',
  standalone: true,
  imports: [
    MatDialogModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule
  ],
  templateUrl: './proveedores-create.html',
  styleUrl: './proveedores-create.scss'
})
export class ProveedoresCreate {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProveedoresCreate>);
  data = inject(MAT_DIALOG_DATA, { optional: true }) as { preset?: any } | null;

  loading = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(120)]],
    nit: ['', [Validators.maxLength(20)]],               
    telefono: ['', [Validators.maxLength(20)]],          
    contacto: ['', [Validators.maxLength(120)]],
    direccion: ['', [Validators.maxLength(300)]],
    activo: [true]
  });

  guardar(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;

     const v = this.form.value;
     const payload = {
      nombre: v.nombre,
      nit:v.nit,
      telefono:v.telefono,
      contacto:v.contacto,
      direccion:v.direccion,
      activo:v.activo
    };


  this.dialogRef.close(payload);
  }

}
