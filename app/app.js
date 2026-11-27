'use strict';

const home = document.querySelector('#home');
const session = document.querySelector('#session');
const settings = document.querySelector('#settings');
const guide = document.querySelector('#guide');
const notice = document.querySelector('#notice');
const clock = document.querySelector('#clock');
const burstMs = 700;
const testMs = 8000;
let active = null;
let frame = 0;
let timeout = 0;
let wakeLock = null;
let sessionNumber = 0;

function keepAwake(enabled) {
  const hint = document.querySelector('#powerHint');
  hint.hidden = true;
  if (window.MousejigPower) {
    window.MousejigPower.keepAwake(enabled);
  } else if (window.webkit?.messageHandlers?.power) {
    window.webkit.messageHandlers.power.postMessage(enabled);
  } else if (enabled && navigator.wakeLock) {
    const id = sessionNumber;
    navigator.wakeLock.request('screen').then(lock => {
      if (active && id === sessionNumber) {
        wakeLock = lock;
        lock.addEventListener('release', () => {
          if (active && id === sessionNumber) hint.hidden = false;
        });
      } else {
        lock.release().catch(() => {});
      }
    }).catch(() => {
      if (active && id === sessionNumber) hint.hidden = false;
    });
  } else if (enabled) {
    hint.hidden = false;
  } else if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}

function supportsVibration() {
  if (window.MousejigPower) return Boolean(window.MousejigPower.hasVibrator?.());
  if (window.webkit?.messageHandlers?.power) return Boolean(window.webkit.messageHandlers.pulse);
  return typeof navigator.vibrate === 'function';
}

function vibrate(enabled) {
  if (window.MousejigPower) {
    window.MousejigPower.pulse(enabled);
  } else if (window.webkit?.messageHandlers?.pulse) {
    if (enabled) window.webkit.messageHandlers.pulse.postMessage(true);
  } else {
    return navigator.vibrate(enabled ? 350 : 0);
  }
  return true;
}

function updatePlacement() {
  const vibrating = settings.elements.method.value === 'vibrate';
  document.querySelector('#vibrationPreview').hidden = !vibrating;
  document.querySelector('#previewCanvas').hidden = vibrating;
  if (!vibrating) pad.drawPreview();
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('mousejig-settings') || '{}');
    for (const input of settings.querySelectorAll('input')) {
      if (!input.disabled && saved[input.name] === input.value) input.checked = true;
    }
  } catch { /* Storage is optional. The controls have built-in defaults. */ }
}
settings.addEventListener('change', () => {
  updatePlacement();
  try {
    localStorage.setItem('mousejig-settings', JSON.stringify({
      method: settings.elements.method.value,
      interval: settings.elements.interval.value,
      duration: settings.elements.duration.value
    }));
  } catch { /* The session can still run without saved settings. */ }
});

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  return (minutes >= 60 ? Math.floor(minutes / 60) + ':' + String(minutes % 60).padStart(2, '0') : minutes) +
    ':' + String(seconds % 60).padStart(2, '0');
}

function stop(message) {
  if (!active) return;
  const trigger = active.trigger;
  if (active.method === 'vibrate') vibrate(false);
  active = null;
  cancelAnimationFrame(frame);
  clearTimeout(timeout);
  keepAwake(false);
  session.hidden = true;
  home.hidden = false;
  notice.textContent = message;
  updatePlacement();
  trigger.focus();
}

