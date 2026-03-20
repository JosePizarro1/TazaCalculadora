import requests as req
import json

BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"

def fetch_p2p(fiat, trade_type, amount=0):
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
        if data.get("data") and len(data["data"]) > 0:
            return float(data["data"][0]["adv"]["price"])
        
        print(f"DEBUG {fiat} {trade_type}: {data}") 
        
        # Retry without amount if failed
        if amount > 0:
            payload["transAmount"] = None
            response = req.post(BINANCE_P2P_URL, json=payload, headers=headers, timeout=10)
            data = response.json()
            if data.get("data") and len(data["data"]) > 0:
                return float(data["data"][0]["adv"]["price"])
        return 0
    except Exception as e:
        print(f"Error request for {fiat}: {e}")
        return 0

def run_test():
    print("=" * 60)
    print("🔍 TEST DE TASAS P2P: CHILE -> BRASIL -> PERÚ")
    print("=" * 60)

    # 1. CHILE (CLP) -> BRASIL (BRL)
    print("\n--- [1] CHILE (CLP) a BRASIL (BRL) ---")
    rate_clp_buy = fetch_p2p("CLP", "BUY", 100000) # Referencia 100k CLP
    rate_brl_sell = fetch_p2p("BRL", "SELL")
    
    if rate_clp_buy > 0 and rate_brl_sell > 0:
        clp_to_brl = rate_brl_sell / rate_clp_buy
        print(f"🇨🇱 CLP Compra USDT: 1 USDT = {rate_clp_buy} CLP")
        print(f"🇧🇷 BRL Venta USDT:  1 USDT = {rate_brl_sell} BRL")
        print(f"📈 TASA DIRECTA: 1,000 CLP = {(clp_to_brl * 1000):.4f} BRL")
        print(f"💡 1 BRL = {(1/clp_to_brl):.2f} CLP")
    else:
        print("❌ Error obteniendo tasas para CLP/BRL")

    # 2. BRASIL (BRL) -> PERÚ (PEN)
    print("\n--- [2] BRASIL (BRL) a PERÚ (PEN) ---")
    rate_brl_buy = fetch_p2p("BRL", "BUY")
    rate_pen_sell = fetch_p2p("PEN", "SELL")
    
    if rate_brl_buy > 0 and rate_pen_sell > 0:
        brl_to_pen = rate_pen_sell / rate_brl_buy
        print(f"🇧🇷 BRL Compra USDT: 1 USDT = {rate_brl_buy} BRL")
        print(f"🇵🇪 PEN Venta USDT:  1 USDT = {rate_pen_sell} PEN")
        print(f"📈 TASA DIRECTA: 1 BRL = {brl_to_pen:.4f} PEN")
        print(f"💡 1 PEN = {(1/brl_to_pen):.2f} BRL")
    else:
        print("❌ Error obteniendo tasas para BRL/PEN")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    run_test()
