"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { makeJet } from "@/lib/aircraft";

/*
 * Terrain treadmill: the grid lattice moves toward the camera as one rigid piece.
 * Each vertex keeps the height of the terrain feature it belongs to (sampled at a
 * "terrain-space" z), so peaks travel with the mesh instead of rippling through it.
 * uS = distance the mesh has slid within the current cell, uN = whole cells already
 * consumed (a multiple of the row spacing, so the snap-back is invisible).
 */
const VERT = /* glsl */ `
uniform float uS;
uniform float uN;
varying float vDepth;
varying float vH;
varying float vNear;
varying vec3 vView;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// ridged fbm -> sharp peaks and valleys instead of soft rolling hills
float ridged(vec2 p){
  float a = 0.0, b = 0.55;
  for (int i = 0; i < 4; i++) {
    float n = 1.0 - abs(2.0 * noise(p) - 1.0);
    a += b * n * n;
    p *= 2.1; b *= 0.5;
  }
  return a;
}
void main(){
  vec3 p = position;
  float tz = position.z - uN;                       // terrain-space z of this vertex
  float side = smoothstep(20.0, 90.0, abs(p.x));    // calm valley in the middle, mountains at the sides
  float h = ridged(vec2(p.x * 0.03, tz * 0.03));
  p.y = h * mix(4.0, 50.0, side) - 8.0;
  p.z = position.z + uS;                            // rigid slide toward the camera
  vH = p.y;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  vDepth = clamp(1.0 - (-mv.z - 20.0) / 260.0, 0.0, 1.0);
  vNear = smoothstep(45.0, 125.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = /* glsl */ `
