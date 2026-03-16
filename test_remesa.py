import requests
import json

def test_conversion(origin, dest, amount=100, margin=3):
    url = "http://localhost:5001/api/remittance"
    payload = {"fiat_origin": origin, "fiat_dest": dest}
    
    print("="*60)
    print(f"🚀 TEST DE CONVERSIÓN: {origin} ➔ {dest}")
    print("="*60)
    
    try:
        response = requests.post(url, json=payload)
        data = response.json()
        
        if not data.get("success"):
            print(f"❌ Error: {data.get('error')}")
            return

        rates = data["rates"]
        origin_p2p = rates["origin_p2p"]
        dest_p2p = rates["dest_p2p"]
        market_cross = rates["market_cross"]
        
        # Cálculos
        market_total = amount * market_cross
        adjusted_rate = market_cross * (1 - (margin / 100))
        final_amount = amount * adjusted_rate
        
        print(f"\n1. DATOS DESDE BINANCE P2P:")
        print(f"   - Origen ({origin}): 1 USDT = {origin_p2p} {origin}")
        print(f"   - Destino ({dest}): 1 USDT = {dest_p2p} {dest}")
        print(f"   - Tasa Real Mercado: 1 {origin} = {market_cross:.8f} {dest}")
        
        print(f"\n2. LINKS PARA VERIFICAR EN VIVO:")
        print(f"   - Ver {origin}: https://p2p.binance.com/trade/buy/USDT?fiat={origin}")
        print(f"   - Ver {dest}: https://p2p.binance.com/trade/sell/USDT?fiat={dest}")
        
        print(f"\n3. CÁLCULO PARA {amount} {origin}:")
        print(f"   - Sin comisión (Mercado): {market_total:.2f} {dest}")
        print(f"   - Con comisión ({margin}%): {final_amount:.2f} {dest}")
        print(f"   - Tu ganancia: {amount * (margin/100):.2f} {origin}")

    except Exception as e:
        print(f"❌ No se pudo conectar con el servidor: {e}")
        print("Asegúrate de que 'app.py' esté corriendo en http://localhost:5001")

if __name__ == "__main__":
    test_conversion("PEN", "CLP")
