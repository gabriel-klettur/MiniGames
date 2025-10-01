 

export interface ShadeTabProps {
  shadeOnlyAvailable: boolean;
  onToggleShadeOnlyAvailable: (v: boolean) => void;
  shadeOnlyHoles: boolean;
  onToggleShadeOnlyHoles: (v: boolean) => void;
  holeBorders: boolean;
  onToggleHoleBorders: (v: boolean) => void;
  noShadeL0: boolean;
  noShadeL1: boolean;
  noShadeL2: boolean;
  noShadeL3: boolean;
  onChangeNoShade: (level: 0 | 1 | 2 | 3, value: boolean) => void;
}

export default function ShadeTab(props: ShadeTabProps) {
  const {
    shadeOnlyAvailable, onToggleShadeOnlyAvailable,
    shadeOnlyHoles, onToggleShadeOnlyHoles,
    holeBorders, onToggleHoleBorders,
    noShadeL0, noShadeL1, noShadeL2, noShadeL3,
    onChangeNoShade,
  } = props;

  return (
    <div role="tabpanel" id="panel-shade" aria-labelledby="tab-shade" className="tabs__panel">
      <div className="row">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={shadeOnlyAvailable} onChange={(e) => onToggleShadeOnlyAvailable(e.target.checked)} />
          Sombreado solo niveles disponibles
        </label>
      </div>
      <div className="row">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={shadeOnlyHoles} onChange={(e) => onToggleShadeOnlyHoles(e.target.checked)} />
          Sombreado solo huecos disponibles
        </label>
      </div>
      <div className="row">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={holeBorders} onChange={(e) => onToggleHoleBorders(e.target.checked)} />
          Bordes blancos en huecos disponibles
        </label>
      </div>
      <div className="row" aria-disabled={shadeOnlyAvailable}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 10, alignItems: 'center' }}>
          <label><input type="checkbox" disabled={shadeOnlyAvailable} checked={noShadeL0} onChange={(e) => onChangeNoShade(0, e.target.checked)} /> Ocultar sombreado L0</label>
          <label><input type="checkbox" disabled={shadeOnlyAvailable} checked={noShadeL1} onChange={(e) => onChangeNoShade(1, e.target.checked)} /> Ocultar sombreado L1</label>
          <label><input type="checkbox" disabled={shadeOnlyAvailable} checked={noShadeL2} onChange={(e) => onChangeNoShade(2, e.target.checked)} /> Ocultar sombreado L2</label>
          <label><input type="checkbox" disabled={shadeOnlyAvailable} checked={noShadeL3} onChange={(e) => onChangeNoShade(3, e.target.checked)} /> Ocultar sombreado L3</label>
        </div>
      </div>
    </div>
  );
}
