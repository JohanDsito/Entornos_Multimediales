/**
 * MEDIOS: video (memoria del robot) + audio espacial
 * -------------------------------------------------------------
 * - Crea el <video> y su VideoTexture para el nucleo del robot.
 * - Crea el AudioListener (oidos = camara) y el PositionalAudio
 *   (fuente = nucleo del robot), de modo que el volumen depende
 *   de la distancia y la orientacion de la camara en el espacio 3D.
 * - Centraliza el play/pausa para sortear la restriccion de
 *   autoplay: nada suena hasta que el usuario lo ordena.
 */
import * as THREE from 'three';

export const RUTA_VIDEO = '/assets/video.mp4';
export const RUTA_AUDIO = '/assets/audio.mp3';

/* Parametros del modelo de atenuacion por distancia (PannerNode) */
export const AUDIO_3D = {
  refDistance: 8,     // hasta aqui el volumen es maximo
  maxDistance: 60,    // mas alla ya no se atenua mas
  rolloffFactor: 1.1, // cuan rapido cae el volumen al alejarse
  volumen: 1.0,
};

export function crearMedios() {
  /* ---------------------------------------------------------------- */
  /* 1. Video -> VideoTexture                                          */
  /* ---------------------------------------------------------------- */
  const video = document.createElement('video');
  video.src = RUTA_VIDEO;
  video.loop = true;
  video.muted = true;        // el sonido llega por el audio espacial
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  // Algunos navegadores (Safari en particular) solo actualizan los frames de
  // un video que forma parte del documento: lo anclamos fuera de pantalla.
  Object.assign(video.style, {
    position: 'fixed', width: '1px', height: '1px',
    left: '-10px', top: '-10px', opacity: '0', pointerEvents: 'none',
  });
  document.body.appendChild(video);
  video.load();

  const texturaVideo = new THREE.VideoTexture(video);
  texturaVideo.colorSpace = THREE.SRGBColorSpace;
  texturaVideo.minFilter = THREE.LinearFilter;
  texturaVideo.magFilter = THREE.LinearFilter;
  texturaVideo.generateMipmaps = false;

  /* ---------------------------------------------------------------- */
  /* 2. Audio espacial                                                 */
  /* ---------------------------------------------------------------- */
  const listener = new THREE.AudioListener();       // se cuelga de la camara
  const sonido = new THREE.PositionalAudio(listener); // se cuelga del nucleo

  sonido.setRefDistance(AUDIO_3D.refDistance);
  sonido.setMaxDistance(AUDIO_3D.maxDistance);
  sonido.setRolloffFactor(AUDIO_3D.rolloffFactor);
  sonido.setDistanceModel('inverse');
  // Cono directivo: el nucleo "proyecta" su voz hacia el frente del pecho,
  // asi el usuario nota tambien el cambio al rodear al robot.
  sonido.setDirectionalCone(110, 250, 0.22);
  sonido.setLoop(true);
  sonido.setVolume(AUDIO_3D.volumen);

  const estado = {
    reproduciendo: false,
    audioListo: false,
    videoListo: false,
    error: null,
  };

  /* ---------------------------------------------------------------- */
  /* 3. Carga del buffer de audio                                      */
  /* ---------------------------------------------------------------- */
  const cargarAudio = (onProgreso) => new Promise((resolve) => {
    new THREE.AudioLoader().load(
      RUTA_AUDIO,
      (buffer) => {
        sonido.setBuffer(buffer);
        estado.audioListo = true;
        onProgreso?.(1);
        resolve(true);
      },
      (evt) => {
        if (evt.lengthComputable) onProgreso?.(evt.loaded / evt.total);
      },
      (err) => {
        console.error('[medios] no se pudo cargar el audio', err);
        estado.error = 'audio';
        resolve(false);
      },
    );
  });

  const cargarVideo = (onProgreso) => new Promise((resolve) => {
    if (video.readyState >= 3) { estado.videoListo = true; onProgreso?.(1); return resolve(true); }
    const ok = () => { estado.videoListo = true; onProgreso?.(1); limpiar(); resolve(true); };
    const fallo = () => { estado.error = 'video'; limpiar(); resolve(false); };
    const avance = () => {
      // Fraccion del video ya almacenada en buffer
      if (video.buffered.length && video.duration) {
        onProgreso?.(Math.min(1, video.buffered.end(0) / video.duration));
      }
    };
    const limpiar = () => {
      video.removeEventListener('canplaythrough', ok);
      video.removeEventListener('error', fallo);
      video.removeEventListener('progress', avance);
    };
    video.addEventListener('canplaythrough', ok);
    video.addEventListener('error', fallo);
    video.addEventListener('progress', avance);
  });

  /**
   * Espera a que ambos medios esten listos para el primer PLAY.
   * @param {(fraccion:number)=>void} [onProgreso] avance combinado 0..1
   */
  function precargar(onProgreso) {
    let pAudio = 0;
    let pVideo = 0;
    const avisar = () => onProgreso?.((pAudio + pVideo) / 2);
    return Promise.all([
      cargarAudio((p) => { pAudio = p; avisar(); }),
      cargarVideo((p) => { pVideo = p; avisar(); }),
    ]);
  }

  /* ---------------------------------------------------------------- */
  /* 4. Control de reproduccion (gesto del usuario obligatorio)        */
  /* ---------------------------------------------------------------- */
  async function reproducir() {
    // Los navegadores dejan el AudioContext suspendido hasta que hay
    // una interaccion real del usuario: aqui lo reanudamos.
    const ctx = listener.context;
    if (ctx.state === 'suspended') await ctx.resume();

    try {
      await video.play();
    } catch (err) {
      console.warn('[medios] el navegador bloqueo el video', err);
    }

    if (estado.audioListo && !sonido.isPlaying) sonido.play();
    estado.reproduciendo = true;
    return estado.reproduciendo;
  }

  function pausar() {
    video.pause();
    if (sonido.isPlaying) sonido.pause();
    estado.reproduciendo = false;
  }

  function alternar() {
    return estado.reproduciendo ? (pausar(), Promise.resolve(false)) : reproducir();
  }

  function reiniciar() {
    video.currentTime = 0;
    if (sonido.isPlaying) sonido.stop();
    if (estado.audioListo && estado.reproduciendo) sonido.play();
  }

  /**
   * Ganancia aproximada segun el modelo "inverse" del PannerNode.
   * Sirve para mostrar al usuario, en el HUD, como cae el volumen
   * cuando aleja la camara del nucleo.
   */
  function gananciaEstimada(distancia) {
    const { refDistance: ref, maxDistance: max, rolloffFactor: k } = AUDIO_3D;
    const d = THREE.MathUtils.clamp(distancia, ref, max);
    return ref / (ref + k * (d - ref));
  }

  return {
    video, texturaVideo, listener, sonido, estado,
    precargar, reproducir, pausar, alternar, reiniciar, gananciaEstimada,
  };
}
