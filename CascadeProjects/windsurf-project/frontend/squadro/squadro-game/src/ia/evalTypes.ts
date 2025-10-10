export interface EvalParams {
  w_race: number;
  w_clash: number;
  w_sprint: number;
  w_block: number;
  done_bonus: number;
  sprint_threshold: number;
  tempo?: number; // optional per-turn initiative bonus
}
