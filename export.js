/**
 * SMG1 Closing Report — Export Module
 * Handles PDF and Excel export
 */

const SMG1Export = (() => {

  /**
   * Export to Excel using SheetJS-style CSV (compatible without library)
   */
  function toExcel() {
    const d = SMG1Storage.collect();

    const rows = [
      ['SMG1 CLOSING REPORT'],
      [''],
      ['DATA', d['meta-data'] || ''],
      ['TURNO', d['meta-turno'] || ''],
      ['RESPONSÁVEL', d['meta-responsavel'] || ''],
      [''],
      ['=== PERFORMANCE GERAL ==='],
      ['Fechamento FAG (%)', d['fag-pct'] || ''],
      ['OOT Ciclo (%)', d['oot-ciclo'] || ''],
      ['OOT Onda (%)', d['oot-onda'] || ''],
      ['OOT Ciclo YMS (%)', d['oot-ciclo-yms'] || ''],
      ['OOT Onda YMS (%)', d['oot-onda-yms'] || ''],
      [''],
      ['=== TOTAIS OPERACIONAIS ==='],
      ['Total Planejado', d['total-planejado'] || ''],
      ['Delay', d['delay-total'] || ''],
      ['Pendentes', d['pendentes-total'] || ''],
      ['Rotas Concluídas', calcRealizado()],
      [''],
      ['=== CARROS ATRASADOS POR ONDA ==='],
      ['Onda', 'Pendentes', 'Delay', 'OOT%', 'OOT YMS%'],
      ['1ª Onda', d['o1-pendentes']||'', d['o1-delay']||'', calcOOT('o1')||'', calcOOTYMS('o1')||''],
      ['2ª Onda', d['o2-pendentes']||'', d['o2-delay']||'', calcOOT('o2')||'', calcOOTYMS('o2')||''],
      ['3ª Onda', d['o3-pendentes']||'', d['o3-delay']||'', calcOOT('o3')||'', calcOOTYMS('o3')||''],
      ['4ª Onda', d['o4-pendentes']||'', d['o4-delay']||'', calcOOT('o4')||'', calcOOTYMS('o4')||''],
      [''],
      ['=== SACAS ==='],
      ['Total de Sacas', d['sacas-total'] || ''],
      ['Sacas Fechadas', d['sacas-fechadas'] || ''],
      ['Sacas para Auditar', d['sacas-auditar'] || ''],
      ['Sacas Pendentes', calcSacasPendentes()],
      [''],
      ['=== VOLUME ==='],
      ['Volume Total Processado', d['vol-total'] || ''],
      ['Backlog', d['vol-backlog'] || ''],
      ['Primeira Vez', d['vol-pv'] || ''],
      [''],
      ['=== VOLUMOSOS ==='],
      ['One Bipe', d['vol-onebipe'] || ''],
      ['Em Rota', d['vol-emrota'] || ''],
      [''],
      ['=== OBSERVAÇÕES ==='],
      [d['observacoes'] || ''],
    ];

    // Convert to CSV
    const csv = rows.map(r =>
      r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Add BOM for proper Excel UTF-8 encoding
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = (d['meta-data'] || new Date().toLocaleDateString('pt-BR')).replace(/\//g, '-');
    a.href = url;
    a.download = `SMG1_${d['meta-turno'] || 'turno'}_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    SMG1App.showToast('Excel exportado com sucesso!', 'check');
  }

  function calcRealizado() {
    const planejado = parseInt(document.querySelector('[data-field="total-planejado"]')?.value) || 0;
    const delay = parseInt(document.querySelector('[data-field="delay-total"]')?.value) || 0;
    const pendentes = parseInt(document.querySelector('[data-field="pendentes-total"]')?.value) || 0;
    return planejado - delay - pendentes;
  }

  function calcOOT(prefix) {
    const el = document.querySelector(`[data-oot="${prefix}"]`);
    return el ? el.textContent : '';
  }
  function calcOOTYMS(prefix) {
    const el = document.querySelector(`[data-ootyms="${prefix}"]`);
    return el ? el.textContent : '';
  }
  function calcSacasPendentes() {
    const el = document.querySelector('[data-calc="sacas-pendentes"]');
    return el ? el.textContent : '';
  }

  /**
   * Export to PDF using print stylesheet
   */
  function toPDF() {
    // Add print class to trigger print styles
    document.body.classList.add('printing');
    // Hide side panel for cleaner print
    const sidePanel = document.querySelector('.side-panel');
    if (sidePanel) sidePanel.style.display = 'none';
    const appBody = document.querySelector('.app-body');
    if (appBody) appBody.style.gridTemplateColumns = '1fr';

    window.print();

    setTimeout(() => {
      document.body.classList.remove('printing');
      if (sidePanel) sidePanel.style.display = '';
      if (appBody) appBody.style.gridTemplateColumns = '';
      SMG1App.showToast('PDF gerado!', 'printer');
    }, 500);
  }

  return { toExcel, toPDF };
})();
