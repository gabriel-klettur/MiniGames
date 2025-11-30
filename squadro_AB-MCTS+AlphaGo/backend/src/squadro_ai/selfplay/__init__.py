"""Self-play utilities for training the Squadro policy/value network.

The main entry points are:

- :func:`play_one_game` — generate training samples from a single self-play game.
- :func:`generate_self_play_samples` — run many games and aggregate samples.
"""

from .selfplay import SelfPlaySample, play_one_game, generate_self_play_samples

__all__ = ["SelfPlaySample", "play_one_game", "generate_self_play_samples"]
