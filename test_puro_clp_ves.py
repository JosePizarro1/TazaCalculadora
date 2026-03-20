import requests as req
import json

BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"

def fetch_p2p_no_amount(fiat, trade_type):
    """Obtiene la tasa pura de mercado sin filtrar por monto."""
    payload = {
        "asset": "USDT",
        "fiat": fiat,
        "merchantCheck": False,
        "page": 1,
        "payTypes": [],
        "publisherType": None,
        "rows": 1,
        "tradeType": trade_type,
        "transAmount": None, # NO FILTRAMOS POR MONTO
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
        return 0
    except:
        return 0

def run_pure_test():
    amount_clp = 1000  # Usamos 1000 como base para el ejemplo de cálculo
    commission = 3.0   # 3% de ganancia para ti
    
    print("=" * 60)
    print("   TEST CHILE -> VENEZUELA (TASA PURA SIN FILTRO DE MONTO)")
    print("=" * 60)
    print(f"Monto de prueba: {amount_clp} CLP")
    print(f"Comisión configurada: {commission}%")
    print("-" * 60)

    # PASO 1: Tasa pura de CLP
    rate_clp = fetch_p2p_no_amount("CLP", "BUY")
    print(f"1. Tasa de Mercado Chile (CLP):")
    print(f"   Mejor precio en Binance para COMPRAR USDT: 1 USDT = {rate_clp} CLP")

    # PASO 2: Tasa pura de VES
    rate_ves = fetch_p2p_no_amount("VES", "SELL")
    print(f"2. Tasa de Mercado Venezuela (VES):")
    print(f"   Mejor precio en Binance para VENDER USDT: 1 USDT = {rate_ves} VES")

    # PASO 3: Cálculo de la conversión directa
    # Esto es dividir lo que recibes (VES) por lo que entregas (CLP)
    market_cross = rate_ves / rate_clp
    print(f"3. Tasa de Cambio Real (CLP a VES):")
    print(f"   {rate_ves} / {rate_clp} = {market_cross:.8f} VES por cada 1 CLP")

    # PASO 4: Aplicar tu ganancia
    # La tasa final = tasa mercado * (100% - comisión%)
    final_cross = market_cross * (1 - (commission / 100))
    print(f"4. Aplicando tu comisión del {commission}%:")
    print(f"   {market_cross:.8f} * 0.97 = {final_cross:.8f} (Tasa que le das al cliente)")

    # PASO 5: Resultado para el cliente
    recibe_cliente = amount_clp * final_cross
    print("-" * 60)
    print(f"RESUMEN PARA EL CLIENTE:")
    print(f"Envía: {amount_clp} CLP")
    print(f"Tasa: {final_cross:.4f}")
    print(f"Recibe: {recibe_cliente:.2f} VES")
    print("-" * 60)
    
    # Ganancia para el negocio
    # Tú te quedas con el % del monto origen
    ganancia = amount_clp * (commission / 100)
    print(f"TU GANANCIA (en CLP): {ganancia:.2f} CLP")
    print("=" * 60)

if __name__ == "__main__":
    run_pure_test()
