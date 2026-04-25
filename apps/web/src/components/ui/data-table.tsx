import type { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  title: string;
  columns: readonly Column<T>[];
  rows: T[];
  emptyMessage?: string;
};

export function DataTable<T>({
  title,
  columns,
  rows,
  emptyMessage = 'No data available.'
}: DataTableProps<T>) {
  return (
    <section className="card table-card">
      <header className="card-header">
        <h3>{title}</h3>
      </header>
      {rows.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.title}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
