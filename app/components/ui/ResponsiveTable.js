/**
 * A data table that becomes a list of stacked cards on phones (see .data-table in components.css).
 *
 * @param {object} props
 * @param {Array<{ heading: string, renderCell: (row: object) => import('react').ReactNode, isActionColumn?: boolean }>} props.columns
 *   One entry per column:
 *   - heading: the column title (also shown beside the value on phones; use '' for none)
 *   - renderCell: returns what to show in that column for one row
 *   - isActionColumn: true for the column that holds buttons (right-aligned, no label on phones)
 * @param {object[]} props.rows - The records to show. Each should have a unique `id`.
 * @param {string} props.emptyMessage - Shown instead of the table when there are no rows.
 */
export function ResponsiveTable({ columns, rows, emptyMessage }) {
  if (rows.length === 0) return <div className="empty-state">{emptyMessage}</div>;

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, columnIndex) => (
              <th key={columnIndex}>{column.heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id ?? rowIndex}>
              {columns.map((column, columnIndex) => (
                <td
                  key={columnIndex}
                  data-label={column.heading}
                  className={column.isActionColumn ? 'table-actions-cell' : undefined}
                >
                  {column.renderCell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