function render() {
  const now = performance.now();
  const elapsed = now - active.start;
  if (elapsed >= active.duration) {
    stop(active.test ? 'Test finished. If the pointer stayed still, choose another movement and test again.' : 'Session complete.');
    return;
  }
  const phase = elapsed % active.interval;
  const timed = Number.isFinite(active.duration);
  const clockText = timed ? formatTime(Math.ceil((active.duration - elapsed) / 1000) * 1000) + ' left' : formatTime(elapsed) + ' elapsed';
  if (clock.textContent !== clockText) clock.textContent = clockText;
  const cycle = Math.floor(elapsed / active.interval);
  if (active.method === 'vibrate') {
    if (cycle !== active.lastPulse) {
      active.lastPulse = cycle;
      if (!vibrate(true)) {
        stop('Vibration was unavailable. Choose Fine grain or Wide bars to test the screen.');
        return;
      }
    }
  } else {
    // Hold the new position until the next nudge, then travel back. Even
    // the one-second setting has a distinct stationary part of each cycle.
    const progress = Math.min(phase / burstMs, 1);
    const eased = (1 - Math.cos(Math.PI * progress)) / 2;
    const position = cycle % 2 === 0 ? eased : 1 - eased;
    if (active.position !== position) {
      pad.drawSurface(active.method, position);
      active.position = position;
    }
    if (progress < 1) {
      frame = requestAnimationFrame(render);
      return;
    }
  }
  // Between nudges wake only for a timer tick, the next nudge, or the end.
  timeout = setTimeout(render, Math.max(1, Math.min(1000 - elapsed % 1000, active.interval - phase, active.duration - elapsed)));
}

function start(test, trigger) {
  if (active) return;
  const minutes = Number(settings.elements.duration.value);
  const seconds = Number(settings.elements.interval.value);
  const method = settings.elements.method.value;
  const vibrating = method === 'vibrate';
  active = {
    start: performance.now(), interval: test ? 1000 : seconds * 1000,
    duration: test ? testMs : (minutes ? minutes * 60000 : Infinity),
    method, position: null, lastPulse: -1, test, trigger
  };
  sessionNumber++;
  notice.textContent = '';
  document.querySelector('.tracking-area').hidden = vibrating;
  document.querySelector('#vibrationPlacement').hidden = !vibrating;
  document.querySelector('#activeTitle').textContent = vibrating ? 'Place the phone beside the mouse' : 'Place the sensor on the pad';
  document.querySelector('#sessionLabel').textContent = test ? 'Sensor test' : 'Jiggling';
  document.querySelector('#cadence').textContent = test ? 'Watch your PC pointer for a nudge every second.' : (seconds === 1 ? 'One nudge every second' : 'One nudge every ' + seconds + ' seconds');
  document.querySelector('#stopLabel').textContent = test ? 'End test' : 'Stop jiggling';
  home.hidden = true;
  session.hidden = false;
  window.scrollTo(0, 0);
  document.querySelector('#activeTitle').focus();
  keepAwake(true);
  render();
}

function suspend() { stop('Session ended when Mousejig left the foreground.'); }
function back() {
  if (guide.open) { guide.close(); return true; }
  if (active) { stop(active.test ? 'Test ended.' : 'Session stopped.'); return true; }
  return false;
}
window.mousejig = { suspend, back };
settings.addEventListener('submit', event => {
  event.preventDefault();
  start(false, settings.querySelector('[type=submit]'));
});
document.querySelector('#test').addEventListener('click', event => start(true, event.currentTarget));
document.querySelector('#stop').addEventListener('click', back);
document.querySelector('#guideButton').addEventListener('click', () => guide.showModal());
document.querySelector('#closeGuide').addEventListener('click', () => guide.close());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && active) back();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
window.addEventListener('pagehide', suspend);
window.addEventListener('resize', () => {
  if (!active) updatePlacement();
  else if (active.method !== 'vibrate') pad.drawSurface(active.method, active.position);
});
const hasVibration = supportsVibration();
document.querySelector('#vibrateOption').hidden = !hasVibration;
settings.querySelector('[value="vibrate"]').disabled = !hasVibration;
document.querySelector('#vibrationGuide').hidden = !hasVibration;
loadSettings();
updatePlacement();

if (window.isSecureContext && /^https?:$/.test(location.protocol) && !window.MousejigPower && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
