/**
 * SMG1 Closing Report — Main App Module
 * Real-time calculations, charts, and WhatsApp preview
 */

const SMG1App = (() => {

  // ── Chart instances ──────────────────────────────────────────
  let chartFAG, chartSacas, chartOOT, chartDelay, chartVol, chartVol2;

  // ── Colors ──────────────────────────────────────────────────
  const C = {
    green:  '#00A650',
    yellow: '#E6CF00',
    red:    '#E02020',
    blue:   '#3D4DB7',
    orange: '#FF7733',
    gray:   '#CDD2DD',
    greenSoft: 'rgba(0,166,80,0.15)',
    redSoft:   'rgba(224,32,32,0.15)',
    blueSoft:  'rgba(61,77,183,0.15)',
  };

  // ── Helper: parse number ─────────────────────────────────────
  const n = id => parseFloat(document.querySelector(`[data-field="${id}"]`)?.value) || 0;
  const pct = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : '0.0';
  const pctNum = (a, b) => b > 0 ? (a / b) * 100 : 0;

  // ── Status color from percentage ─────────────────────────────
  function statusColor(val, goodAbove, warnAbove) {
    if (val >= goodAbove) return 'green';
    if (val >= warnAbove) return 'yellow';
    return 'red';
  }

  // ── Update KPI card ──────────────────────────────────────────
  function setKPI(id, value, status, badge, meta) {
    const card = document.getElementById(id);
    if (!card) return;
    card.className = `kpi-card status-${status || 'gray'}`;
    const valEl = card.querySelector('.kpi-value');
    if (valEl) valEl.textContent = value;
    const badgeEl = card.querySelector('.kpi-badge');
    if (badgeEl && badge !== undefined) {
      badgeEl.className = `kpi-badge badge-${status || 'gray'}`;
      badgeEl.textContent = badge;
    }
    const metaEl = card.querySelector('.kpi-meta');
    if (metaEl && meta !== undefined) metaEl.textContent = meta;
  }

  // ── Performance Geral ─────────────────────────────────────────
  function calcPerformance() {
    const fag = parseFloat(document.querySelector('[data-field="fag-pct"]')?.value) || 0;
    const ootC = parseFloat(document.querySelector('[data-field="oot-ciclo"]')?.value) || 0;
    const ootO = parseFloat(document.querySelector('[data-field="oot-onda"]')?.value) || 0;
    const ootCY = parseFloat(document.querySelector('[data-field="oot-ciclo-yms"]')?.value) || 0;
    const ootOY = parseFloat(document.querySelector('[data-field="oot-onda-yms"]')?.value) || 0;

    // FAG card
    const fagStatus = statusColor(fag, 90, 75);
    setKPI('kpi-fag', fag.toFixed(2) + '%', fagStatus, fagStatus === 'green' ? '✓ Meta' : fagStatus === 'yellow' ? '⚠ Atenção' : '✗ Abaixo');

    // OOT Ciclo
    const ootCStatus = statusColor(ootC, 95, 85);
    setKPI('kpi-oot-ciclo', ootC.toFixed(1) + '%', ootCStatus);

    // OOT Onda
    const ootOStatus = statusColor(ootO, 95, 85);
    setKPI('kpi-oot-onda', ootO.toFixed(1) + '%', ootOStatus);

    // OOT Ciclo YMS
    const ootCYStatus = statusColor(ootCY, 90, 70);
    setKPI('kpi-oot-ciclo-yms', ootCY.toFixed(1) + '%', ootCYStatus);

    // OOT Onda YMS
    const ootOYStatus = statusColor(ootOY, 90, 70);
    setKPI('kpi-oot-onda-yms', ootOY.toFixed(1) + '%', ootOYStatus);

    // Update donut FAG chart
    updateChartFAG(fag);
  }

  // ── Totais Operacionais ───────────────────────────────────────
  function calcTotais() {
    const planejado = n('total-planejado');
    const delay = n('delay-total');
    const pendentes = n('pendentes-total');
    const realizado = Math.max(0, planejado - delay - pendentes);
    const pctReal = pctNum(realizado, planejado);

    // Update display
    setText('calc-realizado', realizado);
    setText('calc-realizado-pct', pct(realizado, planejado) + '%');
    setText('calc-pendentes-pct', pct(pendentes, planejado) + '%');
    setText('calc-delay-pct', pct(delay, planejado) + '%');

    // Progress bars
    setProgress('prog-realizado', pctNum(realizado, planejado), 'green');
    setProgress('prog-delay', pctNum(delay, planejado), 'red');
    setProgress('prog-pendentes', pctNum(pendentes, planejado), 'yellow');

    // KPI summary cards
    const status = statusColor(pctReal, 90, 75);
    setKPI('kpi-total', planejado, 'gray', null, 'Total planejado');
    setKPI('kpi-realizado', realizado, status, pct(realizado, planejado) + '%', `de ${planejado} rotas`);
    setKPI('kpi-delay', delay, delay > 0 ? 'red' : 'green', pct(delay, planejado) + '%');
    setKPI('kpi-pendentes', pendentes, pendentes > 0 ? 'yellow' : 'green', pendentes > 0 ? 'Pendente' : 'OK');
  }

  // ── Volume ────────────────────────────────────────────────────
  function calcVolume() {
    const total = n('vol-total');
    const backlog = n('vol-backlog');
    const pv = n('vol-pv');

    const pctBacklog = pct(backlog, total);
    const pctPV = pct(pv, total);

    setText('calc-vol-backlog-pct', pctBacklog + '%');
    setText('calc-vol-pv-pct', pctPV + '%');

    setProgress('prog-vol-pv', pctNum(pv, total), 'green');
    setProgress('prog-vol-backlog', pctNum(backlog, total), 'red');

    updateChartVol(total, backlog, pv);
  }

  // ── Volumosos ─────────────────────────────────────────────────
  function calcVolumosos() {
    const oneBipe = n('vol-onebipe');
    const emRota = n('vol-emrota');
    const total = oneBipe + emRota;
    const pctRota = pctNum(emRota, total);

    setText('calc-vol-total-vol', total);
    setText('calc-vol-emrota-pct', pct(emRota, total) + '%');

    setProgress('prog-vol-vol', pctRota, 'blue');
    updateChartVolumosos(oneBipe, emRota);
  }

  // ── Carros Atrasados (Ondas) ───────────────────────────────────
  function calcOndas() {
    const ondas = [
      { prefix: 'o1', label: '1ª Onda' },
      { prefix: 'o2', label: '2ª Onda' },
      { prefix: 'o3', label: '3ª Onda' },
      { prefix: 'o4', label: '4ª Onda' },
    ];

    let totDelay = 0, totPend = 0, totTotal = 0;

    ondas.forEach(({ prefix }) => {
      const delay = n(`${prefix}-delay`);
      const pendentes = n(`${prefix}-pendentes`);
      const total = delay + pendentes;

      // OOT = (1 - delay/total) * 100 if total > 0
      const oot = total > 0 ? Math.max(0, ((1 - delay / total) * 100)) : 0;
      const ootYms = n(`${prefix}-oot-yms`);

      // Update displayed calculated cells
      const ootEl = document.querySelector(`[data-oot="${prefix}"]`);
      if (ootEl) {
        ootEl.textContent = total > 0 ? oot.toFixed(1) + '%' : '—';
        ootEl.className = 'oot-value ' + (oot >= 90 ? 'text-success' : oot >= 75 ? 'text-warning' : 'text-danger');
      }

      const ootYmsEl = document.querySelector(`[data-ootyms="${prefix}"]`);
      if (ootYmsEl) {
        const ootYmsIn = n(`${prefix}-oot-yms`);
        ootYmsEl.textContent = ootYmsIn > 0 ? ootYmsIn.toFixed(1) + '%' : '—';
        const ootYmsStatus = ootYmsIn >= 90 ? 'text-success' : ootYmsIn >= 70 ? 'text-warning' : 'text-danger';
        ootYmsEl.className = 'oot-value ' + ootYmsStatus;
      }

      // Badge color
      const row = document.querySelector(`[data-onda-row="${prefix}"]`);
      if (row) {
        const badge = row.querySelector('.onda-badge');
        if (badge) {
          if (delay === 0 && pendentes === 0) {
            badge.className = 'onda-badge badge-green';
            badge.textContent = '✓ Ok';
          } else if (pendentes > 0) {
            badge.className = 'onda-badge badge-red';
            badge.textContent = `${pendentes} pend.`;
          } else {
            badge.className = 'onda-badge badge-yellow';
            badge.textContent = `${delay} delay`;
          }
        }
      }

      totDelay += delay;
      totPend += pendentes;
      totTotal += total;
    });

    // Summary chips
    setText('onda-sum-total', totTotal);
    setText('onda-sum-delay', totDelay);
    setText('onda-sum-pend', totPend);

    // Charts
    updateChartOOT();
    updateChartDelay();
  }

  // ── Sacas ─────────────────────────────────────────────────────
  function calcSacas() {
    const total = n('sacas-total');
    const fechadas = n('sacas-fechadas');
    const auditar = n('sacas-auditar');
    const pendentes = Math.max(0, total - fechadas - auditar);

    const pctFechadas = pctNum(fechadas, total);
    const pctAuditar = pctNum(auditar, total);

    setText('calc-sacas-pct', pct(fechadas, total) + '%');
    setText('calc-sacas-pendentes', pendentes);
    setText('calc-sacas-auditar-pct', pct(auditar, total) + '%');

    updateChartSacas(fechadas, auditar, pendentes);

    setProgress('prog-sacas', pctFechadas, 'green');
  }

  // ── WhatsApp Preview ──────────────────────────────────────────
  function generateWA() {
    const get = field => document.querySelector(`[data-field="${field}"]`)?.value || '';
    const getN = field => parseFloat(document.querySelector(`[data-field="${field}"]`)?.value) || 0;
    const getEl = sel => document.querySelector(sel)?.textContent || '—';

    const turno = get('meta-turno') || 'AM1';
    const data = get('meta-data');
    const dataFmt = data ? new Date(data + 'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

    const total = getN('total-planejado');
    const delay = getN('delay-total');
    const pendentes = getN('pendentes-total');
    const realizado = Math.max(0, total - delay - pendentes);
    const pctRealizadoWA = pct(realizado, total);

    // Ondas
    const ondaLines = ['o1', 'o2', 'o3', 'o4'].map((p, i) => {
      const ond = i + 1;
      const pnd = getN(`${p}-pendentes`);
      const dly = getN(`${p}-delay`);
      const oot = document.querySelector(`[data-oot="${p}"]`)?.textContent || '—';
      const ootYms = getN(`${p}-oot-yms`);
      return `• ${ond}ª Onda: ${pnd} pendente${pnd !== 1 ? 's' : ''} | ${dly} delay | OOT ${oot} | OOT YMS ${ootYms > 0 ? ootYms.toFixed(1) + '%' : '—'}`;
    }).join('\n');

    const sacasTotal = getN('sacas-total');
    const sacasFech = getN('sacas-fechadas');
    const sacasAud = getN('sacas-auditar');
    const sacasPend = Math.max(0, sacasTotal - sacasFech - sacasAud);
    const pctSacas = pct(sacasFech, sacasTotal);

    const obs = get('observacoes');

    const msg = `📊 *Relatório ${turno} — ${dataFmt}*

📈 *Performance Geral*
• Fechamento FAG ${turno}: ${get('fag-pct') || '—'}%
• OOT Ciclo: ${get('oot-ciclo') || '—'}%
• OOT Onda: ${get('oot-onda') || '—'}%
• OOT Ciclo YMS: ${get('oot-ciclo-yms') || '—'}%
• OOT Onda YMS: ${get('oot-onda-yms') || '—'}%

📌 *Totais Operacionais*
• Total planejado: ${total || '—'} rotas
• Realizadas: ${realizado} (${pctRealizadoWA}%)
• Delay: ${delay} rotas
• Pendentes: ${pendentes} rotas

🚚 *Carros Atrasados*
${ondaLines}

🎒 *Sacas finalizadas*
• Total de sacas: ${sacasTotal || '—'}
• Sacas já fechadas: ${sacasFech} (${pctSacas}%)
• Sacas para auditar: ${sacasAud}
• Sacas pendentes: ${sacasPend}

📦 *Volume Processado*
• Volume total processado: ${getN('vol-total').toLocaleString('pt-BR') || '—'}
• Backlog: ${getN('vol-backlog').toLocaleString('pt-BR') || '—'}
• Primeira vez: ${getN('vol-pv').toLocaleString('pt-BR') || '—'}

📦 *Volumosos*
• One Bipe: ${getN('vol-onebipe').toLocaleString('pt-BR') || '—'}
• Em Rota: ${getN('vol-emrota').toLocaleString('pt-BR') || '—'}${obs ? `\n\n📝 *Observações*\n${obs}` : ''}`;

    const waEl = document.getElementById('wa-preview');
    if (waEl) waEl.textContent = msg;

    return msg;
  }

  // ── Helpers ───────────────────────────────────────────────────
  function setText(id, val) {
    const el = document.getElementById(id) || document.querySelector(`[data-calc="${id}"]`);
    if (el) el.textContent = val;
  }

  function setProgress(id, pct, color) {
    const el = document.getElementById(id);
    if (!el) return;
    const clamped = Math.min(100, Math.max(0, pct));
    el.style.width = clamped + '%';
    el.className = `progress-bar-fill fill-${color}`;
  }

  // ── Chart: FAG Donut ──────────────────────────────────────────
  function initChartFAG() {
    const ctx = document.getElementById('chart-fag')?.getContext('2d');
    if (!ctx) return;
    chartFAG = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [0, 100],
          backgroundColor: [C.green, C.gray],
          borderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        cutout: '72%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true, duration: 600 },
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  function updateChartFAG(fag) {
    if (!chartFAG) return;
    const val = Math.min(100, Math.max(0, fag));
    const color = val >= 90 ? C.green : val >= 75 ? C.yellow : C.red;
    chartFAG.data.datasets[0].data = [val, 100 - val];
    chartFAG.data.datasets[0].backgroundColor = [color, getComputedStyle(document.documentElement).getPropertyValue('--gray-200').trim() || C.gray];
    chartFAG.update('none');
    const center = document.getElementById('fag-center-value');
    if (center) center.textContent = fag.toFixed(1) + '%';
  }

  // ── Chart: Sacas Donut ────────────────────────────────────────
  function initChartSacas() {
    const ctx = document.getElementById('chart-sacas')?.getContext('2d');
    if (!ctx) return;
    chartSacas = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Fechadas', 'Auditar', 'Pendentes'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [C.green, C.orange, C.red],
          borderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        cutout: '68%',
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } }
        },
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  function updateChartSacas(fechadas, auditar, pendentes) {
    if (!chartSacas) return;
    chartSacas.data.datasets[0].data = [fechadas, auditar, pendentes];
    chartSacas.update('none');
  }

  // ── Chart: OOT por Onda ───────────────────────────────────────
  function initChartOOT() {
    const ctx = document.getElementById('chart-oot')?.getContext('2d');
    if (!ctx) return;
    chartOOT = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1ª Onda', '2ª Onda', '3ª Onda', '4ª Onda'],
        datasets: [
          {
            label: 'OOT %',
            data: [0, 0, 0, 0],
            backgroundColor: C.blue,
            borderRadius: 6,
            barPercentage: 0.55,
          },
          {
            label: 'OOT YMS %',
            data: [0, 0, 0, 0],
            backgroundColor: C.yellow,
            borderRadius: 6,
            barPercentage: 0.55,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%` } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            min: 0, max: 100,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { callback: v => v + '%', font: { size: 10 } }
          }
        }
      }
    });
  }

  function updateChartOOT() {
    if (!chartOOT) return;
    const prefixes = ['o1', 'o2', 'o3', 'o4'];
    const ootData = prefixes.map(p => {
      const el = document.querySelector(`[data-oot="${p}"]`);
      return el ? parseFloat(el.textContent) || 0 : 0;
    });
    const ootYmsData = prefixes.map(p => n(`${p}-oot-yms`));

    chartOOT.data.datasets[0].data = ootData;
    chartOOT.data.datasets[1].data = ootYmsData;
    chartOOT.update('none');
  }

  // ── Chart: Delay por Onda ─────────────────────────────────────
  function initChartDelay() {
    const ctx = document.getElementById('chart-delay')?.getContext('2d');
    if (!ctx) return;
    chartDelay = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['1ª Onda', '2ª Onda', '3ª Onda', '4ª Onda'],
        datasets: [
          {
            label: 'Delay',
            data: [0, 0, 0, 0],
            backgroundColor: C.red,
            borderRadius: 6,
            barPercentage: 0.5,
          },
          {
            label: 'Pendentes',
            data: [0, 0, 0, 0],
            backgroundColor: C.orange,
            borderRadius: 6,
            barPercentage: 0.5,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  function updateChartDelay() {
    if (!chartDelay) return;
    const prefixes = ['o1', 'o2', 'o3', 'o4'];
    chartDelay.data.datasets[0].data = prefixes.map(p => n(`${p}-delay`));
    chartDelay.data.datasets[1].data = prefixes.map(p => n(`${p}-pendentes`));
    chartDelay.update('none');
  }

  // ── Chart: Volume Pizza ───────────────────────────────────────
  function initChartVol() {
    const ctx = document.getElementById('chart-vol')?.getContext('2d');
    if (!ctx) return;
    chartVol = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Primeira Vez', 'Backlog', 'Restante'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [C.green, C.red, C.gray],
          borderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        cutout: '60%',
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
        },
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  function updateChartVol(total, backlog, pv) {
    if (!chartVol) return;
    const resto = Math.max(0, total - backlog - pv);
    chartVol.data.datasets[0].data = [pv, backlog, resto];
    chartVol.update('none');
  }

  // ── Chart: Volumosos ──────────────────────────────────────────
  function initChartVolumosos() {
    const ctx = document.getElementById('chart-vol2')?.getContext('2d');
    if (!ctx) return;
    chartVol2 = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['One Bipe', 'Em Rota'],
        datasets: [{
          data: [0, 0],
          backgroundColor: [C.blue, C.orange],
          borderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        cutout: '65%',
        plugins: {
          legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 8 } },
        },
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  function updateChartVolumosos(oneBipe, emRota) {
    if (!chartVol2) return;
    chartVol2.data.datasets[0].data = [oneBipe, emRota];
    chartVol2.update('none');
  }

  // ── Master recalc ─────────────────────────────────────────────
  function recalcAll() {
    calcPerformance();
    calcTotais();
    calcVolume();
    calcVolumosos();
    calcOndas();
    calcSacas();
    generateWA();
  }

  // ── Toast notification ────────────────────────────────────────
  function showToast(msg, icon = 'check') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const icons = {
      check:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
      copy:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
      printer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
      warn:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    };
    toast.innerHTML = (icons[icon] || icons.check) + msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // ── Dark mode ─────────────────────────────────────────────────
  function initDarkMode() {
    const btn = document.getElementById('btn-dark');
    const stored = localStorage.getItem('smg1_theme');
    if (stored === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      updateDarkBtn(true);
    }
    btn?.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('smg1_theme', 'light');
        updateDarkBtn(false);
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('smg1_theme', 'dark');
        updateDarkBtn(true);
      }
      // Update chart colors after theme change
      setTimeout(recalcAll, 50);
    });
  }

  function updateDarkBtn(isDark) {
    const btn = document.getElementById('btn-dark');
    if (!btn) return;
    btn.innerHTML = isDark
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg> Claro`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Escuro`;
  }

  // ── Copy to clipboard ─────────────────────────────────────────
  function initCopyWA() {
    const btn = document.getElementById('btn-copy-wa');
    const btn2 = document.getElementById('btn-copy-wa-hdr');
    const handler = async () => {
      const text = document.getElementById('wa-preview')?.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copiado para a área de transferência!', 'copy');
        if (btn) { btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 2000); }
      } catch {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copiado!', 'copy');
      }
    };
    btn?.addEventListener('click', handler);
    btn2?.addEventListener('click', handler);
  }

  // ── New report ────────────────────────────────────────────────
  function initNewReport() {
    document.getElementById('btn-new')?.addEventListener('click', () => {
      if (confirm('Criar novo relatório? Os dados não salvos serão perdidos.')) {
        SMG1Storage.resetAll();
        showToast('Novo relatório iniciado', 'check');
      }
    });
  }

  // ── Save / Load JSON ──────────────────────────────────────────
  function initSaveLoad() {
    document.getElementById('btn-save')?.addEventListener('click', () => {
      SMG1Storage.exportJSON();
      showToast('Relatório salvo como JSON', 'check');
    });

    document.getElementById('btn-load')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        SMG1Storage.importJSON(file, ok => {
          if (ok) showToast('Relatório carregado com sucesso!', 'check');
          else showToast('Erro ao carregar arquivo JSON', 'warn');
        });
      };
      input.click();
    });
  }

  // ── Export buttons ────────────────────────────────────────────
  function initExports() {
    document.getElementById('btn-pdf')?.addEventListener('click', () => SMG1Export.toPDF());
    document.getElementById('btn-excel')?.addEventListener('click', () => SMG1Export.toExcel());
  }

  // ── Init all charts ───────────────────────────────────────────
  function initCharts() {
    initChartFAG();
    initChartSacas();
    initChartOOT();
    initChartDelay();
    initChartVol();
    initChartVolumosos();
  }

  // ── Main init ─────────────────────────────────────────────────
  function init() {
    initCharts();
    initDarkMode();
    initCopyWA();
    initNewReport();
    initSaveLoad();
    initExports();

    // Listen to all field inputs for real-time recalc
    document.addEventListener('input', e => {
      if (e.target.matches('[data-field]') || e.target.matches('[data-field-onda]')) {
        recalcAll();
      }
    });

    // Initial calc
    setTimeout(recalcAll, 150);
  }

  return { init, recalcAll, showToast };
})();

// ── Bootstrap on DOM ready ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  SMG1Storage.init();
  SMG1App.init();
});
