import requests

def fetch_best_rate(fiat, trade_type):
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    payload = {
        "page": 1,
        "rows": 10,
        "payTypes": [],
        "classifies": [
            "mass",
            "profession",
            "tier1",
            "tier2"
        ],
        "asset": "USDT",
        "tradeType": trade_type,
        "fiat": fiat,
        "publisherType": None
    }
    
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Type": "application/json",
        "Host": "p2p.binance.com",
        "Origin": "https://p2p.binance.com",
        "Pragma": "no-cache",
        "TE": "Trailers",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()
        print(f"[{fiat}] SUCCESS => {trade_type}")
        if data.get("data") and len(data["data"]) > 0:
            return float(data["data"][0]["adv"]["price"])
        else:
            print(f"[{fiat}] NO DATA: {data}")
            return 0
    except Exception as e:
        print(f"[{fiat}] ERROR: {e}")
        return 0

print("BRL BUY:", fetch_best_rate("BRL", "BUY"))
print("BRL SELL:", fetch_best_rate("BRL", "SELL"))
