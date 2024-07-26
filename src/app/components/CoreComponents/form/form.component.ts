import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
})
export class FormComponent {
  @Input() title: string;
  @Input() searchForm: FormGroup;
  @Input() dropdownOpen: boolean;
  @Input() selectedStations: string[] = [];
  @Input() gasStations: string[] = [];
  @Input() loader: boolean;
  @Input() hasError: boolean;
  @Input() errorMessage: string;
  @Input() currentTheme: string;

  @Output() search = new EventEmitter<void>();
  @Output() toggleDropdown = new EventEmitter<void>();
  @Output() selectAll = new EventEmitter<Event>();
  @Output() selectStation = new EventEmitter<{ station: string; event: Event }>();
  @Output() cancel = new EventEmitter<void>();
  @Output() toggleTheme = new EventEmitter<void>();

  onSearch(): void {
    this.search.emit();
  }

  onToggleDropdown(): void {
    this.toggleDropdown.emit();
  }

  onSelectAll(event: Event): void {
    this.selectAll.emit(event);
  }

  onSelectStation(station: string, event: Event): void {
    this.selectStation.emit({ station: station, event: event });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onToggleTheme(): void {
    this.toggleTheme.emit();
  }

  areAllSelected(): boolean {
    return (
      this.gasStations.length > 0 &&
      this.selectedStations.length === this.gasStations.length
    );
  }

  isSelected(station: string): boolean {
    return this.selectedStations.includes(station);
  }
}
