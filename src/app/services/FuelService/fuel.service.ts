import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class FuelService {
  private readonly apiUrl = `${environment.server}/fetch-data`;

  constructor(private httpClient: HttpClient) {}

  getStations(
    carburant: string,
    locatie: string,
    nume_locatie: string,
    retea: string[]
  ): Observable<Object> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    const data = {
      carburant: carburant,
      locatie: locatie,
      nume_locatie: nume_locatie,
      retea: retea,
    };

    return this.httpClient.post(this.apiUrl, data, { headers: headers });
  }
}
