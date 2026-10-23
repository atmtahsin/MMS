/**
 * CSV reading and writing, plus support for the older CSV column names.
 */

/**
 * Old short column names -> current descriptive column names, per import type.
 * Spreadsheets made for earlier versions of this system (with columns like "cls" or "dob")
 * keep working: their headings are translated before the rows are sent to the server.
 */
export const LEGACY_CSV_COLUMN_NAMES = {
  students: {
    guardian: 'guardian_name',
    phone: 'guardian_phone',
    cls: 'class_name',
    relationship: 'guardian_relationship',
    dob: 'date_of_birth',
    father: 'father_name',
    mother: 'mother_name',
    father_job: 'father_occupation',
    mother_job: 'mother_occupation',
    email: 'guardian_email',
    blood: 'blood_group',
    prev_school: 'previous_school',
    admitted: 'admission_date',
    emergency: 'emergency_phone',
  },
  teachers: {
    role: 'job_title',
    qual: 'qualification',
    joined: 'joining_date',
    subjects: 'subjects_taught',
  },
  feeTypes: {
    type: 'fee_category',
    cls: 'class_name',
  },
};

/**
 * Reads CSV text that has a heading row. Supports "quoted, values" and doubled quotes ("").
 *
 * @param {string} csvText - The whole file as text.
 * @returns {Array<Record<string, string>>} One object per data row, keyed by the heading names.
 */
export function parseCsv(csvText) {
  const allRows = []; // every finished row (a list of cell texts)
  let currentRow = []; // the row being read
  let currentCell = ''; // the cell being read
  let isInsideQuotes = false;

  /** Finishes the current cell and adds it to the current row. */
  function finishCell() {
    currentRow.push(currentCell.trim());
    currentCell = '';
  }

  /** Finishes the current row; blank lines are ignored. */
  function finishRow() {
    finishCell();
    if (currentRow.some((cellText) => cellText)) allRows.push(currentRow);
    currentRow = [];
  }

  for (let position = 0; position < csvText.length; position++) {
    const character = csvText[position];

    if (isInsideQuotes) {
      if (character === '"' && csvText[position + 1] === '"') {
        currentCell += '"'; // a doubled quote inside quotes means one literal quote
        position++;
      } else if (character === '"') {
        isInsideQuotes = false;
      } else {
        currentCell += character;
      }
    } else if (character === '"') {
      isInsideQuotes = true;
    } else if (character === ',') {
      finishCell();
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && csvText[position + 1] === '\n') position++; // Windows line ending
      finishRow();
    } else {
      currentCell += character;
    }
  }
  finishRow(); // the last line may have no line break after it

  const [headingRow = [], ...dataRows] = allRows;
  return dataRows.map((cellTexts) =>
    Object.fromEntries(
      cellTexts.map((cellText, columnIndex) => [headingRow[columnIndex], cellText]),
    ),
  );
}

/**
 * Renames old-style headings of parsed CSV rows to the current column names.
 *
 * @param {Array<Record<string, string>>} rows - Rows from parseCsv.
 * @param {Record<string, string>} legacyNames - One entry of LEGACY_CSV_COLUMN_NAMES.
 * @returns {Array<Record<string, string>>} Rows using current column names. If a row already
 *   has the current name, that value wins over the old-style one.
 */
export function renameLegacyColumns(rows, legacyNames) {
  return rows.map((row) => {
    const renamedRow = {};
    for (const [columnName, value] of Object.entries(row)) {
      const currentName = legacyNames[columnName] ?? columnName;
      if (currentName in renamedRow && columnName !== currentName) continue;
      renamedRow[currentName] = value;
    }
    return renamedRow;
  });
}

/** Wraps a value in quotes for CSV output, doubling any quote inside it. */
export function toCsvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

/** Builds CSV text from a heading list and an array of rows (each row an array of values). */
export function buildCsv(headings, rows) {
  return [headings.join(','), ...rows.map((row) => row.map(toCsvCell).join(','))].join('\n');
}
