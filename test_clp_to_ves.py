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
        "rows": 1,
        "tradeType": trade_type,
        "transAmount": amount if amount > 0 else None,
        "classifies": ["mass", "profession", "tier1", "tier2"]
    }
    
    headers = {
        "Accept": "*/*",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }

    try:
        response = req.post(BINANCE_P2P_URL, json=payload, headers=headers, timeout=10)
        data = response.json()
        if data.get("data") and len(data["data"]) > 0:
            return float(data["data"][0]["adv"]["price"])
        
        # Retry without amount if failed
        if amount > 0:
            payload["transAmount"] = None
            response = req.post(BINANCE_P2P_URL, json=payload, headers=headers, timeout=10)
            data = response.json()
            if data.get("data") and len(data["data"]) > 0:
                return float(data["data"][0]["adv"]["price"])
        return 0
    except:
        return 0

def run_test():
    amount_clp = 100
    commission = 3.0  # 3% margin
    
    print(f"--- TEST PASO A PASO: CHILE (CLP) -> VENEZUELA (VES) ---")
    print(f"Monto Inicial: {amount_clp} CLP")
    print(f"Margen: {commission}%")
    print("-" * 50)

    # PASO 1: Obtener tasa para comprar USDT con CLP
    rate_clp = fetch_p2p("CLP", "BUY", amount_clp)
    if rate_clp == 0:
        print("Error: No se pudo obtener tasa para CLP")
        return

    approx_usdt = amount_clp / rate_clp
    print(f"1. Tasa Compra (Chile): 1 USDT = {rate_clp} CLP")
    print(f"   => Con {amount_clp} CLP compras: {approx_usdt:.4f} USDT")

    # PASO 2: Obtener tasa para vender USDT por VES
    # Usamos el approx_usdt para filtrar por monto si es posible
    rate_ves = fetch_p2p("VES", "SELL", approx_usdt)
    if rate_ves == 0:
        print("Error: No se pudo obtener tasa para VES")
        return

    print(f"2. Tasa Venta (Venezuela): 1 USDT = {rate_ves} VES")
    
    # PASO 3: Cálculo Final
    market_cross = rate_ves / rate_clp
    print(f"3. Tasa de Mercado Directa: 1 CLP = {market_cross:.8f} VES")
    
    # Aplicar margen
    final_cross = market_cross * (1 - (commission / 100))
    final_amount = amount_clp * final_cross
    
    print("-" * 50)
    print(f"RESULTADO FINAL:")
    print(f"Tasa Aplicada (c/ margen): {final_cross:.8f} VES/CLP")
    print(f"El cliente recibe: {final_amount:.2f} VES")
    
    gain_clp = amount_clp * (commission / 100)
    print(f"Tu ganancia estimada: {gain_clp:.2f} CLP")

if __name__ == "__main__":
    run_test()
