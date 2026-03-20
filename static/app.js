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
    // Formato nuevo: { "VES": { "buy": 58.5, "sell": 57.0 }, "BRL": { "buy": 5.40, "sell": 5.30 } }
    // "buy" = cuánto cuesta COMPRAR 1 USDT con esa moneda (cuando es ORIGEN)
    // "sell" = cuánto recibes al VENDER 1 USDT por esa moneda (cuando es DESTINO)
    let localRates = {};

    function loadLocalRates() {
        try {
            const stored = JSON.parse(localStorage.getItem("manual_rates")) || {};
            // Migrar formato viejo (valor simple) al nuevo formato (buy/sell)
            const migrated = {};
            for (const [fiat, val] of Object.entries(stored)) {
                if (typeof val === "number") {
                    // Formato viejo: un solo número, usarlo para ambos
                    migrated[fiat] = { buy: val, sell: val };
                } else if (typeof val === "object" && val !== null) {
                    migrated[fiat] = val;
                }
            }
            localRates = migrated;
            localStorage.setItem("manual_rates", JSON.stringify(localRates));
        } catch {
            localRates = {};
        }
    }
    loadLocalRates();

    function saveLocalRate(fiat, buyRate, sellRate) {
        localRates[fiat] = {
            buy: parseFloat(buyRate) || 0,
            sell: parseFloat(sellRate) || 0
        };
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

    // Obtener tasa manual para cuando la moneda es ORIGEN (comprar USDT)
    function getManualBuyRate(fiat) {
        if (localRates[fiat] && localRates[fiat].buy > 0) return localRates[fiat].buy;
        return 0;
    }

    // Obtener tasa manual para cuando la moneda es DESTINO (vender USDT)
    function getManualSellRate(fiat) {
        if (localRates[fiat] && localRates[fiat].sell > 0) return localRates[fiat].sell;
        return 0;
    }

    // --- Modals Elements ---
    const missingRateModal = document.getElementById("missingRateModal");
    const btnCloseMissing = document.getElementById("btnCloseMissing");
    const inputMissingRateBuy = document.getElementById("inputMissingRateBuy");
    const inputMissingRateSell = document.getElementById("inputMissingRateSell");
    const btnSaveMissing = document.getElementById("btnSaveMissing");
    const missingRateText = document.getElementById("missingRateText");
    const modalTitle = document.getElementById("modalTitle");
    const refBuy = document.getElementById("refBuy");
    const refSell = document.getElementById("refSell");
    let pendingFiat = null;

    btnCloseMissing.onclick = () => {
        missingRateModal.style.display = "none";
    };

    const managerModal = document.getElementById("managerModal");
    const btnOpenManager = document.getElementById("btnOpenManager");
    const btnCloseManager = document.getElementById("btnCloseManager");
    const managerList = document.getElementById("managerList");
    const btnClearAll = document.getElementById("btnClearAll");

    // --- Missing Rate Modal Logic ---
    async function promptMissingRate(fiat) {
        pendingFiat = fiat;
        const info = FIAT_DATA[fiat];
        
        // Reset modal state
        modalTitle.textContent = "GESTIONAR TASA";
        missingRateText.textContent = `Establece las tasas manuales para ${info.flag} ${info.name}.`;
        refBuy.textContent = "Buscando...";
        refSell.textContent = "Buscando...";
        
        // Pre-rellenar con valores existentes si los hay
        const existing = localRates[fiat] || { buy: 0, sell: 0 };
        inputMissingRateBuy.value = existing.buy > 0 ? existing.buy : "";
        inputMissingRateSell.value = existing.sell > 0 ? existing.sell : "";
        
        missingRateModal.style.display = "flex";

        // Intentar obtener tasas de referencia de Binance
        try {
            const res = await fetch("/api/fiat_info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fiat: fiat })
            });
            const data = await res.json();
            if (data.success) {
                const bBuy = data.binance.buy;
                const bSell = data.binance.sell;
                
                refBuy.textContent = bBuy > 0 ? `B: ${bBuy.toFixed(2)}` : "B: N/A";
                refSell.textContent = bSell > 0 ? `B: ${bSell.toFixed(2)}` : "B: N/A";

                if (bBuy === 0 && bSell === 0) {
                    modalTitle.textContent = "TASA NO DISPONIBLE";
                    missingRateText.textContent = `Binance no tiene anuncios para ${info.flag} ${info.name}.`;
                } else {
                    modalTitle.textContent = "MODIFICAR TASA";
                    missingRateText.textContent = `Ajusta las tasas manuales para ${info.flag} ${info.name}.`;
                }
            }
        } catch (e) {
            console.error("Error fetching reference:", e);
            refBuy.textContent = "B: ERROR";
            refSell.textContent = "B: ERROR";
        }
    }

    btnSaveMissing.onclick = () => {
        const buyRate = parseFloat(inputMissingRateBuy.value) || 0;
        const sellRate = parseFloat(inputMissingRateSell.value) || 0;
        
        if (pendingFiat) {
            if (buyRate > 0 || sellRate > 0) {
                // Guardar tasa manual
                saveLocalRate(pendingFiat, buyRate, sellRate);
            } else {
                // Si ambas son 0 o están vacías, borrar la tasa manual
                deleteLocalRate(pendingFiat);
            }
            missingRateModal.style.display = "none";
            updateRates();
            updateRatesGrid();
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
            const rates = localRates[fiat];
            const item = document.createElement("div");
            item.className = "manager-item";
            item.innerHTML = `
                <div class="manager-info">
                    <span class="manager-country">${info.flag} ${fiat}</span>
                    <span class="manager-rate" style="font-size: 0.75rem; line-height: 1.3;">
                        COMPRA: ${rates.buy > 0 ? rates.buy : '—'}<br>
                        VENTA: ${rates.sell > 0 ? rates.sell : '—'}
                    </span>
                </div>
                <div class="manager-actions">
                    <button class="btn-edit-rate" data-fiat="${fiat}">EDITAR</button>
                    <button class="btn-delete-rate" data-fiat="${fiat}">BORRAR</button>
                </div>
            `;
            managerList.appendChild(item);
        });

        document.querySelectorAll(".btn-edit-rate").forEach(btn => {
            btn.onclick = (e) => {
                managerModal.style.display = "none";
                promptMissingRate(e.target.dataset.fiat);
            };
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

                // Para el grid usamos la tasa SELL (venta de USDT = cuánto recibes)
                const manualSell = getManualSellRate(fiat);
                if (manualSell > 0) {
                    price = manualSell;
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

                    // Hacer la card clicable para editar
                    card.style.cursor = "pointer";
                    card.title = "Clic para establecer tasa manual";
                    card.onclick = () => promptMissingRate(fiat);

                    ratesGrid.appendChild(card);
                } else {
                    const card = document.createElement("div");
                    card.className = "rate-card rate-card-error";
                    card.style.cursor = "pointer";
                    card.title = "Clic para establecer tasa manual";
                    card.onclick = () => promptMissingRate(fiat);

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
            
            // Obtener tasas individuales de Binance (ahora siempre vienen, aunque una sea 0)
            let rateOriginP2P = (data.rates && data.rates.origin_p2p) ? data.rates.origin_p2p : 0;
            let rateDestP2P = (data.rates && data.rates.dest_p2p) ? data.rates.dest_p2p : 0;

            // Sobreescribir SOLO con la tasa manual correspondiente al rol:
            // - Origen = COMPRAR USDT con esa moneda → usar tasa BUY
            // - Destino = VENDER USDT por esa moneda → usar tasa SELL
            const manualOrigin = getManualBuyRate(origin);
            const manualDest = getManualSellRate(dest);

            if (manualOrigin > 0) {
                rateOriginP2P = manualOrigin;
            }
            if (manualDest > 0) {
                rateDestP2P = manualDest;
            }

            if (rateOriginP2P > 0 && rateDestP2P > 0) {
                const crossRate = rateDestP2P / rateOriginP2P;
                calculateValues({
                    origin_p2p: rateOriginP2P,
                    dest_p2p: rateDestP2P,
                    market_cross: crossRate
                });
            } else {
                // Falta una tasa, solicitar al usuario
                if (rateOriginP2P === 0) {
                    promptMissingRate(origin);
                } else if (rateDestP2P === 0) {
                    promptMissingRate(dest);
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
