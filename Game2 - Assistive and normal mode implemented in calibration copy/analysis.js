// Arm Orchard Data Analysis (Enhanced & Fixed)
// Parses CSV and generates Chart.js visualizations based on key metrics

let parsedData = [];
let charts = [];

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const statsSummary = document.getElementById('statsSummary');
const statsList = document.getElementById('statsList');
const chartsGrid = document.getElementById('chartsGrid');
const downloadCleanCsv = document.getElementById('downloadCleanCsv');

// Event Listeners
fileInput.addEventListener('change', handleFile);
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', handleDrop);
dropZone.addEventListener('dragleave', handleDragLeave);
downloadCleanCsv.addEventListener('click', downloadCleanData);

function handleDragOver(e) {
  e.preventDefault();
  dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
  dropZone.classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile({ target: { files: [files[0]] } });
  }
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file || !file.name.endsWith('.csv')) {
    alert('Please select a valid CSV file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    Papa.parse(event.target.result, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        parsedData = results.data;
        processData();
        generateStats();
        generateCharts();
        statsSummary.classList.remove('hidden');
        chartsGrid.classList.remove('hidden');
        dropZone.style.display = 'none'; // Hide after upload
      },
      error: (error) => {
        alert('Error parsing CSV: ' + error);
      }
    });
  };
  reader.readAsText(file);
}

function processData() {
  // Filter and clean data: Remove rows with no timestamp or key fields
  parsedData = parsedData.filter(row => row.timestamp_sec && !isNaN(parseFloat(row.timestamp_sec)));
  // Convert strings to numbers where possible
  parsedData.forEach(row => {
    ['timestamp_sec', 'trial_id', 'x_norm', 'y_norm', 'shoulder_x', 'shoulder_y', 'elbow_x', 'elbow_y', 
     'elbow_angle_deg', 'shoulder_angle_deg', 'trunk_twist_deg', 'source_idx', 'basket_idx', 
     'trial_duration_sec', 'arat_score'].forEach(key => {
      if (row[key]) row[key] = parseFloat(row[key]) || 0;
    });
    // In processData() — replace the row.success line
row.success = row.success === 'true' ? true : 
              (row.success === 'false' ? false : 
               (row.success === true || row.success === false ? row.success : null));  // Explicitly set blanks/null to null
    row.hand_function_left = row.hand_function_left || 'unknown';
    row.hand_function_right = row.hand_function_right || 'unknown';
  });
}

function generateStats() {
  const totalTrials = [...new Set(parsedData.filter(r => r.trial_id).map(r => r.trial_id))].length;
  const successes = parsedData.filter(r => r.success).length;
  const successRate = totalTrials > 0 ? (successes / totalTrials * 100).toFixed(1) : 0;
  const avgArat = parsedData.reduce((sum, r) => sum + (r.arat_score || 0), 0) / (parsedData.filter(r => r.arat_score > 0).length || 1);
  const avgDuration = parsedData.reduce((sum, r) => sum + (r.trial_duration_sec || 0), 0) / (parsedData.filter(r => r.trial_duration_sec > 0).length || 1);
  const leftUsage = parsedData.filter(r => r.hand === 'Left').length;
  const rightUsage = parsedData.filter(r => r.hand === 'Right').length;

  // Hand Function Status (from first non-unknown value)
  const leftFunc = parsedData.find(r => r.hand_function_left && r.hand_function_left !== 'unknown')?.hand_function_left || 'unknown';
  const rightFunc = parsedData.find(r => r.hand_function_right && r.hand_function_right !== 'unknown')?.hand_function_right || 'unknown';

  statsList.innerHTML = `
    <li><strong>Left Hand Function:</strong> ${leftFunc === 'full' ? '✓ Full' : (leftFunc === 'limited' ? '✗ Limited' : '❓ Unknown')}</li>
    <li><strong>Right Hand Function:</strong> ${rightFunc === 'full' ? '✓ Full' : (rightFunc === 'limited' ? '✗ Limited' : '❓ Unknown')}</li>
    <li><strong>Total Trials:</strong> ${totalTrials}</li>
    <li><strong>Avg ARAT Score:</strong> ${avgArat.toFixed(1)}</li>
    <li><strong>Avg Trial Duration:</strong> ${avgDuration.toFixed(1)}s</li>
    <li><strong>Left Hand Usage:</strong> ${leftUsage}</li>
    <li><strong>Right Hand Usage:</strong> ${rightUsage}</li>
  `;
}

