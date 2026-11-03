import * as THREE from "three";

/*
 * Blueprint-style aircraft: solid outline + faint translucent fill, modelled from the top
 * (nose = -z) so the camera, which looks slightly down the valley, sees the planform.
 */
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const FILL = 0.16;

function planform(pts: number[][], edge: number, fill: number) {
  const g = new THREE.Group();
  const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geo = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: fill, transparent: true, opacity: FILL, side: THREE.DoubleSide, depthWrite: false })));
  g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => V(x, 0, z))), new THREE.LineBasicMaterial({ color: edge })));
  return g;
}
const mirror = (pts: number[][]) => pts.map(([x, z]) => [-x, z]).reverse();

/** Swept vertical fin: a triangle standing in the x-plane. */
function fin(x: number, z0: number, z1: number, h: number, edge: number, fill: number) {
  const g = new THREE.Group();
  const v = [V(x, 0, z0), V(x, 0, z1), V(x, h, z1)];
  const geo = new THREE.BufferGeometry().setFromPoints(v);
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: fill, transparent: true, opacity: FILL + 0.06, side: THREE.DoubleSide, depthWrite: false })));
  g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(v), new THREE.LineBasicMaterial({ color: edge })));
  return g;
}

function circle(r: number, seg = 40) {
  const p: THREE.Vector3[] = [];
  for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; p.push(V(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  return p;
}

/** Quadcopter. `spin` holds the blade groups to rotate each frame. */
export function makeQuad(scale = 1) {
  const edge = 0x3ee6c4, fill = 0x3ee6c4;
  const grp = new THREE.Group();
  const spin: THREE.Object3D[] = [];
  const A = 5.2, R = 3;
  const corners: [number, number][] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

  const armPts: THREE.Vector3[] = [];
  corners.forEach(([sx, sz]) => armPts.push(V(0, 0, 0), V(sx * A, 0, sz * A)));
  grp.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(armPts), new THREE.LineBasicMaterial({ color: 0x9fb4c8 })));

  grp.add(planform([[-1.5, -2.1], [1.5, -2.1], [1.9, 0], [1.5, 2.1], [-1.5, 2.1], [-1.9, 0]], 0xe8fff9, 0xe8fff9));
  grp.add(planform([[-0.5, -2.1], [0.5, -2.1], [0, -3.4]], 0xff7a2f, 0xff7a2f)); // nose marker

  corners.forEach(([sx, sz], i) => {
    const r = new THREE.Group();
    r.position.set(sx * A, 0, sz * A);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: fill, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    r.add(disc);
    r.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circle(R)), new THREE.LineBasicMaterial({ color: edge })));
    const blades = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([V(-R, 0, 0), V(R, 0, 0), V(0, 0, -R), V(0, 0, R)]),
      new THREE.LineBasicMaterial({ color: 0xbff7ea })
    );
    blades.userData.dir = i % 2 ? -1 : 1;
    r.add(blades);
    spin.push(blades);
    r.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(circle(0.5, 12)), new THREE.LineBasicMaterial({ color: 0xe8fff9 })));
    grp.add(r);
  });
  grp.scale.setScalar(scale);
  return { group: grp, spin };
}

/** Fighter jet: delta wings, twin fins, glowing exhausts. */
export function makeJet(scale = 1) {
  const edge = 0xe8fff9, fill = 0xcfe6ff;
  const grp = new THREE.Group();
  grp.add(planform([[0, -8.5], [0.7, -5], [1.0, -1], [1.1, 5], [0.6, 6.6], [-0.6, 6.6], [-1.1, 5], [-1.0, -1], [-0.7, -5]], edge, fill));
  const wing = [[0.9, -0.6], [6.9, 5.3], [6.9, 6.5], [1.1, 5.7]];
  grp.add(planform(wing, edge, fill), planform(mirror(wing), edge, fill));
  const tail = [[1.0, 4.3], [3.5, 6.3], [3.5, 7.0], [1.0, 6.5]];
  grp.add(planform(tail, edge, fill), planform(mirror(tail), edge, fill));
  grp.add(planform([[-0.35, -3.6], [0.35, -3.6], [0.45, -1.4], [-0.45, -1.4]], 0x9fd4ff, 0x9fd4ff)); // canopy
  grp.add(fin(1.0, 3.2, 6.3, 2.7, edge, fill), fin(-1.0, 3.2, 6.3, 2.7, edge, fill));
  const flame = new THREE.Points(new THREE.BufferGeometry().setFromPoints([V(0.4, 0, 6.9), V(-0.4, 0, 6.9), V(0.4, 0, 7.5), V(-0.4, 0, 7.5)]), new THREE.PointsMaterial({ color: 0xff7a2f, size: 5, sizeAttenuation: false }));
  grp.add(flame);
  grp.scale.setScalar(scale);
  return { group: grp, spin: [] as THREE.Object3D[] };
}

/** Airliner-style airplane: long fuselage, swept wings, underwing engines, single fin. */
export function makeAirliner(scale = 1) {
  const edge = 0x9fd4ff, fill = 0x9fd4ff;
  const grp = new THREE.Group();
  grp.add(planform([[0, -10.2], [0.9, -8.2], [1.2, -4], [1.2, 5], [0.9, 8], [0.4, 9.8], [-0.4, 9.8], [-0.9, 8], [-1.2, 5], [-1.2, -4], [-0.9, -8.2]], edge, fill));
  const wing = [[1.2, -2.4], [9.8, 2.7], [9.8, 3.9], [1.2, 1.9]];
  grp.add(planform(wing, edge, fill), planform(mirror(wing), edge, fill));
  [4.3, -4.3].forEach((x) => grp.add(planform([[x - 0.55, -1.0], [x + 0.55, -1.0], [x + 0.55, 1.9], [x - 0.55, 1.9]], 0xe8fff9, 0xe8fff9)));
  const tail = [[1.1, 6.9], [4.5, 9.1], [4.5, 9.9], [1.1, 8.7]];
  grp.add(planform(tail, edge, fill), planform(mirror(tail), edge, fill));
  grp.add(fin(0, 5.4, 9.5, 3.6, edge, fill));
  // cockpit windows
  grp.add(planform([[-0.55, -8.6], [0.55, -8.6], [0.7, -7.4], [-0.7, -7.4]], 0xe8fff9, 0xe8fff9));
  grp.scale.setScalar(scale);
  return { group: grp, spin: [] as THREE.Object3D[] };
}
