/**
 * SMG1 Closing Report — Storage Module
 * Handles LocalStorage persistence for all form data
 */

const SMG1Storage = (() => {
  const KEY = 'smg1_report_v2';

  /**
   * Collect all input values from the form
   */
  function collect() {
    const data = {};
    document.querySelectorAll('[data-field]').forEach(el => {
      data[el.dataset.field] = el.value;
    });
    data._savedAt = new Date().toISOString();
    return data;
  }

  /**
   * Restore all input values into the form
   */
  function restore(data) {
    if (!data) return;
    Object.entries(data).forEach(([key, val]) => {
      const el = document.querySelector(`[data-field="${key}"]`);
      if (el) {
        el.value = val;
        // Trigger input event so charts/calculations update
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  /**
   * Save current state to LocalStorage
   */
  function save() {
    try {
      const data = collect();
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('SMG1: save failed', e);
      return false;
    }
  }

  /**
   * Load state from LocalStorage
   */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('SMG1: load failed', e);
      return null;
    }
  }

  /**
   * Clear LocalStorage entry
   */
  function clear() {
    localStorage.removeItem(KEY);
  }

  /**
   * Export current data as downloadable JSON file
   */
  function exportJSON() {
    const data = collect();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = (data['meta-data'] || new Date().toLocaleDateString('pt-BR')).replace(/\//g, '-');
    const turno = data['meta-turno'] || 'turno';
    a.href = url;
    a.download = `SMG1_${turno}_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import JSON file and restore form
   */
  function importJSON(file, onDone) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        restore(data);
        save();
        if (onDone) onDone(true);
      } catch (err) {
        if (onDone) onDone(false);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Reset all fields to empty
   */
  function resetAll() {
    document.querySelectorAll('[data-field]').forEach(el => {
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    // Reset date to today
    const todayEl = document.querySelector('[data-field="meta-data"]');
    if (todayEl) {
      todayEl.value = new Date().toISOString().split('T')[0];
      todayEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    clear();
  }

  // Auto-save every 8 seconds and on input changes
  let saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      save();
      updateSaveIndicator();
    }, 1500);
  }

  function updateSaveIndicator() {
    const el = document.getElementById('save-time');
    if (el) el.textContent = 'Salvo ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function init() {
    document.addEventListener('input', scheduleSave);
    // Restore on load
    const saved = load();
    if (saved) {
      setTimeout(() => {
        restore(saved);
        updateSaveIndicator();
      }, 100);
    } else {
      // Default date
      const todayEl = document.querySelector('[data-field="meta-data"]');
      if (todayEl) todayEl.value = new Date().toISOString().split('T')[0];
    }
  }

  return { init, save, load, clear, collect, restore, exportJSON, importJSON, resetAll, scheduleSave };
})();
