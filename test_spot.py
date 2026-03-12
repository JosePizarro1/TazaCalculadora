import requests
import time

def fetch_spot_rate(fiat):
    symbols = [f"USDT{fiat}", f"{fiat}USDT"]
    for symbol in symbols:
        url = f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}"
        try:
            response = requests.get(url, timeout=5)
            data = response.json()
            if "price" in data:
                price = float(data["price"])
                if symbol.startswith("USDT"):
                    return price
                else:
                    return 1.0 / price
        except Exception as e:
            pass
    return 0

for fiat in ["VES", "COP", "ARS", "BRL", "MXN", "PEN", "CLP", "BOB", "EUR", "DOP", "GTQ", "HNL", "NIO", "CRC", "PAB", "PYG", "UYU", "CAD"]:
    print(f"{fiat} SPOT:", fetch_spot_rate(fiat))
    time.sleep(0.1)

