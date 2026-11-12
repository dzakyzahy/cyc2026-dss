import {PerspectiveCamera, MOUSE, Vector3} from './vendor/three.core.min.js';
import {OrbitControls} from './vendor/OrbitControls.js';

// Same bounded OrbitControls interaction as the supplied Cirata reference.
// Plotly renders metric data; only the viewing camera changes here.
export function attachTerrainControls(el, initial, onChange) {
  const view = new PerspectiveCamera(45, el.clientWidth / el.clientHeight, .01, 100);
  view.up.set(0, 0, 1);
  view.position.set(initial.eye.x, initial.eye.y, initial.eye.z);
  const controls = new OrbitControls(view, el);
  controls.target.set(initial.center.x, initial.center.y, initial.center.z);
  controls.autoRotate = false;
  controls.enableDamping = false; // Stop immediately when a drag ends.
  controls.minPolarAngle = Math.PI / 8;
  controls.maxPolarAngle = Math.PI / 2.15;
  controls.minDistance = .65;
  controls.maxDistance = 4.2;
  controls.rotateSpeed = .45;
  controls.panSpeed = .7;
  controls.zoomSpeed = .7;
  controls.maxTargetRadius = 1.5;
  controls.update();
  const snapshot = () => ({eye:{x:view.position.x,y:view.position.y,z:view.position.z},
    center:{x:controls.target.x,y:controls.target.y,z:controls.target.z},up:{x:0,y:0,z:1}});
  const change = () => onChange(snapshot(), {
    elevation:90-controls.getPolarAngle()*180/Math.PI,
    distance:view.position.distanceTo(controls.target)
  });
  controls.addEventListener('change', change);
  const resize = new ResizeObserver(() => {view.aspect=el.clientWidth/el.clientHeight;view.updateProjectionMatrix();});
  resize.observe(el);
  el.tabIndex = 0;
  el.setAttribute('role','region');
  el.setAttribute('aria-label','Terrain 3D. Drag kiri untuk putar, kanan untuk geser, scroll untuk zoom. Tombol panah menggeser, plus minus untuk zoom, R untuk reset.');
  const zoom = factor => {
    const offset = new Vector3().subVectors(view.position,controls.target);
    offset.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,offset.length()*factor)));
    view.position.copy(controls.target).add(offset);controls.update();
  };
  const reset = () => {controls.target.set(0,0,0);view.position.set(initial.eye.x,initial.eye.y,initial.eye.z);controls.update();};
  controls.listenToKeyEvents(el);
  const keys = event => {
    if(event.key==='+'||event.key==='='){event.preventDefault();zoom(.85);}
    if(event.key==='-'){event.preventDefault();zoom(1/.85);}
    if(event.key.toLowerCase()==='r'){event.preventDefault();reset();}
  };
  el.addEventListener('keydown',keys);
  return {snapshot,zoom,reset,
    mode:mode=>{controls.mouseButtons.LEFT=mode==='pan'?MOUSE.PAN:MOUSE.ROTATE;},
    dispose:()=>{controls.dispose();resize.disconnect();el.removeEventListener('keydown',keys);}
  };
}
