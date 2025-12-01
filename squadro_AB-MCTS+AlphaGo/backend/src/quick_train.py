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


def main() -> None:
    device = torch.device("cpu")

    # Directorio y ruta del checkpoint
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    ckpt_path = os.path.abspath(os.path.join(models_dir, "squadro_policy_value.pt"))

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

    # Replay buffer sencillo: mantenemos un número máximo de muestras de
    # self-play acumuladas entre epochs para estabilizar el entrenamiento.
    max_buffer_size = 50_000
    replay_buffer: list = []

    print(
        f"[config] epochs={epochs}, games_per_epoch={num_games}, "
        f"simulations={simulations}, max_moves={max_moves}",
    )

    mcts_cfg = MCTSConfig(simulations=simulations)

    try:
        for epoch in range(1, epochs + 1):
            print(f"\n[epoch {epoch}/{epochs}] Generating self-play games...", flush=True)
            all_samples = []
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

            print(f"[self-play] Total samples collected this epoch: {len(all_samples)}")

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
    except KeyboardInterrupt:
        print("\n[signal] KeyboardInterrupt detected, saving checkpoint and exiting...", flush=True)
    finally:
        # Guardar siempre el modelo entrenado en ckpt_path (aunque se interrumpa con Ctrl+C)
        torch.save(model.state_dict(), ckpt_path)
        print(f"\n[save] Model saved to: {ckpt_path}")


if __name__ == "__main__":
    main()