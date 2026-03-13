import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../app/assets/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Supplier {
  constructor(readonly http:HttpClient){}

  proveedores():Observable<any>{
    const apiUrl = environment.production ? 'https://armonico.fly.dev' : '/api';

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    return this.http.get(`${apiUrl}/proveedores`, { headers });

  }
  
}
