import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FuelService {
  private apiURL = 'http://localhost:3000/fetch-data';

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

    return this.httpClient.post(this.apiURL, data, { headers: headers });
  }
}
