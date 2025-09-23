export default function RulesPanel() {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <p style={{ fontSize: '0.95rem' }}>
        En Soluna, puedes apilar si las torres tienen la misma altura o el mismo símbolo superior. La altura resultante es la suma y
        el símbolo visible será el de la torre que colocas encima.
      </p>
      <ul style={{ textAlign: 'left', margin: 0, paddingLeft: '1rem', fontSize: '0.9rem' }}>
        <li>Gana la ronda quien realiza el último movimiento válido.</li>
        <li>El ganador obtiene una estrella; con 4 estrellas, gana la partida.</li>
      </ul>
    </div>
  );
}

