// Load trades
let trades = JSON.parse(localStorage.getItem("trades")) || [];

// DOM elements
const form = document.getElementById("trade-form");
const tradesTableBody = document.querySelector("#trades-table tbody");
const totalTradesEl = document.getElementById("total-trades");
const totalGainEl = document.getElementById("total-gain");
const averageGainEl = document.getElementById("average-gain");
const totalRiskRewardEl = document.getElementById("total-risk-reward");
const startDateEl = document.getElementById("start-date");
const endDateEl = document.getElementById("end-date");
const applyDateFilterBtn = document.getElementById("apply-date-filter");
const clearFilterBtn = document.getElementById("clear-filter");
const clearAllBtn = document.getElementById("clear-all");
const clearRangeBtn = document.getElementById("clear-range");

const chartWidthEl = document.getElementById("chart-width");
const chartHeightEl = document.getElementById("chart-height");
const resizeChartBtn = document.getElementById("resize-chart");

const confidenceSlider = document.getElementById("confidence-slider");
const confidenceValue = document.getElementById("confidence-value");

// Chart.js
const gainChartCtx = document.getElementById("gainChart").getContext('2d');
let gainChart;

// Update confidence value display
confidenceSlider.addEventListener("input", () => {
    confidenceValue.innerText = confidenceSlider.value;
});

// Render trades
function renderTrades(filteredTrades = null) {
    const list = filteredTrades || trades;
    tradesTableBody.innerHTML = "";
    let totalGain = 0, totalRisk = 0;

    list.forEach(trade => {
        totalGain += parseFloat(trade.profitLoss) || 0;
        totalRisk += parseFloat(trade.risk) || 0;

        let row = tradesTableBody.insertRow();
        row.insertCell(0).innerText = new Date(trade.date).toLocaleDateString();
        row.insertCell(1).innerText = parseFloat(trade.profitLoss).toFixed(2);
        row.cells[1].className = trade.profitLoss >= 0 ? "profit" : "loss";
        row.insertCell(2).innerText = trade.dailyGain || "";
        row.insertCell(3).innerText = trade.strategy || "";
        row.insertCell(4).innerText = trade.risk || "";
        row.insertCell(5).innerText = trade.platform || "";
        row.insertCell(6).innerText = trade.confidence || "";
        row.insertCell(7).innerText = trade.emotion || "";
        const imgCell = row.insertCell(8);
        if(trade.screenshot) {
            const img = document.createElement("img");
            img.src = trade.screenshot;
            imgCell.appendChild(img);
        }
        row.insertCell(9).innerText = trade.risk ? (parseFloat(trade.profitLoss)/parseFloat(trade.risk)).toFixed(2) : "";
    });

    totalTradesEl.innerText = list.length;
    totalGainEl.innerText = totalGain.toFixed(2);
    averageGainEl.innerText = list.length ? (totalGain/list.length).toFixed(2) : 0;
    totalRiskRewardEl.innerText = totalRisk ? (totalGain/totalRisk).toFixed(2) : 0;

    updateChart(list);
}

// Add trade
form.addEventListener("submit", e => {
    e.preventDefault();
    const formData = new FormData(form);
    const screenshotFile = formData.get("screenshot");

    function saveTrade(screenshotData) {
        const newTrade = {
            date: new Date().toISOString(),
            profitLoss: parseFloat(formData.get("profitLoss")),
            dailyGain: parseFloat(formData.get("dailyGain")) || 0,
            strategy: formData.get("strategy"),
            risk: parseFloat(formData.get("risk")) || 0,
            platform: formData.get("platform"),
            confidence: parseInt(formData.get("confidence")),
            emotion: parseInt(formData.get("emotion")),
            screenshot: screenshotData
        };
        trades.push(newTrade);
        localStorage.setItem("trades", JSON.stringify(trades));
        form.reset();
        confidenceValue.innerText = 5;
        renderTrades();
    }

    if(screenshotFile && screenshotFile.size > 0) {
        const reader = new FileReader();
        reader.onload = e => saveTrade(e.target.result);
        reader.readAsDataURL(screenshotFile);
    } else saveTrade(null);
});

// Apply date filter
applyDateFilterBtn.addEventListener("click", () => {
    const start = startDateEl.value ? new Date(startDateEl.value) : null;
    const end = endDateEl.value ? new Date(endDateEl.value) : null;

    const filtered = trades.filter(t => {
        const tradeDate = new Date(t.date);
        return (!start || tradeDate >= start) && (!end || tradeDate <= end);
    });
    renderTrades(filtered);
});

// Clear filter
clearFilterBtn.addEventListener("click", () => renderTrades());

// Clear all trades
clearAllBtn.addEventListener("click", () => {
    if(confirm("Are you sure you want to clear all trades?")) {
        trades = [];
        localStorage.setItem("trades", JSON.stringify(trades));
        renderTrades();
    }
});

// Clear trades in date range
clearRangeBtn.addEventListener("click", () => {
    const start = startDateEl.value ? new Date(startDateEl.value) : null;
    const end = endDateEl.value ? new Date(endDateEl.value) : null;
    if(!start && !end) return alert("Select a start and/or end date.");
    trades = trades.filter(t => {
        const tradeDate = new Date(t.date);
        return (start && tradeDate < start) || (end && tradeDate > end);
    });
    localStorage.setItem("trades", JSON.stringify(trades));
    renderTrades();
});

// Chart.js
function updateChart(list) {
    const labels = list.map((t,i) => `Trade ${i+1}`);
    const data = list.map(t => t.profitLoss);

    if(gainChart) gainChart.destroy();

    gainChart = new Chart(gainChartCtx, {
        type: 'line',
        data: { labels, datasets:[{label:'Profit/Loss', data, backgroundColor:'rgba(16,185,129,0.3)', borderColor:'rgba(16,185,129,1)', borderWidth:2, fill:true, tension:0.2}]},
        options: { responsive:true, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }
    });
}

// Resize chart
resizeChartBtn.addEventListener("click", () => {
    gainChart.canvas.parentNode.style.width = chartWidthEl.value + "px";
    gainChart.canvas.parentNode.style.height = chartHeightEl.value + "px";
    gainChart.resize();
});

// Initial render
renderTrades();
