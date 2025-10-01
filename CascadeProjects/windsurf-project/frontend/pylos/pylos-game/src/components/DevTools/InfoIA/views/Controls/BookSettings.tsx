export function BookSettings(props: { bookEnabled: boolean; onBookEnabledChange: (v: boolean) => void }) {
  const { bookEnabled, onBookEnabledChange } = props;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <label
        className="label"
        htmlFor="infoia-book"
        title={
          'Libro de aperturas por jugador.\n' +
          'Cuando está activo, la IA usará secuencias de inicio preparadas (siempre que haya coincidencia).\n' +
          'Recomendado para aperturas consistentes en pruebas comparativas.'
        }
      >
        Libro
      </label>
      <input
        id="infoia-book"
        type="checkbox"
        checked={!!bookEnabled}
        onChange={(e) => onBookEnabledChange(e.target.checked)}
        aria-checked={!!bookEnabled}
        title={'Activa/desactiva el uso de libro de aperturas para este jugador.'}
      />
    </div>
  );
}

