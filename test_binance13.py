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
        print(f"[{fiat}] P2P SUCCESS => {trade_type}")
        if data.get("data") and len(data["data"]) > 0:
            return float(data["data"][0]["adv"]["price"])
        else:
            return 0
    except Exception as e:
        print(f"[{fiat}] ERROR: {e}")
        return 0

def fetch_spot_rate(fiat):
    symbol = f"USDT{fiat}"
    url = f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}"
    try:
        response = requests.get(url, timeout=5)
        data = response.json()
        if "price" in data:
            print(f"[{fiat}] SPOT SUCCESS")
            return float(data["price"])
        return 0
    except:
        return 0

p2p_sell = fetch_best_rate("BRL", "SELL")
p2p_buy = fetch_best_rate("BRL", "BUY")
spot = fetch_spot_rate("BRL")

print(f"P2P SELL: {p2p_sell}")
print(f"P2P BUY: {p2p_buy}")
print(f"SPOT: {spot}")

