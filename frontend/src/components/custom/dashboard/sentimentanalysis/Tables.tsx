import { useMemo } from 'react';
import { useTable, useSortBy, Column, ColumnInstance } from 'react-table';
import { Testimonial } from '@/types/testimonial';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

// Define the extended column type with sorting properties
interface SortableColumnInstance<D extends object = object> extends ColumnInstance<D> {
  isSorted: boolean;
  isSortedDesc: boolean;
  getSortByToggleProps: () => any;
}

type Props = {
  testimonials: Testimonial[];
  selected: string[];
  onSelect: (selected: string[]) => void;
};

export default function TestimonialTable({ testimonials, selected, onSelect }: Props) {
  const columns = useMemo<Column<Testimonial>[]>(
    () => [
      {
        Header: () => null,
        id: 'selection',
        Cell: ({ row }: { row: { original: Testimonial } }) => (
          <input
            type="checkbox"
            checked={selected.includes(row.original.id)}
            onChange={(e) => {
              const checked = e.target.checked;
              const newSelected: string[] = checked
                ? [...selected, row.original.id]
                : selected.filter((id: string) => id !== row.original.id);
              onSelect(newSelected);
            }}
            className="form-checkbox"
          />
        ),
      },
      // ... rest of column definitions
    ],
    [selected, onSelect]
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable(
    {
      columns,
      data: testimonials,
    },
    useSortBy
  );

  return (
    <div className="rounded-md border">
      <table {...getTableProps()} className="w-full">
        <thead className="bg-gray-50">
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => {
                // Cast the column to our extended type with sorting properties
                const sortableColumn = column as unknown as SortableColumnInstance<Testimonial>;
                return (
                  <th
                    {...sortableColumn.getHeaderProps(sortableColumn.getSortByToggleProps())}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      {sortableColumn.render('Header')}
                      {sortableColumn.isSorted && (
                        <span className="flex items-center">
                          {sortableColumn.isSortedDesc ? (
                            <ArrowDownIcon className="w-4 h-4 ml-1" />
                          ) : (
                            <ArrowUpIcon className="w-4 h-4 ml-1" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()} className="divide-y">
          {rows.map((row) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} className="hover:bg-gray-50">
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()} className="px-4 py-3 text-sm">
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}