export interface EvalParams {
  w_race: number;
  w_clash: number;
  w_sprint: number;
  w_block: number;
  // Additional heuristic weights to cover the full 12-point scale
  w_chain?: number;      // scales chainBonus (points)
  w_parity?: number;     // scales parityCrossingScore (points)
  w_struct?: number;     // scales structuralBlocksScore (points)
  w_ones?: number;       // scales onesScore (points)
  w_return?: number;     // scales valueReturn (points)
  w_waste?: number;      // scales wasteScore (points)
  w_mob?: number;        // scales mobility score (points)
  done_bonus: number;
  sprint_threshold: number;
}
