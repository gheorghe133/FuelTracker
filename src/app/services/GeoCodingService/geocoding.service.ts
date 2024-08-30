import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private apiKey = '890b833542b747058c0073b1611c4160';
  private apiUrl = 'https://api.opencagedata.com/geocode/v1/json';

  constructor(private http: HttpClient) {}

  geocodeAddress(address: string): Observable<any> {
    const url = `${this.apiUrl}?q=${encodeURIComponent(address)}&key=${this.apiKey}&pretty=1`;
    
    return this.http.get(url);
  }

  reverseGeocode(lat: number, lng: number): Observable<any> {
    const url = `${this.apiUrl}?q=${lat}+${lng}&key=${this.apiKey}&language=ro&pretty=1`;
    return this.http.get(url);
  }
}
