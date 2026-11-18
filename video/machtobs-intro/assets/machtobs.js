// Helpers compartidos por las escenas: todo son tweens del timeline, nada depende del reloj.
window.MO = {
  blurIn(tl, sel, t, d = 0.2) {
    tl.fromTo(sel, { opacity: 0, filter: 'blur(10px)' }, { opacity: 1, filter: 'blur(0px)', duration: d, ease: 'power2.out' }, t);
  },
  blurOut(tl, sel, t, d = 0.15) {
    tl.to(sel, { opacity: 0, filter: 'blur(10px)', duration: d, ease: 'power2.in' }, t);
  },
  // El primer tramo entra desde (x0, y0); la punta de la flecha es el punto de clic.
  enter(tl, sel, t, x0, y0, x, y, d = 0.5) {
    tl.fromTo(sel, { x: x0, y: y0 }, { x, y, duration: d, ease: 'power3.inOut' }, t);
  },
  move(tl, sel, t, x, y, d = 0.45) {
    tl.to(sel, { x, y, duration: d, ease: 'power3.inOut' }, t);
  },
  click(tl, sel, t) {
    tl.to(sel, { scale: 0.8, duration: 0.06, ease: 'power2.in' }, t);
    tl.to(sel, { scale: 1, duration: 0.12, ease: 'power2.out' }, t + 0.06);
  },
};
