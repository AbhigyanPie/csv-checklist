import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ChecklistTable from './components/ChecklistTable';

const LOCALSTORAGE_KEY = 'leetcode_csv_state';
const REMOVE_COLUMNS = ['Acceptance %', 'Frequency %'];
const DIFFICULTY_ORDER = { Easy: 1, Medium: 2, Hard: 3 };

function App() {
  const [data, setData] = useState([]);
  const [checked, setChecked] = useState({});
  const [notes, setNotes] = useState({});
  const [columns, setColumns] = useState([]);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  // Indicates whether upload is allowed
  const isUploadDisabled = data.length > 0;

  // Load from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY));
    if (saved) {
      setData(saved.data || []);
      setChecked(saved.checked || {});
      setNotes(saved.notes || {});
      setColumns(saved.columns || []);
      setSortDir(saved.sortDir || 'asc');
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      LOCALSTORAGE_KEY,
      JSON.stringify({ data, checked, columns, notes, sortDir })
    );
  }, [data, checked, columns, notes, sortDir]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || isUploadDisabled) return;

    let newRows = [];
    let detectedColumns = new Set();
    let parsedFiles = 0;

    files.forEach(file => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const allCols = Object.keys(results.data[0] || {});
          const filteredCols = allCols.filter(col => !REMOVE_COLUMNS.includes(col));
          results.data.forEach(row => {
            const cleanRow = {};
            filteredCols.forEach(col => {
              cleanRow[col] = row[col];
              detectedColumns.add(col);
            });
            newRows.push(cleanRow);
          });

          parsedFiles++;
          if (parsedFiles === files.length) {
            const newUniqueRows = deduplicateByTitleDifficulty(newRows, data);
            const mergedData = [...data, ...newUniqueRows];
            const finalColumns = Array.from(new Set([...columns, ...detectedColumns]));

            const newChecked = { ...checked };
            const newNotes = { ...notes };
            const offset = data.length;

            newUniqueRows.forEach((_, idx) => {
              const id = offset + idx;
              newChecked[id] = false;
              newNotes[id] = '';
            });

            setData(mergedData);
            setColumns(finalColumns);
            setChecked(newChecked);
            setNotes(newNotes);
          }
        }
      });
    });
  };

  const deduplicateByTitleDifficulty = (incomingRows, existingRows) => {
    const existingKeys = new Set(
      existingRows.map(row => `${(row.Title || '').trim().toLowerCase()}::${(row.Difficulty || '').trim().toLowerCase()}`)
    );

    return incomingRows.filter(row => {
      const key = `${(row.Title || '').trim().toLowerCase()}::${(row.Difficulty || '').trim().toLowerCase()}`;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        return true;
      }
      return false;
    });
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to remove all uploaded CSV data and checklist progress?')) {
      localStorage.removeItem(LOCALSTORAGE_KEY);
      setData([]);
      setChecked({});
      setNotes({});
      setColumns([]);
      setSearch('');
      setSortDir('asc');
    }
  };

  const getSortedData = (rows) => {
    if (!columns.includes('Difficulty') || sortDir === 'none') return rows;
    return [...rows].sort((a, b) => {
      const d1 = DIFFICULTY_ORDER[a.Difficulty] || 4;
      const d2 = DIFFICULTY_ORDER[b.Difficulty] || 4;
      return sortDir === 'asc' ? d1 - d2 : d2 - d1;
    });
  };

  const handleSortDifficulty = () => {
    setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc');
  };

  const getFilteredData = (rows) => {
    if (!search.trim()) return rows;
    const normalized = s => (s || '').toLowerCase();
    return rows.filter((row, i) =>
      columns.some(col => normalized(row[col]).includes(normalized(search))) ||
      normalized(notes[i]).includes(normalized(search))
    );
  };

  const sorted = getSortedData(data);
  const filtered = getFilteredData(sorted);

  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#fffaf0', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ fontFamily: 'Didot', fontSize: '2rem', color: '#3f372f' }}>
        LeetCode Checklist
      </h1>

      <div style={{ display: 'flex', gap: '1em', flexWrap: 'wrap', marginBottom: '1.2em' }}>
        <input
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileUpload}
          disabled={isUploadDisabled}
          style={{ fontSize: '1rem', fontFamily: 'inherit' }}
        />
        <input
          className="search-input"
          type="text"
          placeholder="Search problems or notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="sort-difficulty-btn"
          onClick={handleSortDifficulty}
          disabled={!columns.includes('Difficulty')}
        >
          Sort: Difficulty {sortDir === 'none' ? '' : sortDir === 'asc' ? '↑' : '↓'}
        </button>
        <button
          className="delete-all-btn"
          onClick={handleDeleteAll}
          style={{ marginLeft: 'auto', background: '#fff1e0', border: '1px solid #bfa87f' }}
        >
          🗑️ Remove All CSVs
        </button>
      </div>

      <ChecklistTable
        data={filtered}
        checked={checked}
        notes={notes}
        columns={columns}
        handleCheck={idx => setChecked(prev => ({ ...prev, [idx]: !prev[idx] }))}
        handleNoteChange={(idx, val) => setNotes(prev => ({ ...prev, [idx]: val }))}
      />
    </div>
  );
}

export default App;
