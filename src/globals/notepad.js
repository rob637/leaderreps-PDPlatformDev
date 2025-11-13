/* Global Notepad (safe side-effect module)
   - Creates window.notepad/globalThis.notepad if absent
   - No exports; pure side-effect for early import in main.jsx
*/
(function initNotepadGlobal(){
  try {
    var root = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
    if (root.notepad && typeof root.notepad.addContent === 'function') return;

    var subs = new Set();
    var state = { title: 'Notepad', lines: [] };

    const snapshot = () => {
      return { title: state.title, lines: state.lines.slice() };
    }
    
    const notify = () => {
      subs.forEach(function(fn){
        try { fn(snapshot()); } catch (e) { /* ignore subscriber errors */ }
      });
    }

    var api = {
      setTitle: function(t){
        state.title = String(t == null ? '' : t);
        notify();
        return state.title;
      },
      addContent: function(line){
        state.lines.push({ ts: Date.now(), text: String(line == null ? '' : line) });
        notify();
        return state.lines.length;
      },
      get: function(){ return snapshot(); },
      clear: function(){
        state.lines.length = 0;
        notify();
      },
      subscribe: function(fn){
        if (typeof fn !== 'function') return function(){};
        subs.add(fn);
        return function(){ subs.delete(fn); };
      }
    };

    root.notepad = api;
    // mirror to globalThis as well (in case window is shadowed)
    try { if (typeof globalThis !== 'undefined') globalThis.notepad = api; } catch (e) { /* ignore */ }
  } catch (e) {
    // If anything unexpected happens, do not block app boot
  }
})();
