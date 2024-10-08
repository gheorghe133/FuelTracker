import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin, map } from 'rxjs';
import * as L from 'leaflet';

import { FormComponent } from './components/CoreComponents/form/form.component';
import { TableComponent } from './components/CoreComponents/table/table.component';
import { PaginationComponent } from './components/CoreComponents/pagination/pagination.component';

import { FuelService } from './services/FuelService/fuel.service';
import { GeocodingService } from './services/GeoCodingService/geocoding.service';
import { SortPipe } from './pipes/SortPipe/sort.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormComponent,
    TableComponent,
    PaginationComponent,
    CommonModule,
    RouterOutlet,
    SortPipe,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

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

  title = 'Benzo';
  searchForm: FormGroup;
  dropdownOpen = false;
  selectedStations: string[] = [];
  errorMessage!: string;
  hasError = false;
  searchLoader = false;
  myLocationLoader = false;
  fuelResults: any[] = [];
  searchMade: boolean = false;

  selectedIndex: number | null = null;
  selectedMarker: L.Marker | null = null;
  map!: L.Map;
  markers: L.Marker[] = [];
  latitude = 47.0105;
  longitude = 28.8638;
  zoom = 7;

  currentPage = 1;
  itemsPerPage = 15;
  totalItems = 0;
  paginatedResults: any[] = [];

  sortField = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  currentTheme: string | undefined;

  constructor(
    private fuelService: FuelService,
    private geocodingService: GeocodingService,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({
      carburant: ['Benzina_Regular', [Validators.required]],
      locatie: [null, [Validators.required]],
      nume_locatie: [null, [Validators.required]],
    });
  }

  ngOnInit() {
    this.initMap();
    this.applySavedTheme();
  }

  private initMap(): void {
    this.map = L.map('map').setView([this.latitude, this.longitude], this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
  }

  useMyLocation(): void {
    this.myLocationLoader = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          this.geocodingService.reverseGeocode(lat, lng).subscribe({
            next: (response: any) => {
              if (response.results.length > 0) {
                const address = response.results[0].components.city;
                this.searchForm.patchValue({ nume_locatie: address });
              }

              this.myLocationLoader = false;
            },
            error: (error) => {
              console.error('Geocoding error:', error);
              this.myLocationLoader = false;
            },
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          this.myLocationLoader = false;
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      this.myLocationLoader = false;
    }
  }

  search() {
    const { carburant, locatie, nume_locatie } = this.searchForm.value;
    const retea = this.selectedStations;

    this.searchMade = true;
    this.fuelResults = [];
    this.selectedIndex = null;
    this.currentPage = 1;
    this.searchLoader = true;

    this.clearMarkers();

    this.fuelService
      .getStations(carburant, locatie, nume_locatie, retea)
      .subscribe({
        next: (result: any[]) => {
          this.hasError = false;
          this.searchLoader = false;
          this.fuelResults = result;
          this.totalItems = result.length;

          this.paginateResults();
          this.geocodeStations();
        },
        error: (error) => {
          this.hasError = true;
          this.searchLoader = false;
          this.errorMessage = error.error.error;
        },
      });
  }

  private clearMarkers() {
    this.markers.forEach((marker) => this.map.removeLayer(marker));
    this.markers = [];

    if (this.selectedMarker) {
      this.selectedMarker.closePopup();
      this.map.removeLayer(this.selectedMarker);
      this.selectedMarker = null;
    }
  }

  private geocodeStations() {
    const bounds = L.latLngBounds();

    const createMarker = (station: any, lat: number, lng: number) => {
      const stationIcon = L.icon({
        iconUrl: `https://www.peco.md/${station.image}`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const popupContent = `
        <div style="width: 150px;">
          <img src="https://www.peco.md/${station.image}" alt="${station.gasStation}" style="width: 50px; height: 50px;"/>
          <p><b>${station.gasStation}</b></p>
          <p>Adresă: <b>${station.address}</b></p>
          <p>Oraș: <b>${station.city}</b></p>
          <p>Preț: <b>${station.price}</b></p>
          <p>Data: <b>${station.date}</b></p>
        </div>
      `;

      return L.marker([lat, lng], { icon: stationIcon })
        .addTo(this.map)
        .bindPopup(popupContent);
    };

    const geocodeRequests = this.paginatedResults.map((station) => {
      const address = `${station.address}, ${station.city}`;
      return this.geocodingService.geocodeAddress(address).pipe(
        map((geoResult: any) => {
          if (geoResult.results.length > 0) {
            const { lat, lng } = geoResult.results[0].geometry;
            const marker = createMarker(station, lat, lng);
            bounds.extend([lat, lng]);
            return marker;
          }
        })
      );
    });

    forkJoin(geocodeRequests).subscribe({
      next: (markers) => {
        this.markers = markers.filter(
          (marker) => marker !== undefined
        ) as L.Marker[];
        if (bounds.isValid()) {
          this.map.fitBounds(bounds, { padding: [20, 20] });
        }
      },
      error: (error) => console.error('Geocoding error:', error),
    });
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectAll(event: any) {
    this.selectedStations = event.target.checked ? [...this.gasStations] : [];
  }

  selectStation(event: { station: string; event: Event }) {
    const { station, event: targetEvent } = event;
    const target = targetEvent.target as HTMLInputElement;

    if (target.checked) {
      this.selectedStations.push(station);
    } else {
      this.selectedStations = this.selectedStations.filter(
        (s) => s !== station
      );
    }
  }

  isSelected(station: string): boolean {
    return this.selectedStations.includes(station);
  }

  areAllSelected(): boolean {
    return this.selectedStations.length === this.gasStations.length;
  }

  cancel() {
    this.searchForm.reset({
      carburant: 'Benzina_Regular',
      locatie: null,
      nume_locatie: null,
    });
    this.searchMade = false;
    this.fuelResults = [];
    this.selectedStations = [];
    this.clearMarkers();

    if (this.selectedMarker) {
      this.selectedMarker.closePopup();
      this.map.removeLayer(this.selectedMarker);
      this.selectedMarker = null;
    }

    this.map.setView([this.latitude, this.longitude], this.zoom);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  private paginateResults() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedResults = this.fuelResults.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  goToPage(page: number) {
    if (page > 0 && page <= this.totalPages) {
      this.currentPage = page;
      this.paginateResults();
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  highlightStation(event: { station: any; index: number }) {
    const { station, index } = event;
    const currentIndex = (this.currentPage - 1) * this.itemsPerPage + index;

    if (this.selectedIndex === currentIndex) {
      if (this.selectedMarker) {
        this.map.removeLayer(this.selectedMarker);
        this.selectedMarker = null;
      }
      this.selectedIndex = null;
    } else {
      this.selectedIndex = currentIndex;
      const address = `${station.address}, ${station.city}`;
      this.geocodingService.geocodeAddress(address).subscribe({
        next: (geoResult: any) => {
          if (geoResult.results.length > 0) {
            const { lat, lng } = geoResult.results[0].geometry;

            if (this.selectedMarker) {
              this.map.removeLayer(this.selectedMarker);
            }

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
                <div style="width: 150px;">
                  <img src="https://www.peco.md/${station.image}" alt="${station.gasStation}" style="width: 50px; height: 50px;"/>
                  <p><b>${station.gasStation}</b></p>
                  <p>Adresă: <b>${station.address}</b></p>
                  <p>Oraș: <b>${station.city}</b></p>
                  <p>Preț: <b>${station.price}</b></p>
                  <p>Data: <b>${station.date}</b></p>
                </div>
                `
              )
              .openPopup();

            this.map.setView([lat, lng], 13);

            this.scrollToMap();
          }
        },
        error: (error) => console.error('Geocoding error:', error),
      });
    }
  }

  private scrollToMap() {
    this.mapContainer.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  sort(field: string) {
    this.sortField = field;
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.fuelResults = new SortPipe().transform(
      this.fuelResults,
      this.sortField,
      this.sortOrder
    );
    this.paginateResults();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    document
      .getElementsByTagName('html')[0]
      .setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('theme', this.currentTheme);
  }

  private applySavedTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.currentTheme = savedTheme || 'light';
    document
      .getElementsByTagName('html')[0]
      .setAttribute('data-theme', this.currentTheme);
  }
}
