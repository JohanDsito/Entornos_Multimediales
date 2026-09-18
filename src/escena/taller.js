/**
 * TALLER DE REPARACION ABANDONADO
 * -------------------------------------------------------------
 * Construye el entorno que rodea al robot: la sala, la plataforma
 * de reparacion, el banco de trabajo, la estanteria, los barriles,
 * las cajas, las lamparas industriales, las tuberias, el ventilador
 * de techo, los monitores de diagnostico y el polvo en suspension.
 *
 * Expone { grupo, update(t, dt, energia) } para que el bucle
 * principal anime los elementos del ambiente.
 */
import * as THREE from 'three';

/* ================================================================== */
/* 1. Texturas procedurales (generadas en canvas, sin archivos)        */
/* ================================================================== */
function texturaRuido(colorBase, contraste = 26, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  const c = new THREE.Color(colorBase);

  for (let i = 0; i < img.data.length; i += 4) {
    const px = (i / 4) % size;
    const py = Math.floor(i / 4 / size);
    // Grano fino + manchas suaves de humedad y desgaste
    const mancha = Math.sin(px * 0.05) * Math.cos(py * 0.043) * 10;
    const n = (Math.random() - 0.5) * contraste + mancha;
    img.data[i] = THREE.MathUtils.clamp(c.r * 255 + n, 0, 255);
    img.data[i + 1] = THREE.MathUtils.clamp(c.g * 255 + n, 0, 255);
    img.data[i + 2] = THREE.MathUtils.clamp(c.b * 255 + n, 0, 255);
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const texConcreto = texturaRuido('#2b2825', 30);
texConcreto.repeat.set(14, 14);
const texPared = texturaRuido('#24211d', 22);
texPared.repeat.set(7, 3);

/* ================================================================== */
/* 2. Materiales compartidos del taller                                */
/* ================================================================== */
export const MAT = {
  concreto: new THREE.MeshStandardMaterial({
    map: texConcreto, color: 0xa8a49e, roughness: 0.94, metalness: 0.06,
  }),
  pared: new THREE.MeshStandardMaterial({
    map: texPared, color: 0x98948e, roughness: 0.9, metalness: 0.08,
    side: THREE.BackSide,
  }),
  metalOscuro: new THREE.MeshStandardMaterial({ color: 0x35393f, roughness: 0.55, metalness: 0.85 }),
  metalSucio: new THREE.MeshStandardMaterial({ color: 0x4c4f55, roughness: 0.72, metalness: 0.68 }),
  oxido: new THREE.MeshStandardMaterial({ color: 0x6b3b22, roughness: 0.95, metalness: 0.28 }),
  madera: new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.92, metalness: 0.02 }),
  goma: new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.98, metalness: 0.0 }),
};

