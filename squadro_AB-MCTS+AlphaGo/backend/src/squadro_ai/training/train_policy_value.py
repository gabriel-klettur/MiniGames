from __future__ import annotations

from typing import Iterable, Sequence, Tuple

import random

import torch
import torch.nn as nn
import torch.nn.functional as F

from ..policy.torch_net import SquadroPolicyValueNet, encode_state, PIECE_IDS
from ..selfplay import SelfPlaySample


def samples_to_batch(
  samples: Sequence[SelfPlaySample],
  device: torch.device | None = None,
) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
  """Convert a list of :class:`SelfPlaySample` into model-ready tensors.

  Returns ``(x, target_pi, target_z)`` where:

  - ``x`` has shape ``(B, C, H, W)``
  - ``target_pi`` has shape ``(B, len(PIECE_IDS))``
  - ``target_z`` has shape ``(B,)``
  """

  if not samples:
    raise ValueError("samples_to_batch() received an empty sequence")

  device = device or torch.device("cpu")

  xs = []
  pis = []
  zs = []

  for s in samples:
    xs.append(encode_state(s.state, device=device))
    pi_vec = torch.zeros(len(PIECE_IDS), dtype=torch.float32, device=device)
    for move_id, prob in s.pi.items():
      try:
        idx = PIECE_IDS.index(move_id)
      except ValueError:
        continue
      pi_vec[idx] = float(prob)
    pis.append(pi_vec)
    zs.append(torch.as_tensor(float(s.z), dtype=torch.float32, device=device))

  x = torch.cat(xs, dim=0)
  target_pi = torch.stack(pis, dim=0)
  target_z = torch.stack(zs, dim=0)
  return x, target_pi, target_z


def train_step(
  model: SquadroPolicyValueNet,
  optimizer: torch.optim.Optimizer,
  samples: Sequence[SelfPlaySample],
  device: torch.device | None = None,
) -> Tuple[float, float, float]:
  """Perform a single optimization step on a mini-batch of samples.

  Returns ``(loss, policy_loss, value_loss)`` as Python floats.
  """

  device = device or torch.device("cpu")
  model.to(device)
  model.train()

  x, target_pi, target_z = samples_to_batch(samples, device=device)

  optimizer.zero_grad(set_to_none=True)
  policy_logits, value_pred = model(x)

  log_probs = F.log_softmax(policy_logits, dim=1)
  policy_loss = -(target_pi * log_probs).sum(dim=1).mean()
  value_loss = F.mse_loss(value_pred, target_z)
  loss = policy_loss + value_loss

  loss.backward()
  optimizer.step()

  return float(loss.item()), float(policy_loss.item()), float(value_loss.item())


def train_epoch(
  model: SquadroPolicyValueNet,
  optimizer: torch.optim.Optimizer,
  samples: Sequence[SelfPlaySample],
  batch_size: int = 256,
  device: torch.device | None = None,
) -> Tuple[float, float, float]:
  """Run multiple mini-batch updates over ``samples`` and return average losses.

  This is a light-weight epoch helper built on top of :func:`train_step`.
  """

  if not samples:
    raise ValueError("train_epoch() received an empty sequence")

  indices = list(range(len(samples)))
  random.shuffle(indices)

  total_loss = 0.0
  total_pl = 0.0
  total_vl = 0.0
  batches = 0

  for start in range(0, len(indices), max(1, batch_size)):
    batch_idx = indices[start : start + batch_size]
    batch = [samples[i] for i in batch_idx]
    loss, pl, vl = train_step(model, optimizer, batch, device=device)
    total_loss += loss
    total_pl += pl
    total_vl += vl
    batches += 1

  return total_loss / batches, total_pl / batches, total_vl / batches
