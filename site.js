const stateButtons = [...document.querySelectorAll('[data-state]')];
const rug = document.querySelector('#preview-rug');
const status = document.querySelector('#demo-status');
let state = 'flat', x = 0, y = 0, drag = null;
const images = { flat: 'assets/rug-flat.webp', fold: 'assets/rug-fold.webp', roll: 'assets/rug-roll.webp', peek: 'assets/rug-flat.webp' };
const labels = { flat: 'Flat rug. Drag the preview, or use the move buttons.', fold: 'Folded rug, rendered by the Windows app.', roll: 'Rolled rug, rendered by the Windows app.', peek: 'Peek reveals the sample desktop underneath the rug.' };

function move(dx, dy) {
  x = Math.max(-85, Math.min(85, x + dx));
  y = Math.max(-50, Math.min(50, y + dy));
  rug.style.setProperty('--rug-x', x + 'px');
  rug.style.setProperty('--rug-y', y + 'px');
}
function showState(next) {
  if (!rug || !Object.hasOwn(images, next)) return;
  state = next; x = y = 0; move(0, 0);
  rug.src = images[next]; rug.classList.toggle('peeking', next === 'peek');
  rug.alt = next === 'roll' ? 'A rolled carpet rendered by Kilim for Windows' : next === 'fold' ? 'A folded carpet rendered by Kilim for Windows' : 'A Kashan carpet rendered by Kilim for Windows';
  stateButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.state === next)));
  status.textContent = labels[next];
}
stateButtons.forEach(button => button.addEventListener('click', () => showState(button.dataset.state)));
if (rug) {
  rug.addEventListener('dragstart', event => event.preventDefault());
  rug.addEventListener('pointerdown', event => {
    if (event.button !== 0 || state === 'roll') return;
    drag = { x: event.clientX, y: event.clientY }; rug.setPointerCapture(event.pointerId);
  });
  rug.addEventListener('pointermove', event => {
    if (!drag) return;
    move(event.clientX - drag.x, event.clientY - drag.y); drag = { x: event.clientX, y: event.clientY };
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) rug.addEventListener(type, () => { drag = null; });
  rug.addEventListener('keydown', event => {
    const keys = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -15], ArrowDown: [0, 15] };
    if (Object.hasOwn(keys, event.key)) { event.preventDefault(); move(...keys[event.key]); }
  });
  document.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => move(Number(button.dataset.move), 0)));
}

document.querySelectorAll('[data-theme]').forEach(button => button.addEventListener('click', () => {
  const selected = button.dataset.theme;
  if (!/^[a-z]+$/.test(selected)) return;
  document.querySelector('#selected-pattern').src = 'assets/theme-' + selected + '.webp';
  document.querySelector('#selected-pattern').alt = button.dataset.label + ' rug pattern included in Kilim for Windows';
  document.querySelector('#pattern-title').textContent = button.dataset.label;
  document.querySelectorAll('[data-theme]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
}));
