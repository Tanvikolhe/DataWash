// --- GLOBAL VARIABLES ---
let tableData = [];
let tableHeaders = [];
let myChart = null;
let insightsChart = null; // Specific chart for Insights
let historyLog = [];
let currentFileName = "data.csv";

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Dashboard Loaded");
    
    // Dark Mode Init
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
        themeToggle.addEventListener('change', () => {
            if (themeToggle.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }
});

// --- NAVIGATION (The Critical Fix is Here) ---
window.switchTab = function(tabName) {
    // 1. Hide all sections
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active-section'));
    // 2. Show active section
    document.getElementById(tabName).classList.add('active-section');
    
    // 3. Update Sidebar style
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    
    // 4. Scroll to top
    const mainContent = document.querySelector('.main-content');
    if(mainContent) mainContent.scrollTop = 0;

    // 5. TRIGGER SPECIFIC TAB LOGIC
    if (tabName === 'history') {
        renderHistory();
    }
    if (tabName === 'insights') {
        renderInsights(); // <--- THIS WAS LIKELY MISSING OR NOT FIRING
    }
}

// --- UPLOAD LOGIC ---
const fileInput = document.getElementById('fileInput');
if (fileInput) {
    fileInput.addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;

        currentFileName = file.name;

        // UI: Show Loader
        document.getElementById('loader').classList.remove('hidden');
        document.getElementById('upload-state').classList.add('hidden');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload', { method: 'POST', body: formData });
            const result = await response.json();

            if (result.error) throw new Error(result.error);

            // Store Data
            tableData = result.data;
            
            // Update Stats
            document.getElementById('stat-rows').textContent = result.stats.rows;
            document.getElementById('stat-cols').textContent = result.stats.cols;
            document.getElementById('stat-dupes').textContent = result.stats.duplicates;

            // Render Cleaner Dashboard
            renderTable(tableData);
            renderChart(tableData);

            // Show Dashboard
            document.getElementById('loader').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert("Error: " + error.message);
            document.getElementById('loader').classList.add('hidden');
            document.getElementById('upload-state').classList.remove('hidden');
        }
    });
}

// --- INSIGHTS LOGIC (The Deep Dive) ---
function renderInsights() {
    const emptyState = document.getElementById('insights-empty');
    const content = document.getElementById('insights-content');
    const select = document.getElementById('columnSelect');

    // Safety Check: Do we have data?
    if (!tableData || tableData.length === 0) {
        if(emptyState) emptyState.style.display = 'block';
        if(content) content.classList.add('hidden');
        return;
    }

    // If data exists, show content
    if(emptyState) emptyState.style.display = 'none';
    if(content) content.classList.remove('hidden');

    // Populate Dropdown (if needed)
    if (select && tableHeaders.length > 0) {
        // Only repopulate if empty or mismatch
        if (select.options.length === 0 || select.options.length !== tableHeaders.length) {
            select.innerHTML = "";
            tableHeaders.forEach(h => {
                const option = document.createElement('option');
                option.value = h;
                option.textContent = h;
                select.appendChild(option);
            });
            // Automatically analyze the first column
            analyzeColumn();
        }
    }
}

window.analyzeColumn = function() {
    const select = document.getElementById('columnSelect');
    if (!select || !select.value) return;

    const colName = select.value;
    const colData = tableData.map(row => row[colName]);
    const statsGrid = document.getElementById('statsGrid');
    const ctx = document.getElementById('insightsChart');

    if(!ctx) return;

    // Detect Type
    const sample = colData.find(v => v !== null && v !== "");
    const isNumeric = typeof sample === 'number';

    let statsHtml = "";
    let chartData = {};
    let chartType = 'bar';

    if (isNumeric) {
        // Numbers: Avg, Min, Max
        const sum = colData.reduce((a, b) => a + (Number(b) || 0), 0);
        const avg = (sum / colData.length).toFixed(2);
        const min = Math.min(...colData);
        const max = Math.max(...colData);

        statsHtml = `
            <div class="insight-card"><h4>Average</h4><span>${avg}</span></div>
            <div class="insight-card"><h4>Minimum</h4><span>${min}</span></div>
            <div class="insight-card"><h4>Maximum</h4><span>${max}</span></div>
            <div class="insight-card"><h4>Total Sum</h4><span>${sum.toLocaleString()}</span></div>
        `;

        // Line Chart for distribution
        const sorted = [...colData].sort((a, b) => a - b);
        chartType = 'line';
        chartData = {
            labels: sorted.map((_, i) => i),
            datasets: [{
                label: colName,
                data: sorted,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0 // Hide points for cleaner look
            }]
        };
    } else {
        // Text: Frequencies
        const counts = {};
        colData.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const topVal = sortedKeys[0];
        const uniqueCount = sortedKeys.length;

        statsHtml = `
            <div class="insight-card"><h4>Unique Values</h4><span>${uniqueCount}</span></div>
            <div class="insight-card"><h4>Most Common</h4><span>${topVal}</span></div>
            <div class="insight-card"><h4>Frequency</h4><span>${counts[topVal]}</span></div>
        `;

        // Pie Chart (Top 10)
        chartType = 'doughnut';
        const top10 = sortedKeys.slice(0, 10);
        chartData = {
            labels: top10,
            datasets: [{
                data: top10.map(k => counts[k]),
                backgroundColor: [
                    '#4f46e5', '#818cf8', '#c7d2fe', '#3b82f6', '#60a5fa',
                    '#93c5fd', '#10b981', '#34d399', '#f59e0b', '#fbbf24'
                ],
                borderWidth: 1
            }]
        };
    }

    // Render Stats
    if(statsGrid) statsGrid.innerHTML = statsHtml;

    // Render Chart
    if (insightsChart) insightsChart.destroy();
    insightsChart = new Chart(ctx.getContext('2d'), {
        type: chartType,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: chartType === 'doughnut' },
                title: { display: true, text: `Analysis of ${colName}` }
            },
            scales: {
                x: { display: chartType !== 'doughnut' }
            }
        }
    });
}


