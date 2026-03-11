# 🧮 Binance P2P Remittance & Arbitrage Calculator

Una calculadora avanzada diseñada para gestionar remesas y arbitraje utilizando el mercado P2P de Binance como fuente de liquidez. Este sistema permite calcular conversiones entre múltiples divisas utilizando **USDT** como puente, aplicando márgenes de ganancia personalizados y visualizando tasas en tiempo real.

## ✨ Características

- **Tasas en Vivo**: Conexión directa con la API de Binance P2P para obtener los mejores precios de compra/venta.
- **Multidivisa**: Soporte para más de 15 monedas (COP, VES, ARS, BRL, MXN, PEN, CLP, USD, EUR, etc.).
- **Calculadora Bidireccional**: Alterna fácilmente entre "Envía" y "Recibe".
- **Gestión de Márgenes**: Aplica comisiones personalizables para calcular ganancias brutas.
- **Visualizador de Husos Horarios**: Ticker dinámico con la hora local de los principales mercados.
- **Interfaz Premium**: Diseño moderno, responsivo y con efectos visuales de alta calidad.

## 🚀 Instalación y Configuración

Sigue estos pasos para ejecutar el proyecto localmente:

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd TazaCalculadora
```

### 2. Crear un entorno virtual
Se recomienda el uso de `venv` para aislar las dependencias:
```bash
python3 -m venv venv
```

### 3. Activar el entorno virtual
- **macOS/Linux:**
  ```bash
  source venv/bin/activate
  ```
- **Windows:**
  ```bash
  venv\Scripts\activate
  ```

### 4. Instalar dependencias
```bash
pip install -r requirements.txt
```

> **Nota para Mac:** Si el comando `pip` no funciona, intenta con `pip3`.

## 🛠️ Ejecución

Para iniciar el servidor de Flask, ejecuta:

```bash
python3 app.py
```

El servidor se iniciará por defecto en: [http://127.0.0.1:5001](http://127.0.0.1:5001)

> **Nota:** Se utiliza el puerto `5001` para evitar conflictos conocidos con servicios de AirPlay en sistemas macOS.

## 📂 Estructura del Proyecto

- `app.py`: Backend en Flask, maneja la lógica de la API y las peticiones a Binance.
- `templates/`: Contiene el archivo `index.html`.
- `static/`:
  - `styles.css`: Estilos personalizados (Glassmorphism, Dark Mode).
  - `app.js`: Lógica del frontend, actualizaciones de DOM y cálculos locales.
- `requirements.txt`: Lista de dependencias del proyecto.

## ⚙️ Tecnologías Utilizadas

- **Backend**: Python 3, Flask.
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **API**: Binance P2P API (vía Flask backend).

## 🌍 Despliegue en Vercel

Este proyecto está configurado para ser desplegado en **Vercel** usando el runtime oficial de Python.

1.  **Instalar Vercel CLI**: `npm i -g vercel`
2.  **Iniciar sesión**: `vercel login`
3.  **Desplegar**: Ejecuta `vercel` en la raíz del proyecto.
4.  **Configuración**: El archivo `vercel.json` ya está incluido para manejar el ruteo hacia `app.py`.

> **Tip**: Si despliegas desde GitHub, Vercel detectará automáticamente el archivo `vercel.json` y configurará el entorno.

---
Desarrollado para optimizar procesos de transferencia y trading de criptoactivos.
