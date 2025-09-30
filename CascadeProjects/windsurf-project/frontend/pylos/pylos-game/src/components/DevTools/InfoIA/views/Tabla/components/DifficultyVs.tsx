
import bolaA from '../../../../../../assets/bola_a.webp';
import bolaB from '../../../../../../assets/bola_b.webp';

type Props = {
  l: number;
  d: number;
};

export default function DifficultyVs({ l, d }: Props) {
  return (
    <span>
      {l}
      <img
        src={bolaB}
        alt="L"
        style={{ width: 14, height: 14, marginLeft: 4, verticalAlign: 'middle' }}
      />
      <span style={{ margin: '0 6px' }}>vs</span>
      {d}
      <img
        src={bolaA}
        alt="D"
        style={{ width: 14, height: 14, marginLeft: 4, verticalAlign: 'middle' }}
      />
    </span>
  );
}
