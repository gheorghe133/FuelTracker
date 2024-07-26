import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 0;
  @Input() itemsPerPage: number = 15;

  @Output() previousPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() goToPage = new EventEmitter<number>();

  onPreviousPage() {
    if (this.currentPage > 1) {
      this.previousPage.emit();
    }
  }

  onNextPage() {
    if (this.currentPage < this.totalPages) {
      this.nextPage.emit();
    }
  }

  onPageChange(page: number) {
    if (page !== this.currentPage) {
      this.goToPage.emit(page);
    }
  }
}
