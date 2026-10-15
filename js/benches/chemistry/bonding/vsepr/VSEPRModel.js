/**
 * VSEPRModel — VSEPR geometry determination and 3D atom positions.
 *
 * Valence Shell Electron Pair Repulsion (VSEPR) model:
 *   Steric number = ligands + lone pairs
 *   Geometry determined by electron pair arrangement
 *
 * 12 geometries supported (AXnEm notation):
 *   AX₂ through AX₆ with lone pair variants
 *
 * Real bond angles for H₂O (104.5°) and NH₃ (107°):
 *   NIST CCCBDB (Computational Chemistry Comparison and Benchmark Database)
 *   not checked against primary source during this implementation.
 *
 * Reference:
 *   Gillespie, R.J. & Nyholm, R.S. (1957). Inorganic stereochemistry.
 *   Q. Rev. Chem. Soc. 11, 339–380. doi:10.1039/qr9571100339
 */

// 3D positions for each geometry (unit vectors for ligand directions)
const DEG = Math.PI / 180;
const sin = Math.sin, cos = Math.cos;

// Tetrahedral vertices on unit sphere
const tet = [
  [ 1,  1,  1],
  [ 1, -1, -1],
  [-1,  1, -1],
  [-1, -1,  1],
].map(v => { const l = Math.sqrt(3); return [v[0]/l, v[1]/l, v[2]/l]; });

const GEOMETRIES = Object.freeze([
  {
    type: 'AX2', name: 'Linear', ligands: 2, lonePairs: 0, stericNumber: 2,
    idealAngle: 180, realAngle: null, realExample: 'CO₂',
    positions3D: [[0,1,0],[0,-1,0]],
  },
  {
    type: 'AX3', name: 'Trigonal planar', ligands: 3, lonePairs: 0, stericNumber: 3,
    idealAngle: 120, realAngle: null, realExample: 'BF₃',
    positions3D: [
      [0, 1, 0],
      [sin(120*DEG), cos(120*DEG), 0],
      [sin(240*DEG), cos(240*DEG), 0],
    ],
  },
  {
    type: 'AX2E', name: 'Bent (3)', ligands: 2, lonePairs: 1, stericNumber: 3,
    idealAngle: 120, realAngle: 119, realExample: 'SO₂',
    positions3D: [
      [sin(60*DEG), cos(60*DEG), 0],
      [-sin(60*DEG), cos(60*DEG), 0],
    ],
  },
  {
    type: 'AX4', name: 'Tetrahedral', ligands: 4, lonePairs: 0, stericNumber: 4,
    idealAngle: 109.5, realAngle: null, realExample: 'CH₄',
    positions3D: tet,
  },
  {
    type: 'AX3E', name: 'Trigonal pyramidal', ligands: 3, lonePairs: 1, stericNumber: 4,
    idealAngle: 109.5, realAngle: 107, realExample: 'NH₃',
    positions3D: tet.slice(0, 3),
  },
  {
    type: 'AX2E2', name: 'Bent (4)', ligands: 2, lonePairs: 2, stericNumber: 4,
    idealAngle: 109.5, realAngle: 104.5, realExample: 'H₂O',
    positions3D: tet.slice(0, 2),
  },
  {
    type: 'AX5', name: 'Trigonal bipyramidal', ligands: 5, lonePairs: 0, stericNumber: 5,
    idealAngle: 90, realAngle: null, realExample: 'PCl₅',
    positions3D: [
      [1, 0, 0],
      [cos(120*DEG), sin(120*DEG), 0],
      [cos(240*DEG), sin(240*DEG), 0],
      [0, 0,  1],
      [0, 0, -1],
    ],
  },
  {
    type: 'AX4E', name: 'See-saw', ligands: 4, lonePairs: 1, stericNumber: 5,
    idealAngle: 90, realAngle: 101, realExample: 'SF₄',
    // equatorial lone pair removed; keep 2 equatorial + 2 axial
    positions3D: [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 0,  1],
      [0, 0, -1],
    ],
  },
  {
    type: 'AX3E2', name: 'T-shaped', ligands: 3, lonePairs: 2, stericNumber: 5,
    idealAngle: 90, realAngle: 87, realExample: 'ClF₃',
    positions3D: [
      [1, 0, 0],
      [0, 0,  1],
      [0, 0, -1],
    ],
  },
  {
    type: 'AX6', name: 'Octahedral', ligands: 6, lonePairs: 0, stericNumber: 6,
    idealAngle: 90, realAngle: null, realExample: 'SF₆',
    positions3D: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],
  },
  {
    type: 'AX5E', name: 'Square pyramidal', ligands: 5, lonePairs: 1, stericNumber: 6,
    idealAngle: 90, realAngle: 85, realExample: 'BrF₅',
    positions3D: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1]],
  },
  {
    type: 'AX4E2', name: 'Square planar', ligands: 4, lonePairs: 2, stericNumber: 6,
    idealAngle: 90, realAngle: null, realExample: 'XeF₄',
    positions3D: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0]],
  },
]);

// Helper: 3x3 matrix multiply
function mat3mul(A, B) {
  return A.map((row, i) =>
    [0,1,2].map(j => row.reduce((sum, _, k) => sum + A[i][k] * B[k][j], 0))
  );
}
// Helper: rotate vector by 3x3 matrix
function mat3vec(M, v) {
  return [0,1,2].map(i => M[i].reduce((s, Mij, j) => s + Mij * v[j], 0));
}

export class VSEPRModel {
  static get geometries() { return GEOMETRIES; }

  static forType(type) { return GEOMETRIES.find(g => g.type === type) || null; }

  constructor(type = 'AX4') {
    this._geom = VSEPRModel.forType(type) || GEOMETRIES[3];
    // Default rotation: slight isometric angle
    this._R = this._identity();
    this.rotate(20, -15); // initial isometric view
  }

  _identity() {
    return [[1,0,0],[0,1,0],[0,0,1]];
  }

  get geometry() { return this._geom; }
  set geometry(type) {
    this._geom = VSEPRModel.forType(type) || this._geom;
  }

  rotate(dx, dy) {
    // Rotate around screen Y-axis by dx*0.01 rad, X-axis by dy*0.01 rad
    const ax = dy * 0.01, ay = dx * 0.01;
    const Rx = [[1,0,0],[0,cos(ax),-sin(ax)],[0,sin(ax),cos(ax)]];
    const Ry = [[cos(ay),0,sin(ay)],[0,1,0],[-sin(ay),0,cos(ay)]];
    this._R = mat3mul(Ry, mat3mul(Rx, this._R));
  }

  resetRotation() {
    this._R = this._identity();
    this.rotate(20, -15);
  }

  atoms3D(scale = 1) {
    const g = this._geom;
    const ligands = g.positions3D.map((p) => ({
      pos: mat3vec(this._R, p).map(v => v * scale),
      isLonePair: false,
    }));
    return { center: [0,0,0], ligands };
  }
}
