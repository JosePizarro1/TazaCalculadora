import requests

def fetch_best_rate(fiat, trade_type, asset="USDT"):
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    payload = {
        "page": 1,
        "rows": 10,
        "payTypes": [],
        "asset": asset,
        "tradeType": trade_type,
        "fiat": fiat,
        "publisherType": None
    }
    
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()
        print(f"[{fiat}] SUCCESS => {trade_type}")
        if data.get("data") and len(data["data"]) > 0:
            print(float(data["data"][0]["adv"]["price"]))
        else:
            print(f"[{fiat}] NO DATA")
            print(data)
    except Exception as e:
        print(f"[{fiat}] ERROR: {e}")

fetch_best_rate("PEN", "SELL")
fetch_best_rate("PEN", "BUY")
fetch_best_rate("BOB", "SELL")
fetch_best_rate("BOB", "BUY")
fetch_best_rate("USD", "SELL")
fetch_best_rate("USD", "BUY")
fetch_best_rate("EUR", "SELL")
fetch_best_rate("EUR", "BUY")
fetch_best_rate("DOP", "SELL")
fetch_best_rate("DOP", "BUY")
fetch_best_rate("GTQ", "SELL")
fetch_best_rate("GTQ", "BUY")
fetch_best_rate("HNL", "SELL")
fetch_best_rate("HNL", "BUY")
fetch_best_rate("NIO", "SELL")
fetch_best_rate("NIO", "BUY")
fetch_best_rate("CRC", "SELL")
fetch_best_rate("CRC", "BUY")
fetch_best_rate("PAB", "SELL")
fetch_best_rate("PAB", "BUY")
fetch_best_rate("PYG", "SELL")
fetch_best_rate("PYG", "BUY")
fetch_best_rate("UYU", "SELL")
fetch_best_rate("UYU", "BUY")
fetch_best_rate("CAD", "SELL")
fetch_best_rate("CAD", "BUY")

