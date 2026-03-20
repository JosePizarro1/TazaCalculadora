import requests as req
import json

BINANCE_P2P_URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"

def get_rates(fiat, trade_type, publisher_type=None):
    payload = {
        "asset": "USDT",
        "fiat": fiat,
        "merchantCheck": False,
        "page": 1,
        "payTypes": [],
        "publisherType": publisher_type,
        "rows": 5,
        "tradeType": trade_type,
        "transAmount": None,
        "classifies": ["mass", "profession", "tier1", "tier2"]
    }
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    }
    res = req.post(BINANCE_P2P_URL, json=payload, headers=headers).json()
    return res.get("data", [])

print("--- DIAGNÓSTICO DE TASAS ---")

# CHILE (BUY)
clp_all = get_rates("CLP", "BUY", None)
clp_merch = get_rates("CLP", "BUY", "merchant")

print("\n[CHILE - CLP] Comprando USDT (BUY)")
print("  TODOS LOS ANUNCIOS:")
for i, a in enumerate(clp_all[:3]):
    print(f"    {i+1}. {a['adv']['price']} (Min: {a['adv']['minSingleTransAmount']} CLP) - User: {a['advertiser']['nickName']} (Merch: {a['advertiser']['userType']})")

print("  SOLO COMERCIANTES VERIFICADOS:")
for i, a in enumerate(clp_merch[:3]):
    print(f"    {i+1}. {a['adv']['price']} (Min: {a['adv']['minSingleTransAmount']} CLP) - User: {a['advertiser']['nickName']}")

# VENEZUELA (SELL)
ves_all = get_rates("VES", "SELL", None)
ves_merch = get_rates("VES", "SELL", "merchant")

print("\n[VENEZUELA - VES] Vendiendo USDT (SELL)")
print("  TODOS LOS ANUNCIOS:")
for i, a in enumerate(ves_all[:3]):
    print(f"    {i+1}. {a['adv']['price']} (Min: {a['adv']['minSingleTransAmount']} VES) - User: {a['advertiser']['nickName']} (Merch: {a['advertiser']['userType']})")

print("  SOLO COMERCIANTES VERIFICADOS:")
for i, a in enumerate(ves_merch[:3]):
    print(f"    {i+1}. {a['adv']['price']} (Min: {a['adv']['minSingleTransAmount']} VES) - User: {a['advertiser']['nickName']}")
