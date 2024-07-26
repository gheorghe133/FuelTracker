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
import { GeocodingService } from './services/GeoCodingService/geocoding.service';

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

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0; // Numărul total de elemente
  paginatedResults: any[] = [];

  constructor(
    private fuelService: FuelService,
    private geocodingService: GeocodingService,
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
          this.totalItems = result.length; // Setează numărul total de elemente

          // Curăță markerii anteriori
          this.clearMarkers();

          // Paginați rezultatele
          this.paginateResults();

          // Geocodare pentru fiecare adresă
          this.paginatedResults.forEach((station) => {
            const address = `${station.address}, ${station.city}`;
            this.geocodingService.geocodeAddress(address).subscribe({
              next: (geoResult: any) => {
                if (geoResult.results.length > 0) {
                  const { lat, lng } = geoResult.results[0].geometry;

                  // Creează icon-ul din URL-ul imaginii
                  const stationIcon = L.icon({
                    iconUrl: `https://www.peco.md/${station.image}`, // URL-ul imaginii ca icon
                    iconSize: [32, 32], // Dimensiunea icon-ului (ajustează după necesitate)
                    iconAnchor: [16, 32], // Punctul de ancorare al icon-ului (ajustează după necesitate)
                    popupAnchor: [0, -32], // Punctul de ancorare al popup-ului (ajustează după necesitate)
                  });

                  // Creează HTML-ul pentru popup
                  const popupContent = `
                    <div style="width: 100px;">
                      <img src="https://www.peco.md/${station.image}" alt="${station.gasStation}" style="width: 100%; height: auto;"/>
                      <p><strong>${station.gasStation}</strong></p>
                      <p>Preț: ${station.price}</p>
                      <p>Data: ${station.date}</p>
                    </div>
                  `;

                  const marker = L.marker([lat, lng], { icon: stationIcon })
                    .addTo(this.map)
                    .bindPopup(popupContent)
                    .openPopup();

                  this.markers.push(marker);
                }
              },
              error: (error) => {
                console.error('Geocoding error:', error);
              },
            });
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

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  private paginateResults() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedResults = this.fuelResults.slice(startIndex, endIndex);
  }

  public goToPage(page: number) {
    if (page > 0 && page <= Math.ceil(this.totalItems / this.itemsPerPage)) {
      this.currentPage = page;
      this.paginateResults();
    }
  }

  public nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  public previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  selectedIndex: number | null = null;
  selectedMarker: L.Marker | null = null; // Markerul selectat pe hartă

  // Alte metode existente

  highlightStation(station: any) {
    // Setează indexul rândului selectat
    this.selectedIndex = this.paginatedResults.indexOf(station);

    // Geocodare pentru adresa stației selectate
    const address = `${station.address}, ${station.city}`;
    this.geocodingService.geocodeAddress(address).subscribe({
      next: (geoResult: any) => {
        if (geoResult.results.length > 0) {
          const { lat, lng } = geoResult.results[0].geometry;

          // Dacă există un marker anterior selectat, elimină-l de pe hartă
          if (this.selectedMarker) {
            this.map.removeLayer(this.selectedMarker);
          }

          // Creează un nou marker pentru stația selectată
          const stationIcon = L.icon({
            iconUrl: `https://www.peco.md/${station.image}`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          });

          this.selectedMarker = L.marker([lat, lng], { icon: stationIcon })
            .addTo(this.map)
            .bindPopup(
              `
              <div style="width: 100px;">
                <img src="https://www.peco.md/${station.image}" alt="${station.gasStation}" style="width: 100%; height: auto;"/>
                <p><strong>${station.gasStation}</strong></p>
                <p>Preț: ${station.price}</p>
                <p>Data: ${station.date}</p>
              </div>
            `
            )
            .openPopup();

          // Mutați centrul hărții pe locația stației selectate
          this.map.setView([lat, lng], 13); // Ajustează nivelul de zoom după necesitate
        }
      },
      error: (error) => {
        console.error('Geocoding error:', error);
      },
    });
  }
}