/** Crea una malla con las sombras ya configuradas. */
function malla(geo, mat, x = 0, y = 0, z = 0, { recibe = true, proyecta = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = proyecta;
  m.receiveShadow = recibe;
  return m;
}

/* ================================================================== */
/* 3. Construccion del taller                                          */
/* ================================================================== */
export function crearTaller() {
  const grupo = new THREE.Group();
  grupo.name = 'taller';

  /* ---- 3.1 Suelo ------------------------------------------------- */
  const suelo = malla(new THREE.PlaneGeometry(70, 70), MAT.concreto, 0, 0, 0, { proyecta: false });
  suelo.rotation.x = -Math.PI / 2;
  grupo.add(suelo);

  /* ---- 3.2 Sala: caja invertida que hace de paredes y techo ------- */
  const sala = new THREE.Mesh(new THREE.BoxGeometry(44, 18, 44), MAT.pared);
  sala.position.y = 9;
  sala.receiveShadow = true;
  grupo.add(sala);

  // Costillas verticales de refuerzo en las paredes
  const geoCostilla = new THREE.BoxGeometry(0.5, 16, 0.6);
  for (let i = -4; i <= 4; i++) {
    if (i === 0) continue;
    grupo.add(malla(geoCostilla, MAT.metalSucio, i * 4.6, 8, -21.4));
    const lateral = malla(geoCostilla, MAT.metalSucio, -21.4, 8, i * 4.6);
    lateral.rotation.y = Math.PI / 2;
    grupo.add(lateral);
  }

  // Porton metalico del fondo
  grupo.add(malla(new THREE.BoxGeometry(9, 9, 0.5), MAT.oxido, 0, 4.5, -21.2));
  for (let i = 0; i < 5; i++) {
    grupo.add(malla(new THREE.BoxGeometry(8.6, 0.3, 0.7), MAT.metalOscuro, 0, 1 + i * 1.8, -21.1));
  }

  /* ---- 3.3 Plataforma / camilla de reparacion inclinada ----------- */
  grupo.add(malla(new THREE.BoxGeometry(9.5, 1.1, 5.4), MAT.metalOscuro, 0, 0.55, 0));

  // Pistones hidraulicos que sostienen la camilla
  const geoPiston = new THREE.CylinderGeometry(0.28, 0.32, 2.6, 16);
  [-3.1, 3.1].forEach((x) => {
    const p = malla(geoPiston, MAT.metalSucio, x, 2.2, -0.6);
    p.rotation.x = -0.35;
    grupo.add(p);
  });

  // La camilla comparte inclinacion con el robot que reposa sobre ella
  const camilla = new THREE.Group();
  camilla.position.set(0, 2.4, 0.2);
  camilla.rotation.x = -Math.PI / 4;
  camilla.add(malla(new THREE.BoxGeometry(7.8, 13.5, 0.55), MAT.metalSucio, 0, 4.4, -0.35));
  [-3.9, 3.9].forEach((x) => camilla.add(malla(new THREE.BoxGeometry(0.45, 13.5, 1.1), MAT.metalOscuro, x, 4.4, 0.2)));
  // Abrazaderas que sujetan al robot contra la camilla
  [2.2, 6.4].forEach((y) => camilla.add(malla(new THREE.BoxGeometry(8.6, 0.34, 1.1), MAT.metalOscuro, 0, y, 0.5)));
  grupo.add(camilla);

  /* ---- 3.4 Banco de trabajo con herramientas ---------------------- */
  const banco = new THREE.Group();
  banco.position.set(-13, 0, 4);
  banco.rotation.y = Math.PI / 2.4;
  banco.add(malla(new THREE.BoxGeometry(8, 0.25, 2.6), MAT.madera, 0, 2.2, 0));
  [-3.6, 3.6].forEach((x) => {
    banco.add(malla(new THREE.BoxGeometry(0.28, 2.2, 0.28), MAT.metalOscuro, x, 1.1, 1));
    banco.add(malla(new THREE.BoxGeometry(0.28, 2.2, 0.28), MAT.metalOscuro, x, 1.1, -1));
  });
  banco.add(malla(new THREE.BoxGeometry(7.6, 0.2, 2.2), MAT.metalSucio, 0, 0.7, 0));

  // Herramientas sueltas sobre el banco
  const llave = malla(new THREE.BoxGeometry(1.5, 0.12, 0.26), MAT.metalSucio, -1.8, 2.39, 0.3);
  llave.rotation.y = 0.5;
  banco.add(llave);
  const barra = malla(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 10), MAT.metalOscuro, 0.4, 2.4, -0.4);
  barra.rotation.z = Math.PI / 2;
  banco.add(barra);
  banco.add(malla(new THREE.BoxGeometry(1.6, 0.7, 1), MAT.oxido, 2.4, 2.66, 0.2));
  const aro = malla(new THREE.TorusGeometry(0.35, 0.09, 8, 20), MAT.metalSucio, -3, 2.45, -0.5);
  aro.rotation.x = Math.PI / 2;
  banco.add(aro);
  grupo.add(banco);

  /* ---- 3.5 Estanteria con cajas ----------------------------------- */
  const estante = new THREE.Group();
  estante.position.set(13.5, 0, -6);
  estante.rotation.y = -Math.PI / 3;
  for (let n = 0; n < 4; n++) {
    estante.add(malla(new THREE.BoxGeometry(7, 0.16, 2.2), MAT.metalSucio, 0, 1 + n * 1.7, 0));
  }
  [-3.4, 3.4].forEach((x) => {
    [-1, 1].forEach((z) => estante.add(malla(new THREE.BoxGeometry(0.2, 6.3, 0.2), MAT.metalOscuro, x, 3.15, z)));
  });
  const coloresCaja = [0x5a4630, 0x4a4438, 0x63503a, 0x3f4a44];
  for (let n = 0; n < 7; n++) {
    const mat = new THREE.MeshStandardMaterial({
      color: coloresCaja[n % coloresCaja.length], roughness: 0.95, metalness: 0.05,
    });
    const ancho = 0.9 + Math.random() * 0.7;
    const alto = 0.7 + Math.random() * 0.5;
    const c = malla(new THREE.BoxGeometry(ancho, alto, 1.3), mat,
      -2.6 + (n % 4) * 1.7, 1.08 + Math.floor(n / 4) * 1.7 + alto / 2 - 0.4,
      (Math.random() - 0.5) * 0.4);
    c.rotation.y = (Math.random() - 0.5) * 0.3;
    estante.add(c);
  }
  grupo.add(estante);

  /* ---- 3.6 Barriles ----------------------------------------------- */
  const geoBarril = new THREE.CylinderGeometry(0.85, 0.85, 2.4, 20);
  const geoAro = new THREE.TorusGeometry(0.87, 0.07, 8, 22);
  [[-9, -9], [-7.3, -9.6], [11, 7], [13.2, 6.2]].forEach(([x, z], i) => {
    grupo.add(malla(geoBarril, i % 2 ? MAT.oxido : MAT.metalSucio, x, 1.2, z));
    [-0.7, 0.7].forEach((y) => {
      const a = malla(geoAro, MAT.metalOscuro, x, 1.2 + y, z);
      a.rotation.x = Math.PI / 2;
      grupo.add(a);
    });
  });

  /* ---- 3.7 Cajas apiladas ----------------------------------------- */
  [[-6.5, 9, 1.4, 0.4], [-5.4, 8.2, 1.1, -0.2], [-6.2, 8.6, 1.0, 0.8]].forEach(([x, z, s, rot], i) => {
    const c = malla(new THREE.BoxGeometry(s * 1.6, s * 1.4, s * 1.5), MAT.madera, x, (s * 1.4) / 2 + i * 0.02, z);
    c.rotation.y = rot;
    grupo.add(c);
  });

  /* ---- 3.8 Carrito de herramientas -------------------------------- */
  const carrito = new THREE.Group();
  carrito.position.set(5.5, 0, 5.2);
  carrito.rotation.y = -0.6;
  carrito.add(malla(new THREE.BoxGeometry(2.4, 2, 1.4), MAT.oxido, 0, 1.3, 0));
  for (let n = 0; n < 3; n++) {
    carrito.add(malla(new THREE.BoxGeometry(2.2, 0.1, 0.12), MAT.metalOscuro, 0, 0.7 + n * 0.6, 0.72));
  }
  const geoRueda = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 12);
  [[-0.9, 0.5], [0.9, 0.5], [-0.9, -0.5], [0.9, -0.5]].forEach(([x, z]) => {
    const r = malla(geoRueda, MAT.goma, x, 0.22, z);
    r.rotation.z = Math.PI / 2;
    carrito.add(r);
  });
  grupo.add(carrito);

  /* ---- 3.9 Tuberias del techo ------------------------------------- */
  [-8, -5.5, 6.5].forEach((x, i) => {
    const radio = i === 2 ? 0.45 : 0.3;
    const t = malla(new THREE.CylinderGeometry(radio, radio, 42, 14),
      i % 2 ? MAT.oxido : MAT.metalSucio, x, 14.6 - i * 0.5, 0);
    t.rotation.x = Math.PI / 2;
    grupo.add(t);
  });

  /* ---- 3.10 Lamparas industriales colgantes ------------------------ */
  const lamparas = [];
  const crearLampara = (x, z, colorLuz, intensidad) => {
    const l = new THREE.Group();
    l.position.set(x, 15.4, z);
    l.add(malla(new THREE.CylinderGeometry(0.035, 0.035, 3.2, 6), MAT.metalOscuro, 0, -1.6, 0, { proyecta: false }));

    const matPantalla = new THREE.MeshStandardMaterial({
      color: 0x55524d, roughness: 0.6, metalness: 0.8, side: THREE.DoubleSide,
    });
    l.add(malla(new THREE.ConeGeometry(1.15, 1.1, 20, 1, true), matPantalla, 0, -3.6, 0));

    const bombilla = malla(new THREE.SphereGeometry(0.28, 14, 12), new THREE.MeshStandardMaterial({
      color: 0x120d06, emissive: new THREE.Color(colorLuz), emissiveIntensity: 1.6, roughness: 0.4,
    }), 0, -4.05, 0, { proyecta: false });
    l.add(bombilla);

    const luz = new THREE.PointLight(colorLuz, intensidad, 46, 2);
    luz.position.set(0, -4.1, 0);
    luz.castShadow = true;
    luz.shadow.mapSize.set(1024, 1024);
    luz.shadow.bias = -0.002;
    l.add(luz);

    grupo.add(l);
    lamparas.push({ grupo: l, luz, bombilla, fase: Math.random() * Math.PI * 2, base: intensidad });
  };
  crearLampara(-6.5, 3.5, 0xffb060, 210);
  crearLampara(7.5, -4.5, 0xffa348, 145);

  /* ---- 3.10b Foco de trabajo articulado sobre la camilla ------------ */
  // Alguien dejo esta lampara apuntando al pecho abierto del robot.
  const PIE_FOCO = new THREE.Vector3(-5.6, 0, 5.4);   // base en el suelo
  const CABEZA_FOCO = new THREE.Vector3(-4.6, 11.4, 3.6); // cabezal en alto
  const DIANA_FOCO = new THREE.Vector3(0, 9.6, -4.9);  // el nucleo del robot

  /** Coloca un cilindro que va exactamente del punto A al punto B. */
  function barraEntre(a, b, radio, mat) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const barra = malla(new THREE.CylinderGeometry(radio, radio, dir.length(), 12), mat);
    barra.position.copy(a).addScaledVector(dir, 0.5);
    // El cilindro nace alineado con +Y: lo giramos hacia la direccion A->B
    barra.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return barra;
  }

  const codoFoco = new THREE.Vector3(PIE_FOCO.x, CABEZA_FOCO.y - 0.6, PIE_FOCO.z);
  grupo.add(malla(new THREE.CylinderGeometry(0.75, 0.95, 0.24, 18), MAT.metalOscuro, PIE_FOCO.x, 0.12, PIE_FOCO.z));
  grupo.add(barraEntre(PIE_FOCO, codoFoco, 0.14, MAT.metalSucio));
  grupo.add(barraEntre(codoFoco, CABEZA_FOCO, 0.11, MAT.metalSucio));

  // Cabezal: el cono se monta mirando a +Z para poder orientarlo con lookAt
  const cabezaFoco = new THREE.Group();
  cabezaFoco.position.copy(CABEZA_FOCO);
  const pantallaFoco = malla(new THREE.CylinderGeometry(0.95, 0.6, 1.25, 20, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x6a6660, roughness: 0.5, metalness: 0.85, side: THREE.DoubleSide }));
  pantallaFoco.rotation.x = -Math.PI / 2;
  cabezaFoco.add(pantallaFoco);
  const bombillaFoco = malla(new THREE.SphereGeometry(0.33, 14, 12), new THREE.MeshStandardMaterial({
    color: 0x0f0b05, emissive: 0xfff0d0, emissiveIntensity: 2.2, roughness: 0.4,
  }), 0, 0, 0.2, { proyecta: false });
  cabezaFoco.add(bombillaFoco);
  cabezaFoco.lookAt(DIANA_FOCO); // el cabezal apunta de verdad al pecho
  grupo.add(cabezaFoco);

  // Haz de luz coincidente con el cabezal
  const luzFoco = new THREE.SpotLight(0xffeccd, 1400, 48, Math.PI / 7, 0.5, 2);
  luzFoco.position.copy(CABEZA_FOCO);
  luzFoco.target.position.copy(DIANA_FOCO);
  luzFoco.castShadow = true;
  luzFoco.shadow.mapSize.set(2048, 2048);
  luzFoco.shadow.bias = -0.0022;
  luzFoco.shadow.camera.near = 1;
  luzFoco.shadow.camera.far = 48;
  grupo.add(luzFoco);
  grupo.add(luzFoco.target);

  // Luz de relleno fria a ras de suelo: hace legibles las piezas sueltas
  const relleno = new THREE.PointLight(0x5f86b8, 190, 30, 2);
  relleno.position.set(2.5, 2.2, 9);
  grupo.add(relleno);

  /* ---- 3.11 Ventilador de techo ------------------------------------ */
  const ventilador = new THREE.Group();
  ventilador.position.set(9.5, 14.2, 7);
  ventilador.add(malla(new THREE.CylinderGeometry(0.22, 0.22, 1.4, 10), MAT.metalOscuro, 0, 0.7, 0));
  const aspas = new THREE.Group();
  aspas.add(malla(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), MAT.metalSucio, 0, 0, 0));
  for (let n = 0; n < 4; n++) {
    const angulo = (n / 4) * Math.PI * 2;
    const aspa = malla(new THREE.BoxGeometry(3.4, 0.08, 0.7), MAT.metalSucio,
      Math.cos(angulo) * 1.8, 0, Math.sin(angulo) * 1.8);
    aspa.rotation.y = -angulo;
    aspa.rotation.z = 0.2;
    aspas.add(aspa);
  }
  ventilador.add(aspas);
  grupo.add(ventilador);

  /* ---- 3.12 Monitores de diagnostico en la pared -------------------- */
  // Se encienden de forma escalonada cuando el robot recupera energia.
  const monitores = [];
  [[-15.5, 6.5], [-12.6, 6.2], [-15.5, 4], [-12.6, 3.7], [14.5, 6.2], [17.2, 5.9]].forEach(([x, y], i) => {
    grupo.add(malla(new THREE.BoxGeometry(2.4, 1.7, 0.4), MAT.metalOscuro, x, y, -20.6));
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0a0e0c, emissive: 0x24ff9b, emissiveIntensity: 0, roughness: 0.35, metalness: 0.2,
    });
    grupo.add(malla(new THREE.PlaneGeometry(2.05, 1.35), mat, x, y, -20.38, { proyecta: false }));
    monitores.push({ mat, fase: i * 0.9, umbral: 0.15 + i * 0.12 });
  });

  /* ---- 3.13 Tiras de luz de emergencia ------------------------------ */
  const matTira = new THREE.MeshStandardMaterial({
    color: 0x101418, emissive: 0x2ad8ff, emissiveIntensity: 0.15, roughness: 0.4,
  });
  [[-21.3, 0, Math.PI / 2], [21.3, 0, Math.PI / 2], [0, -21.3, 0]].forEach(([x, z, ry]) => {
    const tira = malla(new THREE.BoxGeometry(30, 0.22, 0.14), matTira, x, 9, z, { proyecta: false });
    tira.rotation.y = ry;
    grupo.add(tira);
  });

  /* ---- 3.14 Polvo en suspension ------------------------------------- */
  const TOTAL_POLVO = 900;
  const posiciones = new Float32Array(TOTAL_POLVO * 3);
  const velocidades = new Float32Array(TOTAL_POLVO);
  for (let i = 0; i < TOTAL_POLVO; i++) {
    posiciones[i * 3] = (Math.random() - 0.5) * 36;
    posiciones[i * 3 + 1] = Math.random() * 15;
    posiciones[i * 3 + 2] = (Math.random() - 0.5) * 36;
    velocidades[i] = 0.06 + Math.random() * 0.22;
  }
  const geoPolvo = new THREE.BufferGeometry();
  geoPolvo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
  grupo.add(new THREE.Points(geoPolvo, new THREE.PointsMaterial({
    color: 0xd8c3a0, size: 0.045, transparent: true, opacity: 0.3,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  })));

  /* ================================================================ */
  /* 4. Animacion del entorno                                          */
  /* ================================================================ */
  function update(t, dt, energia) {
    // Lamparas: oscilacion lenta + parpadeo electrico irregular
    lamparas.forEach((l) => {
      l.grupo.rotation.z = Math.sin(t * 0.55 + l.fase) * 0.055;
      l.grupo.rotation.x = Math.cos(t * 0.41 + l.fase) * 0.04;
      const parpadeo = 0.82 + Math.sin(t * 13 + l.fase) * 0.06 + (Math.random() < 0.012 ? -0.45 : 0);
      l.luz.intensity = l.base * parpadeo * (1 + energia * 0.45);
      l.bombilla.material.emissiveIntensity = 1.4 * parpadeo * (1 + energia * 0.5);
    });

    // Foco de trabajo: filamento inestable, se estabiliza con la energia
    const fluct = 0.86 + Math.sin(t * 8.3) * 0.05 + (Math.random() < 0.008 ? -0.5 : 0);
    luzFoco.intensity = 1400 * fluct * (0.75 + energia * 0.35);
    bombillaFoco.material.emissiveIntensity = 2.1 * fluct;

    // Ventilador: casi detenido sin energia, acelera cuando el robot despierta
    aspas.rotation.y += dt * (0.25 + energia * 3.2);

    // Monitores de diagnostico
    monitores.forEach((m) => {
      const activo = THREE.MathUtils.clamp((energia - m.umbral) / 0.25, 0, 1);
      m.mat.emissiveIntensity = activo * (0.55 + Math.sin(t * 7 + m.fase) * 0.3 + Math.random() * 0.12);
    });

    // Tiras de emergencia: pulso respiratorio
    matTira.emissiveIntensity = 0.12 + energia * 0.5 + Math.sin(t * 1.6) * 0.06;

    // Polvo: deriva ascendente con reinicio ciclico
    const arr = geoPolvo.attributes.position.array;
    for (let i = 0; i < TOTAL_POLVO; i++) {
      const idx = i * 3;
      arr[idx + 1] += velocidades[i] * dt * (1 + energia * 0.8);
      arr[idx] += Math.sin(t * 0.3 + i) * dt * 0.09;
      if (arr[idx + 1] > 15) {
        arr[idx + 1] = 0;
        arr[idx] = (Math.random() - 0.5) * 36;
        arr[idx + 2] = (Math.random() - 0.5) * 36;
      }
    }
    geoPolvo.attributes.position.needsUpdate = true;
  }

  return { grupo, update };
}
