// Keyboard state: held = currently down, tap = true once on press frame.
const down = new Set();
const tapped = new Set();

window.addEventListener('keydown', (e) => {
  if (!down.has(e.code)) tapped.add(e.code);
  down.add(e.code);
});
window.addEventListener('keyup', (e) => {
  down.delete(e.code);
});

export function held(code) {
  return down.has(code);
}

export function tap(code) {
  const wasTapped = tapped.has(code);
  tapped.delete(code);
  return wasTapped;
}
