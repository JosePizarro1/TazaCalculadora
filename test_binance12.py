import requests

def fetch_best_rate(fiat, trade_type, asset="FDUSD"):
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

fetch_best_rate("BRL", "SELL")
fetch_best_rate("BRL", "BUY")

