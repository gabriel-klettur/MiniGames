"""Script rápido para probar self-play + entrenamiento de la red.

Este script está pensado para dar *feedback visual rápido* en la terminal:

- Usa pocos juegos y pocas simulaciones por defecto.
- Imprime una línea por cada partida de self-play.
- Muestra un resumen final de la pérdida de entrenamiento.
"""

from squadro_ai.mcts import MCTSConfig
from squadro_ai.policy import SquadroPolicyValueNet, TorchPolicyValueAdapter
from squadro_ai.selfplay import play_one_game
from squadro_ai.training import train_epoch

import torch
import os
import glob
import multiprocessing as mp
import time


_WORKER_ADAPTER: TorchPolicyValueAdapter | None = None
_WORKER_MCTS_CFG: MCTSConfig | None = None
_WORKER_MAX_MOVES: int | None = None


def _atomic_torch_save(obj: object, path: str) -> None:
    tmp_path = f"{path}.tmp"
    torch.save(obj, tmp_path)
    os.replace(tmp_path, path)


def _load_recent_replay_chunks(replay_dir: str, max_samples: int) -> list:
    if max_samples <= 0:
        return []
    if not os.path.isdir(replay_dir):
        return []

    chunk_paths = sorted(glob.glob(os.path.join(replay_dir, "replay_*.pt")))
    if not chunk_paths:
        return []

    replay_buffer: list = []
    for p in reversed(chunk_paths):
        try:
            chunk = torch.load(p, map_location="cpu")
        except Exception:
            continue
        if isinstance(chunk, list):
            replay_buffer[:0] = chunk
        if len(replay_buffer) >= max_samples:
            replay_buffer = replay_buffer[-max_samples:]
            break

    return replay_buffer


def _worker_init(ckpt_path: str, simulations: int, max_moves: int) -> None:
    global _WORKER_ADAPTER, _WORKER_MCTS_CFG, _WORKER_MAX_MOVES

    device = torch.device("cpu")
    model = SquadroPolicyValueNet()
    if os.path.exists(ckpt_path):
        state_dict = torch.load(ckpt_path, map_location=device)
        model.load_state_dict(state_dict)
    _WORKER_ADAPTER = TorchPolicyValueAdapter(model, device=device)
    _WORKER_MCTS_CFG = MCTSConfig(simulations=simulations)
    _WORKER_MAX_MOVES = int(max_moves)


def _worker_play_one(_: int) -> list:
    if _WORKER_ADAPTER is None or _WORKER_MCTS_CFG is None or _WORKER_MAX_MOVES is None:
        raise RuntimeError("Worker not initialized")
    return play_one_game(
        policy_value_fn=_WORKER_ADAPTER,
        mcts_config=_WORKER_MCTS_CFG,
        max_moves=_WORKER_MAX_MOVES,
    )


