document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initMobileNav();
    
    // Check if on Predict page
    if (document.getElementById('prediction-form')) {
        initPredictPage();
    }
    
    // Check if on Dashboard page
    if (window.dashboardData) {
        initDashboardCharts();
    }

    // Check if on History page
    if (document.getElementById('clear-all-btn')) {
        initHistoryPage();
    }
});

/* ==========================================================================
   THEME TOGGLING (DARK / LIGHT)
   ========================================================================== */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const htmlEl = document.documentElement;
    
    // Load cached theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlEl.setAttribute('data-theme', savedTheme);
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlEl.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlEl.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Re-render charts on theme toggle to match grid lines and colors
            if (window.dashboardData) {
                initDashboardCharts();
            }
        });
    }
}

/* ==========================================================================
   MOBILE NAVIGATION
   ========================================================================== */
function initMobileNav() {
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('open');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== mobileToggle) {
                sidebar.classList.remove('open');
            }
        });
    }
}

/* ==========================================================================
   PREDICTION PAGE LOGIC
   ========================================================================== */
function initPredictPage() {
    const stateSelect = document.getElementById('state');
    const areaSelect = document.getElementById('area');
    const stationsSlider = document.getElementById('stations');
    const stationsOutput = stationsSlider.nextElementSibling;
    const form = document.getElementById('prediction-form');
    
    // Handle State -> City change
    stateSelect.addEventListener('change', () => {
        const state = stateSelect.value;
        if (!state) return;
        
        fetch(`/api/cities/${encodeURIComponent(state)}`)
            .then(res => res.json())
            .then(data => {
                // Clear city options
                areaSelect.innerHTML = '';
                data.cities.forEach((city, idx) => {
                    const option = document.createElement('option');
                    option.value = city;
                    option.textContent = city;
                    if (idx === 0) option.selected = true;
                    areaSelect.appendChild(option);
                });
                
                // Trigger station update for the new default city
                if (data.cities.length > 0) {
                    updateDefaultStations(data.cities[0]);
                }
            })
            .catch(err => console.error("Error fetching cities:", err));
    });
    
    // Handle City selection -> Stations count change
    areaSelect.addEventListener('change', () => {
        updateDefaultStations(areaSelect.value);
    });

    function updateDefaultStations(city) {
        fetch(`/api/avg_stations/${encodeURIComponent(city)}`)
            .then(res => res.json())
            .then(data => {
                stationsSlider.value = data.avg_stations;
                stationsOutput.value = data.avg_stations;
            })
            .catch(err => console.error("Error fetching station average:", err));
    }
    
    // Handle prediction submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        
        const placeholder = document.getElementById('result-placeholder');
        const loading = document.getElementById('result-loading');
        const content = document.getElementById('result-content');
        
        // Show Loading UI state
        submitBtn.disabled = true;
        btnText.style.opacity = '0.5';
        btnLoader.style.display = 'inline-block';
        
        placeholder.style.display = 'none';
        content.style.display = 'none';
        loading.style.display = 'flex';
        
        const formData = new FormData(form);
        
        fetch('/predict', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            submitBtn.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
            loading.style.display = 'none';
            
            if (data.error) {
                alert("Error: " + data.error);
                placeholder.style.display = 'block';
                return;
            }
            
            // Populate Results
            document.getElementById('res-location').textContent = `${data.input.area}, ${data.input.state}`;
            document.getElementById('res-date').textContent = data.input.date;
            document.getElementById('res-aqi-value').textContent = data.predicted_aqi;
            document.getElementById('res-pollutant').textContent = data.input.pollutant;
            document.getElementById('res-stations').textContent = data.input.stations;
            document.getElementById('res-advisory').textContent = data.advisory;
            
            // Vulnerable & Active group tips based on category
            const advActive = document.getElementById('res-adv-active');
            const advVulnerable = document.getElementById('res-adv-vulnerable');
            
            if (data.status === "Good" || data.status === "Satisfactory") {
                advActive.textContent = "Safe to exercise outdoors. No special restrictions.";
                advVulnerable.textContent = "Enjoy the fresh air! Normal ventilation is recommended.";
            } else if (data.status === "Moderate") {
                advActive.textContent = "Sensitive individuals should limit prolonged heavy outdoor exertion.";
                advVulnerable.textContent = "Children & elderly should watch for coughing or minor discomfort.";
            } else if (data.status === "Poor") {
                advActive.textContent = "Avoid running or training outdoors. Limit general activities.";
                advVulnerable.textContent = "Vulnerable groups should stay indoors and use air filtration.";
            } else { // Very Poor & Severe
                advActive.textContent = "Health warning: Do not exercise or stay outdoors. Wear N95 masks if essential.";
                advVulnerable.textContent = "Severe hazard. Children, pregnant women, and elderly must remain indoors.";
            }
            
            // Set Badge style
            const statusBadge = document.getElementById('res-status-badge');
            statusBadge.textContent = data.status;
            statusBadge.className = 'status-badge ' + data.color_class;
            
            // Show result content container
            content.style.display = 'block';
            
            // Animate Circle Gauge
            // Circumference of R=80 is 2 * PI * 80 = 502.65
            const circumference = 502.65;
            const fillCircle = document.getElementById('gauge-fill');
            fillCircle.style.stroke = data.hex_color;
            
            // Calculate progress offset (capped at 500 AQI scale)
            const aqiVal = Math.min(500, Math.max(0, data.predicted_aqi));
            const offset = circumference - (aqiVal / 500) * circumference;
            
            // Delay slightly for CSS transition to trigger
            setTimeout(() => {
                fillCircle.style.strokeDashoffset = offset;
            }, 100);
        })
        .catch(err => {
            console.error("Prediction error:", err);
            submitBtn.disabled = false;
            btnText.style.opacity = '1';
            btnLoader.style.display = 'none';
            loading.style.display = 'none';
            placeholder.style.display = 'block';
            alert("An error occurred during prediction. Check server log.");
        });
    });
}

