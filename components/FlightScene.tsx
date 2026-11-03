"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ---------- story: one step per scene ---------- */
const STEPS = [
  {
    tag: "01",
    name: "Jammed",
    caption:
      "A mission loop with jamming zones on both legs. GNSS cannot be trusted anywhere along the route.",
    tone: "bad",
  },
  {
    tag: "02",
    name: "Drift",
    caption:
      "Without GNSS, inertial dead-reckoning drifts. Orange is the estimated path peeling away from the true path; the ring is the growing uncertainty.",
    tone: "bad",
  },
  {
    tag: "03",
    name: "Locked",
    caption:
      "With Stride VPS, vision-based navigation recognises the terrain below the UAV and keeps position error bounded.",
    tone: "ok",
  },
] as const;

const COL = { ok: 0x3ee6c4, bad: 0xff7a2f, grid: 0x8fa3b8, ink: 0xe8fff9 };
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

type Lbl = { el: HTMLDivElement; pos: THREE.Vector3; at: number; on: boolean };
type Scene = {
  group: THREE.Group;
  dur: number;
  cam: { p: THREE.Vector3; t: THREE.Vector3 };
  labels: Lbl[];
  update: (p: number, time: number) => void;
};

export default function FlightScene() {
  const wrap = useRef<HTMLDivElement>(null);
  const labelBox = useRef<HTMLDivElement>(null);
  const fills = useRef<(HTMLElement | null)[]>([]);
  const hudPos = useRef<HTMLElement>(null);
  const goRef = useRef<(i: number) => void>(() => {});
  const [step, setStep] = useState(0);

  useEffect(() => {
    const host = wrap.current!;
    const lblBox = labelBox.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0e14, 130, 330);
    const camera = new THREE.PerspectiveCamera(44, 1, 1, 1000);

    /* ---- ground grid + dust ---- */
    {
      const pts: number[] = [];
      const X = 130, Z = 80, S = 10;
      for (let x = -X; x <= X; x += S) pts.push(x, 0, -Z, x, 0, Z);
      for (let z = -Z; z <= Z; z += S) pts.push(-X, 0, z, X, 0, z);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: COL.grid, transparent: true, opacity: 0.16 })));
      const d: number[] = [];
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 500; i++) d.push((rnd() * 2 - 1) * X, 0, (rnd() * 2 - 1) * Z);
      const dg = new THREE.BufferGeometry();
      dg.setAttribute("position", new THREE.Float32BufferAttribute(d, 3));
      scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x9bb0c4, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.45 })));
    }

    /* ---- helpers ---- */
    const trail = (color: number, n = 300, op = 0.95) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setDrawRange(0, 0);
      const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: op }));
      l.userData.n = n;
      l.frustumCulled = false;
      return l;
    };
    const setTrail = (l: THREE.Line, f: (u: number) => THREE.Vector3, p: number) => {
      const n = l.userData.n as number;
      const attr = l.geometry.attributes.position as THREE.BufferAttribute;
      const a = attr.array as Float32Array;
      const k = Math.floor(clamp(p, 0, 1) * (n - 1));
      for (let i = 0; i <= k; i++) {
        const v = f(i / (n - 1));
        a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z;
      }
      attr.needsUpdate = true;
      l.geometry.setDrawRange(0, k + 1);
    };
    const ring = (color: number, dashed: boolean) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; pts.push(V(Math.cos(a), 0, Math.sin(a))); }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.15, gapSize: 0.1 }) : new THREE.LineBasicMaterial({ color });
      const l = new THREE.LineLoop(g, m);
      if (dashed) l.computeLineDistances();
      l.frustumCulled = false;
      return l;
    };
    const zone = (cx: number, cz: number, w: number, d: number, rot: number, color: number) => {
      const grp = new THREE.Group();
      const g = new THREE.BufferGeometry().setFromPoints([V(-w / 2, 0, -d / 2), V(w / 2, 0, -d / 2), V(w / 2, 0, d / 2), V(-w / 2, 0, d / 2)]);
      const l = new THREE.LineLoop(g, new THREE.LineDashedMaterial({ color, dashSize: 2, gapSize: 1.5, transparent: true, opacity: 0.9 }));
      l.computeLineDistances();
      grp.add(l);
      grp.add(new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.DoubleSide })));
      grp.position.set(cx, 0, cz);
      grp.rotation.y = rot;
      return grp;
    };
    const dropLine = (color: number = COL.ink) => {
      const g = new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, -1, 0)]);
      const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: 1, gapSize: 0.7, transparent: true, opacity: 0.95 }));
      l.frustumCulled = false;
      return l;
    };
    const setDrop = (l: THREE.Line, p: THREE.Vector3) => {
      const attr = l.geometry.attributes.position as THREE.BufferAttribute;
      const a = attr.array as Float32Array;
      a[0] = p.x; a[1] = p.y; a[2] = p.z; a[3] = p.x; a[4] = 0; a[5] = p.z;
      attr.needsUpdate = true;
      l.computeLineDistances();
    };

    /* ---- quadcopter (point cloud, spinning rotors) ---- */
    const rotors: THREE.Points[] = [];
    const pointsFrom = (P: number[], color: number, size: number) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
      return new THREE.Points(g, new THREE.PointsMaterial({ size, sizeAttenuation: false, color }));
    };
    const line2 = (a: number[], b: number[], step = 0.35) => {
      const P: number[] = [];
      const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
      for (let i = 0; i <= n; i++) { const t = i / n; P.push(a[0] + (b[0] - a[0]) * t, 0, a[1] + (b[1] - a[1]) * t); }
      return P;
    };
    const makeDrone = () => {
      const grp = new THREE.Group();
      const A = 4.6, R = 2.6;
      const corners = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
      const arms: number[] = [];
      corners.forEach(([sx, sz]) => arms.push(...line2([0, 0], [sx * A, sz * A])));
      grp.add(pointsFrom(arms, 0x9fb4c8, 2));
      const body: number[] = [];
      for (let x = -1.6; x <= 1.6; x += 0.4) for (let z = -1.9; z <= 1.9; z += 0.4) body.push(x, 0, z);
      grp.add(pointsFrom(body, COL.ink, 2.4));
      grp.add(pointsFrom(line2([0, -2.2], [0, -3.6], 0.3), COL.bad, 3));
      corners.forEach(([sx, sz], i) => {
        const r = new THREE.Group();
        r.position.set(sx * A, 0, sz * A);
        const rg: number[] = [];
        for (let k = 0; k < 44; k++) { const t = (k / 44) * Math.PI * 2; rg.push(Math.cos(t) * R, 0, Math.sin(t) * R); }
        r.add(pointsFrom(rg, COL.ok, 2.2));
        const bl = pointsFrom([...line2([-R, 0], [R, 0], 0.3), ...line2([0, -R], [0, R], 0.3)], 0x8ff5df, 1.8);
        bl.userData.spin = i % 2 ? -1 : 1;
        r.add(bl);
        rotors.push(bl);
        grp.add(r);
      });
      grp.scale.setScalar(1.05);
      return grp;
    };
    const _o = new THREE.Object3D();
    const orient = (grp: THREE.Object3D, pos: THREE.Vector3, tan: THREE.Vector3) => {
      grp.position.copy(pos);
      _o.position.copy(pos);
      _o.lookAt(pos.clone().add(V(tan.x, tan.y * 0.15, tan.z)));
      _o.rotateY(Math.PI);
      grp.quaternion.slerp(_o.quaternion, 0.12);
    };

    /* ---- labels (HTML, projected from 3D) ---- */
    const mkLabel = (text: string, cls: string, pos: THREE.Vector3, at: number): Lbl => {
      const el = document.createElement("div");
      el.className = "scene-lbl " + cls;
      el.textContent = text;
      lblBox.appendChild(el);
      return { el, pos, at, on: false };
    };

    /* =========== SCENE 1: mission loop through jamming =========== */
    const HOME = V(-85, 0, 34), TARGET = V(88, 0, 22);
    const loop = new THREE.CatmullRomCurve3(
      [V(-85, 10, 34), V(-52, 10, 6), V(-12, 10, -6), V(36, 10, -9), V(80, 10, -2), V(96, 10, 14), V(84, 10, 28), V(44, 10, 34), V(0, 10, 36), V(-46, 10, 38), V(-85, 10, 34)],
      false, "catmullrom", 0.5
    );
    const g1 = new THREE.Group();
    const t1 = trail(COL.ok), d1 = makeDrone(), drop1 = dropLine(), ring1 = ring(COL.ok, true);
    g1.add(t1, d1, drop1, ring1, zone(-50, 22, 26, 46, 0.18, COL.bad), zone(46, 18, 24, 48, 0.12, COL.bad));
    const home = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(-4, 0, -2), V(4, 0, -2), V(2, 0, 3), V(-6, 0, 3)]), new THREE.LineBasicMaterial({ color: COL.ok }));
    home.position.copy(HOME);
    const tgt = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([V(-4, 0, -4), V(4, 0, 4), V(-4, 0, 4), V(4, 0, -4)]), new THREE.LineBasicMaterial({ color: COL.bad }));
    tgt.position.copy(TARGET);
    g1.add(home, tgt);
    const L1 = [
      mkLabel("HOME", "mute", V(-85, 0, 42), 0),
      mkLabel("OUTBOUND", "mute", V(-12, 10, -12), 0.2),
      mkLabel("JAMMING ZONE", "bad", V(-50, 0, 0), 0.1),
      mkLabel("JAMMING ZONE", "bad", V(46, 0, -10), 0.35),
      mkLabel("TARGET", "bad", V(92, 0, 30), 0.5),
      mkLabel("RETURN", "mute", V(0, 10, 42), 0.7),
    ];
    let r1 = 3;
    const S1: Scene = {
      group: g1, dur: 12000, labels: L1, cam: { p: V(0, 78, 125), t: V(0, 0, 8) },
      update(p) {
        const q = ease(p);
        setTrail(t1, (u) => loop.getPoint(u), q);
        const pos = loop.getPoint(q);
        orient(d1, pos, loop.getTangent(q));
        setDrop(drop1, pos);
        const inJam = (Math.abs(pos.x + 50) < 14 && q < 0.4) || Math.abs(pos.x - 46) < 13;
        ring1.position.set(pos.x, 0.1, pos.z);
        r1 += ((inJam ? 6 : 3) - r1) * 0.06;
        ring1.scale.set(r1 * 1.3, 1, r1);
        (ring1.material as THREE.LineDashedMaterial).color.setHex(inJam ? COL.bad : COL.ok);
        (drop1.material as THREE.LineDashedMaterial).color.setHex(inJam ? COL.bad : COL.ink);
        L1.forEach((l) => (l.on = q >= l.at));
        if (hudPos.current) hudPos.current.textContent = inJam ? "IN JAMMING ZONE" : "CLEAR";
      },
    };

    /* =========== SCENE 2: dead-reckoning drift =========== */
    const truth = new THREE.CatmullRomCurve3([V(-90, 14, 20), V(-45, 14, 0), V(0, 14, -12), V(45, 14, -4), V(90, 14, 16)]);
    const dr = (u: number) => truth.getPoint(u).add(V(Math.sin(u * 5) * 3, 0, Math.pow(u, 1.6) * 52));
    const g2 = new THREE.Group();
    const t2a = trail(0xdfe8f0, 300, 0.55), t2b = trail(COL.bad, 300, 1);
    const d2 = makeDrone(), drop2 = dropLine(COL.bad), ring2 = ring(COL.bad, false);
    g2.add(t2a, t2b, d2, drop2, ring2);
    const L2 = [mkLabel("TRUE PATH", "mute", V(-48, 15, -4), 0.15), mkLabel("DEAD-RECKONING ESTIMATE", "bad", V(60, 14, 30), 0.55)];
    const S2: Scene = {
      group: g2, dur: 10000, labels: L2, cam: { p: V(-25, 55, 92), t: V(0, 6, 6) },
      update(p) {
        const q = ease(p);
        setTrail(t2a, (u) => truth.getPoint(u), q);
        setTrail(t2b, dr, q);
        const t = truth.getPoint(q);
        orient(d2, t, truth.getTangent(q));
        setDrop(drop2, t);
        ring2.position.set(t.x, 0.1, t.z);
        const r = 3 + q * 13;
        ring2.scale.set(r * 1.3, 1, r);
        L2.forEach((l) => (l.on = q >= l.at));
        if (hudPos.current) hudPos.current.textContent = q < 0.12 ? "DRIFT STARTING" : "DRIFTING";
      },
    };

    /* =========== SCENE 3: vision lock bounds the error =========== */
    const FN = 140;
    const feat: THREE.Vector3[] = [];
    {
      let seed = 42;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < FN; i++) {
        const b = truth.getPoint(rnd());
        feat.push(V(b.x + (rnd() - 0.5) * 70, 0, b.z + (rnd() - 0.5) * 60));
      }
    }
    const g3 = new THREE.Group();
    const fGeo = new THREE.BufferGeometry();
    fGeo.setAttribute("position", new THREE.Float32BufferAttribute(feat.flatMap((v) => [v.x, 0.2, v.z]), 3));
    fGeo.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(FN * 3), 3));
    const fPts = new THREE.Points(fGeo, new THREE.PointsMaterial({ size: 4, sizeAttenuation: false, vertexColors: true }));
    fPts.frustumCulled = false;
    const t3 = trail(COL.ok), d3 = makeDrone(), drop3 = dropLine(COL.ok), ring3 = ring(COL.ok, true);
    const rays = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: COL.ok, transparent: true, opacity: 0.35 }));
    rays.frustumCulled = false;
    rays.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(8 * 6), 3));
    g3.add(fPts, t3, d3, drop3, ring3, rays);
    const L3 = [mkLabel("LANDMARK LOCK", "ok", V(0, 0, 0), 0.05), mkLabel("BOUNDED ERROR", "ok", V(0, 0, 0), 0.05)];
    const cA = new THREE.Color(0x35495c), cB = new THREE.Color(COL.ok), tmp = new THREE.Color();
    const S3: Scene = {
      group: g3, dur: 11000, labels: L3, cam: { p: V(24, 62, 126), t: V(26, 4, 4) },
      update(p, time) {
        const q = ease(p);
        setTrail(t3, (u) => truth.getPoint(u), q);
        const t = truth.getPoint(q);
        orient(d3, t, truth.getTangent(q));
        setDrop(drop3, t);
        ring3.position.set(t.x, 0.1, t.z);
        const r = 3 + Math.sin(time * 2) * 0.4;
        ring3.scale.set(r * 1.3, 1, r);
        const col = fGeo.attributes.color.array as Float32Array;
        const near: [number, number][] = [];
        for (let i = 0; i < FN; i++) {
          const d = Math.hypot(feat[i].x - t.x, feat[i].z - t.z);
          tmp.copy(cA).lerp(cB, clamp(1 - d / 34, 0, 1));
          col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
          near.push([d, i]);
        }
        fGeo.attributes.color.needsUpdate = true;
        near.sort((a, b) => a[0] - b[0]);
        const ra = rays.geometry.attributes.position.array as Float32Array;
        for (let k = 0; k < 8; k++) { const f = feat[near[k][1]]; ra.set([t.x, t.y, t.z, f.x, 0.2, f.z], k * 6); }
        rays.geometry.attributes.position.needsUpdate = true;
        L3[0].pos.set(t.x + 14, t.y + 6, t.z);
        L3[1].pos.set(t.x, 0, t.z + 12);
        L3.forEach((l) => (l.on = q >= l.at));
        if (hudPos.current) hudPos.current.textContent = "LOCKED · BOUNDED";
      },
    };

    /* ---- director ---- */
    const scenes = [S1, S2, S3];
    scenes.forEach((s) => { s.group.visible = false; scene.add(s.group); });
    const camP = scenes[0].cam.p.clone(), camT = scenes[0].cam.t.clone();
    const tgtP = camP.clone(), tgtT = camT.clone();
    let cur = 0, elapsed = 0, last = performance.now(), mx = 0, visible = true, raf = 0;

    const go = (i: number) => {
      cur = i;
      elapsed = 0;
      scenes.forEach((s, k) => (s.group.visible = k === i));
      scenes.forEach((s, k) => { if (k !== i) s.labels.forEach((l) => l.el.classList.remove("on")); });
      tgtP.copy(scenes[i].cam.p);
      tgtT.copy(scenes[i].cam.t);
      fills.current.forEach((f) => f && (f.style.transform = "scaleX(0)"));
      setStep(i);
    };
    goRef.current = go;

    const resize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      // push the scene right on wide screens so the headline stays clear
      if (w > 900) camera.setViewOffset(w, h, 0, -h * 0.08, w, h);
      else camera.setViewOffset(w, h, 0, -h * 0.12, w, h);
      camera.zoom = w > 900 ? 1 : 0.72;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const onMove = (e: PointerEvent) => (mx = e.clientX / window.innerWidth - 0.5);
    window.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.05 });
    io.observe(host);
    go(0);

    const v = new THREE.Vector3();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - last, 100);
      last = now;
      if (!visible || document.hidden) return;
      const s = scenes[cur];
      if (!reduce) elapsed += dt;
      let p = reduce ? 0.999 : elapsed / s.dur;
      if (!reduce && p >= 1.12) { go((cur + 1) % scenes.length); return; }
      p = clamp(p, 0, 1);
      const fill = fills.current[cur];
      if (fill) fill.style.transform = `scaleX(${reduce ? 1 : clamp(elapsed / (s.dur * 1.12), 0, 1)})`;
      rotors.forEach((r) => (r.rotation.y += r.userData.spin * 0.55));
      s.update(p, now / 1000);
      camP.lerp(tgtP, 0.03);
      camT.lerp(tgtT, 0.03);
      camera.position.set(camP.x + mx * 14, camP.y, camP.z);
      camera.lookAt(camT);
      const w = host.clientWidth, h = host.clientHeight;
      s.labels.forEach((l) => {
        v.copy(l.pos).project(camera);
        // account for the view offset used on wide screens
        const sx = ((v.x * 0.5 + 0.5) * w);
        const sy = (-v.y * 0.5 + 0.5) * h;
        l.el.style.left = sx + "px";
        l.el.style.top = sy + "px";
        l.el.classList.toggle("on", l.on && v.z < 1);
      });
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      renderer.dispose();
      host.removeChild(renderer.domElement);
      lblBox.innerHTML = "";
    };
  }, []);

  const s = STEPS[step];
  return (
    <div className="scene">
      <div className="scene-canvas" ref={wrap} aria-hidden="true" />
      <div className="scene-labels" ref={labelBox} aria-hidden="true" />

      <div className="scene-hud" aria-live="off">
        <div><span>GNSS</span><b className="bad">DENIED</b></div>
        <div><span>NAV MODE</span><b className={step === 2 ? "ok" : "bad"}>{step === 2 ? "STRIDE VPS" : step === 1 ? "INERTIAL ONLY" : "MISSION"}</b></div>
        <div><span>POSITION</span><b ref={hudPos}>—</b></div>
      </div>

      <div className="scene-ui">
        <ol className="steps">
          {STEPS.map((st, i) => (
            <li key={st.tag}>
              <button className={i === step ? "on" : ""} onClick={() => goRef.current(i)} aria-label={`Scene ${st.tag}: ${st.name}`} aria-current={i === step}>
                <span className="bar"><i ref={(el) => { fills.current[i] = el; }} /></span>
                <span className="txt"><em>{st.tag}</em><span className="nm"> {st.name}</span></span>
              </button>
            </li>
          ))}
        </ol>
        <p className={`caption ${s.tone}`} key={step}>{s.caption}</p>
      </div>
      <p className="scene-note">Illustrative simulation</p>
    </div>
  );
}
