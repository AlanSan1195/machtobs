// Helpers compartidos por las escenas: todo son tweens del timeline, nada depende del reloj.
(() => {
  const INK = '#090a0a', SKIN = '#f0b48c', HAIR = '#3a2418', HOOD = '#f2b84b', SHADE = '#d6962a', BLUE = '#3a9bdc';
  const eye = (side, cx) => `
    <g class="nk-eye nk-eye${side}" transform="translate(${cx} 178)">
      <g class="e-open"><ellipse rx="23" ry="27" fill="#fff" stroke="${INK}" stroke-width="5"/><circle class="e-pupil" r="11" fill="${INK}"/></g>
      <path class="e-happy" d="M-23 8 Q0 -24 23 8" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path class="e-lid" d="M-24 4 H24" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path class="e-dizzy" d="M-18 -18 L18 18 M18 -18 L-18 18" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    </g>`;
  const arm = (side, x) => `
    <g class="nk-arm${side}">
      <rect x="${x - 32}" y="306" width="64" height="150" rx="32" fill="${HOOD}" stroke="${INK}" stroke-width="6"/>
      <circle cx="${x}" cy="462" r="34" fill="${SKIN}" stroke="${INK}" stroke-width="6"/>
    </g>`;
  const RIG = (id) => `
  <svg viewBox="0 0 400 460">
    <defs><clipPath id="${id}-clip"><rect x="-200" y="-200" width="800" height="648"/></clipPath></defs>
    <g clip-path="url(#${id}-clip)">
      <path d="M78 300 Q200 190 322 300 L322 350 L78 350Z" fill="${SHADE}" stroke="${INK}" stroke-width="6"/>
      <path d="M36 470 Q36 318 136 296 L264 296 Q364 318 364 470Z" fill="${HOOD}" stroke="${INK}" stroke-width="6"/>
      <rect x="172" y="246" width="56" height="62" fill="${SKIN}" stroke="${INK}" stroke-width="6"/>
      <path d="M176 306 V356 M224 306 V356" stroke="#f1efe8" stroke-width="7" stroke-linecap="round"/>
    </g>
    <g class="nk-head">
      <circle cx="102" cy="184" r="19" fill="${SKIN}" stroke="${INK}" stroke-width="6"/><circle cx="298" cy="184" r="19" fill="${SKIN}" stroke="${INK}" stroke-width="6"/>
      <rect x="100" y="70" width="200" height="200" rx="92" fill="${SKIN}" stroke="${INK}" stroke-width="6"/>
      <path d="M97 158 Q84 44 200 42 Q316 44 303 158 Q292 104 252 98 Q204 126 150 98 Q108 106 97 158Z" fill="${HAIR}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path class="nk-browL" d="M133 138 H181" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <path class="nk-browR" d="M219 138 H267" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      <g class="nk-eyes">${eye('L', 157)}${eye('R', 243)}</g>
      <g class="nk-mouth">
        <path class="m-smile" d="M170 224 Q200 252 230 224" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <path class="m-grin" d="M160 216 Q200 276 240 216Z" fill="${INK}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <ellipse class="m-o" cx="200" cy="234" rx="15" ry="19" fill="${INK}"/>
        <path class="m-flat" d="M178 234 H222" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <path class="m-wavy" d="M166 236 q9 -14 17 0 t17 0 t17 0 t17 0" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
      </g>
      <path class="nk-sweat" d="M322 86 Q340 116 322 128 Q304 116 322 86Z" fill="${BLUE}" stroke="${INK}" stroke-width="5"/>
      <g class="nk-phones">
        <path d="M94 176 Q88 22 200 22 Q312 22 306 176" fill="none" stroke="${INK}" stroke-width="26" stroke-linecap="round"/>
        <path d="M94 176 Q88 22 200 22 Q312 22 306 176" fill="none" stroke="#3b4049" stroke-width="16" stroke-linecap="round"/>
        <rect x="64" y="142" width="50" height="88" rx="20" fill="${BLUE}" stroke="${INK}" stroke-width="6"/><rect x="286" y="142" width="50" height="88" rx="20" fill="${BLUE}" stroke="${INK}" stroke-width="6"/>
        <path d="M90 228 Q96 282 152 270" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><circle cx="158" cy="268" r="13" fill="#3b4049" stroke="${INK}" stroke-width="5"/>
      </g>
    </g>
    ${arm('L', 74)}${arm('R', 326)}
  </svg>`;

  // Cada ánimo es un estado completo de la cara; mood() pasa de uno a otro con un "take".
  const MOODS = {
    happy:    { eye: 'open',  mouth: 'smile', by: 0,   bl: 0,   br: 0,   es: 1,    px: 0,  py: 0, sweat: 0 },
    look:     { eye: 'open',  mouth: 'smile', by: -4,  bl: 0,   br: 0,   es: 1,    px: -9, py: 2, sweat: 0 },
    confused: { eye: 'open',  mouth: 'flat',  by: -6,  bl: -14, br: 10,  es: 1,    px: -9, py: 0, sweat: 0 },
    worried:  { eye: 'open',  mouth: 'wavy',  by: -8,  bl: 16,  br: -16, es: 1.08, px: -6, py: -3, sweat: 1 },
    panic:    { eye: 'open',  mouth: 'o',     by: -18, bl: 20,  br: -20, es: 1.28, px: 0,  py: 0, sweat: 1 },
    dizzy:    { eye: 'dizzy', mouth: 'wavy',  by: -4,  bl: 14,  br: -14, es: 1.1,  px: 0,  py: 0, sweat: 1 },
    down:     { eye: 'lid',   mouth: 'flat',  by: 10,  bl: 10,  br: -10, es: 1,    px: 0,  py: 0, sweat: 0 },
    curious:  { eye: 'open',  mouth: 'flat',  by: -14, bl: -6,  br: 6,   es: 1.1,  px: -8, py: 4, sweat: 0 },
    wow:      { eye: 'open',  mouth: 'o',     by: -18, bl: -4,  br: 4,   es: 1.25, px: -6, py: 4, sweat: 0 },
    smile:    { eye: 'open',  mouth: 'smile', by: -6,  bl: 0,   br: 0,   es: 1.05, px: -6, py: 4, sweat: 0 },
    grin:     { eye: 'happy', mouth: 'grin',  by: -10, bl: -6,  br: 6,   es: 1,    px: 0,  py: 0, sweat: 0 },
  };
  const face = (m) => [
    ['.e-open', { opacity: +(m.eye === 'open') }], ['.e-happy', { opacity: +(m.eye === 'happy') }], ['.e-lid', { opacity: +(m.eye === 'lid') }], ['.e-dizzy', { opacity: +(m.eye === 'dizzy') }],
    ['.m-smile', { opacity: +(m.mouth === 'smile') }], ['.m-grin', { opacity: +(m.mouth === 'grin') }], ['.m-o', { opacity: +(m.mouth === 'o') }], ['.m-flat', { opacity: +(m.mouth === 'flat') }], ['.m-wavy', { opacity: +(m.mouth === 'wavy') }],
    ['.nk-sweat', { opacity: m.sweat }],
  ];

  window.MO = {
    land: (id) => document.querySelector('[data-composition-id="' + id + '"]').dataset.width === '1920',
    blurIn(tl, sel, t, d = 0.2) { tl.fromTo(sel, { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: d, ease: 'power2.out' }, t); },
    blurOut(tl, sel, t, d = 0.15) { tl.to(sel, { opacity: 0, filter: 'blur(10px)', duration: d, ease: 'power2.in' }, t); },
    // Palabra a palabra, sin traslación: el título aterriza y se queda quieto.
    words(tl, sel, t, gap = 0.07) { tl.fromTo(sel + ' i', { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.14, stagger: gap, ease: 'power2.out' }, t); },
    enter(tl, sel, t, x0, y0, x, y, d = 0.5) { tl.fromTo(sel, { x: x0, y: y0 }, { x, y, duration: d, ease: 'power3.inOut' }, t); },
    move(tl, sel, t, x, y, d = 0.45) { tl.to(sel, { x, y, duration: d, ease: 'power3.inOut' }, t); },
    click(tl, sel, t) { tl.to(sel, { scale: 0.78, duration: 0.06, ease: 'power2.in' }, t); tl.to(sel, { scale: 1, duration: 0.14, ease: 'power2.out' }, t + 0.06); },
    pop(tl, sel, t, d = 0.3) { tl.fromTo(sel, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: d, ease: 'back.out(2)' }, t); },

    // Monta a Nico en el contenedor #id y deja la cara en su ánimo inicial.
    nico(id, mood = 'happy', phones = false) {
      const s = '#' + id + ' ';
      document.getElementById(id).innerHTML = RIG(id);
      gsap.set(s + '.nk-head', { svgOrigin: '200 290' });
      gsap.set(s + '.nk-armL', { svgOrigin: '74 330' });
      gsap.set(s + '.nk-armR', { svgOrigin: '326 330' });
      gsap.set(s + '.nk-browL', { svgOrigin: '157 138' });
      gsap.set(s + '.nk-browR', { svgOrigin: '243 138' });
      gsap.set(s + '.nk-phones', { opacity: +phones, svgOrigin: '200 120' });
      const m = MOODS[mood];
      face(m).forEach(([c, v]) => gsap.set(s + c, v));
      gsap.set(s + '.nk-browL', { y: m.by, rotation: m.bl });
      gsap.set(s + '.nk-browR', { y: m.by, rotation: m.br });
      gsap.set(s + '.nk-eye', { scale: m.es });
      gsap.set(s + '.e-pupil', { x: m.px, y: m.py });
    },
    // Anticipación (squash), cara nueva en el fondo del squash, estirón y asentado.
    mood(tl, id, t, mood) {
      const s = '#' + id + ' ', m = MOODS[mood];
      tl.to(s + '.nk-head', { scaleY: 0.9, scaleX: 1.05, duration: 0.08, ease: 'power2.in' }, t);
      face(m).forEach(([c, v]) => tl.set(s + c, v, t + 0.08));
      tl.to(s + '.nk-browL', { y: m.by, rotation: m.bl, duration: 0.22, ease: 'back.out(2.2)' }, t + 0.08);
      tl.to(s + '.nk-browR', { y: m.by, rotation: m.br, duration: 0.26, ease: 'back.out(2.2)' }, t + 0.1);
      tl.to(s + '.nk-eye', { scale: m.es, duration: 0.24, ease: 'back.out(3)' }, t + 0.08);
      tl.to(s + '.e-pupil', { x: m.px, y: m.py, duration: 0.2, ease: 'power2.out' }, t + 0.08);
      tl.to(s + '.nk-head', { scaleY: 1, scaleX: 1, duration: 0.42, ease: 'elastic.out(1, 0.45)' }, t + 0.08);
    },
    blink(tl, id, t) {
      tl.to('#' + id + ' .nk-eyes', { scaleY: 0.08, transformOrigin: '50% 50%', duration: 0.05, ease: 'power1.in' }, t);
      tl.to('#' + id + ' .nk-eyes', { scaleY: 1, duration: 0.09, ease: 'power1.out' }, t + 0.06);
    },
  };
})();
