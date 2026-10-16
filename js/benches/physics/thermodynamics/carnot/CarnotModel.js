/**
 * CarnotModel — ideal Carnot heat engine / heat pump / refrigerator.
 *
 * Efficiency:      η = 1 − T_c / T_h                         [dimensionless]
 * COP heat pump:   COP_hp = T_h / (T_h − T_c) = 1/η
 * COP refrigerator:COP_ref = T_c / (T_h − T_c) = COP_hp − 1
 *
 * T-S diagram: rectangular cycle with corners at (0,T_c), (ΔS,T_c), (ΔS,T_h), (0,T_h).
 * Area = W = (T_h − T_c)·ΔS = Q_h·η
 *
 * Reference: Callen, H.B. (1985). Thermodynamics and an Introduction to
 * Thermostatistics, Ch. 4. Wiley. (cited, not fetched)
 */
export class CarnotModel {
  /**
   * @param {object} [opts]
   * @param {number} [opts.Th=500]  hot reservoir temperature [K]
   * @param {number} [opts.Tc=300]  cold reservoir temperature [K]
   * @param {number} [opts.dS=1]    entropy change per cycle [J/K]
   */
  constructor({ Th = 500, Tc = 300, dS = 1 } = {}) {
    this.Th = Th;
    this.Tc = Tc;
    this.dS = dS;
  }

  set Tc(val) {
    if (!Number.isFinite(val)) throw new RangeError(`T_c must be finite; got ${val}`);
    if (val < 0) throw new RangeError(`T_c must be ≥ 0 K (absolute zero); got ${val} K`);
    if (typeof this._Th !== 'undefined' && val >= this._Th) {
      throw new RangeError(`T_c must be < T_h (${this._Th} K); got ${val} K`);
    }
    this._Tc = val;
  }
  get Tc() { return this._Tc; }

  set Th(val) {
    if (!Number.isFinite(val)) throw new RangeError(`T_h must be finite; got ${val}`);
    if (val <= 0) throw new RangeError(`T_h must be positive; got ${val}`);
    this._Th = val;
    // Re-validate Tc if already set
    if (typeof this._Tc !== 'undefined' && this._Tc >= this._Th) {
      throw new RangeError(`T_c (${this._Tc} K) must be < T_h (${this._Th} K)`);
    }
  }
  get Th() { return this._Th; }

  /** Carnot efficiency η = 1 − T_c/T_h */
  get eta() { return 1 - this._Tc / this._Th; }

  /** COP of heat pump = T_h/(T_h−T_c) */
  get copHeatPump() { return this._Th / (this._Th - this._Tc); }

  /** COP of refrigerator = T_c/(T_h−T_c) */
  get copRefrigerator() { return this._Tc / (this._Th - this._Tc); }

  /** Heat absorbed from hot reservoir Q_h = T_h·ΔS  [J] */
  get Qh() { return this._Th * this.dS; }

  /** Heat rejected to cold reservoir Q_c = T_c·ΔS  [J] */
  get Qc() { return this._Tc * this.dS; }

  /** Net work W = Q_h − Q_c = (T_h − T_c)·ΔS  [J] */
  get W() { return (this._Th - this._Tc) * this.dS; }

  /**
   * T-S diagram corners (clockwise from bottom-left).
   * Returns [{S,T}, ...] for the four corners + close.
   */
  tsDiagram() {
    const { _Th: Th, _Tc: Tc, dS } = this;
    return [
      { S: 0,  T: Tc },
      { S: dS, T: Tc },
      { S: dS, T: Th },
      { S: 0,  T: Th },
      { S: 0,  T: Tc },   // close
    ];
  }

  /**
   * T-S rectangle area via shoelace formula (independent check).
   * Shoelace of the 4-corner polygon = (T_h−T_c)·ΔS
   */
  tsShoelaceArea() {
    const pts = this.tsDiagram().slice(0, 4);   // 4 unique corners
    let area = 0;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += pts[i].S * pts[j].T - pts[j].S * pts[i].T;
    }
    return Math.abs(area) / 2;
  }
}
