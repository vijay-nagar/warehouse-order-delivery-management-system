import type { ReactNode } from "react";
import { EmptyState, StatusBadge } from "../feedback/AsyncStates";

export interface DataColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  isStatus?: boolean;
}

export function DataTable<T extends { id?: string | number }>({ columns, rows, emptyLabel }: {
  columns: DataColumn<T>[];
  rows: T[];
  emptyLabel: string;
}) {
  if (!rows.length) return <EmptyState label={emptyLabel} />;

  return <div className="module-table-wrapper"><table className="module-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id ?? index}>{columns.map((column) => <td key={column.key}>{column.isStatus ? <StatusBadge>{column.render(row)}</StatusBadge> : column.render(row)}</td>)}</tr>)}</tbody></table></div>;
}
