import requests

def fetch_best_rate(fiat, trade_type, asset="USDT"):
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
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
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        print(f"[{fiat}] SUCCESS => {trade_type}")
        print(response.json())
    except Exception as e:
        print(f"[{fiat}] ERROR: {e}")

fetch_best_rate("BRL", "BUY")
fetch_best_rate("CLP", "SELL")
