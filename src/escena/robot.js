/**
 * ROBOT HUMANOIDE DESMANTELADO
 * -------------------------------------------------------------
 * Un androide gigante apagado sobre la camilla de reparacion:
 *   - pecho abierto con las compuertas retiradas
 *   - cables expuestos que cuelgan del torso
 *   - brazo derecho separado, en el suelo
 *   - pierna derecha parcialmente desmontada
 *   - paneles metalicos retirados apoyados por el taller
 *   - NUCLEO DE PROCESAMIENTO en el torso: es la pantalla donde
 *     se reproduce el video, la memoria del robot.
 *
 * El parametro `energia` (0 -> 1) recorre toda la animacion: al
 * pulsar PLAY el robot revive progresivamente.
 */
import * as THREE from 'three';
import { MAT } from './taller.js';

/* Inclinacion de la camilla: taller.js replica estos mismos valores
   al construir la camilla, para que robot y soporte encajen. */
export const POSE_CAMILLA = { y: 2.4, z: 0.2, rotX: -Math.PI / 4 };

/* Materiales propios del androide */
const M = {
  chasis: new THREE.MeshStandardMaterial({ color: 0x8b949e, roughness: 0.52, metalness: 0.7 }),
  chasisOscuro: new THREE.MeshStandardMaterial({ color: 0x3c4249, roughness: 0.5, metalness: 0.9 }),
  interior: new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: 0.85, metalness: 0.4 }),
  // Hueco del pecho: BackSide descarta la cara frontal, que si no taparia
  // por completo la pantalla del nucleo.
  cavidad: new THREE.MeshStandardMaterial({
    color: 0x161a1f, roughness: 0.88, metalness: 0.35, side: THREE.BackSide,
  }),
  articulacion: new THREE.MeshStandardMaterial({ color: 0x232830, roughness: 0.35, metalness: 0.95 }),
  piston: new THREE.MeshStandardMaterial({ color: 0xb9bec4, roughness: 0.25, metalness: 0.9 }),
  quemado: new THREE.MeshStandardMaterial({ color: 0x2a221d, roughness: 0.95, metalness: 0.3 }),
};

