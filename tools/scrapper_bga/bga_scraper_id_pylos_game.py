from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time
from bs4 import BeautifulSoup
import re

import json
import os
from pathlib import Path
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

# Configuración inicial
options = Options()
options.add_argument('--start-maximized')
options.add_experimental_option("detach", True)
driver = webdriver.Chrome(options=options)

# Utilidades: carga/guardado de IDs en JSON (sin duplicados)
JSON_PATH = Path(__file__).parent / "table_ids.json"

def load_ids(path: Path):
    """Carga un conjunto de IDs desde un JSON. Acepta lista o dict con clave 'ids'."""
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

def save_ids(path: Path, ids):
    """Guarda un conjunto de IDs como lista ordenada en JSON."""
    try:
        with path.open('w', encoding='utf-8') as f:
            json.dump(sorted(ids), f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"❌ Error guardando {path.name}: {e}")

def extract_current_ids(driver) -> list:
    """Extrae los IDs de tabla visibles actualmente desde el DOM."""
    html = driver.page_source
    soup = BeautifulSoup(html, 'html.parser')
    table_links = soup.select('a.table_name.bga-link.smalltext')
    current_ids = [
        re.search(r'table=(\d+)', link.get('href', '')).group(1)
        for link in table_links
        if re.search(r'table=(\d+)', link.get('href', ''))
    ]
    return current_ids

def click_see_more_until_done(driver, existing: set, timeout: int = 10, pause: float = 0.5) -> set:
    """Clickea el botón 'See more' repetidamente hasta que no aparezcan más registros.

    Tras cada carga, detecta nuevos IDs y los guarda incrementalmente en JSON.
    """
    total_clicks = 0
    while True:
        # Intentar localizar y poder clicar el botón
        try:
            btn = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.ID, "see_more_tables"))
            )
        except TimeoutException:
            print("ℹ️ Botón 'See more' no disponible/visible. Fin del paginado.")
            break

        if not btn.is_displayed():
            print("ℹ️ Botón 'See more' oculto. Fin del paginado.")
            break

        prev_count = len(driver.find_elements(By.CSS_SELECTOR, 'a.table_name.bga-link.smalltext'))

        # Click robusto (via JS) y esperar incremento de elementos
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
        driver.execute_script("arguments[0].click();", btn)

        try:
            WebDriverWait(driver, timeout).until(
                lambda d: len(d.find_elements(By.CSS_SELECTOR, 'a.table_name.bga-link.smalltext')) > prev_count
            )
            total_clicks += 1
            time.sleep(pause)

            # Tras cargar más, extraer y persistir nuevos IDs
            current_ids = extract_current_ids(driver)
            new_ids = [tid for tid in current_ids if tid not in existing]
            if new_ids:
                print(f"✅ Nuevos IDs tras 'See more': {len(new_ids)} → guardando...")
                existing.update(new_ids)
                save_ids(JSON_PATH, existing)
            else:
                print("ℹ️ Sin nuevos IDs tras este 'See more'.")
        except TimeoutException:
            print("ℹ️ No aparecieron más registros tras clicar 'See more'. Fin del paginado.")
            break

    print(f"➡️ Clicks realizados en 'See more': {total_clicks}")
    return existing

# PASO 1: Iniciar navegador e ir al login de BGA
driver.get("https://boardgamearena.com")

print("⚠️ Inicia sesión manualmente, luego presiona ENTER aquí...")
input()  # Espera a que el usuario haya hecho login

# PASO 2: Ir a la URL que quieres scrapear
driver.get("https://boardgamearena.com/gamestats?player=6870632&opponent_id=0&game_id=63&finished=0")

# Espera inicial por si hay carga dinámica
time.sleep(3)

# Primera extracción y guardado inicial
existing = load_ids(JSON_PATH)
current_ids = extract_current_ids(driver)
print("\n🎯 Tablas encontradas (vista actual):")
for tid in current_ids:
    print(f"https://boardgamearena.com/table?table={tid}")

initial_new = [tid for tid in current_ids if tid not in existing]
if initial_new:
    print(f"✅ Nuevas tablas iniciales: {len(initial_new)} → guardando en {JSON_PATH.name}")
    existing.update(initial_new)
    save_ids(JSON_PATH, existing)
else:
    print("ℹ️ No hay tablas nuevas respecto al JSON guardado en la vista inicial.")

print("\n▶️ Iniciando paginado automático con 'See more'...")
existing = click_see_more_until_done(driver, existing)

print(f"\n🏁 Proceso completado. Total IDs guardados: {len(existing)}. El navegador queda abierto por 'detach=True'.")
