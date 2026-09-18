# El Taller Abandonado — La Memoria del Núcleo

**Taller Semana 3 · Animación 3D** — Escena interactiva en Three.js con video
sobre geometría, audio espacial y animación en bucle a 60 FPS.

---

## Concepto

*(Concepto libre)*

El usuario entra en un **taller de reparación abandonado**. En el centro, sobre una
camilla inclinada, yace una **unidad humanoide gigante desmantelada**: el pecho
abierto, los cables al aire, un brazo separado en el suelo, una pierna desmontada a
la altura de la rodilla y los paneles metálicos retirados y apoyados por la sala.

Dentro del torso sigue instalado su **núcleo de procesamiento**. Lo que se reproduce
en él no es un video sobre una pantalla: **es la memoria del robot**.

Cuando el usuario pulsa **PLAY**, la unidad empieza a recuperar energía. El núcleo se
enciende, el visor de la cabeza despierta, los dedos tienen espasmos, saltan chispas
del pecho, los monitores de diagnóstico de la pared se encienden uno a uno y el
ventilador del techo acelera. Al pausar, el robot vuelve a apagarse progresivamente.

---

## Cómo ejecutarlo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # compilación de producción en dist/
npm run preview  # previsualizar la compilación
```

Abre la URL que imprime Vite y pulsa **INICIAR SISTEMA**.

---

## Cumplimiento de los requisitos

### 1. Entorno 3D completo (mínimo 3 objetos adicionales)

Muy por encima del mínimo. Todo construido con geometría procedural, sin modelos externos.

**Entorno** (`src/escena/taller.js`):

| Elemento | Detalle |
|---|---|
| Sala del taller | Suelo de concreto, cuatro paredes con costillas de refuerzo y portón metálico |
| Camilla de reparación | Base, pistones hidráulicos, tabla inclinada 45°, rieles y abrazaderas |
| Banco de trabajo | Tablero, patas, balda y herramientas sueltas (llave, barra, caja, aro) |
| Estantería | Cuatro baldas con siete cajas colocadas al azar |
| Barriles | Cuatro barriles con sus aros metálicos |
| Cajas apiladas | Tres cajas de madera |
| Carrito de herramientas | Cuerpo, cajones y cuatro ruedas |
| Tuberías | Tres conducciones cruzando el techo |
| Lámparas industriales | Dos lámparas colgantes que oscilan y parpadean |
| Foco de trabajo | Lámpara articulada de pie orientada al pecho del robot (`SpotLight`) |
| Ventilador de techo | Cuatro aspas que aceleran con la energía |
| Monitores de diagnóstico | Seis pantallas de pared que se encienden de forma escalonada |
| Tiras de emergencia | Iluminación perimetral con pulso |
| Polvo en suspensión | 900 partículas con deriva ascendente |

**Robot** (`src/escena/robot.js`): torso con caparazón y compuertas abiertas, núcleo de
procesamiento con anillos orbitando, cinco haces de cables expuestos, cabeza ladeada con
visor y antena doblada, brazo izquierdo conectado con mano de cinco dedos, **brazo derecho
separado en el suelo**, **pierna derecha desmontada** con pistones al aire y espinilla
apoyada aparte, **cuatro paneles metálicos retirados** y un sistema de chispas.

Las texturas de concreto y pared se generan por código (ruido en `<canvas>`), sin archivos.

### 2. Animación fluida en el bucle a 60 FPS

`src/main.js` → función `animate()`.

El bucle usa **paso fijo de 1/60 s** con acumulador, de modo que la animación avanza
siempre a 60 pasos por segundo sea cual sea la velocidad real del equipo:

```js
acumulador += delta;
while (acumulador >= PASO_FIJO && pasos < 5) {
  simular(PASO_FIJO);
  acumulador -= PASO_FIJO;
  pasos++;
}
```

El `delta` se recorta a 0,25 s para que al volver de una pestaña en segundo plano la
escena no dé un salto. El HUD muestra los FPS y el número de triángulos en vivo
(~100 000 triángulos).

Todo se anima por `delta`, nunca por número de frame: lámparas oscilando, ventilador,
polvo, anillos del núcleo, cables ondeando (la geometría del tubo se reconstruye cada
paso), compuertas vibrando, dedos con espasmos, respiración mecánica del torso,
chispas con gravedad y monitores parpadeando.

### 3. Interacción de usuario (autoplay)

Nada suena ni se reproduce hasta que el usuario lo ordena. La pantalla de arranque
obtiene el gesto obligatorio y además reanuda el `AudioContext`, que los navegadores
entregan suspendido (`src/medios.js` → `reproducir()`).

| Control | Acción |
|---|---|
| Botón **INICIAR SISTEMA** | Arranca la experiencia |
| Botón **REPRODUCIR / PAUSAR** | Alterna video y audio |
| Botón **REINICIAR MEMORIA** | Rebobina el video y apaga al robot |
| Botón **CÁMARA AUTOMÁTICA** | Órbita automática |
| <kbd>Espacio</kbd> | Arranca la primera vez; después reproducir/pausar |
| <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / flechas | Desplazar la cámara por el taller |
| <kbd>Q</kbd> <kbd>E</kbd> | Bajar / subir |
| <kbd>Shift</kbd> | Moverse más rápido |
| <kbd>R</kbd> | Volver a la vista inicial |
| <kbd>C</kbd> | Cámara automática |
| <kbd>H</kbd> | Ocultar / mostrar el HUD |
| Arrastrar / rueda | Orbitar y acercar (`OrbitControls`) |

Además, al ocultar la pestaña la reproducción se pausa sola.

### 4. Audio espacial funcional

`src/medios.js` + panel **AUDIO ESPACIAL** del HUD.

- El `AudioListener` cuelga de la **cámara**: los oídos del usuario se mueven con ella.
- El `PositionalAudio` cuelga de un objeto situado **dentro del pecho del robot**, de
  modo que la fuente está en el núcleo y no en un punto abstracto.
- Modelo de atenuación `inverse` con `refDistance: 8`, `maxDistance: 60` y
  `rolloffFactor: 1.1`.
- **Cono directivo** (`setDirectionalCone(110, 250, 0.22)`): el núcleo proyecta su voz
  hacia el frente del pecho, así que el volumen cambia también al *rodear* al robot,
  no solo al acercarse.

Para que el efecto sea **comprobable**, el HUD muestra en vivo la distancia de la
cámara al núcleo y el volumen resultante. Medición real de la escena:

| Distancia | Volumen |
|---|---|
| 8,2 u | 98 % |
| 19,9 u (vista inicial) | 38 % |
| 41,2 u | 18 % |

---

## Estructura

```
taller-semana3/
├─ index.html              Pantalla de arranque + HUD
├─ public/assets/
│  ├─ video.mp4            memoria del robot
│  └─ audio.mp3            zumbido del núcleo
└─ src/
   ├─ main.js              renderer, cámara, luces, bucle 60 FPS, HUD, teclado
   ├─ medios.js            VideoTexture + AudioListener/PositionalAudio + play/pausa
   ├─ style.css            interfaz tipo terminal de diagnóstico
   └─ escena/
      ├─ taller.js         entorno del taller y su animación
      └─ robot.js          robot desmantelado, núcleo y piezas sueltas
