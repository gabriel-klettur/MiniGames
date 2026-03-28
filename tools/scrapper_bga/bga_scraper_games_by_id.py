from __future__ import annotations
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time
import json
from pathlib import Path
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from typing import List, Tuple

"""
Scraper de BGA: extrae el HTML completo del bloque <div id="gamelogs"> para
cada partida (table_id) listada en table_ids.json. Evita reprocesar IDs ya
scrapeados gracias a scraped_ids.json. Realiza login automático y rota cuentas
tras alcanzar el límite de consultas por email.

Flujo:
- Abre navegador en boardgamearena.com y realiza login automático
- Rota credenciales cada 10 visitas (configurable con MAX_QUERIES_PER_ACCOUNT)
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
CREDENTIALS_PATH = Path(__file__).parent / "email_password.json"  # Emails y passwords
MAX_QUERIES_PER_ACCOUNT = 10  # Límite de BGA por email antes de rotar
MANUAL_LOGIN = True  # Si True, espera a que el usuario se loguee manualmente y presione ENTER para comenzar el scraping


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


def load_credentials(path: Path) -> List[Tuple[str, str]]:
    """Carga credenciales desde un JSON con formato ["email:password", ...].

    Devuelve una lista de tuplas (email, password). Si no existe o hay error,
    devuelve una lista vacía.
    """
    creds: List[Tuple[str, str]] = []
    if not path.exists():
        print(f"⚠️ Archivo de credenciales no encontrado: {path}")
        return creds
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            print("⚠️ Formato inválido en email_password.json: se esperaba una lista")
            return creds
        for item in data:
            if not isinstance(item, str) or ":" not in item:
                continue
            email, pwd = item.split(":", 1)
            email = email.strip()
            pwd = pwd.strip()
            if email and pwd:
                creds.append((email, pwd))
    except Exception as e:
        print(f"⚠️ No se pudo leer {path.name}: {e}. Se continuará sin credenciales.")
    return creds


def click_button_by_text(driver: webdriver.Chrome, texts: List[str], timeout: int = 8) -> bool:
    """Intenta clicar un botón/enlace con clase de botón cuyo texto coincida con alguno de `texts`.

    Acepta diferentes idiomas; desplaza a la vista antes de hacer click. Devuelve True si clicó algo.
    """
    for t in texts:
        try:
            locator = (By.XPATH, f'//a[contains(@class, "bga-button") and normalize-space()="{t}"]')
            btn = WebDriverWait(driver, timeout).until(EC.element_to_be_clickable(locator))
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
            btn.click()
            return True
        except Exception:
            continue
    return False


def login_bga(driver: webdriver.Chrome, email: str, password: str, *, base_url: str = "https://en.boardgamearena.com", timeout: int = 20) -> bool:
    """Realiza login en Board Game Arena con Selenium.

    Estrategia robusta:
    - Abre la home y clica el link de cuenta (href="/account").
    - Paso 1: escribe email y pulsa "Next".
    - Paso 2: espera el campo de password, escribe y pulsa "Login".
    - Si aparece el botón "Let's play!", lo pulsa.

    Retorna True si parece estar logueado, False si falla.
    """
    try:
        driver.get(base_url)

        # Pausa manual: permite preparar la UI (idioma, cookies, banners, etc.)
        print("⏸️ Ajusta la página (idioma/cookies/modal). Cuando esté lista, presiona ENTER para continuar con el login automático…")
        input()

        # Abrir el panel de cuenta/login (si aplica). Si ya estás en la pantalla de login, continúa.
        try:
            WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, 'a[href="/account"]'))
            ).click()
        except Exception:
            pass

        # Paso 1: introducir email y pulsar "Next"
        print("🧭 Buscando campo de email…")
        try:
            email_input = WebDriverWait(driver, 7).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, 'input[name="email"]'))
            )
        except TimeoutException:
            # Fallback: ir directo a la pantalla de login
            print("↩️ Email no visible. Navegando a /account?section=login…")
            driver.get(f"{base_url}/account?section=login")
            email_input = WebDriverWait(driver, timeout).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, 'input[name="email"]'))
            )
        email_input.clear()
        email_input.send_keys(email)
        print("👉 Pulsando Next/Siguiente…")
        clicked_next = click_button_by_text(driver, ["Next", "Siguiente"], timeout=8)
        if not clicked_next:
            # Último recurso: ENTER desde el email
            print("↩️ Botón Next no localizado, enviando ENTER…")
            email_input.send_keys(Keys.ENTER)

        # Paso 2: esperar el input de password y pulsar "Login"
        print("🧭 Esperando campo de password…")
        pwd_input = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, 'input[type="password"]'))
        )
        pwd_input.clear()
        pwd_input.send_keys(password)
        print("👉 Pulsando Login/Acceder…")
        clicked_login = click_button_by_text(driver, ["Login", "Acceder", "Sign in", "Iniciar sesión"], timeout=8)
        if not clicked_login:
            print("↩️ Botón Login no localizado, enviando ENTER…")
            pwd_input.send_keys(Keys.ENTER)

        # Si aparece el botón "Let's play!", pulsarlo (no siempre es necesario)
        try:
            # Soporta inglés y español
            if not click_button_by_text(driver, ["Let's play!", "¡A jugar!"], timeout=6):
                pass
        except Exception:
            # Si no aparece, continuamos. A veces ya estamos listos.
            pass

        # Heurística simple: tras login, deberíamos poder ver la home cargada
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'a[href="/account"]'))
        )
        return True
    except Exception as e:
        print(f"❌ Falló el login para {email}: {e}")
        return False


def relogin_with_credentials(driver: webdriver.Chrome, creds: List[Tuple[str, str]], index: int) -> int | None:
    """Limpia sesión y reintenta login con la credencial en `index`.

    Devuelve el índice usado si tuvo éxito; en caso contrario, None.
    """
    if not creds:
        return None
    try:
        driver.delete_all_cookies()
    except Exception:
        pass

    email, pwd = creds[index]
    ok = login_bga(driver, email, pwd)
    return index if ok else None


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
        # PASO 1: Login manual o automático según configuración
        if MANUAL_LOGIN:
            print("⏸️ Modo login manual activo.")
            driver.get("https://en.boardgamearena.com")
            print("👉 Inicia sesión manualmente hasta estar COMPLETAMENTE logueado (ver tu avatar o el botón 'Let's play!').")
            print("   Cuando estés listo para comenzar el scraping, presiona ENTER en esta consola…")
            input()
            current_idx = 0
            queries_with_current = 0
            creds = []  # Rotación desactivada en modo manual para mantener tu sesión
            print("🔒 Rotación de cuentas desactivada en modo manual (se mantendrá tu sesión actual).")
        else:
            # Login automático con rotación de cuentas
            creds = load_credentials(CREDENTIALS_PATH)
            current_idx = 0
            queries_with_current = 0

            if creds:
                # Intentar login con la primera credencial disponible; si falla, probar siguientes
                logged_in = False
                tried = 0
                while tried < len(creds) and not logged_in:
                    idx_try = (current_idx + tried) % len(creds)
                    print(f"🔐 Intentando login con cuenta #{idx_try + 1}…")
                    used_idx = relogin_with_credentials(driver, creds, idx_try)
                    if used_idx is not None:
                        current_idx = used_idx
                        logged_in = True
                    else:
                        tried += 1
                if not logged_in:
                    print("❌ No se pudo iniciar sesión con ninguna credencial. Puedes loguearte manualmente y continuar.")
                    print("   Presiona ENTER cuando hayas terminado el login manual…")
                    input()
            else:
                print("⚠️ No hay credenciales. Realiza login manual y presiona ENTER para continuar…")
                driver.get("https://en.boardgamearena.com")
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

                # Rotación de credenciales si alcanzamos el límite de consultas por cuenta
                if 'creds' in locals() and creds:
                    if queries_with_current >= MAX_QUERIES_PER_ACCOUNT:
                        next_idx = (current_idx + 1) % len(creds)
                        print(f"🔄 Límite alcanzado ({MAX_QUERIES_PER_ACCOUNT}). Rotando a cuenta #{next_idx + 1}…")
                        used_idx = relogin_with_credentials(driver, creds, next_idx)
                        if used_idx is not None:
                            current_idx = used_idx
                            queries_with_current = 0
                        else:
                            print("⚠️ Falló la rotación de credenciales. Se intentará continuar con la cuenta actual.")

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

                # Contabilizar la visita para rotación por cuenta (independiente del resultado)
                if 'creds' in locals() and creds:
                    queries_with_current += 1

            print("\n🏁 Proceso completado.")
            print(f"- Éxitos: {success}")
            print(f"- Fallos:  {failed}")
            print(f"- Total acumulado en {SCRAPED_JSON_PATH.name}: {len(scraped_ids)}")

    finally:
        # El navegador queda abierto por detach=True. No llamamos driver.quit().
        pass