varying float vDepth;
varying float vH;
varying float vNear;
void main(){
  vec3 base = vec3(0.56, 0.68, 0.78);
  vec3 col = mix(base, vec3(0.24, 0.9, 0.77), smoothstep(18.0, 46.0, vH) * 0.6);
  gl_FragColor = vec4(col, min((vDepth * vDepth * 0.95 + 0.04) * vNear, 0.34));
}`;

/* solid, lightly lit surface: hides ridges behind it and gives each slope a face */
const FRAG_MESH = /* glsl */ `
varying float vDepth;
varying float vH;
varying vec3 vView;
void main(){
  vec3 bg = vec3(0.039, 0.055, 0.078);              // page background
  vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
  vec3 L = normalize(vec3(-0.45, 0.75, 0.5));
  float lit = max(dot(n, L), 0.0);
  float snow = smoothstep(14.0, 42.0, vH);          // higher = a little whiter
  vec3 col = bg + vec3(1.0) * (0.012 + 0.07 * lit + 0.085 * snow * (0.4 + 0.6 * lit));
  float nearF = smoothstep(10.0, 75.0, -vView.z);   // keep the foreground calm behind the text
  float fog = pow(vDepth, 0.8) * (0.3 + 0.7 * nearF); // and melt into the background with distance
  gl_FragColor = vec4(mix(bg, col, fog), 1.0);
}`;

const SPEED = 15;          // terrain flow speed (units / s)
const ROW = 5, STEP = 2.5; // row spacing must be a multiple of the sample step

export default function HeroScene() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 900;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 1, 600);
    camera.position.set(0, 17, 62);
    camera.lookAt(0, 12, -50);

    /* ---- terrain lattice ---- */
    const X0 = -170, X1 = 170, Z0 = -230, Z1 = 50;
    const colStep = small ? ROW * 2 : ROW * 1.2;
    const pos: number[] = [], idx: number[] = [];
    const addLine = (pts: number[][]) => {
      const base = pos.length / 3;
      pts.forEach((q) => pos.push(q[0], 0, q[1]));
      for (let i = 0; i < pts.length - 1; i++) idx.push(base + i, base + i + 1);
    };
    for (let z = Z0; z <= Z1; z += ROW) {
      const l: number[][] = [];
      for (let x = X0; x <= X1; x += STEP) l.push([x, z]);
      addLine(l);
    }
    for (let x = X0; x <= X1; x += colStep) {
      const l: number[][] = [];
      for (let z = Z0; z <= Z1; z += STEP) l.push([x, z]);
      addLine(l);
    }
    const uniforms = { uS: { value: 0 }, uN: { value: 0 } };
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    tGeo.setIndex(idx);
    const tMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, uniforms,
    });
    const terrain = new THREE.LineSegments(tGeo, tMat);
    terrain.frustumCulled = false;
    terrain.renderOrder = 2;
    scene.add(terrain);

    // solid surface on the same lattice
    const cols = Math.floor((X1 - X0) / STEP) + 1, rows = Math.floor((Z1 - Z0) / STEP) + 1;
    const mPos = new Float32Array(cols * rows * 3);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 3;
      mPos[k] = X0 + i * STEP; mPos[k + 1] = 0; mPos[k + 2] = Z0 + j * STEP;
    }
    const mIdx: number[] = [];
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
      const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
      mIdx.push(a, c, b, b, c, d);
    }
    const mGeo = new THREE.BufferGeometry();
    mGeo.setAttribute("position", new THREE.BufferAttribute(mPos, 3));
    mGeo.setIndex(mIdx);
    const mMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_MESH, uniforms,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    });
    const surface = new THREE.Mesh(mGeo, mMat);
    surface.frustumCulled = false;
    surface.renderOrder = 1;
    scene.add(surface);

    /* ---- speed streaks (dust rushing past the camera) ---- */
    const SN = small ? 40 : 90;
    const sPos = new Float32Array(SN * 6);
    const sx = new Float32Array(SN), sy = new Float32Array(SN), sz = new Float32Array(SN), sl = new Float32Array(SN);
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < SN; i++) {
      sx[i] = (rnd() - 0.5) * 150; sy[i] = 4 + rnd() * 34; sz[i] = -190 + rnd() * 230; sl[i] = 3 + rnd() * 8;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    const streaks = new THREE.LineSegments(sGeo, new THREE.LineBasicMaterial({ color: 0xaecbe0, transparent: true, opacity: 0.22 }));
    streaks.frustumCulled = false;
    scene.add(streaks);

    /* ---- aircraft: quadcopter, fighter jet, airplane (each with ground anchor line + tracking ring) ---- */
    const GROUND = -5;
    const overlay = { transparent: true, depthTest: false, depthWrite: false };
    const mk = (model: { group: THREE.Group; spin: THREE.Object3D[] }, bankK: number, ringR: number, ringColor = 0x3ee6c4) => {
      model.group.rotation.x = 0.45;                 // tilt so the camera sees the top of the airframe
      const inner = new THREE.Group(); inner.add(model.group);
      const holder = new THREE.Group(); holder.add(inner);
      scene.add(holder);

      const ringPts: THREE.Vector3[] = [];
      for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; ringPts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a))); }
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineDashedMaterial({ color: ringColor, dashSize: 0.14, gapSize: 0.1, opacity: 0.9, ...overlay }));
      ring.computeLineDistances();
      ring.scale.set(ringR * 1.3, 1, ringR);
      ring.frustumCulled = false; ring.renderOrder = 6;
      scene.add(ring);

      const dropGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -1, 0)]);
      const drop = new THREE.Line(dropGeo, new THREE.LineDashedMaterial({ color: 0xe8fff9, dashSize: 1, gapSize: 0.7, opacity: 0.85, ...overlay }));
      drop.frustumCulled = false; drop.renderOrder = 6;
      scene.add(drop);
      return { ...model, inner, holder, ring, drop, bankK };
    };
    const jet = mk(makeJet(1.5), 0.06, 7.5);
    const crafts = [jet];

    type Path = (t: number) => THREE.Vector3;
    // highest possible ground at lateral position x (matches the terrain shader's valley + ridged-noise bound)
    const sstep = (e0: number, e1: number, x: number) => { const t = THREE.MathUtils.clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
    const groundMax = (x: number) => -8 + (4 + 46 * sstep(20, 90, Math.abs(x) + 9)) * 1.05;   // +9: wing span
    const smax = (a: number, b: number, k = 5) => 0.5 * (a + b + Math.sqrt((a - b) * (a - b) + k * k));  // smooth max -> no sudden climbs
    // base altitude + slow, smooth bobbing; never below the ridge line beneath it
    const fly3 = (x: number, z: number, base: number, amp: number, t: number, ph: number) =>
      new THREE.Vector3(x, smax(base + amp * Math.sin(t * 0.75 + ph) + amp * 0.35 * Math.sin(t * 1.7 + ph * 2), groundMax(x) + 4), z);
    const pathJet: Path = (t) => fly3(32 + 8 * Math.sin(t * 0.45) + 2.5 * Math.sin(t * 1.15), -40 + 7 * Math.sin(t * 0.3), 14, 2.6, t, 0.0);

    const tgt = new THREE.Object3D();
    const fly = (c: (typeof crafts)[number], path: Path, t: number) => {
      const p0 = path(t), p1 = path(t + 0.08), p2 = path(t + 0.18);
      c.holder.position.copy(p0);
      // ground-relative velocity: lateral sway + constant flight along -z (terrain flows past at SPEED)
      const vx1 = (p1.x - p0.x) / 0.08, vx2 = (p2.x - p1.x) / 0.1;
      tgt.position.copy(p0);
      tgt.lookAt(p0.x + vx1, p0.y, p0.z - SPEED);
      tgt.rotateY(Math.PI);
      c.holder.quaternion.slerp(tgt.quaternion, 0.1);
      const bank = THREE.MathUtils.clamp(-((vx2 - vx1) / 0.1) * c.bankK, -0.55, 0.55);
      c.inner.rotation.z += (bank - c.inner.rotation.z) * 0.07;
      // anchor line + tracking ring directly beneath
      const a = c.drop.geometry.attributes.position as THREE.BufferAttribute;
      a.setXYZ(0, p0.x, p0.y, p0.z); a.setXYZ(1, p0.x, GROUND, p0.z);
      a.needsUpdate = true;
      c.drop.computeLineDistances();
      c.ring.position.set(p0.x, GROUND, p0.z);
    };

    /* ---- loop ---- */
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);
    let mx = 0;
    const onMove = (e: PointerEvent) => (mx = e.clientX / window.innerWidth - 0.5);
    window.addEventListener("pointermove", onMove);
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting)); io.observe(el);

    let raf = 0, time = reduce ? 8 : 0, last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - last, 100) / 1000;
      last = now;
      if (!visible || document.hidden) return;
      if (!reduce) time += dt;

      const dist = time * SPEED;
      const n = Math.floor(dist / ROW);
      uniforms.uS.value = dist - n * ROW;
      uniforms.uN.value = n * ROW;

      for (let i = 0; i < SN; i++) {
        sz[i] += SPEED * 2.2 * (reduce ? 0 : dt);
        if (sz[i] > 40) { sz[i] = -190; sx[i] = (rnd() - 0.5) * 150; sy[i] = 4 + rnd() * 34; }
        sPos.set([sx[i], sy[i], sz[i], sx[i], sy[i], sz[i] - sl[i]], i * 6);
      }
      sGeo.attributes.position.needsUpdate = true;

      crafts.forEach((c) => c.spin.forEach((s) => (s.rotation.y += s.userData.dir * 0.6)));
      fly(jet, pathJet, time);

      camera.position.x += (mx * 10 - camera.position.x) * 0.04;
      camera.lookAt(0, 12, -50);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={host} className="hero-canvas" aria-hidden="true" />;
}
