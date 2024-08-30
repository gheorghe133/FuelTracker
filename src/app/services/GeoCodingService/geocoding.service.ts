import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private readonly apiUrl = `${environment.server}/geocode`;

  constructor(private http: HttpClient) {}

  geocodeAddress(address: string): Observable<any> {
    const url = `${this.apiUrl}?address=${encodeURIComponent(address)}`;
    return this.http.get(url);
  }

  reverseGeocode(lat: number, lng: number): Observable<any> {
    const url = `${this.apiUrl}?lat=${lat}&lng=${lng}`;
    return this.http.get(url);
  }
}
