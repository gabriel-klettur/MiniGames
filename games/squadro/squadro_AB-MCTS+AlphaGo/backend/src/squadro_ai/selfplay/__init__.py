"""Self-play utilities for training the Squadro policy/value network.

The main entry points are:

- :func:`play_one_game` — generate training samples from a single self-play game.
- :func:`generate_self_play_samples` — run many games and aggregate samples.
"""

from .selfplay import (
    SelfPlayGameStats,
    SelfPlaySample,
    generate_self_play_samples,
    play_one_game,
    play_one_game_with_stats,
)

__all__ = [
    "SelfPlayGameStats",
    "SelfPlaySample",
    "play_one_game",
    "play_one_game_with_stats",
    "generate_self_play_samples",
]
