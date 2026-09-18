/**
 * ============================================================
 *  EL TALLER ABANDONADO — LA MEMORIA DEL NUCLEO
 *  Taller Semana 3 · Video + Audio espacial + Animacion 3D
 * ============================================================
 *
 *  NARRATIVA
 *  Un robot humanoide gigante yace desmantelado sobre la camilla
 *  de un taller de reparacion abandonado: pecho abierto, cables
 *  expuestos, un brazo separado, una pierna a medio desmontar y
 *  paneles metalicos por el suelo. Dentro del torso sigue su
 *  nucleo de procesamiento, y lo que ahi se reproduce no es un
 *  video cualquiera: es la memoria del robot.
 *
 *  Al pulsar PLAY la unidad recupera energia progresivamente.
 *
 *  REQUISITOS CUBIERTOS
 *  1. Entorno 3D completo .... taller.js (sala, camilla, banco,
 *     estanteria, barriles, cajas, carrito, lamparas, tuberias,
 *     ventilador, monitores, polvo) + robot.js (robot y piezas).
 *  2. Animacion fluida a 60 FPS ... bucle con paso fijo mas abajo.
 *  3. Interaccion de usuario ...... botones del HUD y teclado.
 *  4. Audio espacial funcional .... PositionalAudio anclado al
 *     nucleo + camara libre + medidor de volumen en el HUD.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { crearTaller } from './escena/taller.js';
import { crearRobot } from './escena/robot.js';
import { crearMedios } from './medios.js';
import './style.css';

/* ================================================================== */
/* 0. Constantes de escena                                             */
/* ================================================================== */
const CAMARA_INICIAL = new THREE.Vector3(8.6, 10.4, 9.2);
const OBJETIVO_INICIAL = new THREE.Vector3(0, 6.8, -2.6);
const FPS_OBJETIVO = 60;
const PASO_FIJO = 1 / FPS_OBJETIVO;

/* ================================================================== */
/* 1. Renderizador, escena y camara                                    */
/* ================================================================== */
const contenedor = document.getElementById('lienzo');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
contenedor.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070a);
scene.fog = new THREE.FogExp2(0x06090d, 0.019);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.copy(CAMARA_INICIAL);

/* ---- Controles de orbita: el usuario mueve la camara libremente --- */
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(OBJETIVO_INICIAL);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 4;
controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI * 0.495; // no atravesar el suelo
controls.autoRotateSpeed = 0.6;
controls.update();

/* ================================================================== */
/* 2. Iluminacion base del taller                                      */
/* ================================================================== */
scene.add(new THREE.AmbientLight(0x2e4055, 0.75));
scene.add(new THREE.HemisphereLight(0x46708f, 0x1a130c, 0.8));

// Luz fria que entra por el ventanal roto del fondo
const luzLuna = new THREE.DirectionalLight(0x7aa6de, 1.5);
luzLuna.position.set(-16, 20, -12);
luzLuna.castShadow = true;
luzLuna.shadow.mapSize.set(2048, 2048);
luzLuna.shadow.camera.left = -26;
luzLuna.shadow.camera.right = 26;
luzLuna.shadow.camera.top = 26;
luzLuna.shadow.camera.bottom = -26;
luzLuna.shadow.camera.far = 70;
luzLuna.shadow.bias = -0.0015;
scene.add(luzLuna);

/* ================================================================== */
/* 3. Medios, entorno y robot                                          */
/* ================================================================== */
const medios = crearMedios();
camera.add(medios.listener);   // los oidos viajan con la camara
scene.add(camera);             // necesario para que el listener se actualice

const taller = crearTaller();
scene.add(taller.grupo);

const robot = crearRobot(medios.texturaVideo);
scene.add(robot.grupo);

// La fuente de sonido vive DENTRO del pecho del robot
robot.focoAudio.add(medios.sonido);

// La pantalla del nucleo se adapta al aspecto real del video (no lo deforma)
const ajustarPantalla = () => robot.ajustarPantalla(medios.video.videoWidth, medios.video.videoHeight);
medios.video.addEventListener('loadedmetadata', ajustarPantalla);
ajustarPantalla();

