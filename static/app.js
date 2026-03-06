document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const fiatOrigin = document.getElementById("fiatOrigin");
    const fiatDest = document.getElementById("fiatDest");
    const inputAmount = document.getElementById("inputAmount");
    const commission = document.getElementById("commission");
    const btnCalculate = document.getElementById("btnCalculate");

    const displayResult = document.getElementById("displayResult");
    const destSymbol = document.getElementById("destSymbol");
    const marketRate = document.getElementById("marketRate");
    const finalRate = document.getElementById("finalRate");
    const summaryText = document.getElementById("summaryText");
    const profitFiat = document.getElementById("profitFiat");
    const profitPercent = document.getElementById("profitPercent");
    const profitLabel = document.getElementById("profitLabel");

    const FIAT_DATA = {
        "VES": { name: "VENEZUELA", symbol: "Bs." },
        "COP": { name: "COLOMBIA", symbol: "$" },
        "PEN": { name: "PERÚ", symbol: "S/" },
        "CLP": { name: "CHILE", symbol: "$" },
        "ARS": { name: "ARGENTINA", symbol: "$" },
        "BRL": { name: "BRASIL", symbol: "R$" },
        "MXN": { name: "MÉXICO", symbol: "$" },
        "USD": { name: "USA", symbol: "$" },
        "DOP": { name: "REP. DOMINICANA", symbol: "RD$" },
        "EUR": { name: "EUROPA", symbol: "€" }
    };

    async function updateRates() {
        btnCalculate.textContent = "CONSULTANDO BINANCE...";
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

            if (data.success) {
                calculateValues(data.rates);
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("Error de conexión con el servidor.");
        } finally {
            btnCalculate.textContent = "ACTUALIZAR TASAS EN VIVO";
            btnCalculate.disabled = false;
        }
    }

    function calculateValues(rates) {
        const amount = parseFloat(inputAmount.value) || 0;

        // El margen lo dejo por defecto en 3.0% (como el Excel que mandaste)
        // para que las ganancias no den cero, pero oculto el input para no romper el diseño.
        const margin = 3.0;

        // Tasa Real Mercado (Cross Rate) de Binance (Ej: 1 CLP = 0.0034 PEN)
        const marketCross = rates.market_cross;
        marketRate.textContent = marketCross.toFixed(8);

        // Tasa Ajustada (Inversa de lo que damos al cliente)
        const inverseRate = 1 / (marketCross * (1 - (margin / 100)));
        finalRate.textContent = inverseRate.toFixed(4);

        // Cuánto recibe el cliente final (Con margen automático del 3%)
        const customerReceive = amount * marketCross * (1 - (margin / 100));
        displayResult.textContent = customerReceive.toLocaleString("es-CL", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

        // Ganancias Dinámicas
        const gainSend = amount * (margin / 100);
        const gainReceive = (amount * marketCross) * (margin / 100);

        document.getElementById("profitOrigin").textContent = gainSend.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById("profitDest").textContent = gainReceive.toLocaleString("es-CL", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

        // Resumen Dinámico
        const originCode = fiatOrigin.value;
        const destCode = fiatDest.value;
        const destSym = FIAT_DATA[destCode]?.symbol || destCode;

        document.getElementById("sumAmount").textContent = amount.toLocaleString();
        document.getElementById("sumOrigin").textContent = originCode;
        document.getElementById("sumResult").textContent = customerReceive.toLocaleString("es-CL", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
        document.getElementById("sumDest").textContent = destSym;

        destSymbol.textContent = destSym;
        summaryText.textContent = `POR ENVIAR ${amount} ${originCode} EL CLIENTE RECIBE ${customerReceive.toFixed(3)} ${destCode}`;
    }

    // Interacciones
    btnCalculate.addEventListener("click", updateRates);
    inputAmount.addEventListener("input", () => calculateValues({ market_cross: parseFloat(marketRate.textContent) }));
    fiatOrigin.addEventListener("change", updateRates);
    fiatDest.addEventListener("change", updateRates);

    // Arranque inicial
    updateRates();
});
