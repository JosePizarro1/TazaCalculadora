import requests as req
import json

BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"

def test_fetch(fiat, trade_type, amount=0):
    payload = {
        "asset": "USDT",
        "fiat": fiat,
        "merchantCheck": False,
        "page": 1,
        "payTypes": [],
        "publisherType": None,
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
        print(f"Results for {fiat} {trade_type} (Amount: {amount}):")
        if data.get("data") and len(data["data"]) > 0:
            for idx, item in enumerate(data["data"][:3]):
                print(f"  {idx+1}. Price: {item['adv']['price']} - Min: {item['adv']['minSingleTransAmount']} - Max: {item['adv']['maxSingleTransAmount']}")
            return True
        else:
            print("  No ads found.")
            print(f"  Response: {json.dumps(data, indent=2)}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

print("Testing CLP...")
test_fetch("CLP", "BUY", 0)
test_fetch("CLP", "BUY", 1000)
test_fetch("CLP", "BUY", 100000)
test_fetch("CLP", "SELL", 0)
