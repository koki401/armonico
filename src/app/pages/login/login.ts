import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../services/login';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    readonly fb: FormBuilder,
    readonly loginService: LoginService,
    readonly router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onLogin() {
  if (this.loginForm.invalid) return;

  const data = {
    email: this.loginForm.value.email,
    password: this.loginForm.value.password
  };

  this.loginService.login(data).subscribe({
    next: (response: any) => {
      const { token, usuario } = response;

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      const roles: string[] = usuario?.roles ?? [];

      const has = (r: string) => roles.includes(r);
      let target = '/dashboard';                

      if (has('COCINA') && !has('ADMIN')) target = '/kds';
      else if (has('CAJERO') || has('MESERO')) target = '/punto-venta';

      this.router.navigate([target]);
    },
    error: (error) => {
      console.error('Error en login:', error);
      alert('Credenciales inválidas o error en el servidor');
    }
  });
}

}
