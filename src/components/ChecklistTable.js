import React from "react";
import "../styles/table.css";

function ChecklistTable({
  data,
  checked,
  notes,
  columns,
  handleCheck,
  handleNoteChange,
}) {
  // Show "No data" for empty sets
  if (!data.length) {
    return (
      <div className="old-money-table-container" style={{
        textAlign: 'center', color: '#8b7e67', padding: "2em"
      }}>
        <b>No data found.</b>
      </div>
    );
  }
  return (
    <div className="old-money-table-container">
      <table className="old-money-table">
        <thead>
          <tr>
            <th>Done</th>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={checked[i] ? "row-checked" : ""}>
              <td className="align-center">
                <input
                  type="checkbox"
                  checked={checked[i] || false}
                  onChange={() => handleCheck(i)}
                />
              </td>
              {columns.map((col, idx) => (
                <td key={col + idx} style={col === "URL" ? { minWidth: "220px", wordBreak: "break-all" } : {}}>
                  {col === "URL" && row[col] ? (
                    <a
                      href={row[col]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nice-link"
                    >
                      {row[col]}
                    </a>
                  ) : (
                    row[col]
                  )}
                </td>
              ))}
              <td>
                <textarea
                  className="notes-textarea"
                  value={notes[i] || ""}
                  placeholder="Add note..."
                  rows={1}
                  onChange={e => handleNoteChange(i, e.target.value)}
                  onInput={autoResizeTextArea}
                  spellCheck={true}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Automatically expand textarea height on input
function autoResizeTextArea(e) {
  const textarea = e.target;
  textarea.style.height = "auto";
  textarea.style.height = textarea.scrollHeight + "px";
}

export default ChecklistTable;
