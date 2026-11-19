// Đảo 3D kiểu đồ chơi đất sét (Three.js). Dựng theo bản thử nghiệm "02-chit-chat-island-3d.html",
// nối với dữ liệu thật của game: khu đã mở, đồ xây theo cấp, vườn nhiệm vụ, ao tôm cua, cư dân có nhiệm vụ.
// File thuần TypeScript, không phụ thuộc React — island3d.tsx bọc lại.
import * as THREE from "three";
import type { FarmKind } from "@/lib/island/state";

export type WorldState = {
  /** Cư dân đang có nhiệm vụ (vẫy tay, có dấu "!"). */
  quest: string | null;
  /** Cấp đảo: mở các món xây. */
  level: number;
  /** Số ô vườn đã trồng (0–6 hiển thị). */
  garden: number;
  /** Con đang nuôi ở Ao Tôm Cua. */
  pond: { kind: FarmKind; ready?: boolean }[];
  /** Văn phòng Mây đã mở chưa. */
  office: boolean;
  dusk: boolean;
  /** Đảo Luyện: các công trình đã dựng (đã thử tính năng). */
  isle?: string[];
  /** Thứ 7, Chủ nhật: đuốc ở đấu trường cháy. */
  bossLit?: boolean;
  /** Đảo Cát Vui: đã mở chưa + trạng thái 4 ô đất. */
  beach?: { open: boolean; plots: Record<string, { st: "locked" | "wild" | "empty" | "built"; t?: string; lv?: number }> };
  /** Đảo Phố Cảng (A2) đã mở chưa. */
  harbor?: boolean;
  /** Số rương kho báu đã mở (hiện rương ở bến phà). */
  chests?: number;
  /** Thành Phố Mây (B1) đã mở chưa. */
  city?: boolean;
  /** Mùa lễ đang diễn ra (id) hoặc null. */
  fest?: string | null;
  /** Đảo Nhỏ Của Tôi: ô → món trang trí. */
  decor?: Record<string, string>;
  /** Số đảo bạn bè hiện trên bản đồ biển. */
  friends?: number;
};

export type WorldView = "home" | "isle" | "beach" | "harbor" | "city" | "fest" | "mine" | "chart";

export type Projected = { id: string; x: number; y: number; depth: number; behind: boolean };

export type WorldOptions = {
  canvas: HTMLCanvasElement;
  state: WorldState;
  reduceMotion: boolean;
  onPick: (id: string | null) => void;
  onFrame: (pts: Projected[], w: number, h: number) => void;
};

export type WorldController = {
  setState: (s: WorldState) => void;
  resize: (w: number, h: number) => void;
  setActive: (on: boolean) => void;
  resetView: () => void;
  focus: (id: string) => void;
  hop: (id: string) => void;
  /** Lướt máy quay sang đảo nhà hoặc Đảo Luyện. */
  setView: (v: WorldView) => void;
  dispose: () => void;
};

const PI = Math.PI;

