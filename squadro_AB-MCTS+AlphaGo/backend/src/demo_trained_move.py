"""Pequeño script para probar el modelo entrenado desde la posición inicial.

Intenta cargar ``models/squadro_policy_value.pt`` y, si existe, usa ese modelo
para guiar MCTS. Si no existe, utiliza pesos aleatorios (modo demo).
"""

from __future__ import annotations

import os

import torch

from squadro_ai.game import create_initial_state
from squadro_ai.mcts import MCTSConfig, mcts_best_move
from squadro_ai.policy import SquadroPolicyValueNet, TorchPolicyValueAdapter


def main() -> None:
    device = torch.device("cpu")

    # Localizar checkpoint entrenado
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    ckpt_path = os.path.abspath(os.path.join(models_dir, "squadro_policy_value.pt"))

    model = SquadroPolicyValueNet()
    if os.path.exists(ckpt_path):
        state_dict = torch.load(ckpt_path, map_location=device)
        model.load_state_dict(state_dict)
        print(f"[load] Loaded trained model from: {ckpt_path}")
    else:
        print(f"[load] WARNING: checkpoint not found at {ckpt_path}, using random weights")

    adapter = TorchPolicyValueAdapter(model, device=device)

    state = create_initial_state()
    config = MCTSConfig(simulations=200)
    move_id = mcts_best_move(state, config, adapter)

    print(f"Best move from initial position (MCTS + trained net): {move_id}")


if __name__ == "__main__":
    main()
