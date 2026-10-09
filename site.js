const stateButtons = [...document.querySelectorAll('[data-state]')];
const rug = document.querySelector('#preview-rug');
const status = document.querySelector('#demo-status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktopCaption = document.querySelector('[data-desktop-caption]');
let x = 0, y = 0, drag = null;
const images = { flat: 'assets/rug-flat.webp', fold: 'assets/rug-fold.webp', roll: 'assets/rug-roll.webp', peek: 'assets/rug-flat.webp' };
const labels = { flat: 'The rug covers the file cluster. Use Peek to see the files, or drag the rug aside.', fold: 'Folded rug, rendered by the Windows app. Your files stay in place.', roll: 'Rolled rug, rendered by the Windows app. Your files stay in place.', peek: 'Peek reveals the file cluster underneath the rug. Your files were here all along.' };

function move(dx, dy) {
  x = Math.max(-85, Math.min(85, x + dx));
  y = Math.max(-50, Math.min(50, y + dy));
  rug.style.setProperty('--rug-x', x + 'px');
  rug.style.setProperty('--rug-y', y + 'px');
}
function reveal(image, opacity = 1) {
  image.getAnimations().forEach(animation => animation.cancel());
  if (!reducedMotion.matches) image.animate([{ opacity: .35 }, { opacity }], { duration: 220, easing: 'ease-out' });
}
function releaseRug() {
  drag = null;
  rug.classList.remove('dragging');
  rug.style.setProperty('--rug-tilt', '0deg');
}
function showState(next) {
  if (!rug || !Object.hasOwn(images, next)) return;
  releaseRug();
  x = y = 0; move(0, 0);
  rug.src = images[next]; rug.classList.toggle('peeking', next === 'peek');
  rug.alt = next === 'roll' ? 'A rolled carpet rendered by Kilim for Windows' : next === 'fold' ? 'A folded carpet rendered by Kilim for Windows' : 'A Kashan carpet rendered by Kilim for Windows';
  reveal(rug, next === 'peek' ? .26 : 1);
  stateButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.state === next)));
  status.textContent = labels[next];
  if (desktopCaption) desktopCaption.textContent = next === 'peek' ? 'Your files. Right where you left them.' : 'Covered, not deleted.';
}
function coverFiles() {
  showState('flat');
  if (reducedMotion.matches) return;
  rug.getAnimations().forEach(animation => animation.cancel());
  desktopCaption.textContent = 'A familiar kind of clutter.';
  const covering = rug.animate([
    { opacity: 0, translate: '20% -40%', rotate: '9deg', offset: 0 },
    { opacity: 0, translate: '20% -40%', rotate: '9deg', offset: .4 },
    { opacity: 1, translate: '12% -22%', rotate: '5deg', offset: .58 },
    { opacity: 1, translate: '0 0', rotate: '0deg', offset: 1 }
  ], { duration: 2600, easing: 'cubic-bezier(.22,.7,.3,1)' });
  covering.onfinish = () => { desktopCaption.textContent = 'Covered, not deleted.'; };
}
stateButtons.forEach(button => button.addEventListener('click', () => showState(button.dataset.state)));
if (rug) {
  rug.addEventListener('dragstart', event => event.preventDefault());
  rug.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    rug.getAnimations().forEach(animation => animation.cancel());
    rug.classList.add('dragging');
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY }; rug.setPointerCapture(event.pointerId);
  });
  rug.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    move(dx, dy);
    rug.style.setProperty('--rug-tilt', Math.max(-3, Math.min(3, dx * .12)) + 'deg');
    drag.x = event.clientX; drag.y = event.clientY;
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) rug.addEventListener(type, releaseRug);
  rug.addEventListener('keydown', event => {
    const keys = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -15], ArrowDown: [0, 15] };
    if (Object.hasOwn(keys, event.key)) { event.preventDefault(); move(...keys[event.key]); }
  });
  document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => move(Number(button.dataset.move), 0)));
  document.querySelector('[data-replay]')?.addEventListener('click', coverFiles);
  coverFiles();
}

document.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => {
  const selected = button.dataset.theme;
  if (!/^[a-z]+$/.test(selected)) return;
  document.querySelector('#selected-pattern').src = 'assets/theme-' + selected + '.webp';
  document.querySelector('#selected-pattern').alt = button.dataset.label + ' rug pattern included in Kilim for Windows';
  reveal(document.querySelector('#selected-pattern'));
  document.querySelector('#pattern-title').textContent = button.dataset.label;
  document.querySelectorAll('[data-theme]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
}));