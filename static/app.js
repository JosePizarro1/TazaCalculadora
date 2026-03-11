document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const fiatOrigin = document.getElementById("fiatOrigin");
    const fiatDest = document.getElementById("fiatDest");
    const inputAmount = document.getElementById("inputAmount");
    const commission = document.getElementById("commission");
    const btnCalculate = document.getElementById("btnCalculate");
    const btnSwap = document.getElementById("btnSwap");
    const tabBtns = document.querySelectorAll(".tab-btn");

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
        "MXN": { name: "MÉXICO", symbol: "$", flag: "🇲🇽" },
        "USD": { name: "USA", symbol: "$", flag: "🇺🇸" },
        "DOP": { name: "REP. DOMINICANA", symbol: "RD$", flag: "🇩🇴" },
        "GTQ": { name: "GUATEMALA", symbol: "Q", flag: "🇬🇹" },
        "HNL": { name: "HONDURAS", symbol: "L", flag: "🇭🇳" },
        "NIO": { name: "NICARAGUA", symbol: "C$", flag: "🇳🇮" },
        "CRC": { name: "COSTA RICA", symbol: "₡", flag: "🇨🇷" },
        "PAB": { name: "PANAMÁ", symbol: "B/.", flag: "🇵🇦" },
        "PYG": { name: "PARAGUAY", symbol: "₲", flag: "🇵🇾" },
        "UYU": { name: "URUGUAY", symbol: "$U", flag: "🇺🇾" },
        "CAD": { name: "CANADÁ", symbol: "$", flag: "🇨🇦" },
        "EUR": { name: "EUROPA", symbol: "€", flag: "🇪🇺" }
    };

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

    // --- Tab Switching ---
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            // Aquí puedes cambiar la lógica según la pestaña si es necesario
        });
    });

    // --- Swap Button ---
    btnSwap.addEventListener("click", () => {
        const temp = fiatOrigin.value;
        fiatOrigin.value = fiatDest.value;
        fiatDest.value = temp;
        updateRates();
    });

    // --- Live Rates Section ---
    async function updateRatesGrid() {
        const currenciesToTrack = ["VES", "COP", "BRL", "CLP", "PEN", "ARS", "MXN", "DOP"];
        ratesGrid.innerHTML = "";

        // Mostramos placeholders mientras carga
        currenciesToTrack.forEach(() => {
            const skeleton = document.createElement("div");
            skeleton.className = "rate-card-skeleton";
            ratesGrid.appendChild(skeleton);
        });

        try {
            // Fetch rates against USD (standard)
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
                if (data.success) {
                    const price = data.rates.dest_p2p;
                    // Mock change percentage for UI
                    const change = (Math.random() * 2 - 1).toFixed(1);
                    const changeClass = change >= 0 ? "up" : "down";
                    const changeIcon = change >= 0 ? "↗" : "↘";

                    const card = document.createElement("div");
                    card.className = "rate-card";
                    card.innerHTML = `
                        <div class="rate-card-header">
                            <div class="rate-card-title">
                                <span class="flag">${info.flag}</span> ${fiat}
                            </div>
                            <div class="rate-change ${changeClass}">${changeIcon} ${Math.abs(change)}%</div>
                        </div>
                        <div class="rate-value">${price.toLocaleString("es-CL", { minimumFractionDigits: 2 })}</div>
                        <div class="rate-base">1 USD = ${price.toFixed(2)} ${fiat}</div>
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

        try {
            const response = await fetch("/api/remittance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fiat_origin: fiatOrigin.value,
                    fiat_dest: fiatDest.value
                })
            });

            const data = await response.json();
            console.log(`[TASAS] Actualización solicitada: ${fiatOrigin.value} -> ${fiatDest.value}`);
            console.log("[DATA API]", data);

            if (data.success) {
                calculateValues(data.rates);
            } else {
                console.error("Rate fetch failed:", data.error);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            btnCalculate.textContent = "ACTUALIZAR TASAS";
            btnCalculate.disabled = false;
        }
    }

    function calculateValues(rates) {
        const amount = parseFloat(inputAmount.value) || 0;
        const margin = parseFloat(commission.value) || 0;
        
        console.log(`[CÁLCULO] Monto: ${amount}, Margen: ${margin}%`);

        // Tasa Real Mercado (Cross Rate) de Binance
        const marketCross = rates.market_cross;
        marketRate.textContent = marketCross.toFixed(8);

        // Tasa Ajustada (Inversa que se muestra al cliente)
        const adjustedRate = marketCross * (1 - (margin / 100));
        const inverseRate = 1 / adjustedRate;
        finalRate.textContent = inverseRate.toFixed(4);

        // Cuánto recibe el cliente final
        const customerReceive = amount * adjustedRate;
        displayResult.textContent = customerReceive.toLocaleString("es-CL", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
        });

        console.log(`[RESULTADO] Cliente recibe: ${customerReceive} | Tasa Ajustada: ${adjustedRate}`);

        // Ganancias
        const gainOrigin = amount * (margin / 100);
        const gainDest = (amount * marketCross) * (margin / 100);

        profitOrigin.textContent = gainOrigin.toLocaleString("es-CL", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + " " + fiatOrigin.value;

        profitDest.textContent = gainDest.toLocaleString("es-CL", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
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
    // Refresh grid every minute
    setInterval(updateRatesGrid, 60000);
});