/* ================================================================== */
/* 4. HUD e interaccion                                                */
/* ================================================================== */
const ui = {
  arranque: document.getElementById('arranque'),
  btnIniciar: document.getElementById('btn-iniciar'),
  barra: document.getElementById('barra-carga-relleno'),
  estadoCarga: document.getElementById('estado-carga'),
  hud: document.getElementById('hud'),
  btnPlay: document.getElementById('btn-play'),
  btnPlayTexto: document.getElementById('btn-play-texto'),
  btnReiniciar: document.getElementById('btn-reiniciar'),
  btnOrbita: document.getElementById('btn-orbita'),
  medidorEnergia: document.getElementById('medidor-energia'),
  valorEnergia: document.getElementById('valor-energia'),
  estadoSistema: document.getElementById('estado-sistema'),
  valorDistancia: document.getElementById('valor-distancia'),
  medidorVolumen: document.getElementById('medidor-volumen'),
  valorVolumen: document.getElementById('valor-volumen'),
  fps: document.getElementById('fps'),
};

/* ---- 4.1 Precarga de video y audio -------------------------------- */
let listo = false;
medios.precargar((fraccion) => {
  ui.barra.style.width = `${Math.round(fraccion * 100)}%`;
}).then(() => {
  listo = true;
  ui.barra.style.width = '100%';
  if (medios.estado.error) {
    ui.estadoCarga.textContent = `Aviso: no se pudo cargar el ${medios.estado.error}. La escena funciona igual.`;
  } else {
    ui.estadoCarga.textContent = 'Memoria recuperada · listo para iniciar';
  }
  ui.btnIniciar.disabled = false;
});

/* ---- 4.2 Play / pausa (supera la restriccion de autoplay) --------- */
let reproduciendo = false;

async function alternarReproduccion() {
  reproduciendo = await medios.alternar();
  actualizarBotonPlay();
}

function actualizarBotonPlay() {
  ui.btnPlay.classList.toggle('reproduciendo', reproduciendo);
  ui.btnPlayTexto.textContent = reproduciendo ? 'PAUSAR' : 'REPRODUCIR';
  ui.btnPlay.querySelector('.icono').textContent = reproduciendo ? '❚❚' : '▶';
  ui.estadoSistema.textContent = reproduciendo ? 'NÚCLEO ACTIVO · REPRODUCIENDO MEMORIA' : 'SISTEMA EN PAUSA';
  ui.estadoSistema.classList.toggle('activo', reproduciendo);
}

async function iniciarExperiencia() {
  if (!listo) return;
  ui.arranque.classList.add('cerrado');
  ui.hud.classList.remove('oculto');
  reproduciendo = await medios.reproducir();
  actualizarBotonPlay();
}

ui.btnIniciar.addEventListener('click', iniciarExperiencia);
ui.btnPlay.addEventListener('click', alternarReproduccion);

ui.btnReiniciar.addEventListener('click', () => {
  medios.reiniciar();
  energia = 0;
});

ui.btnOrbita.addEventListener('click', () => alternarOrbita());

function alternarOrbita() {
  controls.autoRotate = !controls.autoRotate;
  ui.btnOrbita.classList.toggle('activa', controls.autoRotate);
}

function reiniciarCamara() {
  camera.position.copy(CAMARA_INICIAL);
  controls.target.copy(OBJETIVO_INICIAL);
  controls.update();
}

/* ---- 4.3 Teclado --------------------------------------------------- */
const teclas = new Set();

window.addEventListener('keydown', (e) => {
  const k = e.code;

  // Espacio: arranca la experiencia la primera vez, luego play/pausa
  if (k === 'Space') {
    e.preventDefault();
    if (!ui.arranque.classList.contains('cerrado')) iniciarExperiencia();
    else alternarReproduccion();
    return;
  }
  if (k === 'KeyR') { reiniciarCamara(); return; }
  if (k === 'KeyC') { alternarOrbita(); return; }
  if (k === 'KeyH') { ui.hud.classList.toggle('oculto'); return; }

  teclas.add(k);
});
window.addEventListener('keyup', (e) => teclas.delete(e.code));
window.addEventListener('blur', () => teclas.clear());

/* ---- 4.4 Desplazamiento libre de la camara (WASD/QE) --------------- */
// Mueve camara y objetivo a la vez: cambia la posicion del oyente en el
// espacio 3D y por tanto el volumen percibido del nucleo.
const _adelante = new THREE.Vector3();
const _derecha = new THREE.Vector3();
const _desplazamiento = new THREE.Vector3();
const ARRIBA = new THREE.Vector3(0, 1, 0);

