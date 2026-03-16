document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const fiatOrigin = document.getElementById("fiatOrigin");
    const fiatDest = document.getElementById("fiatDest");
    const inputAmount = document.getElementById("inputAmount");
    const commission = document.getElementById("commission");
    const btnCalculate = document.getElementById("btnCalculate");
    const btnSwap = document.getElementById("btnSwap");

    const displayResult = document.getElementById("displayResult");
    const marketRate = document.getElementById("marketRate");
    const finalRate = document.getElementById("finalRate");
    const profitOrigin = document.getElementById("profitOrigin");
    const profitDest = document.getElementById("profitDest");
    const ratesGrid = document.getElementById("ratesGrid");

    const FIAT_DATA = {
        "VES": { name: "VENEZUELA", symbol: "Bs.", flag: "🇻🇪" },
        "COP": { name: "COLOMBIA", symbol: "$", flag: "🇨🇴" },
        "PEN": { name: "PERÚ", symbol: "S/", flag: "🇵🇪" },
        "CLP": { name: "CHILE", symbol: "$", flag: "🇨🇱" },
        "ARS": { name: "ARGENTINA", symbol: "$", flag: "🇦🇷" },
        "BRL": { name: "BRASIL", symbol: "R$", flag: "🇧🇷" },
        "USD": { name: "USA", symbol: "$", flag: "🇺🇸" },
        "HNL": { name: "HONDURAS", symbol: "L", flag: "🇭🇳" },
        "ECU": { name: "ECUADOR", symbol: "$", flag: "🇪🇨" }
    };

    // --- LocalStorage Logic ---
    let localRates = JSON.parse(localStorage.getItem("manual_rates")) || {};

    function saveLocalRate(fiat, rate) {
        localRates[fiat] = parseFloat(rate);
        localStorage.setItem("manual_rates", JSON.stringify(localRates));
        renderManagerList();
    }

    function deleteLocalRate(fiat) {
        delete localRates[fiat];
        localStorage.setItem("manual_rates", JSON.stringify(localRates));
        renderManagerList();
        updateRates();
        updateRatesGrid();
    }

    // --- Modals Elements ---
    const missingRateModal = document.getElementById("missingRateModal");
    const inputMissingRate = document.getElementById("inputMissingRate");
    const btnSaveMissing = document.getElementById("btnSaveMissing");
    const missingRateText = document.getElementById("missingRateText");
    let pendingFiat = null;

    const managerModal = document.getElementById("managerModal");
    const btnOpenManager = document.getElementById("btnOpenManager");
    const btnCloseManager = document.getElementById("btnCloseManager");
    const managerList = document.getElementById("managerList");
    const btnClearAll = document.getElementById("btnClearAll");

    // --- Missing Rate Modal Logic ---
    function promptMissingRate(fiat) {
        pendingFiat = fiat;
        const info = FIAT_DATA[fiat];
        missingRateText.textContent = `Binance no tiene anuncios para ${info.flag} ${info.name}. Establece una tasa manual para continuar.`;
        inputMissingRate.value = "";
        missingRateModal.style.display = "flex";
    }

    btnSaveMissing.onclick = () => {
        const rate = parseFloat(inputMissingRate.value);
        if (rate > 0 && pendingFiat) {
            saveLocalRate(pendingFiat, rate);
            missingRateModal.style.display = "none";
            updateRates();
            updateRatesGrid();
        } else {
            alert("Por favor ingresa una tasa válida.");
        }
    };

    // --- Manager Modal Logic ---
    btnOpenManager.onclick = () => {
        renderManagerList();
        managerModal.style.display = "flex";
    };

    btnCloseManager.onclick = () => {
        managerModal.style.display = "none";
    };

    btnClearAll.onclick = () => {
        if (confirm("¿Estás seguro de borrar TODAS las tasas manuales?")) {
            localRates = {};
            localStorage.removeItem("manual_rates");
            renderManagerList();
            updateRates();
            updateRatesGrid();
        }
    };

    function renderManagerList() {
        managerList.innerHTML = "";
        const keys = Object.keys(localRates);
        if (keys.length === 0) {
            managerList.innerHTML = "<p style='grid-column: 1/-1; text-align:center; opacity:0.5; padding: 20px;'>No hay tasas manuales guardadas.</p>";
            return;
        }

        keys.forEach(fiat => {
            const info = FIAT_DATA[fiat];
            const rate = localRates[fiat];
            const item = document.createElement("div");
            item.className = "manager-item";
            item.innerHTML = `
                <div class="manager-info">
                    <span class="manager-country">${info.flag} ${fiat}</span>
                    <span class="manager-rate">${rate}</span>
                </div>
                <button class="btn-delete-rate" data-fiat="${fiat}">BORRAR</button>
            `;
            managerList.appendChild(item);
        });

        document.querySelectorAll(".btn-delete-rate").forEach(btn => {
            btn.onclick = (e) => deleteLocalRate(e.target.dataset.fiat);
        });
    }

    // --- Ticker Clocks ---
    function updateClocks() {
        const timeElements = document.querySelectorAll(".ticker__item .time");
        timeElements.forEach(el => {
            const timezone = el.dataset.timezone;
            try {
                const timeStr = new Intl.DateTimeFormat("en-US", {
                    timeZone: timezone,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                }).format(new Date());
                el.textContent = timeStr;
            } catch (e) {
                el.textContent = "--:--:--";
            }
        });
    }
    setInterval(updateClocks, 1000);
    updateClocks();

    // --- Swap Button ---
    btnSwap.addEventListener("click", () => {
        const temp = fiatOrigin.value;
        fiatOrigin.value = fiatDest.value;
        fiatDest.value = temp;
        updateRates();
    });

    // --- Live Rates Section ---
    async function updateRatesGrid() {
        const currenciesToTrack = ["VES", "COP", "PEN", "CLP", "ARS", "BRL", "USD", "HNL", "ECU"];
        ratesGrid.innerHTML = "";

        currenciesToTrack.forEach(() => {
            const skeleton = document.createElement("div");
            skeleton.className = "rate-card-skeleton";
            ratesGrid.appendChild(skeleton);
        });

        try {
            const promises = currenciesToTrack.map(fiat =>
                fetch("/api/remittance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fiat_origin: "USD", fiat_dest: fiat })
                }).then(res => res.json())
            );

            const results = await Promise.all(promises);
            ratesGrid.innerHTML = "";

            results.forEach((data, index) => {
                const fiat = currenciesToTrack[index];
                const info = FIAT_DATA[fiat];
                
                let price = data.success ? data.rates.dest_p2p : 0;
                let isManual = false;

                if (localRates[fiat]) {
                    price = localRates[fiat];
                    isManual = true;
                }

                if (price > 0) {
                    const change = (Math.random() * 2 - 1).toFixed(1);
                    const changeClass = change >= 0 ? "up" : "down";
                    const changeIcon = change >= 0 ? "↗" : "↘";

                    const card = document.createElement("div");
                    card.className = "rate-card";
                    if (isManual) card.style.borderColor = "var(--gold-primary)";
                    
                    card.innerHTML = `
                        <div class="rate-card-header">
                            <div class="rate-card-title">
                                <span class="flag">${info.flag}</span> ${fiat}
                                ${isManual ? '<span class="rate-badge rate-badge-manual" style="margin-left:8px">M</span>' : ''}
                            </div>
                            <div class="rate-change ${changeClass}">${changeIcon} ${Math.abs(change)}%</div>
                        </div>
                        <div class="rate-value">${price.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div class="rate-base">1 USD = ${price.toFixed(2)} ${fiat}</div>
                    `;
                    ratesGrid.appendChild(card);
                } else {
                    const card = document.createElement("div");
                    card.className = "rate-card rate-card-error";
                    card.innerHTML = `
                        <div class="rate-card-header">
                            <div class="rate-card-title">
                                <span class="flag">${info.flag}</span> ${fiat}
                            </div>
                        </div>
                        <div class="rate-value" style="font-size: 0.9rem; opacity: 0.6;">Sin datos</div>
                    `;
                    ratesGrid.appendChild(card);
                }
            });
        } catch (error) {
            console.error("Error updating grid:", error);
        }
    }

    // --- Calculator Logic ---
    async function updateRates() {
        btnCalculate.textContent = "CONSULTANDO...";
        btnCalculate.disabled = true;

        const origin = fiatOrigin.value;
        const dest = fiatDest.value;

        try {
            const response = await fetch("/api/remittance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fiat_origin: origin,
                    fiat_dest: dest,
                    amount: inputAmount.value
                })
            });

            const data = await response.json();
            
            if (data.success) {
                let rates = data.rates;
                let usedManual = false;

                if (localRates[origin]) {
                    rates.origin_p2p = localRates[origin];
                    usedManual = true;
                }
                if (localRates[dest]) {
                    rates.dest_p2p = localRates[dest];
                    usedManual = true;
                }

                if (usedManual) {
                    rates.market_cross = rates.dest_p2p / rates.origin_p2p;
                }

                calculateValues(rates);
            } else {
                const rateOrigin = localRates[origin] || 0;
                const rateDest = localRates[dest] || 0;

                if (rateOrigin > 0 && rateDest > 0) {
                    calculateValues({
                        origin_p2p: rateOrigin,
                        dest_p2p: rateDest,
                        market_cross: rateDest / rateOrigin
                    });
                } else {
                    if (!localRates[origin] && (!data.rates || data.rates.origin_p2p === 0)) promptMissingRate(origin);
                    else if (!localRates[dest] && (!data.rates || data.rates.dest_p2p === 0)) promptMissingRate(dest);
                }
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            btnCalculate.textContent = "ACTUALIZAR DATOS";
            btnCalculate.disabled = false;
        }
    }

    function calculateValues(rates) {
        const amount = parseFloat(inputAmount.value) || 0;
        const margin = parseFloat(commission.value) || 0;
        
        const marketCross = rates.market_cross;
        marketRate.textContent = marketCross.toFixed(8);

        const adjustedRate = marketCross * (1 - (margin / 100));
        const inverseRate = 1 / adjustedRate;
        finalRate.textContent = inverseRate.toFixed(4);

        const finalOutputAmount = amount * adjustedRate;

        displayResult.textContent = finalOutputAmount.toLocaleString("es-CL", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        const gainOrigin = amount * (margin / 100);
        const gainDest = (amount * marketCross) * (margin / 100);

        profitOrigin.textContent = gainOrigin.toLocaleString("es-CL", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " " + fiatOrigin.value;

        profitDest.textContent = gainDest.toLocaleString("es-CL", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " " + fiatDest.value;
    }

    // --- Event Listeners ---
    btnCalculate.addEventListener("click", updateRates);
    inputAmount.addEventListener("input", () => {
        const currentRate = parseFloat(marketRate.textContent);
        if (currentRate) calculateValues({ market_cross: currentRate });
    });
    commission.addEventListener("input", () => {
        const currentRate = parseFloat(marketRate.textContent);
        if (currentRate) calculateValues({ market_cross: currentRate });
    });
    fiatOrigin.addEventListener("change", updateRates);
    fiatDest.addEventListener("change", updateRates);

    // --- Initial Load ---
    updateRatesGrid();
    updateRates();
    setInterval(updateRatesGrid, 60000);
});
