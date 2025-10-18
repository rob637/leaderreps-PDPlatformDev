import React, { useState } from 'react';

// src/components/screens/DailyPractice.jsx
// Minimal scaffold so App.jsx can import it without build errors.
// Accepts initialGoal and initialTier (used by App.jsx).
export default function DailyPracticeScreen({ initialGoal = '', initialTier = '' }) {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState('');

  const addEntry = () => {
    const t = text.trim();
    if (!t) return;
    setEntries(e => [{ id: Math.random().toString(36).slice(2), text: t, ts: new Date().toISOString() }, ...e]);
    setText('');
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Daily Practice</h1>
      {(initialGoal || initialTier) && (
        <p className="text-sm text-gray-600">
          Starting with goal <span className="font-medium">{initialGoal || '—'}</span> at tier <span className="font-medium">{initialTier || '—'}</span>
        </p>
      )}
      <div className="flex gap-2">
        <input
          className="border rounded-md px-3 py-2 flex-1"
          placeholder="What did you practice today?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') addEntry(); }}
        />
        <button className="border rounded-md px-3 py-2" onClick={addEntry}>Add</button>
      </div>
      <ul className="space-y-2">
        {entries.map(e => (
          <li key={e.id} className="border rounded-md p-3">
            <div className="text-sm">{e.text}</div>
            <div className="text-xs text-gray-500">{new Date(e.ts).toLocaleString()}</div>
          </li>
        ))}
        {!entries.length && <li className="text-sm text-gray-500">No entries yet.</li>}
      </ul>
    </div>
  );
}
