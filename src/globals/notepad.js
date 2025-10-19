// Ensure a global `notepad` exists before any screen imports run.
(() => {
  const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
  if (!g.notepad) {
    const stub = {
      setTitle: (t) => console.log('[Mock Notepad] setTitle:', t),
      addContent: (c) => console.log('[Mock Notepad] addContent:', c),
      getContent: () => '',
      clear: () => console.log('[Mock Notepad] clear'),
    };
    g.notepad = stub;
    if (typeof window !== 'undefined') window.notepad = g.notepad;
  }
})();
export {};
