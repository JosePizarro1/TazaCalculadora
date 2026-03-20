"""
Binance P2P Remittance & Arbitrage Calculator - Backend
Permite calcular envíos entre dos países usando USDT como puente.
"""

from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import requests as req

app = Flask(__name__)
CORS(app)

BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"

FIAT_CURRENCIES = {
    "VES": {"name": "Venezuela", "symbol": "Bs.", "flag": "🇻🇪"},
    "COP": {"name": "Colombia", "symbol": "$", "flag": "🇨🇴"},
    "ARS": {"name": "Argentina", "symbol": "$", "flag": "🇦🇷"},
    "BRL": {"name": "Brasil", "symbol": "R$", "flag": "🇧🇷"},
    "PEN": {"name": "Perú", "symbol": "S/", "flag": "🇵🇪"},
    "CLP": {"name": "Chile", "symbol": "$", "flag": "🇨🇱"},
    "USD": {"name": "USA", "symbol": "$", "flag": "🇺🇸"},
    "HNL": {"name": "Honduras", "symbol": "L", "flag": "🇭🇳"},
    "ECU": {"name": "Ecuador", "symbol": "$", "flag": "🇪🇨"},
}

def fetch_best_rate(fiat: str, trade_type: str, amount: float = 0, asset: str = "USDT"):
    """Obtiene la mejor tasa P2P directa de Binance."""
    # ECU usa USD en Binance
    binance_fiat = "USD" if fiat == "ECU" else fiat

    payload = {
        "asset": asset,
        "fiat": binance_fiat,
        "merchantCheck": False,
        "page": 1,
        "payTypes": [],
        "publisherType": "merchant", # Solo comerciantes verificados (Pro)
        "rows": 10,
        "tradeType": trade_type,
        "transAmount": amount if amount > 0 else None,
        "classifies": ["mass", "profession", "tier1", "tier2"]
    }
    
    headers = {
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Content-Type": "application/json",
        "Origin": "https://p2p.binance.com",
        "Referer": "https://p2p.binance.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }

    try:
        response = req.post(BINANCE_P2P_URL, json=payload, headers=headers, timeout=10)
        data = response.json()
        if data.get("data") and len(data["data"]) > 0:
            return float(data["data"][0]["adv"]["price"])
        
        # Si no hay anuncios con el monto específico, reintenta sin monto para tener una referencia
        if amount > 0:
            payload["transAmount"] = None
            response = req.post(BINANCE_P2P_URL, json=payload, headers=headers, timeout=10)
            data = response.json()
            if data.get("data") and len(data["data"]) > 0:
                return float(data["data"][0]["adv"]["price"])
                
        return 0
    except Exception as e:
        print(f"Error fetching P2P for {fiat}: {e}")
        return 0

@app.route("/")
def index():
    return render_template("index.html", fiat_currencies=FIAT_CURRENCIES)

@app.route("/api/remittance", methods=["POST"])
def remittance():
    data = request.get_json()
    fiat_origin = data.get("fiat_origin", "CLP")
    fiat_dest = data.get("fiat_dest", "PEN")
    amount = float(data.get("amount", 0))
    
    rate_origin = fetch_best_rate(fiat_origin, "BUY", amount)
    approx_usdt = amount / rate_origin if rate_origin > 0 else 0
    rate_dest = fetch_best_rate(fiat_dest, "SELL", approx_usdt)
    
    if fiat_origin in ["USD", "ECU"] and rate_origin > 1.0: rate_origin = 1.0
    if fiat_dest in ["USD", "ECU"] and rate_dest > 1.0: rate_dest = 1.0
    
    # Siempre retornar las tasas individuales que se pudieron obtener
    both_ok = rate_origin > 0 and rate_dest > 0
    market_cross_rate = (rate_dest / rate_origin) if both_ok else 0
    
    return jsonify({
        "success": both_ok,
        "rates": {
            "origin_p2p": rate_origin,
            "dest_p2p": rate_dest,
            "market_cross": market_cross_rate
        },
        "fiat_origin": FIAT_CURRENCIES.get(fiat_origin),
        "fiat_dest": FIAT_CURRENCIES.get(fiat_dest)
    })

@app.route("/api/fiat_info", methods=["POST"])
def fiat_info():
    data = request.get_json()
    fiat = data.get("fiat")
    if not fiat: return jsonify({"success": False})
    
    rate_buy = fetch_best_rate(fiat, "BUY")
    rate_sell = fetch_best_rate(fiat, "SELL")
    
    return jsonify({
        "success": True,
        "fiat": fiat,
        "binance": {
            "buy": rate_buy,
            "sell": rate_sell
        }
    })

if __name__ == "__main__":
    # Usamos el puerto 5001 para evitar conflictos en Mac
    app.run(debug=True, port=5001)
