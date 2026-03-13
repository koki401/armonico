import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../app/assets/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  
  constructor(readonly http: HttpClient) {}
  
  login(data: any): Observable<any> {
    const apiUrl = environment.production 
      ? 'https://armonico.fly.dev'
      : '/api';
    
    return this.http.post(`${apiUrl}/usuarios/login`, data);
  }
}