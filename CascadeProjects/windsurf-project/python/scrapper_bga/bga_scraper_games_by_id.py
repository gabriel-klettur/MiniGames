from __future__ import annotations
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
import json
from pathlib import Path
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

"""
Scraper de BGA: extrae el HTML completo del bloque <div id="gamelogs"> para
cada partida (table_id) listada en table_ids.json. Evita reprocesar IDs ya
scrapeados gracias a scraped_ids.json. Requiere login manual antes de iniciar.

Flujo:
- Abre navegador en boardgamearena.com
- Espera a que el usuario haga login y presione ENTER en la terminal
- Lee IDs desde table_ids.json
- Filtra los que ya estén en scraped_ids.json
- Para cada ID pendiente:
  * Visita https://boardgamearena.com/gamereview?table=<ID>
  * Espera a que #gamelogs esté presente y con contenido
  * Guarda el outerHTML en gamelogs/gamelogs_<ID>.html
  * Añade el ID a scraped_ids.json

Nota: El navegador queda abierto (detach=True) para facilitar inspección.
"""

# Rutas y configuración
JSON_PATH = Path(__file__).parent / "table_ids.json"           # IDs a procesar
SCRAPED_JSON_PATH = Path(__file__).parent / "scraped_ids.json"  # IDs ya procesados
OUTPUT_DIR = Path(__file__).parent / "gamelogs"                 # Carpeta de salida


def load_ids(path: Path) -> set[str]:
    """Carga un conjunto de IDs desde un JSON.

    El archivo puede ser una lista o un diccionario con clave 'ids'. Si no existe
    o hay error, retorna un set vacío. Todos los IDs se normalizan a str.
    """
    if not path.exists():
        return set()
    try:
        with path.open('r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            return {str(x) for x in data}
        if isinstance(data, dict) and isinstance(data.get('ids'), list):
            return {str(x) for x in data['ids']}
    except Exception as e:
        print(f"⚠️ No se pudo leer {path.name}: {e}. Se continuará con un conjunto vacío.")
    return set()


def save_ids(path: Path, ids: set[str]) -> None:
    """Guarda un conjunto de IDs como lista ordenada en JSON."""
    try:
        with path.open('w', encoding='utf-8') as f:
            json.dump(sorted(ids), f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"❌ Error guardando {path.name}: {e}")


def ensure_dir(path: Path) -> None:
    """Crea la carpeta si no existe (idempotente)."""
    try:
        path.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"❌ No se pudo crear el directorio {path}: {e}")


def fetch_gamelogs_html(driver: webdriver.Chrome, table_id: str, timeout: int = 15) -> str | None:
    """Abre la página de 'gamereview?table=<id>' y devuelve el HTML completo del div#gamelogs.

    Retorna None si no logra encontrar contenido en el tiempo dado (p.ej., partida
    privada, sin datos o red lenta).
    """
    url = f"https://boardgamearena.com/gamereview?table={table_id}"
    print(f"\n➡️ Abriendo: {url}")
    driver.get(url)

    try:
        # Esperar a que exista el contenedor principal
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.ID, "gamelogs"))
        )

        # Esperar a que tenga contenido útil (al menos un bloque de log)
        WebDriverWait(driver, timeout).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "#gamelogs .gamelogreview")) > 0
        )

        gamelogs_el = driver.find_element(By.ID, "gamelogs")
        outer_html = gamelogs_el.get_attribute("outerHTML")
        if outer_html and outer_html.strip():
            return outer_html
        return None
    except TimeoutException:
        print("⏱️ Timeout esperando contenido de gamelogs (puede ser partida privada o sin datos)")
        return None
    except Exception as e:
        print(f"❌ Error obteniendo gamelogs para {table_id}: {e}")
        return None


def save_gamelogs_html(table_id: str, html: str) -> Path | None:
    """Guarda el HTML extraído en un archivo dentro de OUTPUT_DIR. Devuelve la ruta si OK."""
    ensure_dir(OUTPUT_DIR)
    out_path = OUTPUT_DIR / f"gamelogs_{table_id}.html"
    try:
        with out_path.open("w", encoding="utf-8") as f:
            f.write("<!-- Fuente: https://boardgamearena.com/gamereview?table=" + table_id + " -->\n")
            f.write(html)
        return out_path
    except Exception as e:
        print(f"❌ No se pudo guardar {out_path.name}: {e}")
        return None


# ====== Ejecución principal ======
if __name__ == "__main__":
    # Configuración del navegador
    options = Options()
    options.add_argument('--start-maximized')
    options.add_experimental_option("detach", True)
    driver = webdriver.Chrome(options=options)

    try:
        # PASO 1: Iniciar navegador e ir al login de BGA
        driver.get("https://boardgamearena.com")
        print("⚠️ Inicia sesión manualmente en el navegador, luego presiona ENTER aquí para comenzar…")
        input()

        # PASO 2: Cargar IDs y preparar estado de ejecución
        all_ids = load_ids(JSON_PATH)
        scraped_ids = load_ids(SCRAPED_JSON_PATH)  # IDs ya procesados previamente
        pending_ids = [tid for tid in sorted(all_ids) if tid not in scraped_ids]

        print("\n📊 Resumen:")
        print(f"- IDs totales en {JSON_PATH.name}: {len(all_ids)}")
        print(f"- IDs ya scrapeados ({SCRAPED_JSON_PATH.name}): {len(scraped_ids)}")
        print(f"- IDs pendientes: {len(pending_ids)}")

        if not pending_ids:
            print("✅ No hay nada por hacer. Todos los IDs ya fueron procesados.")
        else:
            print("\n▶️ Comenzando extracción de gamelogs por ID…")
            ensure_dir(OUTPUT_DIR)

            success = 0
            failed = 0
            for idx, table_id in enumerate(pending_ids, start=1):
                print(f"\n[{idx}/{len(pending_ids)}] Procesando table_id={table_id}")
                html = fetch_gamelogs_html(driver, table_id)
                if html:
                    out = save_gamelogs_html(table_id, html)
                    if out is not None:
                        scraped_ids.add(str(table_id))
                        save_ids(SCRAPED_JSON_PATH, scraped_ids)
                        print(f"✅ Guardado: {out.name}")
                        success += 1
                    else:
                        print("❌ Fallo al guardar el archivo")
                        failed += 1
                else:
                    print("❌ No se pudo obtener contenido de gamelogs")
                    failed += 1

                # Pausa breve: reduce carga y riesgo de rate limiting
                time.sleep(0.8)

            print("\n🏁 Proceso completado.")
            print(f"- Éxitos: {success}")
            print(f"- Fallos:  {failed}")
            print(f"- Total acumulado en {SCRAPED_JSON_PATH.name}: {len(scraped_ids)}")

    finally:
        # El navegador queda abierto por detach=True. No llamamos driver.quit().
        pass