```

> Los medios viven en `public/assets/` porque Vite solo sirve como estáticos los
> archivos de `public/`; en `assets/` en la raíz del proyecto darían 404.

---

## Detalles técnicos

- **Three.js r186** con `OrbitControls` de `three/addons`.
- Iluminación físicamente correcta (three ≥ r155): las intensidades de `PointLight` y
  `SpotLight` van en centenares porque la caída es `intensidad / distancia²`.
- `ACESFilmicToneMapping` y sombras `PCFSoftShadowMap`.
- La pantalla del núcleo es un plano unitario que se **escala al aspecto real del
  video** al cargar sus metadatos, para no deformar la imagen (el video incluido es
  cuadrado, 480×480).
- El hueco del pecho usa `side: THREE.BackSide`: así se descarta su cara frontal y se
  ven las paredes internas de la cavidad. Con una caja normal, esa cara frontal quedaba
  por delante de la pantalla y tapaba el video por completo.
- Las luces cercanas al núcleo se mantienen suaves a propósito: una fuente intensa muy
  próxima al cristal produce un especular que el tone mapping convierte en un borrón
  blanco sobre la pantalla.
- Los cables salen por los bordes de la cavidad para no cruzar por delante del video.
- El `<video>` se ancla fuera de pantalla dentro del documento: algunos navegadores
  (Safari) no actualizan los frames de un elemento que no está en el DOM.
- Una sola variable, `energia` (0 → 1), gobierna toda la narrativa visual: se pasa a
  `taller.update()` y a `robot.update()` en cada paso de simulación.
