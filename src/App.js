import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import ChecklistTable from './components/ChecklistTable';

const LOCALSTORAGE_KEY = 'leetcode_csv_data_v_multi';
const REMOVE_COLUMNS = ['Acceptance %', 'Frequency %'];
const DIFFICULTY_ORDER = { Easy: 1, Medium: 2, Hard: 3 };

function App() {
  const [data, setData] = useState([]);
  const [checked, setChecked] = useState({});
  const [notes, setNotes] = useState({});
  const [columns, setColumns] = useState([]);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setData(parsed.data || []);
      setChecked(parsed.checked || {});
      setNotes(parsed.notes || {});
      setColumns(parsed.columns || []);
      setSortDir(parsed.sortDir || 'asc');
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (data.length) {
      localStorage.setItem(
        LOCALSTORAGE_KEY,
        JSON.stringify({ data, checked, columns, notes, sortDir })
      );
    }
  }, [data, checked, columns, notes, sortDir]);

  // Helper: Remove duplicates by Title, keep the first occurrence
  function dedupeByTitle(rows) {
    const seen = new Set();
    const result = [];
    for (const row of rows) {
      const title = row.Title ? row.Title.trim().toLowerCase() : '';
      if (!seen.has(title) && title) {
        seen.add(title);
        result.push(row);
      }
    }
    return result;
  }

  // Multi-file upload & parse, then merge and deduplicate by Title
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    let mergedRows = [];
    let detectedColumns = new Set();
    let parsedFiles = 0;

    files.forEach((file) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Remove unwanted columns
          const allCols = Object.keys(results.data[0] || {});
          const filteredCols = allCols.filter(col => !REMOVE_COLUMNS.includes(col));
          results.data.forEach(row => {
            const filteredRow = {};
            filteredCols.forEach(col => {
              filteredRow[col] = row[col];
              detectedColumns.add(col);
            });
            mergedRows.push(filteredRow);
          });
          parsedFiles++;
          if (parsedFiles === files.length) {
            // Merge, dedupe, preserve order
            mergedRows = dedupeByTitle(mergedRows);
            // Use Array.from to preserve order in Set
            const columnsArr = Array.from(detectedColumns);
            setData(mergedRows);
            setColumns(columnsArr);

            // Reset checked and notes for new data
            const initialChecked = {};
            const initialNotes = {};
            mergedRows.forEach((_, i) => {
              initialChecked[i] = false;
              initialNotes[i] = '';
            });
            setChecked(initialChecked);
            setNotes(initialNotes);
            setSortDir('asc');
            setSearch('');
          }
        }
      });
    });
  };

  // Sorting, searching, and the rest as previously described...
  function getSortedData(rows, sortDir) {
    if (!columns.includes('Difficulty') || sortDir === 'none') return rows;
    return [...rows].sort((a, b) => {
      const da = DIFFICULTY_ORDER[a.Difficulty] || 4;
      const db = DIFFICULTY_ORDER[b.Difficulty] || 4;
      if (da === db) return 0;
      if (sortDir === 'asc') return da - db;
      return db - da;
    });
  }
  function handleSortDifficulty() {
    setSortDir(dir => dir === 'asc' ? 'desc' : dir === 'desc' ? 'none' : 'asc');
  }
  function getFilteredData(rows) {
    if (!search.trim()) return rows;
    const lc = s => (s || '').toString().toLowerCase();
    return rows.filter((row, i) =>
      columns.some(col => lc(row[col]).includes(lc(search))) ||
      lc(notes[i]).includes(lc(search))
    );
  }
  const sorted = getSortedData(data, sortDir);
  const filtered = getFilteredData(sorted);

  const handleCheck = idx => setChecked(prev => ({ ...prev, [idx]: !prev[idx] }));
  const handleNoteChange = (idx, val) => setNotes(prev => ({ ...prev, [idx]: val }));

  return (
    <div style={{
      minHeight: '100vh', background: '#fffaf0', fontFamily: 'Georgia,serif', padding: '2rem'
    }}>
      <h1 style={{
        fontFamily: 'Didot,serif', color: '#4e4327', fontWeight: 700,
        letterSpacing: '0.7px', marginBottom: '1.6rem'
      }}>
        LeetCode Checklist
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.3em', marginBottom: '1.4em', flexWrap: 'wrap' }}>
        <input
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileUpload}
          style={{
            fontFamily: 'inherit',
            fontSize: '1em',
            color: '#6d583d',
            border: 'none',
            background: 'transparent'
          }}
        />
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by title, id, URL, note..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="sort-difficulty-btn"
          onClick={handleSortDifficulty}
          style={{ marginLeft: 'auto', minWidth: 170 }}
          disabled={!columns.includes('Difficulty')}
        >
          Sort: Difficulty {sortDir === 'none' ?
            '' : sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>
      <ChecklistTable
        data={filtered}
        checked={checked}
        notes={notes}
        columns={columns}
        handleCheck={handleCheck}
        handleNoteChange={handleNoteChange}
      />
    </div>
  );
}
export default App;