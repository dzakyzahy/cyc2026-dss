// Phones scroll the full plot; explicit buttons change its horizontal scale.
// Desktop Plotly interaction remains unchanged.
export function attachNagNavigation({chart, scroller, controls, render}) {
  const media = window.matchMedia('(max-width: 767px)');
  const levels = [1, 1.5, 2, 3];
  const [minus, plus, reset] = controls.querySelectorAll('button');
  const status = controls.querySelector('[role="status"]');
  let level = 0, disposed = false;

  function updateButtons() {
    minus.disabled = level === 0;
    plus.disabled = level === levels.length - 1;
    status.textContent = `Zoom horizontal ${levels[level].toLocaleString('id-ID')}×`;
  }
  async function changeLevel(next) {
    if (!media.matches || disposed) return;
    const centre = (scroller.scrollLeft + scroller.clientWidth / 2) / chart.offsetWidth;
    level = Math.max(0, Math.min(levels.length - 1, next));
    const width = 720 * levels[level];
    chart.style.width = `${width}px`;
    updateButtons();
    await window.Plotly.relayout(chart, {width, autosize: false});
    if (!disposed) scroller.scrollLeft = Math.max(0, centre * width - scroller.clientWidth / 2);
  }
  async function applyMode() {
    level = 0;
    controls.hidden = !media.matches;
    chart.style.width = media.matches ? '720px' : '';
    chart.style.pointerEvents = media.matches ? 'none' : '';
    scroller.style.touchAction = media.matches ? 'pan-x pan-y' : '';
    updateButtons();
    await render(media.matches);
    if (!disposed) scroller.scrollLeft = 0;
  }
  minus.onclick = () => changeLevel(level - 1);
  plus.onclick = () => changeLevel(level + 1);
  reset.onclick = () => changeLevel(0);
  media.addEventListener('change', applyMode);
  applyMode();
  return {dispose() {disposed = true; media.removeEventListener('change', applyMode);}};
}
