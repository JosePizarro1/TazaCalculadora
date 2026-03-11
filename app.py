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
    "MXN": {"name": "México", "symbol": "$", "flag": "🇲🇽"},
    "PEN": {"name": "Perú", "symbol": "S/", "flag": "🇵🇪"},
    "CLP": {"name": "Chile", "symbol": "$", "flag": "🇨🇱"},
    "BOB": {"name": "Bolivia", "symbol": "Bs", "flag": "🇧🇴"},
    "USD": {"name": "Panamá/USA", "symbol": "$", "flag": "🇺🇸"},
    "EUR": {"name": "España/Europa", "symbol": "€", "flag": "🇪🇺"},
    "DOP": {"name": "Rep. Dominicana", "symbol": "RD$", "flag": "🇩🇴"},
    "GTQ": {"name": "Guatemala", "symbol": "Q", "flag": "🇬🇹"},
    "HNL": {"name": "Honduras", "symbol": "L", "flag": "🇭🇳"},
    "NIO": {"name": "Nicaragua", "symbol": "C$", "flag": "🇳🇮"},
    "CRC": {"name": "Costa Rica", "symbol": "₡", "flag": "🇨🇷"},
    "PAB": {"name": "Panamá", "symbol": "B/.", "flag": "🇵🇦"},
    "PYG": {"name": "Paraguay", "symbol": "₲", "flag": "🇵🇾"},
    "UYU": {"name": "Uruguay", "symbol": "$U", "flag": "🇺🇾"},
    "CAD": {"name": "Canadá", "symbol": "$", "flag": "🇨🇦"},
}

def fetch_best_rate(fiat: str, trade_type: str, asset: str = "USDT"):
    """Obtiene la mejor tasa para una moneda específica."""
    payload = {
        "fiat": fiat,
        "page": 1,
        "rows": 5,
        "tradeType": trade_type,
        "asset": asset,
        "countries": [],
        "proMerchantAds": False,
        "shieldMerchantAds": False,
        "publisherType": None,
        "payTypes": [],
    }
    headers = {"Content-Type": "application/json"}
    try:
        response = req.post(BINANCE_P2P_URL, json=payload, headers=headers, timeout=5)
        data = response.json()
        if data.get("data") and len(data["data"]) > 0:
            return float(data["data"][0]["adv"]["price"])
        return 0
    except:
        return 0

@app.route("/")
def index():
    return render_template("index.html", fiat_currencies=FIAT_CURRENCIES)

@app.route("/api/remittance", methods=["POST"])
def remittance():
    data = request.get_json()
    fiat_origin = data.get("fiat_origin", "CLP")
    fiat_dest = data.get("fiat_dest", "PEN")
    
    # Tasa para COMPRAR USDT con moneda de origen (Ej: CLP -> USDT)
    rate_origin = fetch_best_rate(fiat_origin, "BUY")
    
    # Tasa para VENDER USDT y recibir moneda de destino (Ej: USDT -> PEN)
    rate_dest = fetch_best_rate(fiat_dest, "SELL")
    
    if rate_origin > 0 and rate_dest > 0:
        # Tasa de mercado (Cross rate)
        # 1 PEN = (rate_origin / rate_dest) CLP? No.
        # Monto_Dest = (Monto_Orig / rate_origin) * rate_dest
        # Tasa real = rate_dest / rate_origin
        market_cross_rate = rate_dest / rate_origin
        
        return jsonify({
            "success": True,
            "rates": {
                "origin_p2p": rate_origin,
                "dest_p2p": rate_dest,
                "market_cross": market_cross_rate
            },
            "fiat_origin": FIAT_CURRENCIES.get(fiat_origin),
            "fiat_dest": FIAT_CURRENCIES.get(fiat_dest)
        })
    
    return jsonify({"success": False, "error": "No se pudieron obtener las tasas."})

if __name__ == "__main__":
    # Usamos el puerto 5001 para evitar conflictos en Mac
    app.run(debug=True, port=5001)