// --- HISTORY LOGIC ---
window.saveAndReset = function() {
    if (tableData.length === 0) return;

    const record = {
        id: Date.now(),
        fileName: currentFileName,
        timestamp: new Date().toLocaleTimeString(),
        data: JSON.parse(JSON.stringify(tableData)),
        rows: tableData.length
    };
    historyLog.unshift(record);

    // Reset UI
    tableData = [];
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('upload-state').classList.remove('hidden');
    document.getElementById('fileInput').value = ""; 
}

function renderHistory() {
    const tbody = document.getElementById('historyTableBody');
    const emptyState = document.getElementById('historyEmpty');
    
    if (!tbody) return;
    tbody.innerHTML = "";

    if (historyLog.length === 0) {
        if(emptyState) emptyState.style.display = "block";
        return;
    } else {
        if(emptyState) emptyState.style.display = "none";
    }

    historyLog.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.timestamp}</td>
            <td><strong>${item.fileName}</strong></td>
            <td>${item.rows}</td>
            <td><span class="badge badge-success" style="background:#dcfce7; color:#166534; padding:5px 10px; border-radius:10px;">Cleaned</span></td>
            <td>
                <button class="btn-secondary" onclick="loadFromHistory(${item.id})" title="Load">
                    <i class="fas fa-upload"></i>
                </button>
                <button class="btn-primary" style="padding:5px 10px;" onclick="downloadHistoryItem(${item.id})" title="Download">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.loadFromHistory = function(id) {
    const record = historyLog.find(r => r.id === id);
    if (!record) return;

    tableData = JSON.parse(JSON.stringify(record.data));
    currentFileName = record.fileName;

    switchTab('cleaner');
    document.getElementById('upload-state').classList.add('hidden');
    
    renderTable(tableData);
    renderChart(tableData);
    
    document.getElementById('stat-rows').textContent = tableData.length;
    document.getElementById('stat-cols').textContent = Object.keys(tableData[0]).length;
    document.getElementById('stat-dupes').textContent = "-";
    
    document.getElementById('dashboard').classList.remove('hidden');
}

window.downloadHistoryItem = function(id) {
    const record = historyLog.find(r => r.id === id);
    if (!record) return;
    downloadData(record.data, record.fileName);
}

// --- COMMON HELPER FUNCTIONS ---
function renderTable(data) {
    const table = document.getElementById('dataTable');
    if (!table) return;
    table.innerHTML = ""; 
    if (data.length === 0) return;

    tableHeaders = Object.keys(data[0]);
    
    const thead = document.createElement('thead');
    const trHead = document.createElement('tr');
    trHead.innerHTML = "<th>Act</th>";
    tableHeaders.forEach(h => trHead.innerHTML += `<th>${h}</th>`);
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        let html = `<td><button class="delete-row-btn" onclick="deleteRow(${index})"><i class="fas fa-trash"></i></button></td>`;
        tableHeaders.forEach(key => {
            html += `<td contenteditable="true" oninput="updateCell(${index}, '${key}', this)">${row[key]}</td>`;
        });
        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

window.updateCell = function(index, key, element) {
    let val = element.textContent;
    if (!isNaN(val) && val.trim() !== '') val = Number(val);
    tableData[index][key] = val;
    updateChartData();
}

window.deleteRow = function(index) {
    tableData.splice(index, 1);
    renderTable(tableData);
    renderChart(tableData);
}

window.addRow = function() {
    const newRow = {};
    tableHeaders.forEach(key => newRow[key] = 0);
    tableData.push(newRow);
    renderTable(tableData);
    renderChart(tableData);
}

function renderChart(data) {
    const ctx = document.getElementById('myChart');
    if (!ctx) return;
    const labelKey = tableHeaders.find(h => typeof data[0][h] === 'string') || tableHeaders[0];
    const valueKey = tableHeaders.find(h => typeof data[0][h] === 'number');

    if (!valueKey) return;

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: data.map(d => d[labelKey]),
            datasets: [{
                label: valueKey,
                data: data.map(d => d[valueKey]),
                backgroundColor: '#818cf8',
                borderColor: '#4f46e5',
                borderWidth: 1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 300 } }
    });
}

function updateChartData() {
    if (!myChart) return;
    const labelKey = tableHeaders.find(h => typeof tableData[0][h] === 'string') || tableHeaders[0];
    const valueKey = tableHeaders.find(h => typeof tableData[0][h] === 'number');
    if (!valueKey) return;
    myChart.data.labels = tableData.map(d => d[labelKey]);
    myChart.data.datasets[0].data = tableData.map(d => d[valueKey]);
    myChart.update('none');
}

function downloadData(data, filename) {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'clean_data.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
}

window.showDownloadPopup = function() { document.getElementById('popup-overlay').classList.remove('hidden'); }
window.closePopup = function() { document.getElementById('popup-overlay').classList.add('hidden'); }
window.downloadCSV = function() { downloadData(tableData, 'datawash_cleaned.csv'); closePopup(); }