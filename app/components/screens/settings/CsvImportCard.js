'use client';

import { parseCsv, renameLegacyColumns } from '../../../helpers/csv';
import { readChosenTextFile } from '../../../helpers/files';
import { useAppContext } from '../../AppContext';

/**
 * A card with a file chooser that imports a CSV file (students, teachers or fee types).
 * The chosen file is read in the browser, its rows are sent to the server in one request,
 * and the server adds them all or none of them.
 *
 * @param {object} props
 * @param {string} props.title - The card heading, already translated.
 * @param {string} props.expectedColumnsHint - The column names the file should have, shown under the heading.
 * @param {string} props.importRoutePath - The API route that receives the rows, e.g. "students/import".
 * @param {Record<string, string>} props.legacyColumnNames - Old column names accepted for
 *   backwards compatibility (see LEGACY_CSV_COLUMN_NAMES in helpers/csv.js).
 */
export function CsvImportCard({ title, expectedColumnsHint, importRoutePath, legacyColumnNames }) {
  const { submitToServer } = useAppContext();

  function handleFileChosen(changeEvent) {
    readChosenTextFile(changeEvent, (csvText) => {
      const rows = renameLegacyColumns(parseCsv(csvText), legacyColumnNames);
      submitToServer(importRoutePath, { rows });
    });
  }

  return (
    <section className="card">
      <h3 className="card-title">{title}</h3>
      <p className="hint-text">{expectedColumnsHint}</p>
      <input type="file" accept=".csv" aria-label={title} onChange={handleFileChosen} />
    </section>
  );
}