function malla(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* Colores de los haces de cables */
const COLORES_CABLE = [0x8a2b2b, 0x1f6fb0, 0xb08a1f, 0x2f8a4a, 0x6a3f8a, 0x1a1a1a];

/**
 * @param {THREE.Texture} texturaVideo textura del video que alimenta el nucleo
 */
export function crearRobot(texturaVideo) {
  const grupo = new THREE.Group();
  grupo.name = 'robot';

  /* ================================================================ */
  /* 1. Pivote: coloca al robot recostado sobre la camilla             */
  /* ================================================================ */
  const pivote = new THREE.Group();
  pivote.position.set(0, POSE_CAMILLA.y, POSE_CAMILLA.z);
  pivote.rotation.x = POSE_CAMILLA.rotX;
  grupo.add(pivote);

  // Cuerpo en coordenadas "de pie": pies en y=0, cabeza cerca de y=12
  const cuerpo = new THREE.Group();
  cuerpo.position.set(0, -1.2, 1.1);
  cuerpo.scale.setScalar(1.14); // unidad de gran tamaño: desborda la camilla
  pivote.add(cuerpo);

  /* ================================================================ */
  /* 2. Piernas                                                        */
  /* ================================================================ */
  const geoMuslo = new THREE.CapsuleGeometry(0.62, 1.9, 6, 14);
  const geoEspinilla = new THREE.CapsuleGeometry(0.5, 1.9, 6, 14);
  const geoRodilla = new THREE.SphereGeometry(0.66, 18, 14);

  // --- Pierna izquierda: completa ---
  const piernaIzq = new THREE.Group();
  piernaIzq.position.set(-1.05, 0, 0);
  piernaIzq.add(malla(geoMuslo, M.chasis, 0, 4.6, 0));
  piernaIzq.add(malla(geoRodilla, M.articulacion, 0, 3.1, 0));
  piernaIzq.add(malla(geoEspinilla, M.chasis, 0, 1.75, 0));
  piernaIzq.add(malla(new THREE.BoxGeometry(1.15, 0.5, 2.1), M.chasisOscuro, 0, 0.3, 0.45));
  cuerpo.add(piernaIzq);

  // --- Pierna derecha: desmontada a la altura de la rodilla ---
  const piernaDer = new THREE.Group();
  piernaDer.position.set(1.05, 0, 0);
  piernaDer.add(malla(geoMuslo, M.chasis, 0, 4.6, 0));
  // Muñon de la rodilla: articulacion desnuda con pistones al aire
  piernaDer.add(malla(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16), M.articulacion, 0, 3.3, 0));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    piernaDer.add(malla(new THREE.CylinderGeometry(0.075, 0.075, 1.1, 8), M.piston,
      Math.cos(a) * 0.3, 2.65, Math.sin(a) * 0.3));
  }
  // Cables sueltos colgando del muñon
  for (let i = 0; i < 3; i++) {
    const c = malla(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: COLORES_CABLE[i], roughness: 0.85 }),
      -0.2 + i * 0.2, 2.45, 0.35);
    c.rotation.x = 0.4 + i * 0.1;
    piernaDer.add(c);
  }
  cuerpo.add(piernaDer);

  /* ================================================================ */
  /* 3. Pelvis y torso con el pecho abierto                            */
  /* ================================================================ */
  cuerpo.add(malla(new THREE.BoxGeometry(3.2, 1.4, 1.9), M.chasisOscuro, 0, 6.3, 0));
  cuerpo.add(malla(new THREE.CylinderGeometry(0.55, 0.55, 2.4, 16), M.articulacion, 0, 7.05, 0).rotateZ(Math.PI / 2));

  const torso = new THREE.Group();
  torso.position.set(0, 8.6, 0);
  cuerpo.add(torso);

  // Caparazon: espalda, costados, tapa superior e inferior. El frente esta abierto.
  torso.add(malla(new THREE.BoxGeometry(3.7, 3.4, 0.35), M.chasis, 0, 0, -0.95));
  [-1.72, 1.72].forEach((x) => torso.add(malla(new THREE.BoxGeometry(0.34, 3.4, 2.1), M.chasis, x, 0, 0)));
  torso.add(malla(new THREE.BoxGeometry(3.7, 0.34, 2.1), M.chasis, 0, -1.7, 0));
  torso.add(malla(new THREE.BoxGeometry(3.4, 0.34, 2.1), M.chasisOscuro, 0, 1.7, 0));
  // Cavidad interior ennegrecida (abierta por delante)
  torso.add(malla(new THREE.BoxGeometry(3.05, 3.05, 1.6), M.cavidad, 0, 0, -0.3));

  // Compuertas del pecho abiertas sobre sus bisagras laterales
  const compuertas = [];
  [-1, 1].forEach((lado) => {
    const bisagra = new THREE.Group();
    bisagra.position.set(lado * 1.7, 0, 0.6);
    const hoja = malla(new THREE.BoxGeometry(1.7, 3.3, 0.22), M.chasis, lado * 0.85, 0, 0);
    bisagra.add(hoja);
    // Refuerzo interior de la compuerta
    bisagra.add(malla(new THREE.BoxGeometry(1.2, 2.6, 0.12), M.chasisOscuro, lado * 0.85, 0, 0.17));
    bisagra.rotation.y = lado * 1.85; // abiertas de par en par
    torso.add(bisagra);
    compuertas.push({ bisagra, lado });
  });

  /* ---- 3.1 NUCLEO DE PROCESAMIENTO: la memoria del robot ---------- */
  const nucleo = new THREE.Group();
  nucleo.position.set(0, 0.15, 0.05);
  torso.add(nucleo);

  // Carcasa del nucleo
  nucleo.add(malla(new THREE.BoxGeometry(3.02, 2.92, 0.5), M.chasisOscuro, 0, 0, -0.35));
  nucleo.add(malla(new THREE.TorusGeometry(1.62, 0.08, 8, 36), M.piston, 0, 0, -0.02));

  // Pantalla del nucleo: aqui se reproduce el video (memoria / conciencia)
  const matPantalla = new THREE.MeshBasicMaterial({
    map: texturaVideo, toneMapped: false, side: THREE.FrontSide,
  });
  matPantalla.color.setScalar(0.12); // apagada hasta que llegue la energia
  // Plano unitario: `ajustarPantalla` lo escala al aspecto real del video,
  // para que la memoria del robot no se vea deformada.
  const pantalla = malla(new THREE.PlaneGeometry(1, 1), matPantalla, 0, 0, 0.12);
  pantalla.scale.set(2.24, 1.26, 1);
  pantalla.castShadow = false;
  nucleo.add(pantalla);

  /** Encaja el video (ancho x alto) dentro del hueco del nucleo. */
  function ajustarPantalla(anchoVideo, altoVideo) {
    if (!anchoVideo || !altoVideo) return;
    const MAX_ANCHO = 2.8;
    const MAX_ALTO = 2.6;
    const aspecto = anchoVideo / altoVideo;
    const ancho = Math.min(MAX_ANCHO, MAX_ALTO * aspecto);
    pantalla.scale.set(ancho, ancho / aspecto, 1);
  }

  // Cupula de cristal protector: deja ver la pantalla, solo la tiñe.
  // (sin `transmission`, que obliga a un pase extra de render y ocultaria el video)
  const cristal = malla(new THREE.SphereGeometry(4.6, 28, 18, 0, Math.PI * 2, 0, Math.PI / 8.5),
    new THREE.MeshPhysicalMaterial({
      color: 0xbfeaff, roughness: 0.85, metalness: 0, transparent: true,
      opacity: 0.045, side: THREE.DoubleSide, depthWrite: false,
    }), 0, 0, -4.25);
  cristal.rotation.x = Math.PI / 2;
  cristal.castShadow = false;
  cristal.renderOrder = 2;
  nucleo.add(cristal);

  // Anillos que orbitan el nucleo en ejes distintos (rotaciones complejas)
  const anillos = [];
  const coloresAnillo = [0x34d8ff, 0x7b5cff, 0x2bffb0];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x0e1418, emissive: coloresAnillo[i], emissiveIntensity: 0.1,
      roughness: 0.3, metalness: 0.7,
    });
    const anillo = malla(new THREE.TorusGeometry(1.62 + i * 0.17, 0.04, 8, 40), mat, 0, 0, 0.02);
    anillo.rotation.set(i * 0.5, i * 0.9, 0);
    anillo.castShadow = false;
    nucleo.add(anillo);
    anillos.push({ anillo, mat, vel: 0.5 + i * 0.35, eje: i });
  }

  // Luz interior del nucleo: ilumina el pecho y el taller al despertar
  const luzNucleo = new THREE.PointLight(0x46d6ff, 0, 30, 2);
  luzNucleo.position.set(0, 0, 0.95);
  luzNucleo.castShadow = true;
  luzNucleo.shadow.mapSize.set(1024, 1024);
  luzNucleo.shadow.bias = -0.003;
  nucleo.add(luzNucleo);

  // Objeto vacio que marca el punto exacto del sonido espacial
  const focoAudio = new THREE.Object3D();
  focoAudio.position.set(0, 0, 0.3);
  nucleo.add(focoAudio);

  /* ---- 3.2 Cables expuestos que salen del pecho ------------------- */
  // Se reconstruyen cada frame para que oscilen como cables reales.
  const cables = [];
  // Salen por los bordes de la cavidad, nunca por delante de la pantalla.
  const defCables = [
    { desde: [-1.48, 1.35, -0.1], hasta: [-2.9, -2.5, 1.3], color: COLORES_CABLE[0], r: 0.075 },
    { desde: [1.48, 1.4, -0.15], hasta: [2.95, -2.1, 1.05], color: COLORES_CABLE[1], r: 0.065 },
    { desde: [-1.5, -1.35, -0.1], hasta: [-2.2, -3.5, 0.9], color: COLORES_CABLE[2], r: 0.06 },
    { desde: [1.5, -1.4, -0.12], hasta: [2.45, -3.6, 1.25], color: COLORES_CABLE[3], r: 0.07 },
    { desde: [-1.42, 1.55, -0.2], hasta: [-2.0, 3.1, 1.0], color: COLORES_CABLE[4], r: 0.055 },
  ];
  defCables.forEach((def, i) => {
    const puntos = [];
    const a = new THREE.Vector3(...def.desde);
    const b = new THREE.Vector3(...def.hasta);
    for (let k = 0; k <= 4; k++) {
      const p = a.clone().lerp(b, k / 4);
      p.z += Math.sin((k / 4) * Math.PI) * 0.45; // panza del cable
      puntos.push(p);
    }
    const curva = new THREE.CatmullRomCurve3(puntos);
    const mat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.88, metalness: 0.1 });
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curva, 22, def.r, 6, false), mat);
    mesh.castShadow = true;
    torso.add(mesh);
    cables.push({ mesh, curva, base: puntos.map((p) => p.clone()), r: def.r, fase: i * 1.3 });
  });

  /* ---- 3.3 Hombro derecho vacio (de donde salio el brazo) --------- */
  const socket = new THREE.Group();
  socket.position.set(2.35, 1.0, 0.1);
  torso.add(socket);
  socket.add(malla(new THREE.CylinderGeometry(0.62, 0.62, 0.3, 18), M.quemado, 0, 0, 0).rotateZ(Math.PI / 2));
  socket.add(malla(new THREE.SphereGeometry(0.5, 14, 12), M.interior, 0.1, 0, 0));
  for (let i = 0; i < 4; i++) {
    const c = malla(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6),
      new THREE.MeshStandardMaterial({ color: COLORES_CABLE[i], roughness: 0.85 }),
      0.3, -0.35 - i * 0.05, -0.2 + i * 0.16);
    c.rotation.z = 1.1;
    socket.add(c);
  }

  /* ================================================================ */
  /* 4. Brazo izquierdo (el unico que sigue conectado)                 */
  /* ================================================================ */
  const hombroIzq = new THREE.Group();
  hombroIzq.position.set(-2.45, 9.6, 0.1);
  cuerpo.add(hombroIzq);
  hombroIzq.add(malla(new THREE.SphereGeometry(0.6, 18, 14), M.articulacion));
  hombroIzq.add(malla(new THREE.CapsuleGeometry(0.42, 1.5, 6, 14), M.chasis, 0, -1.15, 0));

  const codoIzq = new THREE.Group();
  codoIzq.position.set(0, -2.1, 0);
  hombroIzq.add(codoIzq);
  codoIzq.add(malla(new THREE.SphereGeometry(0.44, 16, 12), M.articulacion));
  codoIzq.add(malla(new THREE.CapsuleGeometry(0.34, 1.4, 6, 14), M.chasis, 0, -1.05, 0));

  // Mano con dedos que van a temblar cuando vuelva la energia
  const manoIzq = new THREE.Group();
  manoIzq.position.set(0, -1.95, 0);
  codoIzq.add(manoIzq);
  manoIzq.add(malla(new THREE.BoxGeometry(0.62, 0.55, 0.35), M.chasisOscuro));
  const dedos = [];
  for (let i = 0; i < 4; i++) {
    const dedo = new THREE.Group();
    dedo.position.set(-0.22 + i * 0.15, -0.3, 0);
    dedo.add(malla(new THREE.BoxGeometry(0.11, 0.45, 0.12), M.piston, 0, -0.22, 0));
    manoIzq.add(dedo);
    dedos.push(dedo);
  }
  const pulgar = new THREE.Group();
  pulgar.position.set(0.32, -0.12, 0.05);
  pulgar.add(malla(new THREE.BoxGeometry(0.12, 0.38, 0.12), M.piston, 0, -0.18, 0));
  pulgar.rotation.z = -0.9;
  manoIzq.add(pulgar);
  dedos.push(pulgar);

  // El brazo cuelga inerte hacia un lado
  hombroIzq.rotation.z = 0.42;
  codoIzq.rotation.x = 0.25;

  /* ================================================================ */
  /* 5. Cabeza ladeada                                                 */
  /* ================================================================ */
  const cabeza = new THREE.Group();
  cabeza.position.set(0, 10.75, 0);
  cuerpo.add(cabeza);
  cabeza.add(malla(new THREE.CylinderGeometry(0.42, 0.52, 0.7, 14), M.articulacion, 0, -0.45, 0));
  cabeza.add(malla(new THREE.BoxGeometry(2.05, 1.75, 1.95), M.chasis, 0, 0.65, 0));
  cabeza.add(malla(new THREE.BoxGeometry(1.75, 0.55, 0.3), M.chasisOscuro, 0, 0.68, 0.92));

  // Visor: los ojos del robot
  const matVisor = new THREE.MeshStandardMaterial({
    color: 0x090c0e, emissive: 0x46d6ff, emissiveIntensity: 0, roughness: 0.2, metalness: 0.6,
  });
  const visor = malla(new THREE.BoxGeometry(1.5, 0.32, 0.12), matVisor, 0, 0.68, 1.04);
  visor.castShadow = false;
  cabeza.add(visor);

  // Placa lateral arrancada + antena doblada
  cabeza.add(malla(new THREE.BoxGeometry(0.1, 1.05, 1.05), M.quemado, -1.03, 0.55, -0.1));
  const antena = malla(new THREE.CylinderGeometry(0.05, 0.07, 1.3, 8), M.piston, 0.55, 1.75, -0.3);
  antena.rotation.z = 0.5;
  antena.rotation.x = -0.3;
  cabeza.add(antena);

  // Pose: cabeza caida hacia un lado, como apagada
  cabeza.rotation.set(-0.18, 0.12, 0.26);
  const poseCabeza = cabeza.rotation.clone();

  /* ================================================================ */
  /* 6. Piezas sueltas por el taller (coordenadas del mundo)           */
  /* ================================================================ */

  /* ---- 6.1 Brazo derecho separado, tirado en el suelo ------------- */
  const brazoSuelto = new THREE.Group();
  brazoSuelto.position.set(7.2, 0.55, 3.4);
  brazoSuelto.rotation.set(0, -0.8, Math.PI / 2 - 0.15);
  brazoSuelto.add(malla(new THREE.SphereGeometry(0.6, 18, 14), M.articulacion));
  brazoSuelto.add(malla(new THREE.CapsuleGeometry(0.42, 1.5, 6, 14), M.chasis, 0, -1.15, 0));
  brazoSuelto.add(malla(new THREE.SphereGeometry(0.44, 16, 12), M.articulacion, 0, -2.1, 0));
  const anteSuelto = new THREE.Group();
  anteSuelto.position.set(0, -2.1, 0);
  anteSuelto.rotation.x = 0.55;
  anteSuelto.add(malla(new THREE.CapsuleGeometry(0.34, 1.4, 6, 14), M.chasis, 0, -1.05, 0));
  anteSuelto.add(malla(new THREE.BoxGeometry(0.62, 0.55, 0.35), M.chasisOscuro, 0, -1.95, 0));
  for (let i = 0; i < 4; i++) {
    anteSuelto.add(malla(new THREE.BoxGeometry(0.11, 0.45, 0.12), M.piston, -0.22 + i * 0.15, -2.4, 0));
  }
  brazoSuelto.add(anteSuelto);
  // Cables cortados del hombro
  for (let i = 0; i < 4; i++) {
    const c = malla(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6),
      new THREE.MeshStandardMaterial({ color: COLORES_CABLE[i], roughness: 0.85 }),
      0.1 + i * 0.08, 0.6, -0.2 + i * 0.14);
    c.rotation.z = 0.25 + i * 0.1;
    brazoSuelto.add(c);
  }
  grupo.add(brazoSuelto);

  /* ---- 6.2 Espinilla derecha desmontada, apoyada en la plataforma -- */
  const espinillaSuelta = new THREE.Group();
  espinillaSuelta.position.set(-6.4, 1.5, 2.9);
  espinillaSuelta.rotation.set(0.25, 0.4, 0.9);
  espinillaSuelta.add(malla(geoEspinilla, M.chasis, 0, 0, 0));
  espinillaSuelta.add(malla(new THREE.BoxGeometry(1.15, 0.5, 2.1), M.chasisOscuro, 0, -1.5, 0.45));
  espinillaSuelta.add(malla(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16), M.articulacion, 0, 1.55, 0));
  grupo.add(espinillaSuelta);

  /* ---- 6.3 Paneles metalicos retirados ---------------------------- */
  const panelesRetirados = [
    [-8.4, 1.6, 1.2, 0.2, -0.35, 0.28, 3.2, 2.6],
    [8.9, 1.4, -1.6, -0.15, 0.6, -0.3, 2.8, 2.4],
    [4.6, 0.12, 6.4, -Math.PI / 2 + 0.05, 0.5, 0, 2.6, 2.2],
    [-3.4, 0.12, 7.2, -Math.PI / 2, -0.3, 0, 3.0, 1.9],
  ];
  panelesRetirados.forEach(([x, y, z, rx, ry, rz, w, h]) => {
    const p = malla(new THREE.BoxGeometry(w, h, 0.18), M.chasis, x, y, z);
    p.rotation.set(rx, ry, rz);
    grupo.add(p);
    // Refuerzo interno visible del panel
    const r = malla(new THREE.BoxGeometry(w * 0.7, h * 0.12, 0.1), M.chasisOscuro, x, y, z);
    r.rotation.set(rx, ry, rz);
    r.translateZ(0.13);
    grupo.add(r);
  });

  /* ---- 6.4 Chispas que brotan del pecho al recuperar energia ------- */
  const TOTAL_CHISPAS = 160;
  const posChispas = new Float32Array(TOTAL_CHISPAS * 3);
  const velChispas = new Float32Array(TOTAL_CHISPAS * 3);
  const vidaChispas = new Float32Array(TOTAL_CHISPAS);
  const origenChispas = new THREE.Vector3();
  for (let i = 0; i < TOTAL_CHISPAS; i++) vidaChispas[i] = -1; // apagadas al inicio

  const geoChispas = new THREE.BufferGeometry();
  geoChispas.setAttribute('position', new THREE.BufferAttribute(posChispas, 3));
  const chispas = new THREE.Points(geoChispas, new THREE.PointsMaterial({
    color: 0xffd08a, size: 0.085, transparent: true, opacity: 0.9,
    depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  chispas.frustumCulled = false;
  grupo.add(chispas);

  /* ================================================================ */
  /* 7. Animacion del robot                                            */
  /* ================================================================ */
  const _v = new THREE.Vector3();
  let energiaPrevia = 0;

  function update(t, dt, energia) {
    /* --- Nucleo: la pantalla se enciende con la energia ----------- */
    const latido = 0.88 + Math.sin(t * 2.4) * 0.12 + Math.sin(t * 11) * 0.03;
    matPantalla.color.setScalar(0.1 + energia * 1.02 * latido);
    luzNucleo.intensity = energia * 130 * latido;
    cristal.material.opacity = 0.04 + energia * 0.035;

    // Anillos: rotaciones complejas en tres ejes distintos
    anillos.forEach(({ anillo, mat, vel, eje }) => {
      const v = dt * vel * (0.25 + energia * 3.4);
      if (eje === 0) { anillo.rotation.z += v; anillo.rotation.x += v * 0.4; }
      else if (eje === 1) { anillo.rotation.y += v; anillo.rotation.z -= v * 0.6; }
      else { anillo.rotation.x -= v; anillo.rotation.y += v * 0.5; }
      mat.emissiveIntensity = 0.08 + energia * (1.4 + Math.sin(t * 3 + eje) * 0.4);
    });

    /* --- Cabeza: se endereza y el visor se enciende ---------------- */
    const temblor = energia * Math.sin(t * 26) * 0.012;
    cabeza.rotation.x = poseCabeza.x + energia * 0.2 + temblor;
    cabeza.rotation.z = poseCabeza.z * (1 - energia * 0.8) + temblor;
    matVisor.emissiveIntensity = energia * (2.2 + Math.sin(t * 9) * 0.6)
      * (Math.random() < 0.03 ? 0.2 : 1); // parpadeo de arranque

    /* --- Torso: respiracion mecanica ------------------------------ */
    const respira = 1 + energia * Math.sin(t * 1.9) * 0.012;
    torso.scale.set(respira, 1 + energia * Math.sin(t * 1.9 + 1) * 0.008, respira);

    // Las compuertas del pecho vibran ligeramente
    compuertas.forEach(({ bisagra, lado }, i) => {
      bisagra.rotation.y = lado * (1.85 + energia * Math.sin(t * 3.1 + i) * 0.045);
    });

    /* --- Brazo conectado: espasmos en los dedos ------------------- */
    hombroIzq.rotation.z = 0.42 - energia * 0.08 + Math.sin(t * 1.4) * 0.012;
    codoIzq.rotation.x = 0.25 + energia * Math.sin(t * 2.2) * 0.05;
    dedos.forEach((d, i) => {
      const espasmo = Math.max(0, Math.sin(t * 3.2 + i * 0.7)) ** 3;
      d.rotation.x = -energia * espasmo * 0.55;
    });

    /* --- Cables: oscilan como si tuvieran peso -------------------- */
    cables.forEach((c, ci) => {
      const puntos = c.base.map((p, k) => {
        const amp = (k / (c.base.length - 1)) * (0.09 + energia * 0.16);
        return new THREE.Vector3(
          p.x + Math.sin(t * 1.7 + ci + k * 0.8) * amp,
          p.y + Math.cos(t * 1.3 + ci + k) * amp * 0.5,
          p.z + Math.sin(t * 2.1 + ci * 1.7 + k * 0.6) * amp,
        );
      });
      c.curva.points = puntos;
      c.mesh.geometry.dispose();
      c.mesh.geometry = new THREE.TubeGeometry(c.curva, 22, c.r, 6, false);
    });

    /* --- Chispas: brotan mientras el nucleo gana energia ---------- */
    pivote.updateMatrixWorld(true);
    focoAudio.getWorldPosition(origenChispas);
    const subiendo = energia > energiaPrevia + 0.0001;
    const tasa = subiendo ? 6 : energia > 0.05 ? 1 : 0;
    let emitidas = 0;
    for (let i = 0; i < TOTAL_CHISPAS; i++) {
      const idx = i * 3;
      if (vidaChispas[i] > 0) {
        vidaChispas[i] -= dt;
        velChispas[idx + 1] -= dt * 9.5; // gravedad
        posChispas[idx] += velChispas[idx] * dt;
        posChispas[idx + 1] += velChispas[idx + 1] * dt;
        posChispas[idx + 2] += velChispas[idx + 2] * dt;
      } else if (emitidas < tasa && Math.random() < 0.5) {
        emitidas++;
        vidaChispas[i] = 0.5 + Math.random() * 0.8;
        posChispas[idx] = origenChispas.x + (Math.random() - 0.5) * 1.6;
        posChispas[idx + 1] = origenChispas.y + (Math.random() - 0.5) * 1.2;
        posChispas[idx + 2] = origenChispas.z + (Math.random() - 0.5) * 0.8;
        velChispas[idx] = (Math.random() - 0.5) * 3.4;
        velChispas[idx + 1] = 1.5 + Math.random() * 3.5;
        velChispas[idx + 2] = (Math.random() - 0.5) * 3.4 + 1.2;
      } else {
        posChispas[idx + 1] = -999; // fuera de vista
      }
    }
    geoChispas.attributes.position.needsUpdate = true;
    chispas.material.opacity = 0.25 + energia * 0.7;
    energiaPrevia = energia;
  }

  /** Posicion del nucleo en coordenadas del mundo (para HUD y audio). */
  function posicionNucleo(destino = _v) {
    pivote.updateMatrixWorld(true);
    return focoAudio.getWorldPosition(destino);
  }

  return { grupo, pivote, nucleo, focoAudio, pantalla, ajustarPantalla, update, posicionNucleo };
}