/* ==========================================================================
   DASHBOARD CHARTS (CHART.JS)
   ========================================================================== */
let temporalChart = null;
let pollutantChart = null;
let stateChart = null;

function initDashboardCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#475569';
    
    // Destroy existing chart instances if they exist (prevents canvas overlay errors)
    if (temporalChart) temporalChart.destroy();
    if (pollutantChart) pollutantChart.destroy();
    if (stateChart) stateChart.destroy();
    
    const data = window.dashboardData;
    
    // --- 1. TEMPORAL TREND LINE CHART ---
    const ctxTemp = document.getElementById('temporalTrendChart').getContext('2d');
    const trendLabels = data.temporalTrends.map(t => t.month_name);
    const trendValues = data.temporalTrends.map(t => t.avg_aqi);
    
    // Create gradient fill
    const tempGradient = ctxTemp.createLinearGradient(0, 0, 0, 300);
    tempGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    tempGradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    
    temporalChart = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: trendLabels,
            datasets: [{
                label: 'Average AQI',
                data: trendValues,
                borderColor: '#3b82f6',
                borderWidth: 3,
                backgroundColor: tempGradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Inter' } }
                }
            }
        }
    });
    
    // --- 2. POLLUTANT DISTRIBUTION DOUGHNUT CHART ---
    const ctxPol = document.getElementById('pollutantsDistChart').getContext('2d');
    
    // Get top 6 pollutants, group others
    const rawPollutants = data.pollutantsDist;
    const topPollutants = rawPollutants.slice(0, 5);
    const othersCount = rawPollutants.slice(5).reduce((sum, p) => sum + p.count, 0);
    
    if (othersCount > 0) {
        topPollutants.push({ main_pollutant: 'Others', count: othersCount });
    }
    
    const polLabels = topPollutants.map(p => p.main_pollutant);
    const polCounts = topPollutants.map(p => p.count);
    
    pollutantChart = new Chart(ctxPol, {
        type: 'doughnut',
        data: {
            labels: polLabels,
            datasets: [{
                data: polCounts,
                backgroundColor: [
                    '#ef4444', // Red
                    '#3b82f6', // Blue
                    '#10b981', // Green
                    '#f59e0b', // Yellow
                    '#8b5cf6', // Purple
                    '#64748b'  // Grey (others)
                ],
                borderWidth: isDark ? 2 : 1,
                borderColor: isDark ? '#131a2c' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: textColor,
                        font: { family: 'Inter', size: 11 }
                    }
                }
            },
            cutout: '65%'
        }
    });
    
    // --- 3. STATE-WISE AQI BAR CHART (TOP 12 STATES) ---
    const ctxState = document.getElementById('stateAqiChart').getContext('2d');
    const stateSubset = data.stateAqiList.slice(0, 12);
    const stateLabels = stateSubset.map(s => s.state);
    const stateValues = stateSubset.map(s => s.avg_aqi);
    
    // Assign color depending on severity
    const barColors = stateValues.map(val => {
        if (val <= 50) return '#2ecc71';
        if (val <= 100) return '#27ae60';
        if (val <= 150) return '#f1c40f'; // Moderate soft
        if (val <= 200) return '#f39c12'; // Moderate high
        return '#e67e22'; // Poor
    });
    
    stateChart = new Chart(ctxState, {
        type: 'bar',
        data: {
            labels: stateLabels,
            datasets: [{
                data: stateValues,
                backgroundColor: barColors,
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Inter' } },
                    title: { display: true, text: 'Average AQI', color: textColor }
                }
            }
        }
    });
}

/* ==========================================================================
   HISTORY PAGE ACTIONS
   ========================================================================== */
function initHistoryPage() {
    const clearAllBtn = document.getElementById('clear-all-btn');
    
    clearAllBtn.addEventListener('click', () => {
        if (!confirm("Are you sure you want to clear the entire prediction log? This action cannot be undone.")) {
            return;
        }
        
        fetch('/api/clear_history', {
            method: 'POST'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Remove table and replace with empty state card
                const historyCard = document.querySelector('.history-card');
                historyCard.innerHTML = `
                    <div class="history-header-wrapper">
                        <div class="history-title-box">
                            <h3><i class="fa-solid fa-clock-rotate-left"></i> Run History</h3>
                            <p>Saved predictions generated using the pre-trained Random Forest model.</p>
                        </div>
                    </div>
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                        <h3>No predictions generated yet</h3>
                        <p>Your predicted AQI scores will be saved here in the database automatically. Try generating your first prediction!</p>
                        <a href="/predict" class="btn btn-primary">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> Predict Now
                        </a>
                    </div>
                `;
            } else {
                alert("Error clearing history: " + data.error);
            }
        })
        .catch(err => {
            console.error("Error clearing history:", err);
            alert("Communication failed with server.");
        });
    });
}

function deleteHistoryRow(rowId) {
    if (!confirm("Delete this prediction record?")) {
        return;
    }
    
    fetch(`/api/delete_row/${rowId}`, {
        method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const row = document.getElementById(`row-${rowId}`);
            if (row) {
                // Apply a fade-out effect with CSS/JS transition
                row.style.transition = 'opacity 0.4s, transform 0.4s';
                row.style.opacity = '0';
                row.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    row.remove();
                    
                    // If no rows left, reload to show empty state
                    const tbody = document.getElementById('history-table-body');
                    if (tbody && tbody.children.length === 0) {
                        window.location.reload();
                    }
                }, 400);
            }
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(err => {
        console.error("Error deleting record:", err);
        alert("Failed to delete record.");
    });
}