export function createWorld(opts: WorldOptions): WorldController {
  const { canvas, reduceMotion } = opts;
  let state = opts.state;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  const narrowDevice = Math.min(window.innerWidth, window.innerHeight) < 700;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrowDevice ? 1.6 : 2));
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1.6, 0.1, 200);

  // ───────── vật liệu & khối cơ bản ─────────
  const disposables: { dispose: () => void }[] = [];
  const matCache = new Map<string, THREE.MeshStandardMaterial>();
  function mat(hex: string, rough = 0.7): THREE.MeshStandardMaterial {
    const key = hex + rough;
    let m = matCache.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: rough, metalness: 0 });
      matCache.set(key, m);
    }
    return m;
  }
  function own<T extends { dispose: () => void }>(x: T): T {
    disposables.push(x);
    return x;
  }
  const SPH = own(new THREE.SphereGeometry(1, 32, 24));
  const geoCache = new Map<string, THREE.BufferGeometry>();
  function geo(key: string, make: () => THREE.BufferGeometry) {
    let g = geoCache.get(key);
    if (!g) {
      g = own(make());
      geoCache.set(key, g);
    }
    return g;
  }
  function mesh(g: THREE.BufferGeometry, m: THREE.Material, shadow = true) {
    const o = new THREE.Mesh(g, m);
    o.castShadow = shadow;
    o.receiveShadow = true;
    return o;
  }
  function sph(r: number, hex: string, sx = 1, sy = 1, sz = 1, rough?: number) {
    const m = mesh(SPH, mat(hex, rough));
    m.scale.set(r * sx, r * sy, r * sz);
    return m;
  }
  function box(w: number, h: number, d: number, hex: string, rough?: number) {
    return mesh(
      geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)),
      mat(hex, rough),
    );
  }
  function cyl(rt: number, rb: number, h: number, hex: string, seg = 24, rough?: number) {
    return mesh(
      geo(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)),
      mat(hex, rough),
    );
  }
  function cone(r: number, h: number, hex: string, seg = 24) {
    return mesh(
      geo(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)),
      mat(hex),
    );
  }
  function glow(hex: string, intensity = 0.8) {
    return own(new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), emissive: new THREE.Color(hex), emissiveIntensity: intensity, roughness: 0.5 }));
  }
  const faceCenter = (g: THREE.Object3D) => {
    g.rotation.y = Math.atan2(-g.position.x, -g.position.z);
  };
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // ───────── ánh sáng ─────────
  const SUN_DAY = new THREE.Color("#FFF1D6"),
    SUN_DUSK = new THREE.Color("#FF9A5C"),
    SKY_DAY = new THREE.Color("#FFF6E0"),
    SKY_DUSK = new THREE.Color("#E8A6B8");
  const hemi = new THREE.HemisphereLight(SKY_DAY.clone(), new THREE.Color("#9CCB6A"), 0.55 * PI);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(SUN_DAY.clone(), 1.15 * PI);
  sun.position.set(8, 14, 7);
  sun.castShadow = true;
  const sm = narrowDevice ? 1024 : 2048;
  sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
  sun.shadow.bias = -0.0008;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(new THREE.Color("#CFE6FF"), 0.35 * PI);
  fill.position.set(-8, 6, -6);
  scene.add(fill);

  // ───────── biển, khối đảo ─────────
  // Mặt nước trong suốt chỉ nhận bóng (nền biển là CSS của trang).
  const shadowSea = new THREE.Mesh(own(new THREE.CircleGeometry(30, 48)), own(new THREE.ShadowMaterial({ opacity: 0.18 })));
  shadowSea.rotation.x = -PI / 2;
  shadowSea.position.y = -1.72;
  shadowSea.receiveShadow = true;
  scene.add(shadowSea);
  const halo = new THREE.Mesh(own(new THREE.RingGeometry(7.0, 9.6, 72)), own(new THREE.MeshBasicMaterial({ color: 0xd4f3f8, transparent: true, opacity: 0.55, depthWrite: false })));
  halo.rotation.x = -PI / 2;
  halo.position.y = -1.7;
  scene.add(halo);
  const foam: THREE.Mesh[] = [];
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(own(new THREE.TorusGeometry(7.4, 0.07, 8, 96)), own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })));
    ring.rotation.x = PI / 2;
    ring.position.y = -1.66;
    scene.add(ring);
    foam.push(ring);
  }

  const world = new THREE.Group();
  scene.add(world);
  const grass = cyl(7.2, 7.35, 0.5, "#9CCB6A", 72, 0.95);
  grass.position.y = -0.25;
  world.add(grass);
  const cliff = cyl(7.3, 5.4, 2.0, "#C9925C", 72, 0.95);
  cliff.position.y = -1.45;
  cliff.castShadow = false;
  world.add(cliff);
  const band = cyl(6.55, 5.6, 0.45, "#A86A4A", 72, 0.95);
  band.position.y = -1.9;
  world.add(band);
  // Viền cát quanh mép đảo
  const sand = mesh(own(new THREE.TorusGeometry(7.25, 0.16, 10, 96)), mat("#F4DFAA", 0.95), false);
  sand.rotation.x = PI / 2;
  sand.position.y = -0.04;
  world.add(sand);
  (
    [
      [-3, -3.5, 2.2],
      [3.5, 2.6, 2.4],
      [-1.5, 3.8, 1.6],
    ] as const
  ).forEach(([x, z, r]) => {
    const patch = cyl(r, r, 0.02, "#A8D27A", 40, 0.95);
    patch.position.set(x, 0.01, z);
    patch.castShadow = false;
    world.add(patch);
  });

  // ───────── đường đi ─────────
  function pathTo(x1: number, z1: number, x2: number, z2: number) {
    const dx = x2 - x1,
      dz = z2 - z1,
      len = Math.hypot(dx, dz);
    const p = mesh(own(new THREE.BoxGeometry(1.0, 0.05, len)), mat("#EBD5A2", 0.95), false);
    p.position.set((x1 + x2) / 2, 0.025, (z1 + z2) / 2);
    p.rotation.y = Math.atan2(dx, dz);
    world.add(p);
    const cap = cyl(0.5, 0.5, 0.05, "#EBD5A2", 24, 0.95);
    cap.position.set(x2, 0.025, z2);
    cap.castShadow = false;
    world.add(cap);
  }
  const plaza = cyl(1.8, 1.8, 0.06, "#EBD5A2", 48, 0.95);
  plaza.position.y = 0.03;
  plaza.castShadow = false;
  world.add(plaza);
  pathTo(0, 0, -3.3, -0.5);
  pathTo(0, 0, 3.3, 0.3);
  pathTo(0, 0, 2.5, -3.3);
  pathTo(0, 0, -2.2, 2.4);
  pathTo(0, 0, 1.8, 5.8);
  pathTo(0, 0, -2.6, -2.7);
  pathTo(0, 0, 3.2, 3.3);

  // Đài phun nước
  const basin = cyl(0.55, 0.6, 0.3, "#B9B4A8", 32);
  basin.position.set(0.9, 0.15, -0.6);
  world.add(basin);
  const pool = cyl(0.45, 0.45, 0.04, "#9BD6E6", 32, 0.2);
  pool.position.set(0.9, 0.31, -0.6);
  world.add(pool);
  const jet = sph(0.09, "#BFE3F0", 1, 1, 1, 0.2);
  jet.position.set(0.9, 0.55, -0.6);
  world.add(jet);

  // Nơi bấm được: mesh gắn userData.pid → id
  const pickables: THREE.Object3D[] = [];
  function tag(obj: THREE.Object3D, id: string) {
    obj.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.userData.pid = id;
        pickables.push(o);
      }
    });
  }
  function untag(obj: THREE.Object3D) {
    obj.traverse((o) => {
      const i = pickables.indexOf(o);
      if (i >= 0) pickables.splice(i, 1);
    });
  }
  const anchors = new Map<string, { obj: THREE.Object3D; y: number }>();

  // ───────── Quán Miso ─────────
  const cafe = new THREE.Group();
  cafe.position.set(-4.2, 0, -0.6);
  faceCenter(cafe);
  world.add(cafe);
  {
    const cb = box(2.0, 1.4, 1.6, "#FFF4E2");
    cb.position.y = 0.7;
    cafe.add(cb);
    const roof = cone(1.7, 1.1, "#D9735A", 4);
    roof.rotation.y = PI / 4;
    roof.scale.set(1, 1, 0.82);
    roof.position.y = 1.95;
    cafe.add(roof);
    for (let i = 0; i < 7; i++) {
      const st = box(0.3, 0.06, 0.5, i % 2 ? "#FFF4E2" : "#3F7A34");
      st.position.set(-0.9 + i * 0.3, 1.18, 0.98);
      st.rotation.x = 0.4;
      cafe.add(st);
    }
    const door = box(0.46, 0.8, 0.06, "#8B5E3C");
    door.position.set(0, 0.4, 0.81);
    cafe.add(door);
    const chim = box(0.26, 0.7, 0.26, "#A86A4A");
    chim.position.set(0.55, 2.05, -0.25);
    cafe.add(chim);
    const sign = cyl(0.26, 0.26, 0.06, "#FFF9EE", 24);
    sign.rotation.x = PI / 2;
    sign.position.set(0, 1.62, 0.84);
    cafe.add(sign);
    const cupS = cyl(0.1, 0.08, 0.12, "#8B5E3C", 16);
    cupS.rotation.x = PI / 2;
    cupS.position.set(0, 1.62, 0.89);
    cafe.add(cupS);
    // Bàn ngoài hiên
    const tbl = cyl(0.28, 0.28, 0.05, "#FFF9EE", 20);
    tbl.position.set(1.25, 0.5, 1.05);
    cafe.add(tbl);
    const leg = cyl(0.04, 0.04, 0.5, "#8B5E3C", 8);
    leg.position.set(1.25, 0.25, 1.05);
    cafe.add(leg);
  }
  const cafeWin = glow("#BFE3F0", 0);
  [-0.65, 0.65].forEach((x) => {
    const w = mesh(geo("win", () => new THREE.BoxGeometry(0.42, 0.36, 0.05)), cafeWin);
    w.position.set(x, 0.82, 0.81);
    cafe.add(w);
  });
  const steamMat = own(new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 1 }));
  const steam: { m: THREE.Mesh; o: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(SPH, steamMat.clone());
    disposables.push(puff.material as THREE.Material);
    puff.scale.setScalar(0.12);
    cafe.add(puff);
    steam.push({ m: puff, o: i / 4 });
  }
  tag(cafe, "place:cafe");
  anchors.set("place:cafe", { obj: cafe, y: 3.0 });

  // ───────── Chợ Cà Rốt ─────────
  const stall = new THREE.Group();
  stall.position.set(4.3, 0, 0.4);
  faceCenter(stall);
  world.add(stall);
  {
    const table = box(1.9, 0.62, 0.8, "#C9925C");
    table.position.y = 0.31;
    stall.add(table);
    (
      [
        [-0.9, -0.35],
        [0.9, -0.35],
        [-0.9, 0.35],
        [0.9, 0.35],
      ] as const
    ).forEach(([x, z]) => {
      const post = cyl(0.05, 0.05, 1.5, "#8B5E3C", 8);
      post.position.set(x, 0.75, z);
      stall.add(post);
    });
    for (let i = 0; i < 7; i++) {
      const can = box(0.3, 0.06, 1.15, i % 2 ? "#FFF4E2" : "#E89AAD");
      can.position.set(-0.9 + i * 0.3, 1.56, 0);
      can.rotation.x = -0.18;
      stall.add(can);
    }
    const crate = box(0.6, 0.22, 0.45, "#A86A4A");
    crate.position.set(-0.45, 0.73, 0.05);
    stall.add(crate);
    for (let k = 0; k < 4; k++) {
      const carrot = cone(0.06, 0.32, "#F29A4E", 12);
      carrot.rotation.z = PI / 2 + (k - 1.5) * 0.15;
      carrot.position.set(-0.6 + k * 0.1, 0.9, 0.05);
      stall.add(carrot);
      const top = cone(0.04, 0.12, "#6FAE4F", 8);
      top.rotation.z = -PI / 2;
      top.position.set(-0.4 + k * 0.1, 0.9 + (k - 1.5) * 0.03, 0.05);
      stall.add(top);
    }
    (
      [
        [0.35, 0.78],
        [0.52, 0.78],
        [0.44, 0.92],
      ] as const
    ).forEach(([x, y]) => {
      const ap = sph(0.09, "#E86F5A", 1, 1, 1, 0.4);
      ap.position.set(x, y, 0.05);
      stall.add(ap);
    });
  }
  tag(stall, "place:market");
  anchors.set("place:market", { obj: stall, y: 2.3 });

  // ───────── Sân Bay Mây ─────────
  const air = new THREE.Group();
  air.position.set(3.0, 0, -4.3);
  faceCenter(air);
  world.add(air);
  let beacon: THREE.Mesh;
  {
    const tower = cyl(0.32, 0.42, 2.6, "#FFF9EE", 24);
    tower.position.set(0.9, 1.3, 0);
    air.add(tower);
    const cab = cyl(0.62, 0.55, 0.5, "#BFE3F0", 10, 0.2);
    cab.position.set(0.9, 2.85, 0);
    air.add(cab);
    const troof = cone(0.78, 0.5, "#4E7FB8", 10);
    troof.position.set(0.9, 3.35, 0);
    air.add(troof);
    beacon = new THREE.Mesh(SPH, glow("#E86F5A", 0.6));
    beacon.scale.setScalar(0.09);
    beacon.position.set(0.9, 3.65, 0);
    air.add(beacon);
    const term = box(1.6, 0.8, 1.0, "#EEF3F7");
    term.position.set(-0.6, 0.4, 0.2);
    air.add(term);
    const troof2 = box(1.75, 0.12, 1.15, "#4E7FB8");
    troof2.position.set(-0.6, 0.86, 0.2);
    air.add(troof2);
    for (let i = 0; i < 3; i++) {
      const tw = box(0.3, 0.25, 0.04, "#BFE3F0", 0.2);
      tw.position.set(-1.1 + i * 0.5, 0.48, 0.71);
      air.add(tw);
    }
    // Ống gió sọc
    const pole = cyl(0.03, 0.03, 1.0, "#8B5E3C", 6);
    pole.position.set(-1.6, 0.5, -0.4);
    air.add(pole);
    const sock = cone(0.1, 0.42, "#E86F5A", 12);
    sock.rotation.z = PI / 2;
    sock.position.set(-1.42, 0.95, -0.4);
    air.add(sock);
  }
  tag(air, "place:airport");
  anchors.set("place:airport", { obj: air, y: 3.9 });

  const plane = new THREE.Group();
  scene.add(plane);
  {
    plane.add(sph(0.35, "#FFFFFF", 2.2, 0.75, 0.75, 0.4));
    plane.add(box(0.25, 0.05, 1.6, "#4E7FB8"));
    const tail = box(0.22, 0.38, 0.05, "#E86F5A");
    tail.position.set(-0.68, 0.22, 0);
    plane.add(tail);
    const stab = box(0.18, 0.04, 0.6, "#4E7FB8");
    stab.position.set(-0.7, 0.05, 0);
    plane.add(stab);
  }

  // ───────── Cây Anh Đào ─────────
  const sakura = new THREE.Group();
  sakura.position.set(-0.6, 0, -3.8);
  world.add(sakura);
  const crown = new THREE.Group();
  {
    const trunk = cyl(0.22, 0.4, 1.9, "#8B5E3C", 16);
    trunk.position.y = 0.95;
    trunk.rotation.z = 0.06;
    sakura.add(trunk);
    crown.position.y = 2.4;
    sakura.add(crown);
    (
      [
        [0, 0.3, 0, 1.15, "#F4B6C2"],
        [-0.9, -0.1, 0.2, 0.85, "#E89AAD"],
        [0.9, -0.05, 0.1, 0.9, "#F4B6C2"],
        [0.1, -0.2, 0.85, 0.8, "#F7C9D2"],
        [-0.2, 0.1, -0.8, 0.85, "#E89AAD"],
        [0.4, 0.75, -0.2, 0.7, "#F7C9D2"],
      ] as const
    ).forEach(([x, y, z, r, c]) => {
      const s = sph(r, c, 1, 0.9, 1, 0.85);
      s.position.set(x, y, z);
      crown.add(s);
    });
    // Xích đu
    const rope1 = cyl(0.015, 0.015, 1.1, "#8B5E3C", 4);
    rope1.position.set(0.55, 1.15, 0.5);
    sakura.add(rope1);
    const rope2 = rope1.clone();
    rope2.position.x = 0.95;
    sakura.add(rope2);
    const seat = box(0.55, 0.05, 0.2, "#A86A4A");
    seat.position.set(0.75, 0.6, 0.5);
    sakura.add(seat);
  }
  tag(sakura, "place:tree");
  anchors.set("place:tree", { obj: sakura, y: 4.2 });

  // ───────── Trạm Hỏi Đường (Hồ Kero) ─────────
  const pondG = new THREE.Group();
  pondG.position.set(-3.4, 0, 2.7);
  world.add(pondG);
  {
    const pond = cyl(1.25, 1.25, 0.04, "#8FD0E2", 40, 0.2);
    pond.position.y = 0.03;
    pond.castShadow = false;
    pondG.add(pond);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * PI * 2;
      const rock = sph(0.13, "#B9B4A8", 1.2, 0.7, 1, 0.9);
      rock.position.set(Math.cos(a) * 1.3, 0.06, Math.sin(a) * 1.3);
      pondG.add(rock);
    }
    (
      [
        [-0.4, -0.3],
        [0.4, 0.5],
      ] as const
    ).forEach(([x, z]) => {
      const pad = cyl(0.24, 0.24, 0.03, "#6FAE4F", 20);
      pad.position.set(x, 0.07, z);
      pondG.add(pad);
    });
    const lotus = sph(0.07, "#F4B6C2", 1, 0.8, 1, 0.5);
    lotus.position.set(-0.4, 0.13, -0.3);
    pondG.add(lotus);
  }
  const signG = new THREE.Group();
  signG.position.set(-1.6, 0, 3.7);
  world.add(signG);
  {
    const sp = cyl(0.06, 0.07, 1.2, "#8B5E3C", 8);
    sp.position.y = 0.6;
    signG.add(sp);
    const b1 = box(0.8, 0.2, 0.06, "#E8CF9B");
    b1.position.set(0.25, 1.0, 0);
    b1.rotation.y = 0.3;
    signG.add(b1);
    const b2 = box(0.7, 0.2, 0.06, "#E8CF9B");
    b2.position.set(-0.2, 0.72, 0);
    b2.rotation.y = -0.5;
    signG.add(b2);
  }
  tag(pondG, "place:pond");
  tag(signG, "place:pond");
  anchors.set("place:pond", { obj: pondG, y: 1.5 });

  // ───────── Vườn Nhiệm Vụ ─────────
  const gardenG = new THREE.Group();
  gardenG.position.set(-3.7, 0, -3.3);
  gardenG.rotation.y = 0.6;
  world.add(gardenG);
  const crops: THREE.Group[] = [];
  {
    const fence = (x: number, z: number, len: number, rot: number) => {
      const rail = box(len, 0.06, 0.06, "#C9925C");
      rail.position.set(x, 0.35, z);
      rail.rotation.y = rot;
      gardenG.add(rail);
    };
    fence(0, -1.05, 2.7, 0);
    fence(-1.35, 0, 2.1, PI / 2);
    fence(1.35, 0, 2.1, PI / 2);
    for (const [x, z] of [
      [-1.35, -1.05],
      [1.35, -1.05],
      [-1.35, 1.05],
      [1.35, 1.05],
      [0, -1.05],
    ] as const) {
      const post = cyl(0.05, 0.05, 0.5, "#8B5E3C", 6);
      post.position.set(x, 0.25, z);
      gardenG.add(post);
    }
    const CROP_COLORS = ["#E86F5A", "#F2C14E", "#F4B6C2", "#F29A4E", "#B48CE0", "#FFFFFF"];
    for (let i = 0; i < 6; i++) {
      const x = -0.85 + (i % 3) * 0.85,
        z = i < 3 ? -0.45 : 0.45;
      const plot = box(0.7, 0.12, 0.7, "#8A5A37", 0.95);
      plot.position.set(x, 0.06, z);
      gardenG.add(plot);
      const crop = new THREE.Group();
      crop.position.set(x, 0.12, z);
      const stem = cyl(0.025, 0.03, 0.3, "#4C8A3F", 6);
      stem.position.y = 0.15;
      crop.add(stem);
      [-1, 1].forEach((s) => {
        const leaf = sph(0.09, "#6FAE4F", 1.4, 0.4, 0.8, 0.8);
        leaf.position.set(s * 0.1, 0.18, 0);
        leaf.rotation.z = s * 0.4;
        crop.add(leaf);
      });
      const bloom = sph(0.1, CROP_COLORS[i], 1, 0.85, 1, 0.6);
      bloom.position.y = 0.34;
      crop.add(bloom);
      crop.visible = false;
      gardenG.add(crop);
      crops.push(crop);
      // Mầm nhỏ ở ô chưa trồng
      const sprout = sph(0.05, "#9CCB6A", 1, 1.4, 1, 0.8);
      sprout.position.set(x, 0.16, z);
      sprout.userData.sprout = i;
      gardenG.add(sprout);
    }
    // Bù nhìn
    const sc = new THREE.Group();
    sc.position.set(1.0, 0, 1.25);
    const pole = cyl(0.04, 0.04, 1.1, "#8B5E3C", 6);
    pole.position.y = 0.55;
    sc.add(pole);
    const arm = cyl(0.03, 0.03, 0.8, "#8B5E3C", 6);
    arm.rotation.z = PI / 2;
    arm.position.y = 0.8;
    sc.add(arm);
    const shirt = box(0.34, 0.36, 0.18, "#4E7FB8");
    shirt.position.y = 0.72;
    sc.add(shirt);
    const hd = sph(0.15, "#F2D27A");
    hd.position.y = 1.08;
    sc.add(hd);
    const hat = cone(0.24, 0.18, "#C9925C", 16);
    hat.position.y = 1.24;
    sc.add(hat);
    gardenG.add(sc);
  }
  tag(gardenG, "place:garden");
  anchors.set("place:garden", { obj: gardenG, y: 1.7 });

  // ───────── Ao Tôm Cua ─────────
  const farmG = new THREE.Group();
  farmG.position.set(-0.7, 0, 5.0);
  farmG.rotation.y = -0.15;
  world.add(farmG);
  const FW = 2.3,
    FD = 1.5;
  {
    const water = box(FW, 0.06, FD, "#6FC1DA", 0.2);
    water.position.y = 0.04;
    water.castShadow = false;
    farmG.add(water);
    const frameMat = "#A86A4A";
    const e1 = box(FW + 0.24, 0.16, 0.12, frameMat);
    e1.position.set(0, 0.08, -FD / 2 - 0.06);
    farmG.add(e1);
    const e2 = e1.clone();
    e2.position.z = FD / 2 + 0.06;
    farmG.add(e2);
    const e3 = box(0.12, 0.16, FD, frameMat);
    e3.position.set(-FW / 2 - 0.06, 0.08, 0);
    farmG.add(e3);
    const e4 = e3.clone();
    e4.position.x = FW / 2 + 0.06;
    farmG.add(e4);
    // Phao
    for (let i = 0; i < 5; i++) {
      const b = sph(0.06, i % 2 ? "#FFFFFF" : "#E86F5A", 1, 1, 1, 0.4);
      b.position.set(-0.8 + i * 0.4, 0.1, 0);
      farmG.add(b);
    }
    // Vỏ sò trên bờ
    const shell = sph(0.1, "#F2C14E", 1, 0.5, 1.2, 0.5);
    shell.position.set(FW / 2 + 0.35, 0.05, 0.4);
    farmG.add(shell);
  }
  const kidsG = new THREE.Group();
  farmG.add(kidsG);
  tag(farmG, "place:farm");
  anchors.set("place:farm", { obj: farmG, y: 1.0 });

  // ───────── Văn phòng Mây ─────────
  const office = new THREE.Group();
  office.position.set(5.3, 0, -2.0);
  faceCenter(office);
  world.add(office);
  const officeWin = glow("#BFE3F0", 0);
  const officeTape: THREE.Object3D[] = [];
  {
    const body = box(1.6, 2.0, 1.2, "#EEF3F7");
    body.position.y = 1.0;
    office.add(body);
    const top = box(1.75, 0.14, 1.35, "#C96A2B");
    top.position.y = 2.07;
    office.add(top);
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        const w = mesh(geo("owin", () => new THREE.BoxGeometry(0.36, 0.38, 0.05)), officeWin);
        w.position.set(-0.5 + c * 0.5, 0.95 + r * 0.6, 0.61);
        office.add(w);
      }
    const door = box(0.42, 0.62, 0.06, "#4E7FB8");
    door.position.set(0, 0.31, 0.61);
    office.add(door);
    const awn = box(0.7, 0.05, 0.3, "#C96A2B");
    awn.position.set(0, 0.7, 0.72);
    office.add(awn);
    const ant = cyl(0.02, 0.02, 0.6, "#8B5E3C", 6);
    ant.position.set(0.5, 2.44, -0.2);
    office.add(ant);
    const dish = sph(0.12, "#FFFFFF", 1, 0.4, 1);
    dish.position.set(0.5, 2.75, -0.2);
    office.add(dish);
    // Rào "sắp mở"
    for (const x of [-0.6, 0.6]) {
      const cn = cone(0.1, 0.3, "#F29A4E", 12);
      cn.position.set(x, 0.15, 1.0);
      office.add(cn);
      officeTape.push(cn);
    }
    const tape = box(1.3, 0.06, 0.02, "#F2C14E");
    tape.position.set(0, 0.26, 1.0);
    office.add(tape);
    officeTape.push(tape);
  }
  tag(office, "place:office");
  anchors.set("place:office", { obj: office, y: 2.9 });

  // ───────── cây, bụi, hoa ─────────
  const trees: { g: THREE.Group; ph: number }[] = [];
  function tree(x: number, z: number, s: number, pink = false) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    const t = cyl(0.12, 0.18, 0.8, "#8B5E3C", 10);
    t.position.y = 0.4;
    g.add(t);
    const a = sph(0.62, pink ? "#E89AAD" : "#5E9B4C", 1, 1, 1, 0.9);
    a.position.y = 1.15;
    g.add(a);
    const b = sph(0.42, pink ? "#F4B6C2" : "#74B05A", 1, 1, 1, 0.9);
    b.position.set(-0.18, 1.45, 0.2);
    g.add(b);
    world.add(g);
    return g;
  }
  (
    [
      [-6.1, 2.6, 1],
      [-5.6, 4.1, 0.8],
      [-4.4, 5.2, 1.1],
      [-2.7, 6.2, 0.85],
      [3.1, 6.0, 0.9],
      [3.9, 4.6, 0.8],
      [6.4, -0.75, 0.9],
      [4.9, -4.4, 0.95],
      [0.8, -6.4, 1.05],
      [-2.4, -6.1, 0.9],
      [-5.6, -3.8, 1.0],
      [-6.3, -1.9, 0.95],
      [-1.4, -5.7, 0.7, true],
      [2.2, -6.2, 0.7, true],
      [5.6, 3.6, 0.7, true],
    ] as [number, number, number, boolean?][]
  ).forEach(([x, z, s, p], i) => trees.push({ g: tree(x, z, s, p), ph: i * 0.7 }));
  (
    [
      [-1.9, 1.3],
      [1.7, 2.1],
      [-2.4, -1.4],
      [2.0, -1.6],
    ] as const
  ).forEach(([x, z]) => {
    const b1 = sph(0.32, "#6FAE4F", 1, 0.85, 1, 0.9);
    b1.position.set(x, 0.22, z);
    world.add(b1);
    const b2 = sph(0.25, "#74B05A", 1, 0.85, 1, 0.9);
    b2.position.set(x + 0.32, 0.18, z + 0.1);
    world.add(b2);
    const fl = sph(0.06, "#F4B6C2", 1, 1, 1, 0.6);
    fl.position.set(x + 0.1, 0.48, z + 0.15);
    world.add(fl);
  });
  const flowerCols = ["#F4B6C2", "#F2C14E", "#FFFFFF", "#E89AAD"];
  for (let i = 0; i < 46; i++) {
    const a = rnd() * PI * 2,
      r = 2.2 + rnd() * 4.4;
    const f = sph(0.055, flowerCols[i % 4], 1, 1, 1, 0.6);
    f.position.set(Math.cos(a) * r, 0.06, Math.sin(a) * r);
    f.castShadow = false;
    world.add(f);
  }

  // ───────── Đảo Luyện: đảo nhỏ bên phải, nối bằng cầu gỗ ─────────
  // Mỗi công trình = một cách luyện. Chưa thử thì còn giàn giáo; thử lần đầu thì dựng xong.
  const ISLE_C = new THREE.Vector3(12.0, 0, 0.8);
  const IR = 4.2;
  const isleG = new THREE.Group();
  isleG.position.copy(ISLE_C);
  world.add(isleG);
  const isleGround = new THREE.Group();
  isleG.add(isleGround);
  {
    const g2 = cyl(IR, IR + 0.12, 0.5, "#A8D27A", 56, 0.95);
    g2.position.y = -0.25;
    isleGround.add(g2);
    const c2 = cyl(IR + 0.1, IR * 0.7, 1.75, "#C9925C", 56, 0.95);
    c2.position.y = -1.37;
    c2.castShadow = false;
    isleGround.add(c2);
    const b2 = cyl(IR * 0.86, IR * 0.66, 0.4, "#A86A4A", 56, 0.95);
    b2.position.y = -1.85;
    isleGround.add(b2);
    const sand2 = mesh(own(new THREE.TorusGeometry(IR + 0.06, 0.15, 10, 72)), mat("#F4DFAA", 0.95), false);
    sand2.rotation.x = PI / 2;
    sand2.position.y = -0.04;
    isleGround.add(sand2);
    const plaza2 = cyl(1.1, 1.1, 0.06, "#EBD5A2", 40, 0.95);
    plaza2.position.y = 0.03;
    plaza2.castShadow = false;
    isleGround.add(plaza2);
    // Lối từ cầu vào quảng trường nhỏ
    const lane = box(0.9, 0.05, 3.2, "#EBD5A2", 0.95);
    lane.castShadow = false;
    lane.position.set(-2.6, 0.025, -0.15);
    lane.rotation.y = PI / 2 + 0.04;
    isleGround.add(lane);
    // Cột cờ giữa đảo
    const pole = cyl(0.04, 0.05, 2.0, "#8B5E3C", 8);
    pole.position.y = 1.0;
    isleGround.add(pole);
    const knob = sph(0.08, "#F2C14E", 1, 1, 1, 0.4);
    knob.position.y = 2.04;
    isleGround.add(knob);
  }
  const isleFlag = box(0.62, 0.36, 0.03, "#6FAE4F");
  isleFlag.position.set(0.33, 1.75, 0);
  isleG.add(isleFlag);
  const isleHalo = new THREE.Mesh(own(new THREE.RingGeometry(IR - 0.2, IR + 1.9, 64)), own(new THREE.MeshBasicMaterial({ color: 0xd4f3f8, transparent: true, opacity: 0.5, depthWrite: false })));
  isleHalo.rotation.x = -PI / 2;
  isleHalo.position.set(ISLE_C.x, -1.69, ISLE_C.z);
  scene.add(isleHalo);
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(own(new THREE.TorusGeometry(IR + 0.25, 0.06, 8, 72)), own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })));
    ring.rotation.x = PI / 2;
    ring.position.set(ISLE_C.x, -1.66, ISLE_C.z);
    scene.add(ring);
    foam.push(ring);
  }
  tag(isleGround, "isle:go");

  // Cầu gỗ cong nối hai đảo
  const bridgeG = new THREE.Group();
  world.add(bridgeG);
  {
    const x1 = 6.5,
      z1 = 0.43,
      x2 = ISLE_C.x - IR + 0.55,
      z2 = 0.53;
    const len = Math.hypot(x2 - x1, z2 - z1);
    bridgeG.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
    bridgeG.rotation.y = Math.atan2(x2 - x1, z2 - z1) - PI / 2;
    const N = 9;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const plank = box(len / N + 0.03, 0.08, 1.0, i % 2 ? "#C9925C" : "#B98250");
      plank.position.set(-len / 2 + (u * (N - 1) + 0.5) * (len / N), 0.07 + Math.sin(u * PI) * 0.28, 0);
      plank.rotation.z = -Math.cos(u * PI) * 0.28;
      bridgeG.add(plank);
    }
    for (const side of [-0.5, 0.5]) {
      for (let i = 0; i <= 4; i++) {
        const u = i / 4;
        const post = cyl(0.045, 0.05, 0.55, "#8B5E3C", 8);
        post.position.set(-len / 2 + u * len, 0.32 + Math.sin(u * PI) * 0.28, side);
        bridgeG.add(post);
      }
      const rail = mesh(
        geo(`rail${len.toFixed(2)}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([0, 0.25, 0.5, 0.75, 1].map((u) => new THREE.Vector3(-len / 2 + u * len, 0.58 + Math.sin(u * PI) * 0.28, 0))), 20, 0.035, 6)),
        mat("#A86A4A"),
      );
      rail.position.z = side;
      bridgeG.add(rail);
    }
  }
  tag(bridgeG, "isle:go");
  // Lối nhỏ sau sạp chợ dẫn ra cầu
  pathTo(5.15, 0.45, 6.75, 0.43);

  // Giàn giáo dùng chung (chưa dựng)
  function scaffold(h: number, w = 0.9) {
    const g = new THREE.Group();
    const hw = w / 2;
    for (const [x, z] of [
      [-hw, -hw],
      [hw, -hw],
      [-hw, hw],
      [hw, hw],
    ] as const) {
      const p = cyl(0.035, 0.035, h, "#C9925C", 6);
      p.position.set(x, h / 2, z);
      g.add(p);
    }
    for (let y = 0.45; y < h; y += 0.6)
      for (const z of [-hw, hw]) {
        const beam = box(w + 0.1, 0.05, 0.05, "#B98250");
        beam.position.set(0, y, z);
        g.add(beam);
      }
    const brace = box(0.04, Math.hypot(w, h * 0.7), 0.04, "#B98250");
    brace.position.set(0, h * 0.4, hw + 0.03);
    brace.rotation.z = Math.atan2(w, h * 0.7);
    g.add(brace);
    const deck = box(w + 0.1, 0.05, w + 0.1, "#D9B27C");
    deck.position.y = Math.min(h - 0.1, 0.9);
    g.add(deck);
    const plankPile = box(0.5, 0.12, 0.22, "#C9925C");
    plankPile.position.set(hw + 0.35, 0.06, hw);
    plankPile.rotation.y = 0.4;
    g.add(plankPile);
    const cn = cone(0.09, 0.26, "#F29A4E", 12);
    cn.position.set(-hw - 0.25, 0.13, hw + 0.15);
    g.add(cn);
    // Bảng "?" vàng phía trước
    const sign = box(0.34, 0.34, 0.04, "#F2C14E");
    sign.position.set(0, 0.55, hw + 0.08);
    g.add(sign);
    const q = sph(0.06, "#4A3222", 1, 1, 0.4);
    q.position.set(0, 0.5, hw + 0.11);
    g.add(q);
    return g;
  }

  const isleSpots = new Map<string, { built: THREE.Group; scaffold: THREE.Group }>();
  function isleSpot(id: string, a: number, r: number, labelY: number, scaffH: number, make: (g: THREE.Group) => void) {
    const g = new THREE.Group();
    const rad = (a * PI) / 180;
    g.position.set(Math.sin(rad) * r, 0, Math.cos(rad) * r);
    g.rotation.y = Math.atan2(-g.position.x, -g.position.z);
    isleG.add(g);
    const built = new THREE.Group();
    make(built);
    g.add(built);
    const sc = scaffold(scaffH);
    g.add(sc);
    built.visible = false;
    tag(g, `isle:${id}`);
    anchors.set(`isle:${id}`, { obj: g, y: labelY });
    isleSpots.set(id, { built, scaffold: sc });
    return g;
  }

  // Bốt điện thoại
  isleSpot("call", 318, 2.8, 1.85, 1.3, (g) => {
    const body = box(0.62, 1.3, 0.62, "#D9483B");
    body.position.y = 0.65;
    g.add(body);
    const cap = box(0.72, 0.1, 0.72, "#B53A2F");
    cap.position.y = 1.35;
    g.add(cap);
    const crown2 = box(0.5, 0.12, 0.5, "#D9483B");
    crown2.position.y = 1.46;
    g.add(crown2);
    const glass = box(0.44, 0.7, 0.04, "#CFEAF4", 0.2);
    glass.position.set(0, 0.78, 0.31);
    g.add(glass);
    for (const x of [-0.31, 0.31]) {
      const side = box(0.04, 0.6, 0.4, "#CFEAF4", 0.2);
      side.position.set(x, 0.8, 0);
      g.add(side);
    }
    const plate = box(0.4, 0.1, 0.03, "#FFF9EE");
    plate.position.set(0, 1.24, 0.32);
    g.add(plate);
    const phone = box(0.12, 0.16, 0.05, "#2B2B2B");
    phone.position.set(0, 0.85, -0.2);
    g.add(phone);
  });
  // Bảng tin nhiệm vụ
  isleSpot("mission", 292, 2.0, 1.75, 1.2, (g) => {
    for (const x of [-0.48, 0.48]) {
      const p = cyl(0.05, 0.06, 1.35, "#8B5E3C", 8);
      p.position.set(x, 0.67, 0);
      g.add(p);
    }
    const board = box(1.05, 0.7, 0.07, "#C9925C");
    board.position.y = 0.95;
    g.add(board);
    const roof2 = box(1.25, 0.08, 0.32, "#A86A4A");
    roof2.position.set(0, 1.36, 0.02);
    roof2.rotation.x = -0.25;
    g.add(roof2);
    (
      [
        [-0.3, 1.05, "#FFFFFF", 0.1],
        [0.05, 0.98, "#FFF1A8", -0.08],
        [0.33, 1.08, "#F4B6C2", 0.06],
        [-0.15, 0.78, "#CFEAF4", -0.05],
        [0.25, 0.78, "#FFFFFF", 0.12],
      ] as const
    ).forEach(([x, y, c, r]) => {
      const n = box(0.24, 0.2, 0.02, c);
      n.position.set(x, y, 0.05);
      n.rotation.z = r;
      g.add(n);
    });
  });
  // Sân khấu nói đuổi
  let micGlow: THREE.MeshStandardMaterial | null = null;
  isleSpot("shadow", 32, 2.7, 1.9, 1.2, (g) => {
    const floor = box(1.4, 0.24, 1.0, "#B98250");
    floor.position.y = 0.12;
    g.add(floor);
    const edge = box(1.44, 0.06, 1.04, "#F2C14E");
    edge.position.y = 0.26;
    g.add(edge);
    for (const x of [-0.65, 0.65]) {
      const p = cyl(0.06, 0.06, 1.3, "#8B5E3C", 8);
      p.position.set(x, 0.9, -0.42);
      g.add(p);
      const cur = box(0.32, 1.0, 0.06, "#C8553D");
      cur.position.set(x * 0.78, 0.82, -0.36);
      g.add(cur);
    }
    const beam = box(1.5, 0.16, 0.12, "#C8553D");
    beam.position.set(0, 1.55, -0.42);
    g.add(beam);
    const stand = cyl(0.02, 0.02, 0.62, "#4A4A4A", 6);
    stand.position.set(0, 0.58, 0.1);
    g.add(stand);
    micGlow = glow("#F2C14E", 0.2);
    const mic = new THREE.Mesh(SPH, micGlow);
    mic.scale.setScalar(0.07);
    mic.position.set(0, 0.92, 0.1);
    g.add(mic);
    for (const x of [-0.45, 0.45]) {
      const note = sph(0.06, "#4A3222", 1, 0.8, 0.6);
      note.position.set(x, 1.25 + Math.abs(x) * 0.2, -0.1);
      g.add(note);
    }
  });
  // Hải đăng: Phòng nghe
  let lampMat: THREE.MeshStandardMaterial | null = null;
  let lampBeam: THREE.Mesh | null = null;
  isleSpot("listen", 205, 2.9, 3.25, 2.3, (g) => {
    for (let i = 0; i < 4; i++) {
      const seg = cyl(0.36 - i * 0.045, 0.4 - i * 0.045, 0.55, i % 2 ? "#D9483B" : "#FFFFFF", 20);
      seg.position.y = 0.275 + i * 0.55;
      g.add(seg);
    }
    const gal = cyl(0.36, 0.36, 0.07, "#4A3222", 20);
    gal.position.y = 2.24;
    g.add(gal);
    lampMat = glow("#FFE7A8", 0.4);
    const lamp = mesh(geo("lamp", () => new THREE.CylinderGeometry(0.2, 0.2, 0.34, 16)), lampMat);
    lamp.position.y = 2.45;
    g.add(lamp);
    const top = cone(0.3, 0.32, "#D9483B", 16);
    top.position.y = 2.78;
    g.add(top);
    const door2 = box(0.22, 0.36, 0.05, "#8B5E3C");
    door2.position.set(0, 0.18, 0.39);
    g.add(door2);
    lampBeam = new THREE.Mesh(
      own(new THREE.ConeGeometry(0.5, 2.6, 16, 1, true)),
      own(new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide })),
    );
    lampBeam.rotation.z = PI / 2;
    lampBeam.position.set(1.35, 2.45, 0);
    const beamPivot = new THREE.Group();
    beamPivot.add(lampBeam);
    g.add(beamPivot);
  });
  // Lều kể chuyện + lửa trại
  let fireMat: THREE.MeshStandardMaterial | null = null;
  let flame: THREE.Mesh | null = null;
  isleSpot("stories", 78, 2.75, 1.75, 1.1, (g) => {
    const tent = cone(0.7, 1.25, "#8E5BB5", 6);
    tent.position.set(0, 0.62, -0.25);
    g.add(tent);
    const flap = cone(0.3, 0.7, "#F4E3FF", 3);
    flap.position.set(0, 0.35, 0.3);
    flap.rotation.y = PI;
    g.add(flap);
    const tip = sph(0.07, "#F2C14E", 1, 1, 1, 0.4);
    tip.position.set(0, 1.28, -0.25);
    g.add(tip);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      const st = sph(0.08, "#B9B4A8", 1, 0.7, 1);
      st.position.set(Math.cos(a) * 0.24, 0.05, 0.75 + Math.sin(a) * 0.24);
      g.add(st);
    }
    for (const r of [0.5, -0.5]) {
      const log = cyl(0.04, 0.04, 0.34, "#8B5E3C", 6);
      log.rotation.set(PI / 2, 0, r);
      log.position.set(0, 0.06, 0.75);
      g.add(log);
    }
    fireMat = glow("#F29A4E", 1.0);
    flame = mesh(geo("flame", () => new THREE.ConeGeometry(0.12, 0.3, 8)), fireMat, false);
    flame.position.set(0, 0.22, 0.75);
    g.add(flame);
    for (const x of [-0.55, 0.55]) {
      const stump = cyl(0.13, 0.15, 0.2, "#A86A4A", 10);
      stump.position.set(x, 0.1, 0.85);
      g.add(stump);
    }
  });
  // Giếng gương
  isleSpot("mirror", 352, 2.7, 1.6, 1.1, (g) => {
    const ring = mesh(geo("well", () => new THREE.TorusGeometry(0.38, 0.13, 10, 24)), mat("#B9B4A8"));
    ring.rotation.x = PI / 2;
    ring.position.y = 0.32;
    g.add(ring);
    const wall = cyl(0.42, 0.45, 0.32, "#CFC8B8", 20);
    wall.position.y = 0.16;
    g.add(wall);
    const water = cyl(0.3, 0.3, 0.02, "#BFE9F5", 20, 0.05);
    water.position.y = 0.34;
    g.add(water);
    for (const x of [-0.42, 0.42]) {
      const p = cyl(0.04, 0.04, 0.95, "#8B5E3C", 8);
      p.position.set(x, 0.75, 0);
      g.add(p);
    }
    const rf = cone(0.62, 0.38, "#B5893A", 4);
    rf.rotation.y = PI / 4;
    rf.position.y = 1.36;
    g.add(rf);
    const bucket = cyl(0.08, 0.06, 0.12, "#A86A4A", 10);
    bucket.position.set(0, 0.85, 0);
    g.add(bucket);
    const sparkle = sph(0.05, "#FFFFFF", 1, 1, 1, 0.1);
    sparkle.position.set(0.1, 0.37, 0.05);
    g.add(sparkle);
  });
  // Lớp học nhỏ: Bài học của tôi
  isleSpot("lesson", 240, 2.55, 1.95, 1.3, (g) => {
    const body = box(1.0, 0.85, 0.85, "#FFF4E2");
    body.position.y = 0.425;
    g.add(body);
    const rf = cone(0.82, 0.55, "#C9506B", 4);
    rf.rotation.y = PI / 4;
    rf.scale.set(1, 1, 0.82);
    rf.position.y = 1.12;
    g.add(rf);
    const bellT = box(0.16, 0.22, 0.16, "#FFF4E2");
    bellT.position.y = 1.45;
    g.add(bellT);
    const bell = sph(0.06, "#F2C14E", 1, 1, 1, 0.3);
    bell.position.y = 1.44;
    g.add(bell);
    const board = box(0.56, 0.34, 0.03, "#3F6B4A");
    board.position.set(0, 0.55, 0.44);
    g.add(board);
    const chalk = box(0.36, 0.03, 0.01, "#FFFFFF");
    chalk.position.set(-0.02, 0.6, 0.46);
    g.add(chalk);
    const chalk2 = box(0.24, 0.03, 0.01, "#FFFFFF");
    chalk2.position.set(-0.08, 0.52, 0.46);
    g.add(chalk2);
    const door3 = box(0.24, 0.42, 0.04, "#C9506B");
    door3.position.set(0.32, 0.21, 0.44);
    g.add(door3);
  });
  // Bến thuyền: Ghé đảo bạn bè (cầu tàu chìa ra biển)
  let skiff: THREE.Group | null = null;
  isleSpot("visit", 120, 3.55, 1.5, 1.0, (g) => {
    for (let i = 0; i < 6; i++) {
      const pl = box(0.62, 0.06, 0.22, i % 2 ? "#C9925C" : "#B98250");
      pl.position.set(0, 0.04, -0.15 - i * 0.24);
      g.add(pl);
    }
    for (const x of [-0.3, 0.3])
      for (const z of [-0.3, -1.3]) {
        const p = cyl(0.04, 0.05, 1.1, "#8B5E3C", 8);
        p.position.set(x, -0.35, z);
        g.add(p);
      }
    skiff = new THREE.Group();
    const hull = sph(0.4, "#5A6FC9", 1.6, 0.45, 0.7, 0.5);
    skiff.add(hull);
    const seat = box(0.36, 0.05, 0.4, "#FFF4E2");
    seat.position.y = 0.12;
    skiff.add(seat);
    const mast = cyl(0.02, 0.02, 0.7, "#8B5E3C", 6);
    mast.position.set(0.1, 0.45, 0);
    skiff.add(mast);
    const sail = box(0.02, 0.4, 0.32, "#FFFFFF");
    sail.position.set(0.1, 0.55, 0.15);
    skiff.add(sail);
    skiff.position.set(0.75, -0.08, -1.0);
    g.add(skiff);
  });
  // Đấu trường: Thử thách cuối tuần (đuốc chỉ cháy Thứ 7, Chủ nhật)
  const torchMats: THREE.MeshStandardMaterial[] = [];
  isleSpot("boss", 160, 2.55, 1.6, 1.0, (g) => {
    const floor = cyl(0.78, 0.82, 0.16, "#CFC8B8", 28);
    floor.position.y = 0.08;
    g.add(floor);
    const inner = cyl(0.6, 0.6, 0.02, "#E8CF9B", 28);
    inner.position.y = 0.17;
    g.add(inner);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2 + PI / 6;
      const col = cyl(0.08, 0.09, 0.62, "#B9B4A8", 10);
      col.position.set(Math.sin(a) * 0.72, 0.47, Math.cos(a) * 0.72);
      g.add(col);
    }
    for (const x of [-0.85, 0.85]) {
      const stick = cyl(0.03, 0.03, 0.7, "#8B5E3C", 6);
      stick.position.set(x, 0.35, 0.55);
      g.add(stick);
      const m = glow("#F29A4E", 0);
      torchMats.push(m);
      const f = mesh(geo("torch", () => new THREE.ConeGeometry(0.07, 0.2, 8)), m, false);
      f.position.set(x, 0.8, 0.55);
      g.add(f);
    }
    const banner = box(0.03, 0.36, 0.26, "#7A3E2C");
    banner.position.set(0, 0.95, -0.72);
    banner.rotation.y = PI / 2;
    g.add(banner);
    const bp = cyl(0.025, 0.025, 1.2, "#8B5E3C", 6);
    bp.position.set(0, 0.6, -0.78);
    g.add(bp);
    const cup = cyl(0.08, 0.04, 0.12, "#F2C14E", 12, 0.3);
    cup.position.set(0, 0.24, 0);
    g.add(cup);
  });
  // Vài cây nhỏ cho đảo đỡ trống
  (
    [
      [55, 3.5, 0.62],
      [140, 3.45, 0.58],
      [222, 3.55, 0.6],
      [5, 3.75, 0.5],
    ] as const
  ).forEach(([a, r, s], i) => {
    const rad = (a * PI) / 180;
    trees.push({ g: tree(ISLE_C.x + Math.sin(rad) * r, ISLE_C.z + Math.cos(rad) * r, s, i % 2 === 1), ph: 2 + i });
  });
  anchors.set("isle:go", { obj: isleG, y: 2.6 });

  // ───────── Đảo Cát Vui: đảo cát bên trái, nối cầu; quầy trò chơi + 4 ô đất ─────────
  const BEACH_C = new THREE.Vector3(-11.6, 0, 1.6);
  const BR = 3.8;
  const beachG = new THREE.Group();
  beachG.position.copy(BEACH_C);
  world.add(beachG);
  const beachGround = new THREE.Group();
  beachG.add(beachGround);
  {
    const top = cyl(BR, BR + 0.12, 0.5, "#F4DFAA", 56, 0.95);
    top.position.y = -0.25;
    beachGround.add(top);
    const c3 = cyl(BR + 0.1, BR * 0.7, 1.75, "#D9B27C", 56, 0.95);
    c3.position.y = -1.37;
    c3.castShadow = false;
    beachGround.add(c3);
    const grassP = cyl(1.9, 1.9, 0.03, "#B8D98C", 40, 0.95);
    grassP.position.set(-0.6, 0.015, -0.9);
    grassP.castShadow = false;
    beachGround.add(grassP);
    const lane = box(0.9, 0.04, 2.6, "#EBD5A2", 0.95);
    lane.castShadow = false;
    lane.position.set(2.2, 0.02, -0.2);
    lane.rotation.y = PI / 2 - 0.14;
    beachGround.add(lane);
    // Khăn tắm, dù đi biển, quả bóng
    for (const [a, r, col] of [
      [8, 3.05, "#E86F5A"],
      [125, 3.1, "#6FC1DA"],
    ] as const) {
      const rad = (a * PI) / 180;
      const x = Math.sin(rad) * r,
        z = Math.cos(rad) * r;
      const towel = box(0.5, 0.02, 0.85, col);
      towel.position.set(x, 0.02, z);
      towel.rotation.y = rad;
      beachGround.add(towel);
      const pole = cyl(0.025, 0.025, 1.1, "#FFFFFF", 6);
      pole.position.set(x + 0.35, 0.55, z - 0.2);
      beachGround.add(pole);
      const umb = cone(0.62, 0.32, col, 10);
      umb.position.set(x + 0.35, 1.18, z - 0.2);
      beachGround.add(umb);
    }
    const ball = sph(0.13, "#FFFFFF", 1, 1, 1, 0.5);
    ball.position.set(0.4, 0.13, 3.1);
    beachGround.add(ball);
    const stripe = sph(0.135, "#E86F5A", 1, 0.35, 1, 0.5);
    stripe.position.copy(ball.position);
    beachGround.add(stripe);
  }
  const beachHalo = new THREE.Mesh(own(new THREE.RingGeometry(BR - 0.2, BR + 1.8, 64)), own(new THREE.MeshBasicMaterial({ color: 0xd4f3f8, transparent: true, opacity: 0.5, depthWrite: false })));
  beachHalo.rotation.x = -PI / 2;
  beachHalo.position.set(BEACH_C.x, -1.69, BEACH_C.z);
  scene.add(beachHalo);
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(own(new THREE.TorusGeometry(BR + 0.25, 0.06, 8, 72)), own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })));
    ring.rotation.x = PI / 2;
    ring.position.set(BEACH_C.x, -1.66, BEACH_C.z);
    scene.add(ring);
    foam.push(ring);
  }
  tag(beachGround, "beach:go");

  // Cây dừa
  const palms: THREE.Group[] = [];
  function palm(parent: THREE.Object3D, x: number, z: number, s = 1, lean = 0.18) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    for (let i = 0; i < 5; i++) {
      const seg = cyl(0.09 - i * 0.008, 0.11 - i * 0.008, 0.36, i % 2 ? "#B98250" : "#A86A4A", 8);
      seg.position.set(Math.sin(lean) * i * 0.36 * 0.6, 0.18 + i * 0.34, 0);
      seg.rotation.z = -lean;
      g.add(seg);
    }
    const crown = new THREE.Group();
    crown.position.set(Math.sin(lean) * 1.8 * 0.6, 1.78, 0);
    for (let i = 0; i < 6; i++) {
      const leaf = sph(0.55, i % 2 ? "#6FAE4F" : "#5E9B4C", 1, 0.12, 0.28, 0.9);
      leaf.position.set(Math.cos((i / 6) * PI * 2) * 0.42, -0.08, Math.sin((i / 6) * PI * 2) * 0.42);
      leaf.rotation.y = -(i / 6) * PI * 2;
      leaf.rotation.z = -0.35;
      crown.add(leaf);
    }
    for (let i = 0; i < 3; i++) {
      const nut = sph(0.08, "#8B5E3C", 1, 1, 1, 0.6);
      nut.position.set(Math.cos(i * 2.1) * 0.1, -0.15, Math.sin(i * 2.1) * 0.1);
      crown.add(nut);
    }
    g.add(crown);
    parent.add(g);
    palms.push(crown as THREE.Group);
    return g;
  }
  palm(beachGround, 2.4, 2.3, 0.9, 0.22);
  palm(beachGround, -2.9, 1.6, 1.0, -0.2);
  palm(beachGround, -1.0, -3.0, 0.85, 0.15);

  // Cầu cát nối đảo nhà (có dây chắn khi chưa mở)
  const beachBridge = new THREE.Group();
  world.add(beachBridge);
  const beachGate: THREE.Object3D[] = [];
  {
    const x1 = -6.55,
      z1 = 0.9,
      x2 = BEACH_C.x + BR - 0.5,
      z2 = 1.12;
    const len = Math.hypot(x2 - x1, z2 - z1);
    beachBridge.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
    beachBridge.rotation.y = Math.atan2(x2 - x1, z2 - z1) - PI / 2;
    const N = 8;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const plank = box(len / N + 0.03, 0.08, 1.0, i % 2 ? "#D9B27C" : "#C9925C");
      plank.position.set(-len / 2 + (u * (N - 1) + 0.5) * (len / N), 0.07 + Math.sin(u * PI) * 0.22, 0);
      plank.rotation.z = -Math.cos(u * PI) * 0.22;
      beachBridge.add(plank);
    }
    for (const side of [-0.5, 0.5])
      for (let i = 0; i <= 3; i++) {
        const u = i / 3;
        const post = cyl(0.04, 0.05, 0.5, "#FFFFFF", 8);
        post.position.set(-len / 2 + u * len, 0.3 + Math.sin(u * PI) * 0.22, side);
        beachBridge.add(post);
        const cap = sph(0.06, "#6FC1DA", 1, 1, 1, 0.5);
        cap.position.set(-len / 2 + u * len, 0.57 + Math.sin(u * PI) * 0.22, side);
        beachBridge.add(cap);
      }
    // Dây chắn + biển "sắp mở"
    const rope = box(0.05, 0.05, 1.05, "#E86F5A");
    rope.position.set(-len / 2 + 0.15, 0.42, 0);
    beachBridge.add(rope);
    const sign = box(0.05, 0.3, 0.5, "#F2C14E");
    sign.position.set(-len / 2 + 0.15, 0.62, 0);
    beachBridge.add(sign);
    beachGate.push(rope, sign);
  }
  tag(beachBridge, "beach:go");
  pathTo(-5.4, 0.82, -6.7, 0.9);

  // Quầy trò chơi
  const arcadeMats: THREE.MeshStandardMaterial[] = [];
  const arcadeG = new THREE.Group();
  {
    const rad = (200 * PI) / 180;
    arcadeG.position.set(Math.sin(rad) * 2.0, 0, Math.cos(rad) * 2.0);
    arcadeG.rotation.y = Math.atan2(-arcadeG.position.x, -arcadeG.position.z);
    beachG.add(arcadeG);
    const body = box(1.7, 1.15, 1.1, "#FFF4E2");
    body.position.y = 0.575;
    arcadeG.add(body);
    for (let i = 0; i < 6; i++) {
      const st = box(0.3, 0.07, 1.35, i % 2 ? "#FFFFFF" : "#6FC1DA");
      st.position.set(-0.75 + i * 0.3, 1.24, 0.05);
      st.rotation.x = 0.18;
      arcadeG.add(st);
    }
    const signB = box(1.3, 0.34, 0.08, "#4A3222");
    signB.position.set(0, 1.62, 0.3);
    arcadeG.add(signB);
    const neonCols = ["#F29BB5", "#F2C14E", "#6FC1DA", "#9CCB6A"];
    neonCols.forEach((c, i) => {
      const m = glow(c, 0.6);
      arcadeMats.push(m);
      const bulb = new THREE.Mesh(SPH, m);
      bulb.scale.setScalar(0.07);
      bulb.position.set(-0.45 + i * 0.3, 1.62, 0.36);
      arcadeG.add(bulb);
    });
    // Hai máy chơi trước quầy
    for (const x of [-0.45, 0.45]) {
      const cab = box(0.42, 0.78, 0.36, x < 0 ? "#8E5BB5" : "#E86F5A");
      cab.position.set(x, 0.39, 0.8);
      arcadeG.add(cab);
      const scr = glow("#BFE9F5", 0.5);
      arcadeMats.push(scr);
      const screen = mesh(geo("scr", () => new THREE.BoxGeometry(0.3, 0.22, 0.02)), scr);
      screen.position.set(x, 0.58, 0.99);
      arcadeG.add(screen);
      const stick = cyl(0.015, 0.015, 0.1, "#4A3222", 6);
      stick.position.set(x - 0.06, 0.82, 0.9);
      arcadeG.add(stick);
      const knob = sph(0.035, "#F2C14E", 1, 1, 1, 0.4);
      knob.position.set(x - 0.06, 0.88, 0.9);
      arcadeG.add(knob);
    }
  }
  tag(arcadeG, "beach:arcade");
  anchors.set("beach:arcade", { obj: arcadeG, y: 2.2 });

  // 4 ô đất: đất trống / đất hoang / khoá / công trình (4 loại × 3 bậc)
  type PlotView = { root: THREE.Group; empty: THREE.Group; wild: THREE.Group; locked: THREE.Group; kinds: Record<string, THREE.Group>; extras: Record<string, THREE.Object3D[]> };
  const plotViews = new Map<string, PlotView>();
  const PLOT_AT: Record<string, [number, number]> = { p1: [40, 2.3], p2: [330, 2.4], p3: [265, 2.45], p4: [148, 2.45] };
  function plotSpot(id: string) {
    const [a, r] = PLOT_AT[id];
    const rad = (a * PI) / 180;
    const root = new THREE.Group();
    root.position.set(Math.sin(rad) * r, 0, Math.cos(rad) * r);
    root.rotation.y = Math.atan2(-root.position.x, -root.position.z) + PI;
    beachG.add(root);
    // Nền ô đất (luôn có)
    const pad = box(1.25, 0.06, 1.25, "#C9A37A", 0.95);
    pad.position.y = 0.03;
    root.add(pad);
    const empty = new THREE.Group();
    {
      const soil = box(1.05, 0.08, 1.05, "#A86A4A", 0.95);
      soil.position.y = 0.06;
      empty.add(soil);
      const post = cyl(0.03, 0.03, 0.5, "#8B5E3C", 6);
      post.position.set(0.45, 0.3, 0.55);
      empty.add(post);
      const board = box(0.34, 0.2, 0.03, "#FFF4E2");
      board.position.set(0.45, 0.5, 0.57);
      empty.add(board);
      const plus = box(0.14, 0.035, 0.01, "#3F7A34");
      plus.position.set(0.45, 0.5, 0.59);
      empty.add(plus);
      const plus2 = box(0.035, 0.14, 0.01, "#3F7A34");
      plus2.position.set(0.45, 0.5, 0.59);
      empty.add(plus2);
    }
    const wild = new THREE.Group();
    {
      for (const [x, z, s] of [
        [-0.3, -0.2, 0.22],
        [0.25, 0.3, 0.18],
        [0.3, -0.35, 0.15],
      ] as const) {
        const rock = sph(s, "#B9B4A8", 1.2, 0.7, 1, 0.9);
        rock.position.set(x, s * 0.5, z);
        wild.add(rock);
      }
      for (const [x, z] of [
        [-0.35, 0.3],
        [0.0, 0.0],
        [0.35, 0.0],
        [-0.1, -0.4],
      ] as const) {
        const weed = cone(0.1, 0.32, "#7DBA5A", 5);
        weed.position.set(x, 0.16, z);
        wild.add(weed);
      }
    }
    const locked = new THREE.Group();
    {
      for (const [x, z] of [
        [-0.55, -0.55],
        [0.55, -0.55],
        [-0.55, 0.55],
        [0.55, 0.55],
      ] as const) {
        const p = cyl(0.035, 0.035, 0.45, "#8B5E3C", 6);
        p.position.set(x, 0.22, z);
        locked.add(p);
      }
      for (const [x, z, ry] of [
        [0, -0.55, 0],
        [0, 0.55, 0],
        [-0.55, 0, PI / 2],
        [0.55, 0, PI / 2],
      ] as const) {
        const rope = box(1.1, 0.03, 0.03, "#E86F5A");
        rope.position.set(x, 0.36, z);
        rope.rotation.y = ry;
        locked.add(rope);
      }
      const lockB = box(0.22, 0.2, 0.08, "#F2C14E");
      lockB.position.set(0, 0.45, 0.56);
      locked.add(lockB);
    }
    // Công trình
    const kinds: Record<string, THREE.Group> = {};
    const extras: Record<string, THREE.Object3D[]> = {};
    // Quầy kem
    {
      const g = new THREE.Group();
      const cart = box(0.8, 0.5, 0.5, "#FFFFFF");
      cart.position.y = 0.4;
      g.add(cart);
      const band = box(0.82, 0.12, 0.52, "#E07A93");
      band.position.y = 0.3;
      g.add(band);
      for (const x of [-0.3, 0.3]) {
        const wheel = cyl(0.12, 0.12, 0.06, "#4A3222", 14);
        wheel.rotation.x = PI / 2;
        wheel.position.set(x, 0.12, 0.27);
        g.add(wheel);
      }
      for (let i = 0; i < 5; i++) {
        const aw = box(0.18, 0.04, 0.6, i % 2 ? "#FFFFFF" : "#F29BB5");
        aw.position.set(-0.36 + i * 0.18, 1.05, 0.05);
        aw.rotation.x = 0.2;
        g.add(aw);
      }
      for (const x of [-0.36, 0.36]) {
        const p = cyl(0.02, 0.02, 0.45, "#FFFFFF", 6);
        p.position.set(x, 0.85, -0.2);
        g.add(p);
      }
      const coneB = cone(0.13, 0.32, "#E8B26A", 10);
      coneB.rotation.x = PI;
      coneB.position.set(0, 1.32, 0);
      g.add(coneB);
      const scoop = sph(0.15, "#F4B6C2", 1, 0.9, 1, 0.6);
      scoop.position.set(0, 1.5, 0);
      g.add(scoop);
      const sc2 = sph(0.13, "#BFE3F5", 1, 0.9, 1, 0.6);
      sc2.position.set(0, 1.66, 0);
      g.add(sc2);
      const sc3 = sph(0.11, "#FFF1A8", 1, 0.9, 1, 0.6);
      sc3.position.set(0, 1.8, 0);
      g.add(sc3);
      const stool = cyl(0.12, 0.12, 0.3, "#6FC1DA", 10);
      stool.position.set(0.6, 0.15, 0.45);
      g.add(stool);
      extras.icecream = [sc2, stool, sc3];
      kinds.icecream = g;
    }
    // Thư viện nhỏ
    {
      const g = new THREE.Group();
      const body = box(0.9, 0.7, 0.75, "#EEF3F7");
      body.position.y = 0.35;
      g.add(body);
      const rf = cone(0.75, 0.45, "#4E7FB8", 4);
      rf.rotation.y = PI / 4;
      rf.scale.set(1, 1, 0.85);
      rf.position.y = 0.93;
      g.add(rf);
      const door = box(0.22, 0.38, 0.03, "#8B5E3C");
      door.position.set(0, 0.19, 0.39);
      g.add(door);
      const bookS = box(0.34, 0.24, 0.04, "#F2C14E");
      bookS.position.set(0, 0.55, 0.4);
      g.add(bookS);
      const spine = box(0.02, 0.24, 0.05, "#4A3222");
      spine.position.set(0, 0.55, 0.41);
      g.add(spine);
      const shelf = box(0.5, 0.34, 0.16, "#A86A4A");
      shelf.position.set(0.62, 0.17, 0.3);
      g.add(shelf);
      const books: THREE.Object3D[] = [];
      ["#E86F5A", "#6FAE4F", "#4E7FB8", "#F2C14E"].forEach((c, i) => {
        const b = box(0.08, 0.16, 0.12, c);
        b.position.set(0.47 + i * 0.1, 0.42, 0.3);
        g.add(b);
        books.push(b);
      });
      const chimney = box(0.14, 0.3, 0.14, "#B9B4A8");
      chimney.position.set(-0.25, 1.1, -0.15);
      g.add(chimney);
      extras.library = [shelf, ...books, chimney];
      kinds.library = g;
    }
    // Vườn dừa
    {
      const g = new THREE.Group();
      palm(g, -0.25, -0.2, 0.62, 0.18);
      const p2 = palm(g, 0.3, 0.15, 0.55, -0.2);
      const p3 = palm(g, -0.05, 0.4, 0.5, 0.1);
      const pile: THREE.Object3D[] = [];
      for (let i = 0; i < 3; i++) {
        const nut = sph(0.09, "#8B5E3C", 1, 1, 1, 0.6);
        nut.position.set(0.4 + (i % 2) * 0.12, 0.09 + (i === 2 ? 0.12 : 0), -0.35);
        g.add(nut);
        pile.push(nut);
      }
      extras.coconut = [p2, p3, ...pile];
      kinds.coconut = g;
    }
    // Sân bóng chuyền
    {
      const g = new THREE.Group();
      const court = box(1.1, 0.02, 1.1, "#F8E6B8", 0.95);
      court.position.y = 0.07;
      g.add(court);
      for (const [x, z, w, d] of [
        [0, -0.53, 1.1, 0.03],
        [0, 0.53, 1.1, 0.03],
        [-0.53, 0, 0.03, 1.1],
        [0.53, 0, 0.03, 1.1],
      ] as const) {
        const l = box(w, 0.01, d, "#FFFFFF");
        l.position.set(x, 0.085, z);
        g.add(l);
      }
      for (const z of [-0.6, 0.6]) {
        const p = cyl(0.025, 0.025, 0.8, "#8B5E3C", 6);
        p.position.set(0, 0.4, z);
        g.add(p);
      }
      const net = box(0.02, 0.22, 1.2, "#FFFFFF", 0.9);
      net.position.set(0, 0.64, 0);
      g.add(net);
      const vball = sph(0.09, "#F2C14E", 1, 1, 1, 0.5);
      vball.position.set(0.3, 0.9, 0.2);
      g.add(vball);
      const flagP = cyl(0.015, 0.015, 0.5, "#FFFFFF", 6);
      flagP.position.set(-0.55, 0.3, 0.6);
      g.add(flagP);
      const flag = box(0.02, 0.14, 0.22, "#F29A4E");
      flag.position.set(-0.55, 0.48, 0.71);
      g.add(flag);
      extras.volley = [flagP, flag, vball];
      kinds.volley = g;
    }
    for (const g of Object.values(kinds)) {
      g.visible = false;
      root.add(g);
    }
    root.add(empty, wild, locked);
    tag(root, `beach:${id}`);
    anchors.set(`beach:${id}`, { obj: root, y: 1.5 });
    plotViews.set(id, { root, empty, wild, locked, kinds, extras });
  }
  ["p1", "p2", "p3", "p4"].forEach(plotSpot);
  anchors.set("beach:go", { obj: beachG, y: 2.4 });

  // ───────── Đảo Phố Cảng (A2): đảo xa phía sau, đi bằng phà ─────────
  const HARBOR_C = new THREE.Vector3(3.0, 0, -19.5);
  const HR = 5.0;
  const harborG = new THREE.Group();
  harborG.position.copy(HARBOR_C);
  world.add(harborG);
  const harborGround = new THREE.Group();
  harborG.add(harborGround);
  {
    const top = cyl(HR, HR + 0.12, 0.5, "#B8D98C", 64, 0.95);
    top.position.y = -0.25;
    harborGround.add(top);
    const c4 = cyl(HR + 0.1, HR * 0.72, 1.8, "#C9925C", 64, 0.95);
    c4.position.y = -1.4;
    c4.castShadow = false;
    harborGround.add(c4);
    const sand4 = mesh(own(new THREE.TorusGeometry(HR + 0.06, 0.16, 10, 80)), mat("#F4DFAA", 0.95), false);
    sand4.rotation.x = PI / 2;
    sand4.position.y = -0.04;
    harborGround.add(sand4);
    // Quảng trường lát đá + đường ra bến
    const sq = cyl(1.9, 1.9, 0.05, "#E3D3B5", 48, 0.95);
    sq.position.y = 0.025;
    sq.castShadow = false;
    harborGround.add(sq);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2;
      const st = box(0.34, 0.02, 0.2, "#D2C09C", 0.95);
      st.position.set(Math.sin(a) * 1.55, 0.055, Math.cos(a) * 1.55);
      st.rotation.y = a;
      st.castShadow = false;
      harborGround.add(st);
    }
    const road = box(1.0, 0.05, 3.4, "#E3D3B5", 0.95);
    road.position.set(0, 0.025, 3.3);
    road.castShadow = false;
    harborGround.add(road);
    // Tháp đồng hồ giữa quảng trường
    const base = box(0.6, 1.6, 0.6, "#F3E6CC");
    base.position.y = 0.8;
    harborGround.add(base);
    const roofT = cone(0.55, 0.6, "#4E7FB8", 4);
    roofT.rotation.y = PI / 4;
    roofT.position.y = 1.9;
    harborGround.add(roofT);
    for (const [x, z, ry] of [
      [0, 0.31, 0],
      [0.31, 0, PI / 2],
    ] as const) {
      const face = cyl(0.2, 0.2, 0.03, "#FFFFFF", 20);
      face.rotation.set(PI / 2, 0, ry);
      face.position.set(x, 1.3, z);
      harborGround.add(face);
    }
  }
  const harborHalo = new THREE.Mesh(own(new THREE.RingGeometry(HR - 0.2, HR + 2.2, 72)), own(new THREE.MeshBasicMaterial({ color: 0xd4f3f8, transparent: true, opacity: 0.5, depthWrite: false })));
  harborHalo.rotation.x = -PI / 2;
  harborHalo.position.set(HARBOR_C.x, -1.69, HARBOR_C.z);
  scene.add(harborHalo);
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(own(new THREE.TorusGeometry(HR + 0.28, 0.07, 8, 80)), own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })));
    ring.rotation.x = PI / 2;
    ring.position.set(HARBOR_C.x, -1.66, HARBOR_C.z);
    scene.add(ring);
    foam.push(ring);
  }
  tag(harborGround, "harbor:go");

  function harborSpot(id: string, a: number, r: number, labelY: number, make: (g: THREE.Group) => void) {
    const g = new THREE.Group();
    const rad = (a * PI) / 180;
    g.position.set(Math.sin(rad) * r, 0, Math.cos(rad) * r);
    g.rotation.y = Math.atan2(-g.position.x, -g.position.z);
    harborG.add(g);
    make(g);
    tag(g, `harbor:${id}`);
    anchors.set(`harbor:${id}`, { obj: g, y: labelY });
    return g;
  }
  const harborWin: THREE.MeshStandardMaterial = glow("#BFE3F0", 0);
  function windows(g: THREE.Object3D, rows: number, cols: number, w: number, y0: number, z: number) {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const win = mesh(geo("hwin", () => new THREE.BoxGeometry(0.22, 0.24, 0.04)), harborWin);
        win.position.set(-w / 2 + (c + 0.5) * (w / cols), y0 + r * 0.45, z);
        g.add(win);
      }
  }
  // Khách sạn Hải Âu (chương 5: sân bay & khách sạn)
  harborSpot("hotel", 300, 3.1, 3.0, (g) => {
    const body = box(1.5, 2.2, 1.0, "#EEF3F7");
    body.position.y = 1.1;
    g.add(body);
    const top = box(1.65, 0.14, 1.12, "#4E7FB8");
    top.position.y = 2.27;
    g.add(top);
    windows(g, 3, 3, 1.3, 0.85, 0.51);
    const door = box(0.4, 0.55, 0.04, "#4E7FB8");
    door.position.set(0, 0.28, 0.51);
    g.add(door);
    const awn = box(0.7, 0.05, 0.35, "#F2C14E");
    awn.position.set(0, 0.62, 0.66);
    g.add(awn);
    const sign = box(0.9, 0.24, 0.05, "#FFFFFF");
    sign.position.set(0, 2.05, 0.53);
    g.add(sign);
    const bird = sph(0.08, "#FFFFFF", 1.6, 0.6, 1, 0.5);
    bird.position.set(-0.25, 2.05, 0.57);
    g.add(bird);
    const flagP = cyl(0.02, 0.02, 0.7, "#8B5E3C", 6);
    flagP.position.set(0.6, 2.65, 0);
    g.add(flagP);
    const flag = box(0.03, 0.2, 0.32, "#E86F5A");
    flag.position.set(0.6, 2.88, 0.16);
    g.add(flag);
  });
  // Nhà hàng Bến Cảng (chương 6)
  harborSpot("restaurant", 55, 3.0, 2.2, (g) => {
    const body = box(1.5, 1.1, 1.0, "#FFF4E2");
    body.position.y = 0.55;
    g.add(body);
    const rf = cone(1.15, 0.6, "#C96A2B", 4);
    rf.rotation.y = PI / 4;
    rf.scale.set(1, 1, 0.72);
    rf.position.y = 1.4;
    g.add(rf);
    for (let i = 0; i < 6; i++) {
      const st = box(0.26, 0.05, 0.42, i % 2 ? "#FFFFFF" : "#C96A2B");
      st.position.set(-0.65 + i * 0.26, 0.95, 0.68);
      st.rotation.x = 0.3;
      g.add(st);
    }
    windows(g, 1, 2, 1.1, 0.6, 0.51);
    for (const x of [-0.45, 0.45]) {
      const tbl = cyl(0.2, 0.2, 0.04, "#FFFFFF", 16);
      tbl.position.set(x, 0.42, 1.2);
      g.add(tbl);
      const leg = cyl(0.03, 0.03, 0.42, "#8B5E3C", 6);
      leg.position.set(x, 0.21, 1.2);
      g.add(leg);
      const umb = cone(0.36, 0.2, x < 0 ? "#E86F5A" : "#F2C14E", 10);
      umb.position.set(x, 0.95, 1.2);
      g.add(umb);
      const up = cyl(0.015, 0.015, 0.5, "#FFFFFF", 6);
      up.position.set(x, 0.68, 1.2);
      g.add(up);
    }
    const plate = cyl(0.1, 0.1, 0.02, "#FFFFFF", 12);
    plate.position.set(0.45, 0.45, 1.2);
    g.add(plate);
    const fish = sph(0.06, "#F29A4E", 1.6, 0.6, 0.8, 0.5);
    fish.position.set(0.45, 0.48, 1.2);
    g.add(fish);
  });
  // Bưu điện (chương 7: gọi điện & hẹn lịch)
  harborSpot("post", 125, 3.0, 2.2, (g) => {
    const body = box(1.3, 1.1, 0.9, "#F8E6C8");
    body.position.y = 0.55;
    g.add(body);
    const rf = cone(1.0, 0.55, "#C8553D", 4);
    rf.rotation.y = PI / 4;
    rf.scale.set(1, 1, 0.75);
    rf.position.y = 1.37;
    g.add(rf);
    windows(g, 1, 2, 0.9, 0.62, 0.46);
    const door = box(0.32, 0.5, 0.04, "#C8553D");
    door.position.set(0, 0.25, 0.46);
    g.add(door);
    const env = box(0.36, 0.22, 0.04, "#FFFFFF");
    env.position.set(0, 0.92, 0.47);
    g.add(env);
    const flap = cone(0.2, 0.1, "#E8D2B0", 3);
    flap.rotation.set(PI / 2, 0, PI);
    flap.position.set(0, 0.97, 0.5);
    g.add(flap);
    const mail = cyl(0.14, 0.14, 0.55, "#D9483B", 12);
    mail.position.set(0.85, 0.28, 0.55);
    g.add(mail);
    const mcap = sph(0.14, "#D9483B", 1, 0.6, 1);
    mcap.position.set(0.85, 0.56, 0.55);
    g.add(mcap);
    const booth = box(0.38, 0.85, 0.38, "#D9483B");
    booth.position.set(-0.9, 0.43, 0.5);
    g.add(booth);
    const glass = box(0.26, 0.45, 0.03, "#CFEAF4", 0.2);
    glass.position.set(-0.9, 0.5, 0.7);
    g.add(glass);
  });
  // Phòng khám & nhà thuốc (chương 8)
  harborSpot("clinic", 225, 3.1, 2.3, (g) => {
    const body = box(1.4, 1.3, 1.0, "#FFFFFF");
    body.position.y = 0.65;
    g.add(body);
    const top = box(1.5, 0.12, 1.1, "#3F9E6E");
    top.position.y = 1.36;
    g.add(top);
    windows(g, 1, 3, 1.2, 0.75, 0.51);
    const door = box(0.36, 0.5, 0.04, "#3F9E6E");
    door.position.set(0, 0.25, 0.51);
    g.add(door);
    const c1 = box(0.32, 0.1, 0.05, "#3F9E6E");
    c1.position.set(0, 1.62, 0);
    const c2 = box(0.1, 0.32, 0.05, "#3F9E6E");
    c2.position.set(0, 1.62, 0);
    const crossB = box(0.42, 0.42, 0.04, "#FFFFFF");
    crossB.position.set(0, 1.62, -0.03);
    g.add(crossB, c1, c2);
    const pot = cyl(0.14, 0.11, 0.2, "#C9925C", 10);
    pot.position.set(0.85, 0.1, 0.55);
    g.add(pot);
    const herb = sph(0.18, "#6FAE4F", 1, 1.2, 1, 0.9);
    herb.position.set(0.85, 0.35, 0.55);
    g.add(herb);
  });
  // Bến phà: cầu tàu chìa ra biển về phía đảo nhà + cần cẩu, thùng hàng
  harborSpot("dock", 0, 4.4, 1.6, (g) => {
    for (let i = 0; i < 7; i++) {
      const pl = box(1.1, 0.07, 0.3, i % 2 ? "#C9925C" : "#B98250");
      pl.position.set(0, 0.03, -0.1 - i * 0.32);
      g.add(pl);
    }
    for (const x of [-0.5, 0.5])
      for (const z of [-0.4, -1.4, -2.2]) {
        const p = cyl(0.05, 0.06, 1.8, "#8B5E3C", 8);
        p.position.set(x, -0.85, z);
        g.add(p);
      }
    const bollard = cyl(0.07, 0.08, 0.16, "#4A3222", 8);
    bollard.position.set(0.45, 0.12, -2.0);
    g.add(bollard);
  });
  {
    // Cần cẩu và thùng hàng cạnh bến
    const rad = (28 * PI) / 180;
    const cg = new THREE.Group();
    cg.position.set(Math.sin(rad) * 3.9, 0, Math.cos(rad) * 3.9);
    harborG.add(cg);
    const mast = box(0.16, 2.2, 0.16, "#F2C14E");
    mast.position.y = 1.1;
    cg.add(mast);
    const jib = box(1.6, 0.12, 0.12, "#F2C14E");
    jib.position.set(0.6, 2.15, 0);
    cg.add(jib);
    const cable = cyl(0.01, 0.01, 0.9, "#4A3222", 4);
    cable.position.set(1.2, 1.65, 0);
    cg.add(cable);
    const hook = box(0.3, 0.22, 0.3, "#4E7FB8");
    hook.position.set(1.2, 1.1, 0);
    cg.add(hook);
    (
      [
        [-0.6, 0.2, "#E86F5A"],
        [-0.6, 0.62, "#6FAE4F"],
        [-1.05, 0.2, "#4E7FB8"],
      ] as const
    ).forEach(([x, y, c]) => {
      const crate = box(0.42, 0.4, 0.42, c);
      crate.position.set(x, y, 0.2);
      cg.add(crate);
    });
  }
  // Cây cho đảo đỡ trống
  (
    [
      [85, 4.2, 0.7],
      [170, 4.0, 0.8],
      [262, 4.2, 0.65, true],
      [315, 4.3, 0.7],
    ] as [number, number, number, boolean?][]
  ).forEach(([a, r, sc, pink], i) => {
    const rad = (a * PI) / 180;
    trees.push({ g: tree(HARBOR_C.x + Math.sin(rad) * r, HARBOR_C.z + Math.cos(rad) * r, sc, pink), ph: 4 + i });
  });
  // Bảng câu đố của Thuyền trưởng Rái
  harborSpot("quiz", 330, 3.6, 1.7, (g) => {
    for (const x of [-0.4, 0.4]) {
      const p = cyl(0.05, 0.06, 1.2, "#8B5E3C", 8);
      p.position.set(x, 0.6, 0);
      g.add(p);
    }
    const board = box(0.95, 0.65, 0.07, "#2B4C7E");
    board.position.y = 0.95;
    g.add(board);
    const paper = box(0.5, 0.38, 0.02, "#F8E6B8");
    paper.position.set(-0.12, 0.95, 0.05);
    paper.rotation.z = 0.06;
    g.add(paper);
    const xMark1 = box(0.12, 0.025, 0.01, "#D9483B");
    xMark1.position.set(-0.05, 0.92, 0.065);
    xMark1.rotation.z = 0.7;
    const xMark2 = xMark1.clone();
    xMark2.rotation.z = -0.7;
    g.add(xMark1, xMark2);
    const q = sph(0.11, "#F2C14E", 1, 1, 0.4, 0.4);
    q.position.set(0.3, 1.05, 0.05);
    g.add(q);
  });
  // Rương kho báu (hiện khi đã mở ít nhất một rương)
  const chestG = new THREE.Group();
  {
    const rad = (345 * PI) / 180;
    chestG.position.set(Math.sin(rad) * 4.3, 0, Math.cos(rad) * 4.3);
    chestG.rotation.y = 0.4;
    harborG.add(chestG);
    const body = box(0.6, 0.34, 0.4, "#8B5E3C");
    body.position.y = 0.17;
    chestG.add(body);
    const lid = cyl(0.2, 0.2, 0.6, "#A86A4A", 16);
    lid.rotation.z = PI / 2;
    lid.scale.set(1, 1, 1);
    lid.position.y = 0.34;
    chestG.add(lid);
    for (const x of [-0.22, 0.22]) {
      const band = box(0.06, 0.56, 0.42, "#F2C14E");
      band.position.set(x, 0.3, 0);
      chestG.add(band);
    }
    const lock = box(0.1, 0.12, 0.04, "#F2C14E");
    lock.position.set(0, 0.28, 0.22);
    chestG.add(lock);
    const gold = glow("#FFD25A", 0.8);
    for (const [x, z] of [
      [0.42, 0.1],
      [0.5, -0.12],
      [0.36, -0.2],
    ] as const) {
      const coin = mesh(geo("coin", () => new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14)), gold);
      coin.position.set(x, 0.02, z);
      chestG.add(coin);
    }
  }
  tag(chestG, "harbor:quiz");
  // Mây che khi chưa mở
  const harborFog = new THREE.Group();
  {
    const fogMat = own(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 }));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2;
      const r = i % 2 ? 2.8 : 1.6;
      const puff = new THREE.Mesh(SPH, fogMat);
      puff.scale.set(1.9, 1.1, 1.6);
      puff.position.set(Math.sin(a) * r, 1.6 + (i % 3) * 0.4, Math.cos(a) * r);
      harborFog.add(puff);
    }
    const mid = new THREE.Mesh(SPH, fogMat);
    mid.scale.set(2.4, 1.5, 2.4);
    mid.position.y = 2.2;
    harborFog.add(mid);
    harborG.add(harborFog);
  }
  // Phà chạy giữa đảo nhà và Đảo Phố Cảng
  const ferry = new THREE.Group();
  {
    const hull = box(1.3, 0.32, 0.6, "#FFFFFF");
    hull.position.y = 0.16;
    ferry.add(hull);
    const band = box(1.32, 0.1, 0.62, "#4E7FB8");
    band.position.y = 0.05;
    ferry.add(band);
    const cabin = box(0.6, 0.34, 0.46, "#F2C14E");
    cabin.position.set(-0.1, 0.48, 0);
    ferry.add(cabin);
    const chim = cyl(0.07, 0.07, 0.3, "#E86F5A", 10);
    chim.position.set(0.15, 0.75, 0);
    ferry.add(chim);
    world.add(ferry);
  }
  const FERRY_A = new THREE.Vector3(2.2, -1.62, -8.9);
  const FERRY_B = new THREE.Vector3(HARBOR_C.x, -1.62, HARBOR_C.z + HR + 2.6);
  anchors.set("harbor:go", { obj: harborG, y: 3.2 });

  // ───────── Thành Phố Mây (B1): 5 công trình cho chương 9–13 ─────────
  const CITY_C = new THREE.Vector3(19, 0, -17);
  const CR = 4.4;
  const cityG = new THREE.Group();
  cityG.position.copy(CITY_C);
  world.add(cityG);
  const cityGround = new THREE.Group();
  cityG.add(cityGround);
  {
    const top = cyl(CR, CR + 0.12, 0.5, "#B8D98C", 60, 0.95);
    top.position.y = -0.25;
    cityGround.add(top);
    const c5 = cyl(CR + 0.1, CR * 0.7, 1.8, "#A9B6C6", 60, 0.95);
    c5.position.y = -1.4;
    c5.castShadow = false;
    cityGround.add(c5);
    const sq = cyl(2.0, 2.0, 0.05, "#E4E1DA", 48, 0.95);
    sq.position.y = 0.025;
    sq.castShadow = false;
    cityGround.add(sq);
    const fBase = cyl(0.55, 0.62, 0.28, "#C9D6E3", 24);
    fBase.position.y = 0.14;
    cityGround.add(fBase);
    const fWater = cyl(0.46, 0.46, 0.03, "#9BD6E6", 24, 0.2);
    fWater.position.y = 0.29;
    cityGround.add(fWater);
    const fTop = cyl(0.12, 0.16, 0.5, "#C9D6E3", 12);
    fTop.position.y = 0.5;
    cityGround.add(fTop);
    const sand5 = mesh(own(new THREE.TorusGeometry(CR + 0.06, 0.15, 10, 80)), mat("#F4DFAA", 0.95), false);
    sand5.rotation.x = PI / 2;
    sand5.position.y = -0.04;
    cityGround.add(sand5);
  }
  tag(cityGround, "city:go");
  const cityHalo = new THREE.Mesh(own(new THREE.RingGeometry(CR - 0.2, CR + 2, 72)), own(new THREE.MeshBasicMaterial({ color: 0xd4f3f8, transparent: true, opacity: 0.5, depthWrite: false })));
  cityHalo.rotation.x = -PI / 2;
  cityHalo.position.set(CITY_C.x, -1.69, CITY_C.z);
  scene.add(cityHalo);
  const cityWin = glow("#BFE3F0", 0);
  const cityLights: THREE.MeshStandardMaterial[] = [];
  function citySpot(id: string, a: number, r: number, labelY: number, make: (g: THREE.Group) => void) {
    const g = new THREE.Group();
    const rad = (a * PI) / 180;
    g.position.set(Math.sin(rad) * r, 0, Math.cos(rad) * r);
    g.rotation.y = Math.atan2(-g.position.x, -g.position.z);
    cityG.add(g);
    make(g);
    tag(g, `city:${id}`);
    anchors.set(`city:${id}`, { obj: g, y: labelY });
  }
  const cWin = (g: THREE.Object3D, rows: number, cols: number, w: number, y0: number, z: number) => {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const win = mesh(geo("cwin", () => new THREE.BoxGeometry(0.2, 0.22, 0.04)), cityWin);
        win.position.set(-w / 2 + (c + 0.5) * (w / cols), y0 + r * 0.42, z);
        g.add(win);
      }
  };
  // Quán trà chiều (ch9 small talk)
  citySpot("teahouse", 30, 2.95, 2.0, (g) => {
    const b = box(1.3, 0.9, 0.9, "#FFF4E2");
    b.position.y = 0.45;
    g.add(b);
    const rf = cone(1.0, 0.5, "#3F7A34", 4);
    rf.rotation.y = PI / 4;
    rf.scale.set(1, 1, 0.75);
    rf.position.y = 1.15;
    g.add(rf);
    cWin(g, 1, 2, 0.9, 0.5, 0.46);
    for (const x of [-0.4, 0.4]) {
      const t = cyl(0.17, 0.17, 0.03, "#FFFFFF", 14);
      t.position.set(x, 0.38, 0.95);
      g.add(t);
      const l = cyl(0.025, 0.025, 0.38, "#8B5E3C", 6);
      l.position.set(x, 0.19, 0.95);
      g.add(l);
      const cup = cyl(0.04, 0.03, 0.06, "#F4B6C2", 10);
      cup.position.set(x, 0.43, 0.95);
      g.add(cup);
    }
  });
  // Rạp chiếu phim (ch10 rủ rê)
  citySpot("cinema", 100, 3.0, 2.3, (g) => {
    const b = box(1.5, 1.3, 1.0, "#C8553D");
    b.position.y = 0.65;
    g.add(b);
    const marquee = box(1.3, 0.32, 0.12, "#FFF4E2");
    marquee.position.set(0, 1.05, 0.56);
    g.add(marquee);
    for (let i = 0; i < 6; i++) {
      const m = glow(i % 2 ? "#F2C14E" : "#FFF6C9", 0.6);
      cityLights.push(m);
      const bulb = new THREE.Mesh(SPH, m);
      bulb.scale.setScalar(0.045);
      bulb.position.set(-0.55 + i * 0.22, 1.25, 0.62);
      g.add(bulb);
    }
    const door = box(0.5, 0.55, 0.04, "#4A3222");
    door.position.set(0, 0.28, 0.51);
    g.add(door);
    const top = box(1.6, 0.12, 1.1, "#8E3A2C");
    top.position.y = 1.36;
    g.add(top);
  });
  // Toà nhà Mây (ch13 phỏng vấn) — cao nhất, phía sau
  citySpot("tower", 180, 2.9, 4.0, (g) => {
    const b = box(1.2, 3.2, 1.0, "#DCE8F4");
    b.position.y = 1.6;
    g.add(b);
    cWin(g, 6, 3, 1.0, 0.55, 0.51);
    const top = box(1.3, 0.14, 1.1, "#4E7FB8");
    top.position.y = 3.27;
    g.add(top);
    const ant = cyl(0.02, 0.02, 0.6, "#8B5E3C", 6);
    ant.position.set(0.3, 3.64, 0);
    g.add(ant);
    const m = glow("#E86F5A", 0.8);
    cityLights.push(m);
    const tip = new THREE.Mesh(SPH, m);
    tip.scale.setScalar(0.06);
    tip.position.set(0.3, 3.96, 0);
    g.add(tip);
  });
  // Nhà sách kể chuyện (ch11)
  citySpot("bookshop", 250, 3.0, 2.2, (g) => {
    const b = box(1.3, 1.1, 0.9, "#E3DAF5");
    b.position.y = 0.55;
    g.add(b);
    const rf = cone(1.0, 0.5, "#8E5BB5", 4);
    rf.rotation.y = PI / 4;
    rf.scale.set(1, 1, 0.72);
    rf.position.y = 1.35;
    g.add(rf);
    cWin(g, 1, 2, 0.9, 0.62, 0.46);
    ["#E86F5A", "#6FAE4F", "#4E7FB8"].forEach((c, i) => {
      const bk = box(0.12, 0.3, 0.2, c);
      bk.position.set(-0.75 - i * 0.14, 0.15, 0.4);
      bk.rotation.z = i === 2 ? 0.25 : 0;
      g.add(bk);
    });
  });
  // Quầy chăm sóc khách hàng (ch12 phàn nàn)
  citySpot("mall", 320, 2.95, 2.1, (g) => {
    const b = box(1.6, 1.0, 1.0, "#FFF4E2");
    b.position.y = 0.5;
    g.add(b);
    const glass = box(1.3, 0.55, 0.04, "#CFEAF4", 0.2);
    glass.position.set(0, 0.45, 0.51);
    g.add(glass);
    const top = box(1.7, 0.14, 1.1, "#C96A2B");
    top.position.y = 1.07;
    g.add(top);
    const sign = cyl(0.2, 0.2, 0.05, "#F2C14E", 18);
    sign.rotation.x = PI / 2;
    sign.position.set(0, 1.35, 0.3);
    g.add(sign);
    const q = sph(0.07, "#4A3222", 1, 1, 0.5);
    q.position.set(0, 1.35, 0.34);
    g.add(q);
  });
  (
    [
      [65, 3.9, 0.6],
      [140, 3.9, 0.6, true],
      [215, 4.0, 0.62],
      [285, 3.9, 0.58, true],
      [355, 3.8, 0.55],
    ] as [number, number, number, boolean?][]
  ).forEach(([a, r, sc, pink], i) => {
    const rad = (a * PI) / 180;
    trees.push({ g: tree(CITY_C.x + Math.sin(rad) * r, CITY_C.z + Math.cos(rad) * r, sc, pink), ph: 7 + i });
  });
  // Khinh khí cầu bay trên thành phố (khi đã mở)
  const blimp = new THREE.Group();
  {
    const body = sph(0.7, "#F3E6CC", 1.9, 0.75, 0.75, 0.6);
    blimp.add(body);
    const band = sph(0.71, "#4E7FB8", 1.9, 0.2, 0.76, 0.6);
    blimp.add(band);
    const fin = box(0.04, 0.4, 0.3, "#4E7FB8");
    fin.position.set(-1.25, 0.15, 0);
    blimp.add(fin);
    const gond = box(0.5, 0.18, 0.25, "#8B5E3C");
    gond.position.y = -0.62;
    blimp.add(gond);
    cityG.add(blimp);
  }
  // Mây phủ khi chưa mở
  const cityFog = new THREE.Group();
  {
    const cmat = own(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.95 }));
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2;
      const p = new THREE.Mesh(SPH, cmat);
      p.scale.set(1.9, 1.1, 1.6);
      p.position.set(Math.sin(a) * (i % 2 ? 3 : 1.7), 1.8 + (i % 3) * 0.5, Math.cos(a) * (i % 2 ? 3 : 1.7));
      cityFog.add(p);
    }
    const mid = new THREE.Mesh(SPH, cmat);
    mid.scale.set(2.6, 1.8, 2.6);
    mid.position.y = 2.6;
    cityFog.add(mid);
    cityG.add(cityFog);
  }
  anchors.set("city:go", { obj: cityG, y: 4.4 });

  // ───────── Đảo Lễ Hội: trang trí đổi theo mùa ─────────
  const FEST_C = new THREE.Vector3(-15, 0, -12);
  const FR = 3.4;
  const festG = new THREE.Group();
  festG.position.copy(FEST_C);
  world.add(festG);
  const festTopMat = own(new THREE.MeshStandardMaterial({ color: new THREE.Color("#B8D98C"), roughness: 0.95 }));
  {
    const top = mesh(geo("festtop", () => new THREE.CylinderGeometry(FR, FR + 0.12, 0.5, 56)), festTopMat);
    top.position.y = -0.25;
    festG.add(top);
    const c6 = cyl(FR + 0.1, FR * 0.7, 1.7, "#C9925C", 56, 0.95);
    c6.position.y = -1.35;
    c6.castShadow = false;
    festG.add(c6);
    const stage = cyl(1.0, 1.05, 0.18, "#E8CF9B", 32);
    stage.position.y = 0.09;
    festG.add(stage);
  }
  tag(festG, "fest:go");
  const festHalo = new THREE.Mesh(own(new THREE.RingGeometry(FR - 0.2, FR + 1.6, 64)), own(new THREE.MeshBasicMaterial({ color: 0xd4f3f8, transparent: true, opacity: 0.5, depthWrite: false })));
  festHalo.rotation.x = -PI / 2;
  festHalo.position.set(FEST_C.x, -1.69, FEST_C.z);
  scene.add(festHalo);
  const festSets: Record<string, THREE.Group> = {};
  const festGlow: THREE.MeshStandardMaterial[] = [];
  const ring = (n: number, r: number, fn: (x: number, z: number, i: number) => void) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + 0.3;
      fn(Math.sin(a) * r, Math.cos(a) * r, i);
    }
  };
  // Giáng sinh
  {
    const g = new THREE.Group();
    const tr = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const c = cone(0.75 - i * 0.18, 0.75, "#3F7A34", 14);
      c.position.y = 0.6 + i * 0.45;
      tr.add(c);
    }
    const trunk = cyl(0.1, 0.12, 0.3, "#8B5E3C", 8);
    trunk.position.y = 0.2;
    tr.add(trunk);
    const star = glow("#FFD25A", 1);
    festGlow.push(star);
    const st = new THREE.Mesh(SPH, star);
    st.scale.setScalar(0.12);
    st.position.y = 1.95;
    tr.add(st);
    ["#E86F5A", "#F2C14E", "#6FC1DA", "#F29BB5", "#FFFFFF"].forEach((c, i) => {
      const m = glow(c, 0.5);
      festGlow.push(m);
      const o = new THREE.Mesh(SPH, m);
      o.scale.setScalar(0.06);
      const a = i * 1.3;
      o.position.set(Math.sin(a) * 0.45, 0.75 + (i % 3) * 0.35, Math.cos(a) * 0.45);
      tr.add(o);
    });
    tr.position.y = 0.18;
    g.add(tr);
    ring(5, 1.7, (x, z, i) => {
      const gift = box(0.32, 0.26, 0.32, ["#E86F5A", "#6FAE4F", "#4E7FB8", "#F2C14E", "#8E5BB5"][i]);
      gift.position.set(x, 0.13, z);
      g.add(gift);
      const rib = box(0.34, 0.06, 0.08, "#FFFFFF");
      rib.position.set(x, 0.27, z);
      g.add(rib);
    });
    const sm = new THREE.Group();
    const s1 = sph(0.32, "#FFFFFF", 1, 1, 1, 0.8);
    s1.position.y = 0.3;
    const s2 = sph(0.22, "#FFFFFF", 1, 1, 1, 0.8);
    s2.position.y = 0.75;
    const nose = cone(0.04, 0.16, "#F29A4E", 8);
    nose.rotation.x = PI / 2;
    nose.position.set(0, 0.76, 0.24);
    const hat = cyl(0.13, 0.13, 0.18, "#4A3222", 12);
    hat.position.y = 1.02;
    sm.add(s1, s2, nose, hat);
    sm.position.set(2.3, 0, 1.2);
    g.add(sm);
    festSets.christmas = g;
  }
  // Tết
  {
    const g = new THREE.Group();
    const trunk = cyl(0.1, 0.16, 1.0, "#6B4A30", 8);
    trunk.position.y = 0.6;
    g.add(trunk);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2;
      const bl = sph(0.32, i % 2 ? "#F4B6C2" : "#E89AAD", 1, 0.8, 1, 0.9);
      bl.position.set(Math.sin(a) * 0.5, 1.25 + (i % 3) * 0.18, Math.cos(a) * 0.5);
      g.add(bl);
    }
    ring(6, 1.8, (x, z, i) => {
      const pole = cyl(0.02, 0.02, 0.9, "#8B5E3C", 6);
      pole.position.set(x, 0.45, z);
      g.add(pole);
      const m = glow("#E8453C", 0.5);
      festGlow.push(m);
      const lan = mesh(geo("lantern", () => new THREE.SphereGeometry(0.16, 16, 12)), m);
      lan.scale.set(1, 1.2, 1);
      lan.position.set(x, 0.95, z);
      g.add(lan);
      if (i % 2 === 0) {
        const cake = box(0.26, 0.12, 0.26, "#3F7A34");
        cake.position.set(x * 0.7, 0.06, z * 0.7);
        g.add(cake);
      }
    });
    festSets.tet = g;
  }
  // Halloween
  {
    const g = new THREE.Group();
    ring(7, 1.6, (x, z) => {
      const p = sph(0.25, "#F29A4E", 1.2, 0.85, 1.2, 0.6);
      p.position.set(x, 0.2, z);
      g.add(p);
      const stem = cyl(0.03, 0.04, 0.12, "#3F7A34", 6);
      stem.position.set(x, 0.44, z);
      g.add(stem);
      const m = glow("#FFB347", 0.9);
      festGlow.push(m);
      const face = box(0.16, 0.08, 0.02, "#000000");
      face.material = m;
      face.position.set(x, 0.2, z + 0.27);
      g.add(face);
    });
    const hut = box(0.9, 0.8, 0.8, "#6B5B8C");
    hut.position.y = 0.58;
    g.add(hut);
    const hr = cone(0.75, 0.7, "#3E3550", 4);
    hr.rotation.y = PI / 4;
    hr.position.y = 1.33;
    g.add(hr);
    festSets.halloween = g;
  }
  // Trung thu
  {
    const g = new THREE.Group();
    const moon = glow("#FFE39A", 0.9);
    festGlow.push(moon);
    const mn = new THREE.Mesh(SPH, moon);
    mn.scale.setScalar(0.5);
    mn.position.set(0, 2.6, -1.4);
    g.add(mn);
    ring(6, 1.7, (x, z, i) => {
      const pole = cyl(0.02, 0.02, 0.8, "#8B5E3C", 6);
      pole.position.set(x, 0.4, z);
      g.add(pole);
      const m = glow(["#F2C14E", "#E86F5A", "#F29BB5"][i % 3], 0.6);
      festGlow.push(m);
      const star = mesh(geo("starL", () => new THREE.OctahedronGeometry(0.17)), m);
      star.position.set(x, 0.92, z);
      g.add(star);
    });
    const tbl = cyl(0.4, 0.4, 0.05, "#C9925C", 18);
    tbl.position.y = 0.42;
    g.add(tbl);
    const cake = cyl(0.14, 0.14, 0.08, "#D9A44E", 14);
    cake.position.y = 0.49;
    g.add(cake);
    festSets.midautumn = g;
  }
  for (const g of Object.values(festSets)) {
    g.visible = false;
    festG.add(g);
  }
  const festFog = new THREE.Group();
  {
    const cmat = own(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.92 }));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * PI * 2;
      const p = new THREE.Mesh(SPH, cmat);
      p.scale.set(1.4, 0.8, 1.2);
      p.position.set(Math.sin(a) * 1.6, 1.3 + (i % 2) * 0.4, Math.cos(a) * 1.6);
      festFog.add(p);
    }
    festG.add(festFog);
  }
  anchors.set("fest:go", { obj: festG, y: 2.6 });

  // ───────── Đảo Nhỏ Của Tôi: 9 ô trang trí ─────────
  const MINE_C = new THREE.Vector3(-2.6, 0, -11.2);
  const MR = 2.8;
  const mineG = new THREE.Group();
  mineG.position.copy(MINE_C);
  world.add(mineG);
  {
    const top = cyl(MR, MR + 0.1, 0.5, "#A8D27A", 48, 0.95);
    top.position.y = -0.25;
    mineG.add(top);
    const c7 = cyl(MR + 0.08, MR * 0.7, 1.6, "#C9925C", 48, 0.95);
    c7.position.y = -1.3;
    c7.castShadow = false;
    mineG.add(c7);
  }
  const mineHalo = new THREE.Mesh(own(new THREE.RingGeometry(MR - 0.2, MR + 1.4, 56)), own(new THREE.MeshBasicMaterial({ color: 0xd4f3f8, transparent: true, opacity: 0.5, depthWrite: false })));
  mineHalo.rotation.x = -PI / 2;
  mineHalo.position.set(MINE_C.x, -1.69, MINE_C.z);
  scene.add(mineHalo);
  tag(mineG, "mine:go");
  function decorModel(id: string): THREE.Group {
    const g = new THREE.Group();
    if (id === "pot") {
      const p = cyl(0.18, 0.13, 0.25, "#C9925C", 12);
      p.position.y = 0.12;
      const f = sph(0.22, "#E89AAD", 1, 0.8, 1, 0.9);
      f.position.y = 0.38;
      const f2 = sph(0.12, "#F2C14E", 1, 1, 1, 0.9);
      f2.position.set(0.1, 0.48, 0.08);
      g.add(p, f, f2);
    } else if (id === "sign") {
      const p = cyl(0.03, 0.03, 0.8, "#8B5E3C", 6);
      p.position.y = 0.4;
      const b1 = box(0.5, 0.14, 0.04, "#E8CF9B");
      b1.position.set(0.15, 0.68, 0);
      const b2 = box(0.45, 0.14, 0.04, "#E8CF9B");
      b2.position.set(-0.12, 0.48, 0);
      b2.rotation.y = 0.6;
      g.add(p, b1, b2);
    } else if (id === "bench") {
      const seat = box(0.8, 0.06, 0.28, "#C9925C");
      seat.position.y = 0.28;
      const back = box(0.8, 0.22, 0.05, "#B98250");
      back.position.set(0, 0.45, -0.12);
      g.add(seat, back);
      for (const x of [-0.32, 0.32]) {
        const l = box(0.06, 0.28, 0.26, "#8B5E3C");
        l.position.set(x, 0.14, 0);
        g.add(l);
      }
    } else if (id === "lamp") {
      const p = cyl(0.035, 0.05, 1.2, "#3E4A61", 8);
      p.position.y = 0.6;
      const m = glow("#FFE7A8", 0.8);
      festGlow.push(m);
      const l = new THREE.Mesh(SPH, m);
      l.scale.setScalar(0.12);
      l.position.y = 1.25;
      const cap = cone(0.15, 0.12, "#3E4A61", 10);
      cap.position.y = 1.38;
      g.add(p, l, cap);
    } else if (id === "flamingo") {
      const b = sph(0.2, "#F29BB5", 1.3, 0.8, 0.8, 0.6);
      b.position.y = 0.55;
      const n = cyl(0.04, 0.04, 0.4, "#F29BB5", 8);
      n.position.set(0.18, 0.78, 0);
      n.rotation.z = -0.3;
      const h = sph(0.08, "#F29BB5", 1, 1, 1, 0.6);
      h.position.set(0.25, 0.98, 0);
      const beak = cone(0.03, 0.1, "#4A3222", 6);
      beak.rotation.z = -PI / 2;
      beak.position.set(0.34, 0.96, 0);
      const leg = cyl(0.015, 0.015, 0.4, "#E07A93", 4);
      leg.position.set(0, 0.2, 0);
      g.add(b, n, h, beak, leg);
    } else if (id === "snowman") {
      const s1 = sph(0.28, "#FFFFFF", 1, 1, 1, 0.8);
      s1.position.y = 0.26;
      const s2 = sph(0.2, "#FFFFFF", 1, 1, 1, 0.8);
      s2.position.y = 0.66;
      const nose = cone(0.035, 0.14, "#F29A4E", 8);
      nose.rotation.x = PI / 2;
      nose.position.set(0, 0.68, 0.22);
      const sc = mesh(geo("scarfS", () => new THREE.TorusGeometry(0.16, 0.04, 8, 20)), mat("#E86F5A"));
      sc.rotation.x = PI / 2;
      sc.position.y = 0.5;
      g.add(s1, s2, nose, sc);
    } else if (id === "swing") {
      for (const x of [-0.4, 0.4]) {
        const p = cyl(0.035, 0.035, 1.1, "#8B5E3C", 6);
        p.position.set(x, 0.55, 0);
        g.add(p);
      }
      const top = cyl(0.03, 0.03, 0.85, "#8B5E3C", 6);
      top.rotation.z = PI / 2;
      top.position.y = 1.1;
      const seat = box(0.36, 0.04, 0.18, "#E86F5A");
      seat.position.y = 0.4;
      g.add(top, seat);
      for (const x of [-0.15, 0.15]) {
        const r = cyl(0.008, 0.008, 0.7, "#4A3222", 4);
        r.position.set(x, 0.75, 0);
        g.add(r);
      }
    } else if (id === "statue") {
      const base = box(0.4, 0.2, 0.4, "#B9B4A8");
      base.position.y = 0.1;
      const body = sph(0.2, "#C9D6E3", 1, 1.1, 0.9, 0.5);
      body.position.y = 0.42;
      const head = sph(0.15, "#C9D6E3", 1, 1, 1, 0.5);
      head.position.y = 0.7;
      g.add(base, body, head);
      for (const s of [-1, 1]) {
        const ear = cone(0.06, 0.12, "#C9D6E3", 8);
        ear.position.set(s * 0.09, 0.85, 0);
        g.add(ear);
      }
    }
    return g;
  }
  const decorSlots = new Map<string, { root: THREE.Group; marker: THREE.Mesh; item: string | null }>();
  for (let i = 0; i < 9; i++) {
    const id = `d${i + 1}`;
    const root = new THREE.Group();
    root.position.set(((i % 3) - 1) * 1.3, 0, (Math.floor(i / 3) - 1) * 1.3);
    mineG.add(root);
    const marker = cyl(0.42, 0.42, 0.03, "#D9C79E", 24, 0.95);
    marker.position.y = 0.015;
    marker.castShadow = false;
    root.add(marker);
    tag(root, `mine:${id}`);
    anchors.set(`mine:${id}`, { obj: root, y: 1.0 });
    decorSlots.set(id, { root, marker, item: null });
  }
  anchors.set("mine:go", { obj: mineG, y: 2.4 });

  // ───────── Đảo bạn bè trên bản đồ biển (tối đa 6) ─────────
  const FRIEND_AT: [number, number][] = [
    [-27, -1],
    [-26, -24],
    [-8, -32],
    [14, -33],
    [33, -4],
    [30, 12],
  ];
  const friendIsles: THREE.Group[] = FRIEND_AT.map(([x, z], i) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    const top = cyl(1.7, 1.8, 0.45, ["#A8D27A", "#B8D98C", "#9CCB6A"][i % 3], 32, 0.95);
    top.position.y = -0.22;
    const cl = cyl(1.8, 1.2, 1.4, "#C9925C", 32, 0.95);
    cl.position.y = -1.15;
    const house = box(0.7, 0.55, 0.6, "#FFF4E2");
    house.position.set(-0.2, 0.28, 0);
    const rf = cone(0.6, 0.4, ["#E86F5A", "#4E7FB8", "#8E5BB5", "#C96A2B", "#3F7A34", "#E07A93"][i], 4);
    rf.rotation.y = PI / 4;
    rf.position.set(-0.2, 0.75, 0);
    const tt = cyl(0.07, 0.09, 0.5, "#8B5E3C", 8);
    tt.position.set(0.75, 0.25, 0.3);
    const crown = sph(0.35, "#6FAE4F", 1, 1, 1, 0.9);
    crown.position.set(0.75, 0.7, 0.3);
    g.add(top, cl, house, rf, tt, crown);
    g.visible = false;
    world.add(g);
    tag(g, `chart:friend${i}`);
    anchors.set(`chart:friend${i}`, { obj: g, y: 1.6 });
    return g;
  });

  // Nhãn trên bản đồ biển
  const chartPin = (id: string, pos: THREE.Vector3, y: number) => {
    const o = new THREE.Object3D();
    o.position.copy(pos);
    world.add(o);
    anchors.set(`chart:${id}`, { obj: o, y });
  };
  chartPin("home", new THREE.Vector3(0, 0, 0), 4.5);
  chartPin("isle", ISLE_C, 3.2);
  chartPin("beach", BEACH_C, 3.0);
  chartPin("harbor", HARBOR_C, 3.6);
  chartPin("city", CITY_C, 4.6);
  chartPin("fest", FEST_C, 3.0);
  chartPin("mine", MINE_C, 2.4);

  // Mây
  const clouds: { g: THREE.Group; r: number; a: number; y: number; s: number; m: THREE.MeshStandardMaterial }[] = [];
  for (let i = 0; i < 6; i++) {
    const cloudMat = own(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.95, depthWrite: false }));
    const cg = new THREE.Group();
    (
      [
        [0, 0, 0, 0.9],
        [0.9, -0.1, 0.1, 0.7],
        [-0.85, -0.15, 0, 0.65],
        [0.3, 0.35, -0.1, 0.6],
      ] as const
    ).forEach(([x, y, z, s]) => {
      const m = new THREE.Mesh(SPH, cloudMat);
      m.scale.setScalar(s);
      m.position.set(x, y, z);
      cg.add(m);
    });
    scene.add(cg);
    cg.scale.setScalar(1.1 + (i % 3) * 0.25);
    clouds.push({ g: cg, r: 11 + (i % 3) * 1.6, a: (i / 6) * PI * 2, y: 3.5 + (i % 3) * 1.6, s: 0.02 + i * 0.005, m: cloudMat });
  }

  // Cánh hoa rơi
  const petals: { m: THREE.Mesh; y0: number; x0: number; z0: number; sp: number; off: number; sw: number }[] = [];
  const petalMat = own(new THREE.MeshStandardMaterial({ color: new THREE.Color("#F4B6C2"), roughness: 0.8, side: THREE.DoubleSide }));
  const petalGeo = own(new THREE.CircleGeometry(0.07, 8));
  for (let i = 0; i < (reduceMotion ? 12 : 36); i++) {
    const pm = new THREE.Mesh(petalGeo, petalMat);
    pm.scale.set(1, 0.6, 1);
    world.add(pm);
    petals.push({ m: pm, y0: 2.2 + rnd() * 1.6, x0: -0.6 + (rnd() - 0.5) * 3, z0: -3.8 + (rnd() - 0.5) * 3, sp: 0.25 + rnd() * 0.3, off: rnd() * 10, sw: rnd() * 2 });
  }

  // ───────── nhân vật ─────────
  type Kind = "shiba" | "cat" | "bunny" | "penguin" | "frog" | "otter";
  const KINDS: Record<Kind, { body: string; belly: string; inner: string; feet: string }> = {
    shiba: { body: "#E9A15B", belly: "#FFF4E2", inner: "#F7C7A0", feet: "#E9A15B" },
    cat: { body: "#AEB8CB", belly: "#F7F3EC", inner: "#F4B6C2", feet: "#AEB8CB" },
    bunny: { body: "#FBF6EF", belly: "#FFFFFF", inner: "#F4B6C2", feet: "#FBF6EF" },
    penguin: { body: "#3E4A61", belly: "#FBF6EF", inner: "#3E4A61", feet: "#F2A541" },
    frog: { body: "#8CC56A", belly: "#E9F4CF", inner: "#8CC56A", feet: "#8CC56A" },
    otter: { body: "#A8775A", belly: "#F2DCC4", inner: "#8E6248", feet: "#8E6248" },
  };
  type Char = { id: string; root: THREE.Group; inner: THREE.Group; head: THREE.Group; eyes: THREE.Group; armPivot: THREE.Group; ph: number; blinkAt: number; hop: number; ears: THREE.Object3D[]; float?: number };
  const chars: Char[] = [];
  const blushMat = own(new THREE.MeshStandardMaterial({ color: new THREE.Color("#F48FA0"), roughness: 0.8, transparent: true, opacity: 0.75 }));
  const mouthGeo = own(new THREE.TorusGeometry(0.05, 0.013, 8, 16, PI));

  function makeChar(id: string, kind: Kind, x: number, z: number): Char {
    const k = KINDS[kind];
    const root = new THREE.Group();
    root.position.set(x, 0, z);
    world.add(root);
    const inner = new THREE.Group();
    root.add(inner);
    const body = sph(0.42, k.body, 1, 0.95, 0.9, 0.6);
    body.position.y = 0.45;
    inner.add(body);
    const belly = sph(0.3, k.belly, 1, 0.95, 0.55, 0.6);
    belly.position.set(0, 0.42, 0.25);
    inner.add(belly);
    [-1, 1].forEach((s) => {
      const ft = sph(0.14, k.feet, 1.15, 0.6, 1.35, 0.6);
      ft.position.set(s * 0.18, 0.06, 0.14);
      inner.add(ft);
    });
    const armL = sph(0.12, k.body, 0.75, 1.25, 0.75, 0.6);
    armL.position.set(-0.41, 0.5, 0.05);
    armL.rotation.z = 0.5;
    inner.add(armL);
    const armPivot = new THREE.Group();
    armPivot.position.set(0.33, 0.64, 0.05);
    inner.add(armPivot);
    const armR = sph(0.12, k.body, 0.75, 1.25, 0.75, 0.6);
    armR.position.set(0.08, -0.13, 0);
    armR.rotation.z = -0.5;
    armPivot.add(armR);

    const head = new THREE.Group();
    head.position.y = 1.08;
    inner.add(head);
    head.add(sph(0.5, k.body, 1.08, 0.94, 0.95, 0.6));
    const eyes = new THREE.Group();
    head.add(eyes);
    const dark = "#3A2618";
    if (kind === "frog") {
      [-1, 1].forEach((s) => {
        const bump = sph(0.17, k.body, 1, 1, 1, 0.6);
        bump.position.set(s * 0.24, 0.4, 0.14);
        head.add(bump);
        const w = sph(0.1, "#FFFFFF", 1, 1, 0.8, 0.3);
        w.position.set(s * 0.24, 0.43, 0.26);
        eyes.add(w);
        const p = sph(0.055, dark, 1, 1.2, 0.6, 0.3);
        p.position.set(s * 0.24, 0.43, 0.34);
        eyes.add(p);
      });
      eyes.userData.pivotY = 0.43;
    } else {
      [-1, 1].forEach((s) => {
        const e = sph(0.072, dark, 1, 1.35, 0.6, 0.3);
        e.position.set(s * 0.19, 0.04, 0.45);
        eyes.add(e);
        const hl = sph(0.024, "#FFFFFF", 1, 1, 1, 0.2);
        hl.position.set(s * 0.19 + 0.025, 0.09, 0.5);
        eyes.add(hl);
      });
    }
    [-1, 1].forEach((s) => {
      const bl = new THREE.Mesh(SPH, blushMat);
      bl.scale.set(0.09, 0.055, 0.03);
      bl.position.set(s * 0.32, -0.1, 0.39);
      bl.rotation.y = s * 0.6;
      head.add(bl);
    });
    if (kind === "shiba") {
      const mask = sph(0.28, k.belly, 1.2, 0.75, 0.6, 0.6);
      mask.position.set(0, -0.15, 0.28);
      head.add(mask);
    }
    if (kind === "penguin") {
      const face = sph(0.4, k.belly, 1.0, 0.88, 0.62, 0.6);
      face.position.set(0, -0.03, 0.22);
      head.add(face);
      const beak = cone(0.07, 0.17, "#F2A541", 12);
      beak.rotation.x = PI / 2;
      beak.position.set(0, -0.09, 0.53);
      head.add(beak);
    } else if (kind !== "frog") {
      const nose = sph(0.042, dark, 1.2, 0.85, 0.8, 0.3);
      nose.position.set(0, -0.09, 0.5);
      head.add(nose);
    }
    const mouth = new THREE.Mesh(mouthGeo, mat(dark));
    mouth.rotation.z = PI;
    mouth.position.set(0, kind === "frog" ? -0.1 : -0.16, kind === "frog" ? 0.5 : 0.47);
    head.add(mouth);
    const ears: THREE.Object3D[] = [];
    if (kind === "shiba" || kind === "cat") {
      [-1, 1].forEach((s) => {
        const ear = cone(0.15, 0.34, k.body, 16);
        ear.position.set(s * 0.3, 0.44, -0.02);
        ear.rotation.z = -s * 0.38;
        head.add(ear);
        const ie = cone(0.085, 0.2, k.inner, 12);
        ie.position.set(s * 0.29, 0.42, 0.07);
        ie.rotation.z = -s * 0.38;
        head.add(ie);
      });
    }
    if (kind === "bunny") {
      [-1, 1].forEach((s) => {
        const earG = new THREE.Group();
        earG.position.set(s * 0.17, 0.4, -0.02);
        earG.rotation.z = -s * 0.12;
        head.add(earG);
        const ear = sph(0.11, k.body, 1, 3.1, 0.7, 0.6);
        ear.position.y = 0.3;
        earG.add(ear);
        const ie = sph(0.055, k.inner, 1, 2.6, 0.5, 0.6);
        ie.position.set(0, 0.3, 0.06);
        earG.add(ie);
        ears.push(earG);
      });
      (
        [
          [0.3, 0.42, 0.18],
          [0.38, 0.34, 0.16],
          [0.26, 0.31, 0.24],
          [0.36, 0.46, 0.08],
        ] as const
      ).forEach(([x, y, z]) => {
        const pet = sph(0.06, "#F4B6C2", 1, 1, 1, 0.6);
        pet.position.set(x, y, z);
        head.add(pet);
      });
      const fc = sph(0.045, "#F2C14E", 1, 1, 1, 0.5);
      fc.position.set(0.33, 0.39, 0.2);
      head.add(fc);
    }
    if (kind === "shiba") {
      const scarf = mesh(geo("scarf", () => new THREE.TorusGeometry(0.34, 0.075, 12, 36)), mat("#4C8A3F"));
      scarf.rotation.x = PI / 2;
      scarf.position.y = 0.82;
      inner.add(scarf);
      const knot = sph(0.09, "#4C8A3F", 1, 1.4, 0.7);
      knot.position.set(0.16, 0.7, 0.3);
      inner.add(knot);
      const leaf = sph(0.1, "#6FAE4F", 0.55, 1.4, 0.3, 0.6);
      leaf.position.set(0.03, 0.56, 0);
      leaf.rotation.z = -0.4;
      head.add(leaf);
    }
    if (kind === "cat") {
      const beret = sph(0.36, "#8B5E3C", 1, 0.32, 1, 0.8);
      beret.position.set(0.05, 0.4, -0.02);
      beret.rotation.z = -0.15;
      head.add(beret);
      const nub = sph(0.05, "#8B5E3C");
      nub.position.set(0.03, 0.52, -0.02);
      head.add(nub);
      const apron = box(0.42, 0.34, 0.04, "#8B5E3C");
      apron.position.set(0, 0.42, 0.38);
      apron.rotation.x = -0.15;
      inner.add(apron);
    }
    if (kind === "penguin") {
      const capTop = mesh(geo("cap", () => new THREE.SphereGeometry(0.45, 32, 16, 0, PI * 2, 0, PI / 2)), mat("#4E7FB8"));
      capTop.scale.y = 0.75;
      capTop.position.y = 0.2;
      head.add(capTop);
      const brim = cyl(0.3, 0.3, 0.04, "#3D6797", 24);
      brim.scale.z = 0.6;
      brim.position.set(0, 0.22, 0.38);
      head.add(brim);
      const badge = sph(0.06, "#F2C14E", 1, 1, 0.5, 0.4);
      badge.position.set(0, 0.42, 0.33);
      head.add(badge);
    }
    if (kind === "otter") {
      [-1, 1].forEach((s) => {
        const ear = sph(0.09, k.body, 1, 0.8, 0.6, 0.6);
        ear.position.set(s * 0.3, 0.3, -0.02);
        head.add(ear);
      });
      const muzzle = sph(0.2, k.belly, 1.3, 0.8, 0.7, 0.6);
      muzzle.position.set(0, -0.13, 0.33);
      head.add(muzzle);
      // Mũ thuyền trưởng
      const crown = cyl(0.3, 0.34, 0.2, "#FFFFFF", 24);
      crown.position.y = 0.42;
      head.add(crown);
      const band = cyl(0.345, 0.345, 0.06, "#2B4C7E", 24);
      band.position.y = 0.34;
      head.add(band);
      const brimO = cyl(0.26, 0.26, 0.03, "#2B4C7E", 20);
      brimO.scale.z = 0.6;
      brimO.position.set(0, 0.32, 0.3);
      head.add(brimO);
      const anchorB = sph(0.05, "#F2C14E", 1, 1, 0.5, 0.4);
      anchorB.position.set(0, 0.44, 0.31);
      head.add(anchorB);
      const tail = sph(0.12, k.body, 0.7, 0.45, 2.2, 0.6);
      tail.position.set(0, 0.16, -0.48);
      tail.rotation.x = 0.4;
      inner.add(tail);
    }
    if (kind === "frog") {
      [-1, 1].forEach((s) => {
        const bow = cone(0.08, 0.16, "#E86F5A", 3);
        bow.rotation.z = (s * PI) / 2;
        bow.position.set(s * 0.09, 0.84, 0.33);
        inner.add(bow);
      });
      const brimH = cyl(0.62, 0.62, 0.04, "#F2D27A", 32);
      brimH.position.y = 0.58;
      brimH.rotation.x = -0.08;
      head.add(brimH);
      const crownH = cyl(0.3, 0.34, 0.22, "#E8C060", 24);
      crownH.position.y = 0.7;
      head.add(crownH);
    }
    tag(root, `npc:${id}`);
    const ch: Char = { id, root, inner, head, eyes, armPivot, ph: rnd() * 6, blinkAt: 1 + rnd() * 3, hop: 0, ears };
    chars.push(ch);
    anchors.set(`npc:${id}`, { obj: head, y: 0.95 });
    return ch;
  }
  makeChar("bo", "shiba", 0.1, 1.0);
  makeChar("miso", "cat", -2.7, -0.1);
  makeChar("mallow", "bunny", 2.8, 1.3);
  makeChar("pip", "penguin", 1.7, -2.7);
  makeChar("kero", "frog", -1.9, 2.2);
  // Thuyền trưởng Rái đứng gần bến phà Đảo Phố Cảng
  makeChar("otto", "otter", HARBOR_C.x + 1.1, HARBOR_C.z + 3.2);

  // ───────── thú nuôi: heo, trâu, rồng ─────────
  function animalBase(id: string, x: number, z: number, scale: number) {
    const root = new THREE.Group();
    root.position.set(x, 0, z);
    root.scale.setScalar(scale);
    world.add(root);
    const inner = new THREE.Group();
    root.add(inner);
    const head = new THREE.Group();
    inner.add(head);
    const eyes = new THREE.Group();
    head.add(eyes);
    const ch: Char = { id, root, inner, head, eyes, armPivot: new THREE.Group(), ph: rnd() * 6, blinkAt: 1 + rnd() * 3, hop: 0, ears: [] };
    chars.push(ch);
    return ch;
  }
  function eyesOn(ch: Char, y: number, z: number, gap: number) {
    [-1, 1].forEach((s) => {
      const e = sph(0.06, "#3A2618", 1, 1.3, 0.6, 0.3);
      e.position.set(s * gap, y, z);
      ch.eyes.add(e);
      const hl = sph(0.02, "#FFFFFF", 1, 1, 1, 0.2);
      hl.position.set(s * gap + 0.02, y + 0.04, z + 0.04);
      ch.eyes.add(hl);
      const bl = new THREE.Mesh(SPH, blushMat);
      bl.scale.set(0.07, 0.045, 0.03);
      bl.position.set(s * (gap + 0.12), y - 0.1, z - 0.04);
      ch.head.add(bl);
    });
  }
  {
    // Heo Ủn bên vũng bùn
    const mud = cyl(0.75, 0.75, 0.02, "#9A6B45", 28, 0.4);
    mud.scale.z = 0.7;
    mud.position.set(-2.2, 0.015, -2.1);
    mud.castShadow = false;
    world.add(mud);
    const pig = animalBase("pig", -2.0, -1.9, 0.75);
    const body = sph(0.5, "#F6B5C0", 1.15, 0.85, 1, 0.6);
    body.position.y = 0.45;
    pig.inner.add(body);
    for (const [x, z] of [
      [-0.28, -0.25],
      [0.28, -0.25],
      [-0.28, 0.25],
      [0.28, 0.25],
    ] as const) {
      const leg = cyl(0.09, 0.1, 0.2, "#F29AA8", 10);
      leg.position.set(x, 0.1, z);
      pig.inner.add(leg);
    }
    pig.head.position.set(0, 0.62, 0.42);
    pig.head.add(sph(0.36, "#F6B5C0", 1.05, 0.95, 0.95, 0.6));
    const snout = cyl(0.15, 0.15, 0.1, "#F29AA8", 20);
    snout.rotation.x = PI / 2;
    snout.position.set(0, -0.06, 0.34);
    pig.head.add(snout);
    [-1, 1].forEach((s) => {
      const n = sph(0.03, "#C9737F", 1, 1, 0.5);
      n.position.set(s * 0.05, -0.06, 0.4);
      pig.head.add(n);
      const ear = cone(0.1, 0.2, "#F29AA8", 3);
      ear.position.set(s * 0.22, 0.3, -0.02);
      ear.rotation.z = -s * 0.5;
      pig.head.add(ear);
    });
    eyesOn(pig, 0.08, 0.3, 0.14);
    const tail = mesh(geo("ptail", () => new THREE.TorusGeometry(0.07, 0.025, 8, 16, PI * 1.5)), mat("#F29AA8"));
    tail.position.set(0, 0.55, -0.58);
    pig.inner.add(tail);
    tag(pig.root, "animal:pig");
    anchors.set("animal:pig", { obj: pig.root, y: 1.3 });

    // Trâu Mộc
    const buf = animalBase("buffalo", 2.4, 2.9, 0.8);
    const bbody = sph(0.6, "#7E8794", 1.3, 0.8, 0.95, 0.75);
    bbody.position.y = 0.6;
    buf.inner.add(bbody);
    for (const [x, z] of [
      [-0.45, -0.3],
      [0.45, -0.3],
      [-0.45, 0.3],
      [0.45, 0.3],
    ] as const) {
      const leg = cyl(0.11, 0.12, 0.34, "#69717D", 10);
      leg.position.set(x, 0.17, z);
      buf.inner.add(leg);
    }
    buf.head.position.set(0, 0.78, 0.62);
    buf.head.add(sph(0.36, "#7E8794", 1, 0.9, 1, 0.75));
    const muzzle = sph(0.22, "#B9B4A8", 1.2, 0.8, 0.8, 0.7);
    muzzle.position.set(0, -0.12, 0.26);
    buf.head.add(muzzle);
    [-1, 1].forEach((s) => {
      const horn = mesh(geo("horn", () => new THREE.TorusGeometry(0.22, 0.05, 8, 18, PI * 0.9)), mat("#F4E7CF"));
      horn.position.set(s * 0.25, 0.22, -0.05);
      horn.rotation.set(0, s > 0 ? 0 : PI, 0.2);
      buf.head.add(horn);
    });
    eyesOn(buf, 0.1, 0.3, 0.15);
    buf.head.rotation.y = 0;
    tag(buf.root, "animal:buffalo");
    anchors.set("animal:buffalo", { obj: buf.root, y: 1.6 });

    // Rồng Bông bay lơ lửng gần sân bay
    const drg = animalBase("dragon", 0.9, -5.2, 0.8);
    drg.float = 1.4;
    const dbody = sph(0.45, "#9DD7A6", 1, 1.05, 0.95, 0.6);
    dbody.position.y = 0.45;
    drg.inner.add(dbody);
    const dbelly = sph(0.32, "#FFF4D6", 1, 1, 0.55, 0.6);
    dbelly.position.set(0, 0.42, 0.25);
    drg.inner.add(dbelly);
    drg.head.position.y = 1.05;
    drg.head.add(sph(0.42, "#9DD7A6", 1.08, 0.95, 0.95, 0.6));
    [-1, 1].forEach((s) => {
      const horn = cone(0.06, 0.2, "#F2C14E", 10);
      horn.position.set(s * 0.18, 0.4, -0.05);
      horn.rotation.z = -s * 0.3;
      drg.head.add(horn);
      const wing = sph(0.32, "#C9E9B4", 1, 0.6, 0.12, 0.6);
      wing.position.set(s * 0.42, 0.75, -0.25);
      wing.rotation.set(0.3, s * 0.6, s * 0.5);
      drg.inner.add(wing);
      drg.ears.push(wing);
    });
    for (let i = 0; i < 3; i++) {
      const sp = cone(0.07, 0.16, "#6FAE4F", 8);
      sp.position.set(0, 0.95 - i * 0.22, -0.4 + i * 0.02);
      sp.rotation.x = -0.6;
      drg.inner.add(sp);
    }
    eyesOn(drg, 0.04, 0.38, 0.16);
    const dmouth = new THREE.Mesh(mouthGeo, mat("#3A2618"));
    dmouth.rotation.z = PI;
    dmouth.position.set(0, -0.12, 0.4);
    drg.head.add(dmouth);
    tag(drg.root, "animal:dragon");
    anchors.set("animal:dragon", { obj: drg.root, y: 2.0 });
  }

  // ───────── đồ xây theo cấp ─────────
  const builds = new Map<string, { lv: number; g: THREE.Group }>();
  function build(id: string, lv: number) {
    const g = new THREE.Group();
    g.visible = false;
    world.add(g);
    builds.set(id, { lv, g });
    return g;
  }
  const lanternMats: THREE.MeshStandardMaterial[] = [];
  let windBlades: THREE.Group | null = null;
  let balloonG: THREE.Group | null = null;
  let boatG: THREE.Group | null = null;
  {
    // Luống hoa quanh quảng trường
    const g = build("flowers", 2);
    for (let i = 0; i < 4; i++) {
      const a = PI / 4 + (i * PI) / 2;
      const bed = cyl(0.42, 0.46, 0.12, "#8A5A37", 20, 0.95);
      bed.position.set(Math.cos(a) * 2.25, 0.06, Math.sin(a) * 2.25);
      g.add(bed);
      for (let j = 0; j < 6; j++) {
        const fa = (j / 6) * PI * 2;
        const f = sph(0.08, ["#F4B6C2", "#F2C14E", "#E86F5A", "#FFFFFF"][(i + j) % 4], 1, 0.8, 1, 0.6);
        f.position.set(Math.cos(a) * 2.25 + Math.cos(fa) * 0.24, 0.18, Math.sin(a) * 2.25 + Math.sin(fa) * 0.24);
        g.add(f);
      }
    }
  }
  {
    // Ghế gỗ cạnh hồ
    const g = build("bench", 3);
    g.position.set(-4.7, 0, 1.4);
    g.rotation.y = 1.0;
    const seat = box(1.0, 0.08, 0.34, "#C9925C");
    seat.position.y = 0.36;
    g.add(seat);
    const back = box(1.0, 0.3, 0.06, "#C9925C");
    back.position.set(0, 0.58, -0.16);
    g.add(back);
    for (const x of [-0.42, 0.42]) {
      const leg = box(0.08, 0.36, 0.3, "#8B5E3C");
      leg.position.set(x, 0.18, 0);
      g.add(leg);
    }
  }
  {
    // Hòm thư của Bơ
    const g = build("mailbox", 4);
    g.position.set(1.15, 0, 1.85);
    const post = cyl(0.05, 0.05, 0.7, "#8B5E3C", 8);
    post.position.y = 0.35;
    g.add(post);
    const mb = box(0.32, 0.26, 0.44, "#E86F5A");
    mb.position.y = 0.82;
    g.add(mb);
    const lid = mesh(geo("mblid", () => new THREE.CylinderGeometry(0.16, 0.16, 0.44, 16, 1, false, 0, PI)), mat("#E86F5A"));
    lid.rotation.set(PI / 2, 0, PI / 2);
    lid.position.y = 0.95;
    g.add(lid);
    const flag = box(0.04, 0.2, 0.08, "#F2C14E");
    flag.position.set(0.19, 1.0, 0.1);
    g.add(flag);
  }
  {
    // Dây đèn lồng dọc đường tới quán và chợ
    const g = build("lanterns", 5);
    const posts: [number, number][] = [
      [-1.6, -0.6],
      [-3.0, -1.15],
      [1.6, 0.8],
      [3.0, 1.05],
    ];
    posts.forEach(([x, z]) => {
      const p = cyl(0.04, 0.05, 1.5, "#8B5E3C", 8);
      p.position.set(x, 0.75, z);
      g.add(p);
    });
    const LCOL = ["#E86F5A", "#F2C14E", "#F4B6C2"];
    const span = (a: [number, number], b: [number, number]) => {
      for (let i = 1; i <= 3; i++) {
        const t = i / 4;
        const m = own(new THREE.MeshStandardMaterial({ color: new THREE.Color(LCOL[i % 3]), emissive: new THREE.Color(LCOL[i % 3]), emissiveIntensity: 0.15, roughness: 0.5 }));
        lanternMats.push(m);
        const l = new THREE.Mesh(SPH, m);
        l.scale.set(0.1, 0.13, 0.1);
        l.position.set(a[0] + (b[0] - a[0]) * t, 1.4 - Math.sin(t * PI) * 0.18, a[1] + (b[1] - a[1]) * t);
        l.castShadow = true;
        g.add(l);
      }
    };
    span(posts[0], posts[1]);
    span(posts[2], posts[3]);
  }
  {
    // Thuyền nhỏ trên Hồ Kero
    const g = build("boat", 6);
    g.position.set(-3.2, 0.08, 2.9);
    boatG = g;
    const hull = mesh(geo("hull", () => new THREE.CylinderGeometry(0.18, 0.12, 0.6, 12, 1, false, 0, PI)), mat("#C9925C"));
    hull.rotation.set(0, 0, PI / 2);
    hull.rotation.x = PI;
    hull.scale.set(1, 1, 1.6);
    hull.position.y = 0.1;
    g.add(hull);
    const mast = cyl(0.02, 0.02, 0.5, "#8B5E3C", 6);
    mast.position.y = 0.35;
    g.add(mast);
    const sail = cone(0.16, 0.36, "#FFFFFF", 3);
    sail.position.set(0.06, 0.4, 0);
    g.add(sail);
  }
  {
    // Cối xay gió cạnh chợ
    const g = build("windmill", 7);
    g.position.set(4.9, 0, 2.7);
    g.scale.setScalar(0.85);
    faceCenter(g);
    const tw = cyl(0.3, 0.45, 1.8, "#FFF4E2", 12);
    tw.position.y = 0.9;
    g.add(tw);
    const rf = cone(0.42, 0.45, "#D9735A", 12);
    rf.position.y = 2.02;
    g.add(rf);
    windBlades = new THREE.Group();
    windBlades.position.set(0, 1.6, 0.42);
    for (let i = 0; i < 4; i++) {
      const bl = box(0.14, 0.75, 0.03, "#FFF9EE");
      bl.position.y = 0.4;
      const arm = new THREE.Group();
      arm.rotation.z = (i * PI) / 2;
      arm.add(bl);
      windBlades.add(arm);
    }
    const hub = sph(0.07, "#8B5E3C");
    windBlades.add(hub);
    g.add(windBlades);
  }
  {
    // Khinh khí cầu
    const g = build("balloon", 8);
    balloonG = g;
    g.position.set(-4.6, 4.0, -4.4);
    const env = sph(0.75, "#F2C14E", 1, 1.15, 1, 0.6);
    g.add(env);
    for (let i = 0; i < 4; i++) {
      const stripe = mesh(geo("bstripe", () => new THREE.TorusGeometry(0.76, 0.04, 6, 32)), mat("#E86F5A"));
      stripe.rotation.y = (i * PI) / 4;
      stripe.scale.y = 1.15;
      g.add(stripe);
    }
    const basket = box(0.36, 0.26, 0.36, "#A86A4A");
    basket.position.y = -1.25;
    g.add(basket);
    for (const [x, z] of [
      [-0.15, -0.15],
      [0.15, -0.15],
      [-0.15, 0.15],
      [0.15, 0.15],
    ] as const) {
      const r = cyl(0.01, 0.01, 0.5, "#8B5E3C", 4);
      r.position.set(x, -0.9, z);
      g.add(r);
    }
  }
  {
    // Cổng hoa lễ hội trên đường xuống bến
    const g = build("arch", 10);
    g.position.set(1.08, 0, 3.45);
    g.rotation.y = Math.atan2(1.8, 5.8);
    const ar = mesh(geo("arch", () => new THREE.TorusGeometry(0.75, 0.09, 10, 32, PI)), mat("#6FAE4F"));
    ar.position.y = 0.55;
    g.add(ar);
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * PI;
      const f = sph(0.1, i % 2 ? "#F4B6C2" : "#F2C14E", 1, 1, 1, 0.6);
      f.position.set(Math.cos(a) * 0.75, 0.55 + Math.sin(a) * 0.75, 0.08);
      g.add(f);
    }
    for (const x of [-0.75, 0.75]) {
      const p = cyl(0.08, 0.08, 0.55, "#6FAE4F", 10);
      p.position.set(x, 0.27, 0);
      g.add(p);
    }
  }

  // ───────── trạng thái động ─────────
  const kidMeshes: { g: THREE.Group; a: number; r: number; sp: number; cx: number; cz: number; ready?: boolean }[] = [];
  function rebuildKids(list: WorldState["pond"]) {
    kidMeshes.length = 0;
    for (const c of [...kidsG.children]) kidsG.remove(c);
    list.slice(0, 8).forEach((k, i) => {
      const g = new THREE.Group();
      if (k.kind === "crab") {
        g.add(sph(0.12, "#E86F5A", 1.3, 0.55, 1, 0.5));
        [-1, 1].forEach((s) => {
          const cl = sph(0.05, "#E86F5A", 1, 0.8, 1, 0.5);
          cl.position.set(s * 0.15, 0.02, 0.1);
          g.add(cl);
        });
      } else if (k.kind === "lobster") {
        g.add(sph(0.1, "#B8402F", 0.8, 0.6, 2.0, 0.5));
        [-1, 1].forEach((s) => {
          const cl = sph(0.06, "#B8402F", 1, 0.7, 1.4, 0.5);
          cl.position.set(s * 0.12, 0, 0.22);
          g.add(cl);
        });
      } else {
        for (let j = 0; j < 3; j++) {
          const seg = sph(0.07 - j * 0.012, "#F29A4E", 1, 0.8, 1, 0.5);
          seg.position.set(0, Math.sin(j * 0.7) * 0.05, -j * 0.09);
          g.add(seg);
        }
      }
      if (k.ready) {
        const star = sph(0.05, "#F2C14E", 1, 1, 1, 0.3);
        star.position.y = 0.25;
        star.userData.star = true;
        g.add(star);
      }
      g.position.y = 0.1;
      kidsG.add(g);
      kidMeshes.push({ g, a: (i / Math.max(1, list.length)) * PI * 2, r: 0.25 + (i % 3) * 0.12, sp: 0.4 + rnd() * 0.4, cx: -0.5 + (i % 2) * 1.0, cz: 0, ready: k.ready });
    });
    kidsG.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) o.userData.pid = "place:farm";
    });
  }
  let kidSig = "";
  function apply(s: WorldState) {
    state = s;
    builds.forEach((b) => (b.g.visible = s.level >= b.lv));
    const gn = Math.max(0, Math.min(6, s.garden));
    crops.forEach((c, i) => (c.visible = i < gn));
    gardenG.children.forEach((o) => {
      if (o.userData.sprout !== undefined) o.visible = o.userData.sprout >= gn;
    });
    officeTape.forEach((o) => (o.visible = !s.office));
    const built = new Set(s.isle || []);
    isleSpots.forEach((v, id) => {
      v.built.visible = built.has(id);
      v.scaffold.visible = !built.has(id);
    });
    beachGate.forEach((o) => (o.visible = !s.beach?.open));
    harborFog.visible = !s.harbor;
    cityFog.visible = !s.city;
    blimp.visible = !!s.city;
    for (const [k, g] of Object.entries(festSets)) g.visible = s.fest === k;
    festFog.visible = !s.fest;
    festTopMat.color.set(s.fest === "christmas" ? "#F4F8FB" : s.fest === "halloween" ? "#9FB08A" : "#B8D98C");
    decorSlots.forEach((slot, id) => {
      const want = s.decor?.[id] || null;
      if (want === slot.item) return;
      slot.root.children.filter((c) => c !== slot.marker).forEach((c) => {
        untag(c);
        slot.root.remove(c);
      });
      slot.item = want;
      slot.marker.visible = !want;
      if (want) {
        const m = decorModel(want);
        slot.root.add(m);
        tag(m, `mine:${id}`);
      }
    });
    friendIsles.forEach((g, i) => (g.visible = i < (s.friends || 0)));
    chestG.visible = (s.chests || 0) > 0;
    ferry.visible = !!s.harbor;
    plotViews.forEach((v, id) => {
      const p = s.beach?.plots[id] || { st: "locked" as const };
      v.empty.visible = p.st === "empty";
      v.wild.visible = p.st === "wild";
      v.locked.visible = p.st === "locked";
      for (const [k, g] of Object.entries(v.kinds)) {
        const on = p.st === "built" && p.t === k;
        g.visible = on;
        if (!on) continue;
        const lv = Math.max(1, Math.min(3, p.lv || 1));
        g.scale.setScalar([0.85, 1, 1.12][lv - 1]);
        const ex = v.extras[k] || [];
        const show = lv === 1 ? 0 : lv === 2 ? Math.ceil(ex.length / 2) : ex.length;
        ex.forEach((o, i) => (o.visible = i < show));
      }
    });
    const sig = s.pond.map((k) => `${k.kind}${k.ready ? 1 : 0}`).join(",");
    if (sig !== kidSig) {
      kidSig = sig;
      rebuildKids(s.pond);
    }
  }
  apply(state);

  // ───────── camera & điều khiển ─────────
  const HOME = { theta: 0.3, phi: 0.96, radius: 25.5 };
  const ISLE_RADIUS = 19;
  const orbit = { theta: HOME.theta, phi: HOME.phi, radius: HOME.radius, tTheta: HOME.theta, tPhi: HOME.phi, tRadius: HOME.radius };
  // Tâm xoay của máy quay: đảo nhà (0,0,0) hoặc Đảo Luyện.
  let view: WorldView = "home";
  const center = new THREE.Vector3(),
    tCenter = new THREE.Vector3();
  scene.add(sun.target);
  const BEACH_RADIUS = 17;
  const VIEWS: Record<WorldView, { c: THREE.Vector3; r: number; phi: number; theta?: number }> = {
    home: { c: new THREE.Vector3(), r: HOME.radius, phi: HOME.phi },
    isle: { c: ISLE_C, r: ISLE_RADIUS, phi: HOME.phi },
    beach: { c: BEACH_C, r: BEACH_RADIUS, phi: HOME.phi },
    harbor: { c: HARBOR_C, r: 22, phi: HOME.phi },
    city: { c: CITY_C, r: 22, phi: HOME.phi },
    fest: { c: FEST_C, r: 15, phi: HOME.phi },
    // Nhìn từ phía sau (phía Phố Cảng) để đảo nhà không che mất đảo nhỏ.
    mine: { c: MINE_C, r: 13, phi: 0.9, theta: PI + 0.35 },
    chart: { c: new THREE.Vector3(3, 0, -7), r: 58, phi: 0.64 },
  };
  function goView(v: WorldView) {
    view = v;
    tCenter.copy(VIEWS[v].c);
    orbit.tRadius = VIEWS[v].r;
    orbit.tPhi = VIEWS[v].phi;
    const want = VIEWS[v].theta ?? HOME.theta;
    // Xoay theo đường ngắn nhất tới góc nhìn của đảo
    let d = want - orbit.theta;
    d -= Math.round(d / (PI * 2)) * PI * 2;
    orbit.tTheta = orbit.theta + d;
    // Bản đồ biển: mở rộng vùng đổ bóng cho thấy cả quần đảo
    const ext = v === "chart" ? 34 : 11;
    Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext });
    sun.shadow.camera.updateProjectionMatrix();
    lastInteract = performance.now();
  }
  let lastInteract = -1e9;
  let w = 1,
    h = 1;
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch0 = 0,
    moved = 0;
  const ray = new THREE.Raycaster(),
    ndc = new THREE.Vector2();

  function hitAt(x: number, y: number): string | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    return hit ? (hit.object.userData.pid as string) : null;
  }
  const onDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) moved = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
    }
    lastInteract = performance.now();
  };
  let hoverAt = 0;
  const onMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) {
      // Rê chuột: đổi con trỏ khi trỏ vào chỗ bấm được
      if (e.pointerType === "mouse" && performance.now() - hoverAt > 60) {
        hoverAt = performance.now();
        canvas.style.cursor = hitAt(e.clientX, e.clientY) ? "pointer" : "grab";
      }
      return;
    }
    const dx = e.clientX - prev.x,
      dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6) {
        if (!canvas.hasPointerCapture(e.pointerId)) canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
      }
      orbit.tTheta -= dx * 0.008;
      if (e.pointerType === "mouse") orbit.tPhi = Math.min(1.22, Math.max(0.62, orbit.tPhi - dy * 0.005));
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch0) orbit.tRadius = Math.min(view === "chart" ? 80 : 32, Math.max(10, (orbit.tRadius * pinch0) / dist));
      pinch0 = dist;
      moved = 99;
    }
    lastInteract = performance.now();
  };
  const onUp = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    const single = pointers.size === 1;
    pointers.delete(e.pointerId);
    if (single && moved < 6) opts.onPick(hitAt(e.clientX, e.clientY));
    if (pointers.size < 2) pinch0 = 0;
    canvas.style.cursor = "grab";
  };
  const onCancel = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    pinch0 = 0;
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    orbit.tRadius = Math.min(view === "chart" ? 80 : 32, Math.max(10, orbit.tRadius * (1 + Math.sign(e.deltaY) * 0.08)));
    lastInteract = performance.now();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);
  canvas.addEventListener("pointerleave", () => {
    if (!pointers.size) canvas.style.cursor = "grab";
  });
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.style.cursor = "grab";

  // ───────── vòng lặp ─────────
  const tmp = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const timer = new THREE.Timer();
  let active = true;
  let raf = 0;
  let duskT = state.dusk ? 1 : 0;
  const anchorIds = [...anchors.keys()];
  const projected: Projected[] = anchorIds.map((id) => ({ id, x: 0, y: 0, depth: 0, behind: false }));

  function frame(now: number) {
    raf = 0;
    if (!active) return;
    timer.update(now);
    const dt = Math.min(timer.getDelta(), 0.05),
      t = timer.getElapsed();
    const motion = reduceMotion ? 0.3 : 1;

    // Camera: tự lắc nhẹ khi rảnh tay
    const idle = performance.now() - lastInteract > 4000 && !reduceMotion;
    const sway = idle ? Math.sin(t * 0.18) * 0.05 : 0;
    orbit.theta += (orbit.tTheta + sway - orbit.theta) * Math.min(1, dt * 5);
    orbit.phi += (orbit.tPhi - orbit.phi) * Math.min(1, dt * 5);
    orbit.radius += (orbit.tRadius - orbit.radius) * Math.min(1, dt * 4);
    center.lerp(tCenter, Math.min(1, dt * 3));
    const aspect = w / h;
    const tall = aspect < 1.4;
    // Màn dọc (điện thoại): lùi máy quay cho đảo vừa khít bề ngang, nhìn từ trên cao hơn một chút.
    const portrait = aspect < 1;
    let k = tall ? 0.84 : 1;
    if (portrait) k = 7.4 / (1.06 * Math.tan((camera.fov * PI) / 360) * aspect) / HOME.radius;
    const R = orbit.radius * k * (portrait && view === "chart" ? 1.4 : 1);
    const ph = orbit.phi - (portrait ? 0.14 : 0);
    camera.position.set(center.x + Math.sin(orbit.theta) * Math.sin(ph) * R, Math.cos(ph) * R + 0.5, center.z + Math.cos(orbit.theta) * Math.sin(ph) * R);
    camera.lookAt(center.x, view === "chart" ? -1.5 : portrait ? -0.9 : tall ? -0.1 : view === "home" ? -0.75 : -0.4, center.z + 0.4);
    sun.target.position.copy(center);

    duskT += ((state.dusk ? 1 : 0) - duskT) * Math.min(1, dt * 2);
    sun.color.copy(SUN_DAY).lerp(SUN_DUSK, duskT);
    sun.intensity = (1.15 - duskT * 0.45) * PI;
    sun.position.set(center.x + 8 - duskT * 14, 14 - duskT * 8, center.z + 7);
    // Đảo Luyện
    isleFlag.rotation.y = Math.sin(t * 2.2) * 0.25 * motion;
    isleFlag.position.x = 0.33 * Math.cos(isleFlag.rotation.y);
    if (lampMat) lampMat.emissiveIntensity = 0.35 + duskT * 1.3;
    if (lampBeam) {
      (lampBeam.parent as THREE.Object3D).rotation.y = t * 0.8 * motion;
      (lampBeam.material as THREE.MeshBasicMaterial).opacity = isleSpots.get("listen")!.built.visible ? 0.05 + duskT * 0.22 : 0;
    }
    if (fireMat && flame) {
      fireMat.emissiveIntensity = 0.9 + Math.sin(t * 13) * 0.25 + duskT * 0.6;
      flame.scale.set(1, 0.85 + Math.abs(Math.sin(t * 7)) * 0.3 * motion, 1);
    }
    if (micGlow) micGlow.emissiveIntensity = 0.15 + duskT * 0.8;
    torchMats.forEach((m, i) => (m.emissiveIntensity = state.bossLit ? 1.0 + Math.sin(t * 11 + i * 2) * 0.3 + duskT * 0.6 : 0));
    if (ferry.visible) {
      const u = (1 - Math.cos(t * 0.22 * motion)) / 2;
      ferry.position.lerpVectors(FERRY_A, FERRY_B, u);
      ferry.position.y = -1.62 + Math.sin(t * 2) * 0.03;
      const goingOut = Math.sin(t * 0.22 * motion) >= 0;
      ferry.rotation.y = Math.atan2(FERRY_B.x - FERRY_A.x, FERRY_B.z - FERRY_A.z) + (goingOut ? -PI / 2 : PI / 2);
      ferry.rotation.z = Math.sin(t * 1.4) * 0.03;
    }
    cityWin.emissiveIntensity = duskT * 0.8;
    cityWin.color.set("#BFE3F0").lerp(new THREE.Color("#FFE7A8"), duskT);
    cityWin.emissive.copy(cityWin.color);
    cityLights.forEach((m, i) => (m.emissiveIntensity = state.city ? 0.4 + (Math.sin(t * 5 + i) > 0 ? 0.7 : 0.1) + duskT * 0.4 : 0.05));
    if (blimp.visible) {
      blimp.position.set(Math.cos(t * 0.15) * 2.4, 5.2 + Math.sin(t * 0.8) * 0.2 * motion, Math.sin(t * 0.15) * 2.4);
      blimp.rotation.y = -t * 0.15 + PI / 2;
    }
    festGlow.forEach((m, i) => (m.emissiveIntensity = 0.45 + Math.sin(t * 2.4 + i * 0.9) * 0.25 + duskT * 0.6));
    harborWin.emissiveIntensity = duskT * 0.8;
    harborWin.color.set("#BFE3F0").lerp(new THREE.Color("#FFE7A8"), duskT);
    harborWin.emissive.copy(harborWin.color);
    for (let i = 0; i < palms.length; i++) palms[i].rotation.z = Math.sin(t * 1.3 + i) * 0.06 * motion;
    arcadeMats.forEach((m, i) => (m.emissiveIntensity = state.beach?.open ? 0.35 + (Math.sin(t * 4 + i * 1.6) > 0 ? 0.6 : 0.1) + duskT * 0.5 : 0.1));
    if (skiff) {
      skiff.position.y = -0.08 + Math.sin(t * 1.6) * 0.04 * motion;
      skiff.rotation.z = Math.sin(t * 1.2) * 0.06 * motion;
    }
    hemi.color.copy(SKY_DAY).lerp(SKY_DUSK, duskT);
    hemi.intensity = (0.55 - duskT * 0.2) * PI;
    (beacon.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + (Math.sin(t * 4) > 0 ? 0.8 : 0) + duskT;
    cafeWin.emissiveIntensity = duskT * 0.9;
    cafeWin.color.set("#BFE3F0").lerp(new THREE.Color("#FFD27A"), duskT);
    cafeWin.emissive.copy(cafeWin.color);
    officeWin.emissiveIntensity = duskT * 0.8;
    officeWin.color.set("#BFE3F0").lerp(new THREE.Color("#FFE7A8"), duskT);
    officeWin.emissive.copy(officeWin.color);
    lanternMats.forEach((m, i) => (m.emissiveIntensity = 0.15 + duskT * (1.1 + Math.sin(t * 3 + i) * 0.15)));

    for (const ch of chars) {
      const bob = Math.sin(t * 2.4 + ch.ph);
      let jump = 0;
      if (ch.hop > 0) {
        ch.hop = Math.max(0, ch.hop - dt * 0.9);
        jump = Math.abs(Math.sin((1 - ch.hop) * PI * 2)) * 0.55 * ch.hop;
      }
      const lift = ch.float ? ch.float + Math.sin(t * 1.6 + ch.ph) * 0.18 * motion : 0;
      ch.inner.position.y = Math.max(0, bob) * 0.05 * motion + jump + lift;
      const sq = 1 + bob * 0.025 * motion;
      ch.inner.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      ch.head.rotation.z = Math.sin(t * 1.3 + ch.ph) * 0.08 * motion;
      const wave = ch.id === "bo" || ch.id === state.quest;
      ch.armPivot.rotation.z = wave ? 2.2 + Math.sin(t * 9) * 0.35 * motion : 0.1 + Math.sin(t * 2 + ch.ph) * 0.05;
      ch.blinkAt -= dt;
      const blink = ch.blinkAt < 0 ? 0.12 : 1;
      if (ch.blinkAt < -0.12) ch.blinkAt = 2.5 + Math.random() * 3;
      ch.eyes.scale.y = blink;
      if (ch.eyes.userData.pivotY) ch.eyes.position.y = ch.eyes.userData.pivotY * (1 - blink);
      ch.ears.forEach((e, i) => {
        if (ch.id === "dragon") e.rotation.z = (i ? 1 : -1) * (0.5 + Math.sin(t * 8) * 0.35 * motion);
        else e.rotation.z = (i ? -1 : 1) * 0.12 + Math.sin(t * 2 + i) * 0.1 * motion;
      });
      const target = Math.atan2(camera.position.x - ch.root.position.x, camera.position.z - ch.root.position.z);
      let d = target - ch.root.rotation.y;
      while (d > PI) d -= PI * 2;
      while (d < -PI) d += PI * 2;
      ch.root.rotation.y += d * Math.min(1, dt * 3);
    }

    crown.rotation.z = Math.sin(t * 0.8) * 0.03 * motion;
    for (const tr of trees) tr.g.rotation.z = Math.sin(t * 1.1 + tr.ph) * 0.03 * motion;
    for (const s of steam) {
      const p = (t * 0.35 + s.o) % 1;
      s.m.position.set(0.55 + Math.sin(p * 6) * 0.08, 2.45 + p * 1.0, -0.25);
      s.m.scale.setScalar(0.08 + p * 0.16);
      (s.m.material as THREE.MeshStandardMaterial).opacity = 0.85 * (1 - p);
    }
    for (const p of petals) {
      const fall = (t * p.sp + p.off) % 3.2;
      p.m.position.set(p.x0 + Math.sin(t + p.off) * 0.4 + fall * 0.3, Math.max(0.03, p.y0 - fall), p.z0 + Math.cos(t * 0.7 + p.off) * 0.3);
      p.m.rotation.set(t * p.sw + p.off, t * 1.3, 0);
    }
    // Mây chỉ hiện ở phía sau đảo (không che tầm nhìn).
    const camA = Math.atan2(camera.position.z, camera.position.x);
    for (const c of clouds) {
      c.a += dt * c.s * motion;
      c.g.position.set(Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r);
      const facing = Math.cos(c.a - camA); // 1 = cùng phía camera
      c.m.opacity = Math.max(0, Math.min(0.95, (0.15 - facing) * 2.2));
      c.g.visible = c.m.opacity > 0.02 && view !== "chart";
    }
    const pa = t * 0.45 * motion;
    plane.position.set(3.0 + Math.cos(pa) * 4.5, 5 + Math.sin(t * 1.5) * 0.2, -4.3 + Math.sin(pa) * 4.5);
    plane.rotation.set(0, -pa, -0.25);
    foam.forEach((f, i) => {
      const k = (t * 0.12 + i * 0.5) % 1;
      const s = 1 + k * 0.25;
      f.scale.set(s, s, 1);
      (f.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - k);
    });
    jet.position.y = 0.55 + Math.abs(Math.sin(t * 3)) * 0.12;
    if (windBlades) windBlades.rotation.z += dt * 1.2 * motion;
    if (balloonG) {
      balloonG.position.y = 4.0 + Math.sin(t * 0.7) * 0.3 * motion;
      balloonG.position.x = -4.6 + Math.sin(t * 0.15) * 0.8 * motion;
    }
    if (boatG) {
      boatG.position.x = -3.2 + Math.cos(t * 0.3) * 0.55 * motion;
      boatG.position.z = 2.7 + Math.sin(t * 0.3) * 0.55 * motion;
      boatG.rotation.y = -t * 0.3 * motion;
      boatG.rotation.z = Math.sin(t * 2) * 0.05;
    }
    for (const k of kidMeshes) {
      k.a += dt * k.sp * motion;
      const x = Math.max(-FW / 2 + 0.2, Math.min(FW / 2 - 0.2, k.cx + Math.cos(k.a) * (k.r + 0.2)));
      const z = Math.max(-FD / 2 + 0.2, Math.min(FD / 2 - 0.2, k.cz + Math.sin(k.a) * k.r));
      k.g.position.set(x, 0.1 + Math.abs(Math.sin(t * 3 + k.a)) * 0.03, z);
      k.g.rotation.y = -k.a;
      if (k.ready) k.g.children.forEach((c) => c.userData.star && (c.position.y = 0.25 + Math.sin(t * 4) * 0.05));
    }

    renderer.render(scene, camera);

    // Toạ độ màn hình của các nhãn
    camera.getWorldDirection(camDir);
    for (let i = 0; i < anchorIds.length; i++) {
      const a = anchors.get(anchorIds[i])!;
      a.obj.getWorldPosition(tmp);
      tmp.y += a.y;
      const dist = tmp.distanceTo(camera.position);
      tmp.project(camera);
      const p = projected[i];
      p.x = (tmp.x * 0.5 + 0.5) * w;
      p.y = (-tmp.y * 0.5 + 0.5) * h;
      p.depth = dist;
      p.behind = tmp.z > 1;
    }
    opts.onFrame(projected, w, h);
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!raf && active) raf = requestAnimationFrame(frame);
  }

  return {
    setState: apply,
    resize(nw, nh) {
      w = Math.max(1, nw);
      h = Math.max(1, nh);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 1.2 ? 44 : 34;
      camera.updateProjectionMatrix();
      if (!raf) {
        renderer.render(scene, camera);
      }
    },
    setActive(on) {
      active = on;
      if (on) {
        timer.reset();
        start();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    resetView() {
      orbit.tTheta = HOME.theta + Math.round((orbit.theta - HOME.theta) / (PI * 2)) * PI * 2;
      orbit.tPhi = HOME.phi;
      orbit.tPhi = VIEWS[view].phi;
      orbit.tRadius = VIEWS[view].r;
      lastInteract = performance.now();
    },
    setView(v) {
      if (v !== view) goView(v);
    },
    focus(id) {
      const a = anchors.get(id);
      if (!a) return;
      const v: WorldView = id.startsWith("isle:") ? "isle" : id.startsWith("beach:") ? "beach" : id.startsWith("harbor:") || id === "npc:otto" ? "harbor" : id.startsWith("city:") ? "city" : id.startsWith("fest:") ? "fest" : id.startsWith("mine:") ? "mine" : "home";
      if (v !== view) goView(v);
      a.obj.getWorldPosition(tmp);
      tmp.sub(tCenter);
      let tt = Math.atan2(tmp.x, tmp.z);
      let d = tt - orbit.theta;
      while (d > PI) {
        tt -= PI * 2;
        d -= PI * 2;
      }
      while (d < -PI) {
        tt += PI * 2;
        d += PI * 2;
      }
      orbit.tTheta = tt;
      orbit.tRadius = Math.min(orbit.tRadius, view === "home" ? 20 : 13);
      lastInteract = performance.now();
    },
    hop(id) {
      const ch = chars.find((c) => `npc:${c.id}` === id || `animal:${c.id}` === id);
      if (ch) ch.hop = 1;
    },
    dispose() {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("wheel", onWheel);
      kidsG.clear();
      disposables.forEach((d) => d.dispose());
      matCache.forEach((m) => m.dispose());
      renderer.dispose();
    },
  };
}
