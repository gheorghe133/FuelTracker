import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuelService } from './services/FuelService/fuel.service';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  gasStations: string[] = [
    'Avante',
    'Bemol',
    'eGaz',
    'Fox',
    'GoianaPetrol',
    'Lukoil',
    'Now',
    'Pemo',
    'Petrocub',
    'Petrom',
    'PrimOil',
    'Rompetrol',
    'Sheriff',
    'TagoOil',
    'TLX',
    'TransAutoGaz',
    'Vento',
    'BasaPetrol - (fǎrǎ preț)',
    'Tirex - (fǎrǎ preț)',
  ];

  title = 'Benzeno';
  searchForm: FormGroup;
  dropdownOpen = false;
  selectedStations: string[] = [];
  errorMessage!: string;
  hasError = false;
  loader = false;
  fuelResults = [];
  private updatingQueryParams = false;
  map!: L.Map;
  markers: L.Marker[] = []; // Variabilă pentru markerii curenți
  latitude = 47.0105; // Coordonatele centrale pentru Moldova
  longitude = 28.8638;
  zoom = 7;

  constructor(
    private fuelService: FuelService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.searchForm = this.formBuilder.group({
      carburant: ['Benzina_Regular', [Validators.required]],
      locatie: [null, [Validators.required]],
      nume_locatie: [null, [Validators.required]],
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(
      ({ carburant, locatie, nume_locatie, retea }) => {
        const carburant_param = carburant;
        const locatie_param = locatie;
        const nume_locatie_param = nume_locatie;
        const retea_param = retea;

        if (
          carburant_param &&
          locatie_param &&
          nume_locatie_param &&
          retea_param
        ) {
          this.updatingQueryParams = true;
          this.searchForm.patchValue({
            carburant: carburant || 'Benzina_Regular',
            locatie: locatie || '',
            nume_locatie: nume_locatie || '',
          });

          if (retea) {
            this.selectedStations = Array.isArray(retea) ? retea : [retea];
          }

          this.search();
          this.updatingQueryParams = false;
        }
      }
    );

    this.initMap();
  }

  private initMap(): void {
    this.map = L.map('map').setView([this.latitude, this.longitude], this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  public search() {
    if (this.updatingQueryParams) {
      return;
    }

    const { carburant, locatie, nume_locatie } = this.searchForm.value;
    const retea = this.selectedStations;

    this.loader = true;

    this.fuelService
      .getStations(carburant, locatie, nume_locatie, retea)
      .subscribe({
        next: (result: any[]) => {
          this.hasError = false;
          this.loader = false;
          console.log(result);
          this.fuelResults = result;

          // Curăță markerii anteriori
          this.clearMarkers();

          // Adaugă markerii pentru fiecare benzinărie
          result.forEach((station) => {
            // Asumăm că `station` conține `latitude` și `longitude`
            const marker = L.marker([station.latitude, station.longitude])
              .addTo(this.map)
              .bindPopup(station.name || 'Unknown')
              .openPopup();

            this.markers.push(marker);
          });
        },
        error: (error) => {
          console.error(error);
          this.hasError = true;
          this.loader = false;
          this.errorMessage = error.error.error;
        },
      });
  }

  private clearMarkers() {
    this.markers.forEach((marker) => this.map.removeLayer(marker));
    this.markers = [];
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectAll(event: any) {
    if (event.target.checked) {
      this.selectedStations = [...this.gasStations];
    } else {
      this.selectedStations = [];
    }
    this.updateQueryParams();
  }

  selectStation(station: string, event: any) {
    if (event.target.checked) {
      this.selectedStations.push(station);
    } else {
      this.selectedStations = this.selectedStations.filter(
        (s) => s !== station
      );
    }
    this.updateQueryParams();
  }

  isSelected(station: string): boolean {
    return this.selectedStations.includes(station);
  }

  areAllSelected(): boolean {
    return this.selectedStations.length === this.gasStations.length;
  }

  cancel() {
    this.searchForm.setValue({
      carburant: 'Benzina_Regular',
      locatie: null,
      nume_locatie: null,
    });
    this.fuelResults = [];
    this.selectedStations = [];
    this.clearQueryParams();
  }

  private updateQueryParams() {
    const { carburant, locatie, nume_locatie } = this.searchForm.value;

    const queryParams = {
      carburant,
      locatie,
      nume_locatie,
      retea:
        this.selectedStations.length > 0 ? this.selectedStations : undefined,
    };

    this.updatingQueryParams = true;
    this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams,
        queryParamsHandling: 'merge',
      })
      .then(() => {
        this.updatingQueryParams = false;
      });
  }

  private clearQueryParams() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }
}
