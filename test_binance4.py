import requests
import json

def fetch_best_rate(fiat, trade_type, asset="USDT"):
    url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
    payload = {
        "fiat": fiat,
        "page": 1,
        "rows": 10,
        "tradeType": trade_type,
        "asset": asset,
        "countries": [],
        "proMerchantAds": False,
        "shieldMerchantAds": False,
        "publisherType": "merchant",
        "payTypes": []
    }
    headers = {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Length": "253",
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
            print(float(data["data"][0]["adv"]["price"]))
        else:
            print(f"[{fiat}] NO DATA")
    except Exception as e:
        print(f"[{fiat}] ERROR: {e}")

fetch_best_rate("BRL", "SELL")
fetch_best_rate("BRL", "BUY")
fetch_best_rate("CLP", "SELL")
fetch_best_rate("CLP", "BUY")
