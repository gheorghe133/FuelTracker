import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort',
  standalone: true
})
export class SortPipe implements PipeTransform {
  transform(
    array: any[],
    sortBy: string,
    direction: 'asc' | 'desc' = 'asc'
  ): any[] {
    if (!array || !sortBy) {
      return array;
    }

    const sortOrder = direction === 'asc' ? 1 : -1;

    return array.sort((a, b) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return valueA.localeCompare(valueB) * sortOrder;
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * sortOrder;
      }

      return 0;
    });
  }
}