function generateCharts() {
  // Clear existing charts
  charts.forEach(chart => chart.destroy());
  charts = [];
  chartsGrid.innerHTML = '';

  // 1. Timeline of Events
  const eventData = parsedData.filter(r => ['spawn', 'pick', 'drop_success', 'drop_miss', 'timeout'].includes(r.event));
  if (eventData.length > 0) {
    const timelineCtx = createCanvas('Timeline of Events');
    new Chart(timelineCtx, {
      type: 'line',
      data: {
        labels: eventData.map(r => `t${r.timestamp_sec}`),
        datasets: [{
          label: 'Cumulative Events',
          data: eventData.map((r, i) => i + 1),
          borderColor: '#2f7a2f',
          fill: false
        }]
      },
      options: { 
    responsive: true,
    maintainAspectRatio: true,
    scales: { y: { beginAtZero: true } } 
  }
    });
  }

  // 2. Hand Movement Path (Scatter: x_norm vs y_norm, segregated by event)
const pickData = parsedData.filter(r => r.event === 'pick' && r.x_norm && r.y_norm);
const dropSuccessData = parsedData.filter(r => r.event === 'drop_success' && r.x_norm && r.y_norm);
const dropMissData = parsedData.filter(r => r.event === 'drop_miss' && r.x_norm && r.y_norm);

if (pickData.length > 0 || dropSuccessData.length > 0 || dropMissData.length > 0) {
  const movementCtx = createCanvas('Hand Movement Path (Segregated by Event)');
  new Chart(movementCtx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Pick Events',
          data: pickData.map(r => ({ x: r.x_norm, y: r.y_norm })),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',  // Blue
          borderColor: 'rgba(54, 162, 235, 1)',
          pointRadius: 6,
          pointStyle: 'circle'
        },
        {
          label: 'Drop Success',
          data: dropSuccessData.map(r => ({ x: r.x_norm, y: r.y_norm })),
          backgroundColor: 'rgba(40, 167, 69, 0.8)',  // Green
          borderColor: 'rgba(40, 167, 69, 1)',
          pointRadius: 6,
          pointStyle: 'triangle'
        },
        {
          label: 'Drop Miss',
          data: dropMissData.map(r => ({ x: r.x_norm, y: r.y_norm })),
          backgroundColor: 'rgba(220, 53, 69, 0.8)',  // Red
          borderColor: 'rgba(220, 53, 69, 1)',
          pointRadius: 6,
          pointStyle: 'rect'
        }
      ]
    },
    options: { 
      responsive: true,
      maintainAspectRatio: true,
      scales: { 
        x: { title: { display: true, text: 'X Norm' }, min: 0, max: 1 },
        y: { title: { display: true, text: 'Y Norm' }, min: 0, max: 1 }
      },
      plugins: {
        legend: { display: true }  // Show event legend
      }
    }
  });
}

  // 3. ARAT Scores per Trial (Bar)
  const aratData = parsedData.filter(r => r.trial_id && r.arat_score > 0);
  const uniqueTrials = [...new Set(aratData.map(r => r.trial_id))];
  if (uniqueTrials.length > 0) {
    const aratCtx = createCanvas('ARAT Scores per Trial');
    new Chart(aratCtx, {
      type: 'bar',
      data: {
        labels: uniqueTrials,
        datasets: [{
          label: 'ARAT Score',
          data: uniqueTrials.map(t => aratData.find(r => r.trial_id === t)?.arat_score || 0),
          backgroundColor: '#2f7a2f'
        }]
      },
      options: { scales: { y: { beginAtZero: true, max: 3 } } }
    });
  }

  // 4. Success Rate (Pie)
  // Include only real booleans (true or false). Ignore null/undefined.



  // 5. Elbow Angle Over Trials (Line)
  const angleData = parsedData.filter(r => r.trial_id && r.elbow_angle_deg > 0);
  const uniqueTrialsAngle = [...new Set(angleData.map(r => r.trial_id))];
  if (uniqueTrialsAngle.length > 0) {
    const avgAngles = uniqueTrialsAngle.map(t => {
      const trialAngles = angleData.filter(r => r.trial_id === t).map(r => r.elbow_angle_deg);
      return trialAngles.length ? trialAngles.reduce((a, b) => a + b, 0) / trialAngles.length : 0;
    });
    const angleCtx = createCanvas('Average Elbow Angle per Trial');
    new Chart(angleCtx, {
      type: 'line',
      data: {
        labels: uniqueTrialsAngle,
        datasets: [{
          label: 'Elbow Angle (deg)',
          data: avgAngles,
          borderColor: '#ff6347',
          fill: false
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  // 6. Shoulder Angle Over Trials (Line)
  const shoulderData = parsedData.filter(r => r.trial_id && r.shoulder_angle_deg > 0);
  const uniqueTrialsShoulder = [...new Set(shoulderData.map(r => r.trial_id))];
  if (uniqueTrialsShoulder.length > 0) {
    const avgShoulders = uniqueTrialsShoulder.map(t => {
      const trialShoulders = shoulderData.filter(r => r.trial_id === t).map(r => r.shoulder_angle_deg);
      return trialShoulders.length ? trialShoulders.reduce((a, b) => a + b, 0) / trialShoulders.length : 0;
    });
    const shoulderCtx = createCanvas('Average Shoulder Angle per Trial');
    new Chart(shoulderCtx, {
      type: 'line',
      data: {
        labels: uniqueTrialsShoulder,
        datasets: [{
          label: 'Shoulder Angle (deg)',
          data: avgShoulders,
          borderColor: '#51cf66',
          fill: false
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  // 7. Trunk Twist Distribution (Histogram - Bar) [FIXED]
//   const twistData = parsedData.filter(r => r.trunk_twist_deg > 0);
//   if (twistData.length > 0) {
//     const twistBins = [0, 30, 60, 90, 120, 150, 180]; // Bins for degrees
//     const twistCounts = twistBins.slice(0, -1).map((bin, i) => {
//       const nextBin = twistBins[i + 1];
//       return twistData.filter(r => r.trunk_twist_deg >= bin && r.trunk_twist_deg < nextBin).length;
//     });
//     const twistCtx = createCanvas('Trunk Twist Distribution');
//     new Chart(twistCtx, {
//       type: 'bar',
//       data: {
//         labels: twistBins.slice(0, -1).map((b, i) => `${b}-${twistBins[i+1]}°`),
//         datasets: [{
//           label: 'Count',
//           data: twistCounts,
//           backgroundColor: '#ff6347'
//         }]
//       },
//       options: { scales: { y: { beginAtZero: true } } }
//     });
//   }

  // 8. Trial Duration Histogram (Bar)
  const durationData = parsedData.filter(r => r.trial_duration_sec > 0);
  if (durationData.length > 0) {
    const durationBins = [0, 2, 4, 6, 8, 10]; // Bins for seconds
    const durationCounts = durationBins.slice(0, -1).map((bin, i) => {
      const nextBin = durationBins[i + 1];
      return durationData.filter(r => r.trial_duration_sec >= bin && r.trial_duration_sec < nextBin).length;
    });
    const durationCtx = createCanvas('Trial Duration Histogram');
    new Chart(durationCtx, {
      type: 'bar',
      data: {
        labels: durationBins.slice(0, -1).map((b, i) => `${b}-${durationBins[i+1]}s`),
        datasets: [{
          label: 'Count',
          data: durationCounts,
          backgroundColor: '#2f7a2f'
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
  }

  const successData = parsedData.filter(r => r.success === true || r.success === false);

if (successData.length > 0) {
  const successCounts = { true: 0, false: 0 };

  successData.forEach(r => {
    if (r.success === true) successCounts.true++;
    else if (r.success === false) successCounts.false++;
  });

  const successCtx = createCanvas('Success Rate');
  new Chart(successCtx, {
    type: 'pie',
    data: {
      labels: ['Success', 'Failure'],
      datasets: [{
        data: [successCounts.true, successCounts.false],
        backgroundColor: ['#28a745', '#dc3545']
      }]
    }
  });
}

  // 9. Hand Usage Breakdown (Pie)
  const handData = parsedData.filter(r => r.hand);
  if (handData.length > 0) {
    const handCounts = { Left: 0, Right: 0 };
    handData.forEach(r => handCounts[r.hand]++);
    const handCtx = createCanvas('Hand Usage Breakdown');
    new Chart(handCtx, {
      type: 'pie',
      data: {
        labels: ['Left', 'Right'],
        datasets: [{
          data: [handCounts.Left, handCounts.Right],
          backgroundColor: ['#51cf66', '#ff6347']
        }]
      }
    });
  }

  // 10. Function Assessment Summary (Bar)
//   const funcLeft = parsedData.filter(r => r.hand_function_left && r.hand_function_left !== 'unknown');
//   const funcRight = parsedData.filter(r => r.hand_function_right && r.hand_function_right !== 'unknown');
//   if (funcLeft.length > 0 || funcRight.length > 0) {
//     const leftCounts = { full: funcLeft.filter(f => f.hand_function_left === 'full').length, limited: funcLeft.filter(f => f.hand_function_left === 'limited').length };
//     const rightCounts = { full: funcRight.filter(f => f.hand_function_right === 'full').length, limited: funcRight.filter(f => f.hand_function_right === 'limited').length };
//     const funcCtx = createCanvas('Hand Function Assessment');
//     new Chart(funcCtx, {
//       type: 'bar',
//       data: {
//         labels: ['Full', 'Limited'],
//         datasets: [
//           { label: 'Left', data: [leftCounts.full, leftCounts.limited], backgroundColor: '#51cf66' },
//           { label: 'Right', data: [rightCounts.full, rightCounts.limited], backgroundColor: '#ff6347' }
//         ]
//       },
//       options: { scales: { y: { beginAtZero: true } } }
//     });
//   }
}

function createCanvas(title) {
  const container = document.createElement('div');
  container.className = 'chart-container';
  container.innerHTML = `<h3>${title}</h3><canvas></canvas>`;
  chartsGrid.appendChild(container);
  return container.querySelector('canvas').getContext('2d');
}

function downloadCleanData() {
  // Clean data: Only rows with timestamp_sec > 0 and key fields
  const cleanData = parsedData.filter(r => r.timestamp_sec > 0 && (r.event || r.x_norm || r.arat_score));
  const csv = Papa.unparse(cleanData);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arm-orchard-clean-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}