def main() -> None:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Directorio y ruta del checkpoint
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    ckpt_path = os.path.abspath(os.path.join(models_dir, "squadro_policy_value.pt"))
    ckpt_dir = os.path.abspath(os.path.join(models_dir, "checkpoints"))
    os.makedirs(ckpt_dir, exist_ok=True)

    replay_dir = os.path.abspath(os.path.join(models_dir, "replay"))
    os.makedirs(replay_dir, exist_ok=True)

    # Crear modelo y, si existe, cargar pesos previos
    model = SquadroPolicyValueNet()
    if os.path.exists(ckpt_path):
        state_dict = torch.load(ckpt_path, map_location=device)
        model.load_state_dict(state_dict)
        print(f"[load] Loaded existing checkpoint from: {ckpt_path}")
    else:
        print("[load] No existing checkpoint found, starting from scratch")

    adapter = TorchPolicyValueAdapter(model, device=device)

    opt = torch.optim.Adam(model.parameters(), lr=1e-3)

    # Parámetros "rápidos" para ver actividad en la consola.
    num_games = 10
    simulations = 200
    max_moves = 100
    epochs = 10000000
    self_play_workers = max(1, min(num_games, (os.cpu_count() or 1)))
    keep_last_checkpoints = 10

    # Replay buffer sencillo: mantenemos un número máximo de muestras de
    # self-play acumuladas entre epochs para estabilizar el entrenamiento.
    max_buffer_size = 50_000
    replay_buffer: list = _load_recent_replay_chunks(replay_dir, max_buffer_size)

    print(
        f"[config] epochs={epochs}, games_per_epoch={num_games}, "
        f"simulations={simulations}, max_moves={max_moves}",
    )

    if replay_buffer:
        print(f"[replay] Loaded {len(replay_buffer)} samples from disk cache: {replay_dir}")

    mcts_cfg = MCTSConfig(simulations=simulations)

    try:
        for epoch in range(1, epochs + 1):
            print(f"\n[epoch {epoch}/{epochs}] Generating self-play games...", flush=True)
            all_samples = []
            if self_play_workers <= 1:
                for g in range(1, num_games + 1):
                    print(f"[self-play] Game {g}/{num_games}...", flush=True)
                    samples = play_one_game(
                        policy_value_fn=adapter,
                        mcts_config=mcts_cfg,
                        max_moves=max_moves,
                    )
                    all_samples.extend(samples)
                    print(
                        f"[self-play] Game {g} finished: {len(samples)} samples "
                        f"(cumulative={len(all_samples)})",
                        flush=True,
                    )
            else:
                print(f"[self-play] Using multiprocessing workers={self_play_workers}", flush=True)
                with mp.get_context("spawn").Pool(
                    processes=self_play_workers,
                    initializer=_worker_init,
                    initargs=(ckpt_path, simulations, max_moves),
                ) as pool:
                    for g, samples in enumerate(pool.imap_unordered(_worker_play_one, range(num_games)), start=1):
                        all_samples.extend(samples)
                        print(
                            f"[self-play] Game {g}/{num_games} finished: {len(samples)} samples "
                            f"(cumulative={len(all_samples)})",
                            flush=True,
                        )

            print(f"[self-play] Total samples collected this epoch: {len(all_samples)}")

            if all_samples:
                replay_chunk_path = os.path.join(replay_dir, f"replay_{epoch:06d}_{int(time.time())}.pt")
                _atomic_torch_save(all_samples, replay_chunk_path)
                print(f"[replay] Saved disk cache chunk: {replay_chunk_path}")

            # Actualizar replay buffer con las muestras de este epoch y recortar
            # para no superar max_buffer_size.
            replay_buffer.extend(all_samples)
            if len(replay_buffer) > max_buffer_size:
                # Conservamos las muestras más recientes.
                replay_buffer = replay_buffer[-max_buffer_size:]

            print(
                f"[replay] Buffer size after update: {len(replay_buffer)} (max={max_buffer_size})",
                flush=True,
            )

            print("[train] Running training epoch on mini-batches from replay buffer...", flush=True)
            loss, pl, vl = train_epoch(
                model,
                opt,
                replay_buffer,
                batch_size=256,
                device=device,
            )
            print(f"[train] epoch={epoch} loss={loss:.3f}  policy={pl:.3f}  value={vl:.3f}")
            # Guardar checkpoint después de cada epoch para poder reanudar entrenamiento fácilmente.
            state_dict = model.state_dict()
            epoch_ckpt = os.path.join(ckpt_dir, f"squadro_policy_value_epoch_{epoch:06d}.pt")
            _atomic_torch_save(state_dict, epoch_ckpt)
            _atomic_torch_save(state_dict, ckpt_path)

            ckpts = sorted(glob.glob(os.path.join(ckpt_dir, "squadro_policy_value_epoch_*.pt")))
            if keep_last_checkpoints > 0 and len(ckpts) > keep_last_checkpoints:
                for p in ckpts[: -keep_last_checkpoints]:
                    try:
                        os.remove(p)
                    except OSError:
                        pass

            print(f"[save] Checkpoint saved after epoch {epoch} to: {ckpt_path}", flush=True)
    except KeyboardInterrupt:
        print("\n[signal] KeyboardInterrupt detected, saving checkpoint and exiting...", flush=True)
    finally:
        # Guardar siempre el modelo entrenado en ckpt_path (aunque se interrumpa con Ctrl+C)
        _atomic_torch_save(model.state_dict(), ckpt_path)
        print(f"\n[save] Model saved to: {ckpt_path}")


if __name__ == "__main__":
    mp.freeze_support()
    main()