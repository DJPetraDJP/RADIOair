// Einfaches Three.js-Szene-Setup mit interaktiven Elementen
// Anpassbar: Pfade, Farben, Größen

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b0b0f, 0.01);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0b0b0f);
container.appendChild(renderer.domElement);

// Licht
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemi.position.set(0, 10, 0);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);

// Boden
const floorGeo = new THREE.PlaneGeometry(30, 40);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Wände (einfach)
const wallMat = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.9 });
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), wallMat);
backWall.position.set(0, 4, -18);
scene.add(backWall);

// Sofas (einfach)
function makeSofa(x, z) {
  const g = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 1.4), new THREE.MeshStandardMaterial({ color: 0xffb6d9, roughness: 0.6 }));
  seat.position.y = 0.4;
  g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 0.3), new THREE.MeshStandardMaterial({ color: 0xff90d0 }));
  back.position.set(0, 0.95, -0.55);
  g.add(back);
  g.position.set(x, 0, z);
  scene.add(g);
}
makeSofa(-6, -6);
makeSofa(6, -6);
makeSofa(-6, -2);
makeSofa(6, -2);

// Markierungs-Kästchen (wo man hinlaufen/teleportieren kann)
const markerMat = new THREE.MeshStandardMaterial({ color: 0x66d9ff, emissive: 0x113344, metalness: 0.2 });
const markers = [];
const markerPositions = [
  { x: -4, z: 2 },
  { x: 0, z: 2 },
  { x: 4, z: 2 },
  { x: 0, z: -8 }
];
markerPositions.forEach((p, i) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), markerMat.clone());
  m.position.set(p.x, 0.1, p.z);
  m.userData.isMarker = true;
  scene.add(m);
  markers.push(m);
});

// Musikbox (hinten in der Halle) - Neon/Pink-Highlight
const boxGroup = new THREE.Group();
const boxBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.8, 1.6), new THREE.MeshStandardMaterial({ color: 0x222233 }));
const neon = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 1.8), new THREE.MeshStandardMaterial({ color: 0xff2fbf, emissive: 0xff2fbf, emissiveIntensity: 0.6 }));
neon.position.y = 1.05;
boxGroup.add(boxBase);
boxGroup.add(neon);
boxGroup.position.set(0, 0.9, -16);
boxGroup.userData.isMusicBox = true;
scene.add(boxGroup);

// ein dezenter Schein (fake bloom) - glühender Ring als Sprite
const spriteMap = new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/2/2c/Light_blue_glow.png');
const spriteMat = new THREE.SpriteMaterial({ map: spriteMap, color: 0xff66aa, blending: THREE.AdditiveBlending, opacity: 0.6 });
const glow = new THREE.Sprite(spriteMat);
glow.scale.set(6, 3, 1);
glow.position.set(0, 1.6, -15.5);
scene.add(glow);

// 4 Audio-Slots
const audioSlots = [null, null, null, null];
const audioElements = [null, null, null, null];
const uploadBtns = document.querySelectorAll('.uploadBtn');
const playBtns = document.querySelectorAll('.playBtn');
const fileInput = document.getElementById('fileInput');

uploadBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const slot = parseInt(btn.dataset.slot);
    fileInput.dataset.slot = slot;
    fileInput.click();
  });
});
fileInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  const slot = parseInt(e.target.dataset.slot);
  if (!f) return;
  const url = URL.createObjectURL(f);
  audioSlots[slot] = { file: f, url };
  if (audioElements[slot]) {
    audioElements[slot].src = url;
  } else {
    audioElements[slot] = new Audio(url);
    audioElements[slot].crossOrigin = "anonymous";
  }
  playBtns[slot].disabled = false;
  // Highlight musicbox pink when any slot filled
  if (audioSlots.some(Boolean)) {
    neon.material.emissiveIntensity = 1.2;
    spriteMat.color = new THREE.Color(0xff66aa);
  }
  fileInput.value = ""; // reset
});

playBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const slot = parseInt(btn.dataset.slot);
    if (!audioElements[slot]) return;
    // stop others
    audioElements.forEach((a, i) => { if (a && i !== slot) a.pause(); });
    audioElements[slot].currentTime = 0;
    audioElements[slot].play();
    // animate musicbox color to show playing
    neon.material.emissiveIntensity = 2.2;
    setTimeout(()=>neon.material.emissiveIntensity = 1.2, 800);
  });
});

// Einfaches Movement (Pfeiltasten)
const player = { pos: new THREE.Vector3(0, 0, 6), rotY: 0 };
camera.position.set(player.pos.x, 2, player.pos.z);
camera.rotation.order = "YXZ";

const keys = { ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false };
window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key)) keys[e.key]=true; });
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key]=false; });

// Raycaster für Klick-Teleport auf Marker
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('click', (ev) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = - ((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(markers.concat([boxBase, neon]), true);
  if (intersects.length) {
    const it = intersects[0].object;
    if (it.userData.isMarker) {
      // teleport
      player.pos.set(it.position.x, 0, it.position.z + 1.2);
      camera.position.set(player.pos.x, 2, player.pos.z);
    } else if (it.parent && it.parent.userData.isMusicBox) {
      // klick auf musikbox -> play first available slot
      for (let i=0;i<audioElements.length;i++){
        if (audioElements[i]){ audioElements.forEach((a,j)=>{if(a && j!==i) a.pause();}); audioElements[i].currentTime=0; audioElements[i].play(); break;}
      }
    }
  }
});

// Roboter (pink, fährt im Kreis)
const robot = new THREE.Group();
const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff9fcb }));
body.position.y = 0.45;
robot.add(body);
// Augen als kleine schwarze spheres
const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
const leftEye = new THREE.Mesh(eyeGeo, new THREE.MeshStandardMaterial({ color: 0x040404 }));
leftEye.position.set(-0.12, 0.6, 0.32);
const rightEye = leftEye.clone();
rightEye.position.x = 0.12;
robot.add(leftEye, rightEye);
// Tablet (plane) attached
const tabletGeo = new THREE.PlaneGeometry(0.3, 0.18);
const tabletMat = new THREE.MeshStandardMaterial({ color: 0x223344, emissive:0x112233 });
const tablet = new THREE.Mesh(tabletGeo, tabletMat);
tablet.position.set(0, 0.25, -0.43);
tablet.rotation.x = -0.4;
robot.add(tablet);
// Flasche (kleiner cylinder)
const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.18,12), new THREE.MeshStandardMaterial({ color:0x66ffcc }));
bottle.position.set(0.24, 0.2, 0.28);
bottle.rotation.x = 0.4;
robot.add(bottle);

robot.position.set(2, 0, -4);
scene.add(robot);

let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  // Bewegung basierend auf keys
  const speed = 4;
  if (keys.ArrowLeft) player.rotY += dt * 1.8;
  if (keys.ArrowRight) player.rotY -= dt * 1.8;
  let forward = 0;
  if (keys.ArrowUp) forward = -1;
  if (keys.ArrowDown) forward = 1;
  if(forward !== 0){
    const dx = Math.sin(player.rotY) * forward * speed * dt;
    const dz = Math.cos(player.rotY) * forward * speed * dt;
    player.pos.x += dx;
    player.pos.z += dz;
  }
  camera.position.set(player.pos.x, 2, player.pos.z);
  camera.rotation.y = player.rotY;

  // Roboter fährt im Kreis
  const t = performance.now() / 1000;
  const r = 3.0;
  robot.position.x = Math.cos(t) * r;
  robot.position.z = Math.sin(t) * r - 6;
  robot.rotation.y = -t * 1.2;
  // Roboter lächelt: leichtes Kopfneigen animation
  tablet.rotation.z = Math.sin(t*2) * 0.08;

  // leichte Puls-Effekte bei Musikbox (wenn audio läuft)
  const anyPlaying = audioElements.some(a => a && !a.paused && a.currentTime > 0);
  glow.material.opacity = anyPlaying ? 1.0 : 0.6;
  neon.material.emissiveIntensity = anyPlaying ? 2.5 : (audioSlots.some(Boolean) ? 1.2 : 0.6);

  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