function moverCamara(dt) {
  const vel = (teclas.has('ShiftLeft') || teclas.has('ShiftRight') ? 26 : 12) * dt;
  _desplazamiento.set(0, 0, 0);

  camera.getWorldDirection(_adelante);
  _adelante.y = 0;
  if (_adelante.lengthSq() < 1e-6) _adelante.set(0, 0, -1);
  _adelante.normalize();
  _derecha.crossVectors(_adelante, ARRIBA).normalize();

  if (teclas.has('KeyW') || teclas.has('ArrowUp')) _desplazamiento.addScaledVector(_adelante, vel);
  if (teclas.has('KeyS') || teclas.has('ArrowDown')) _desplazamiento.addScaledVector(_adelante, -vel);
  if (teclas.has('KeyD') || teclas.has('ArrowRight')) _desplazamiento.addScaledVector(_derecha, vel);
  if (teclas.has('KeyA') || teclas.has('ArrowLeft')) _desplazamiento.addScaledVector(_derecha, -vel);
  if (teclas.has('KeyE')) _desplazamiento.y += vel;
  if (teclas.has('KeyQ')) _desplazamiento.y -= vel;

  if (_desplazamiento.lengthSq() === 0) return;

  camera.position.add(_desplazamiento);
  controls.target.add(_desplazamiento);

  // Mantener la camara dentro del taller y por encima del suelo
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -20, 20);
  camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1.2, 16);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -20, 20);
}

/* ================================================================== */
/* 5. Bucle de animacion con paso fijo de 60 FPS                       */
/* ================================================================== */
const reloj = new THREE.Clock();
const posNucleo = new THREE.Vector3();

let energia = 0;        // 0 = robot muerto, 1 = nucleo a pleno rendimiento
let acumulador = 0;     // acumulador del paso fijo
let tiempo = 0;         // tiempo simulado
let fpsMuestra = 60;
let contadorHud = 0;

function simular(dt) {
  tiempo += dt;

  // El robot revive despacio al reproducir y se apaga al pausar
  const objetivo = reproduciendo ? 1 : 0;
  const velocidad = reproduciendo ? 0.42 : 1.1;
  energia += (objetivo - energia) * Math.min(1, dt * velocidad);

  moverCamara(dt);
  taller.update(tiempo, dt, energia);
  robot.update(tiempo, dt, energia);

  // La atmosfera responde a la energia del nucleo
  scene.fog.density = 0.019 - energia * 0.004;
  renderer.toneMappingExposure = 0.95 + energia * 0.1;
}

function actualizarHud() {
  // Energia
  const pct = Math.round(energia * 100);
  ui.medidorEnergia.style.width = `${pct}%`;
  ui.valorEnergia.textContent = `${pct}%`;

  // Audio espacial: distancia real camara -> nucleo y volumen resultante
  robot.posicionNucleo(posNucleo);
  const distancia = camera.position.distanceTo(posNucleo);
  const ganancia = medios.gananciaEstimada(distancia) * (reproduciendo ? 1 : 0);

  ui.valorDistancia.textContent = `${distancia.toFixed(1)} u`;
  ui.medidorVolumen.style.width = `${Math.round(ganancia * 100)}%`;
  ui.valorVolumen.textContent = `${Math.round(ganancia * 100)}%`;
  ui.fps.textContent = `${Math.round(fpsMuestra)} FPS · ${renderer.info.render.triangles.toLocaleString('es')} tris`;
}

function animate() {
  requestAnimationFrame(animate);

  const bruto = Math.min(reloj.getDelta(), 0.25); // evita saltos tras un parpadeo de pestaña
  fpsMuestra += ((bruto > 0 ? 1 / bruto : 60) - fpsMuestra) * 0.08;
  acumulador += bruto;

  // Paso fijo: la animacion avanza siempre a 60 pasos por segundo,
  // independientemente de la velocidad real del equipo.
  let pasos = 0;
  while (acumulador >= PASO_FIJO && pasos < 5) {
    simular(PASO_FIJO);
    acumulador -= PASO_FIJO;
    pasos++;
  }
  if (pasos === 5) acumulador = 0; // el equipo no da mas: descartamos atraso

  controls.update();

  // El HUD se refresca 10 veces por segundo (no necesita 60)
  if ((contadorHud = (contadorHud + 1) % 6) === 0) actualizarHud();

  renderer.render(scene, camera);
}
animate();

/* ================================================================== */
/* 6. Redimensionado                                                   */
/* ================================================================== */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Al ocultar la pestaña pausamos para no gastar recursos ni sonar de fondo
document.addEventListener('visibilitychange', () => {
  if (document.hidden && reproduciendo) {
    medios.pausar();
    reproduciendo = false;
    actualizarBotonPlay();
  }
});
