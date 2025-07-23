import React from 'react';
import '../styles/table.css';

function ChecklistTable({ data, checked, notes, columns, handleCheck, handleNoteChange }) {
  return (
    <div className="old-money-table-container">
      <table className="old-money-table">
        <thead>
          <tr>
            <th>S.No.</th>
            <th>Done</th>
            {columns.map(col => (
              <th key={col}>{col}</th>
            ))}
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className={checked[idx] ? 'row-checked' : ''}>
              <td className="align-center">{idx + 1}</td>
              <td className="align-center">
                <input
                  type="checkbox"
                  checked={checked[idx] || false}
                  onChange={() => handleCheck(idx)}
                />
              </td>
              {columns.map((col, i) => (
                <td key={i} style={col === 'URL' ? { wordBreak: 'break-word' } : {}}>
                  {col === 'URL' && row[col] ? (
                    <a href={row[col]} target="_blank" rel="noreferrer" className="nice-link">{row[col]}</a>
                  ) : row[col]}
                </td>
              ))}
              <td>
                <textarea
                  className="notes-textarea"
                  value={notes[idx] || ''}
                  onChange={(e) => handleNoteChange(idx, e.target.value)}
                  onInput={autoResize}
                  placeholder="Add note..."
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function autoResize(e) {
  e.target.style.height = 'auto';
  e.target.style.height = `${e.target.scrollHeight}px`;
}

export default ChecklistTable;
