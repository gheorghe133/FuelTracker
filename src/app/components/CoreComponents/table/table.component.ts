import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent {
  @Input() fuelResults: any[] = [];
  @Input() paginatedResults: any[] = [];
  @Input() currentPage: number = 1;
  @Input() itemsPerPage: number = 15;
  @Input() totalPages: number = 0;
  @Input() sortField: string = '';
  @Input() sortOrder: 'asc' | 'desc' = 'asc';
  @Input() selectedIndex: number | null = null;

  @Output() sort = new EventEmitter<string>();
  @Output() highlightStation = new EventEmitter<{ station: any; index: number; }>();

  onSort(field: string) {
    this.sort.emit(field);
  }

  onHighlightStation(station: any, index: number) {
    this.highlightStation.emit({ station, index });
  }
}
