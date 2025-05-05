const scene = new THREE.Scene();
scene.background = null;

const starsGeometry = new THREE.BufferGeometry();
const starsCount = 10000;
const positions = new Float32Array(starsCount * 3);

for (let i = 0; i < starsCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 2000;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1,
    transparent: true,
    opacity: 0.8
});
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);


//scene.background = new THREE.Color(0x333333);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('canvas'),
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

let model;
let isDragging = false;
let previousPosition = { x: 0, y: 0 };
let scale = 1;

const loader = new THREE.GLTFLoader();
loader.load(
    'models/model.glb',
    (gltf) => {
        model = gltf.scene;
        scene.add(model);
        
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;
        
        camera.lookAt(center);
        camera.position.copy(center);
        camera.position.z += size * 1.5;
    },
    undefined,
    (error) => console.error('Ошибка:', error)
);

function handleStart(x, y) {
    isDragging = true;
    previousPosition = { x, y };
}

function handleMove(x, y) {
    if (!isDragging || !model) return;
    
    const deltaX = x - previousPosition.x;
    const deltaY = y - previousPosition.y;
    
    model.rotation.y += deltaX * 0.01;
    model.rotation.x += deltaY * 0.01;
    
    previousPosition = { x, y };
}

function handleEnd() {
    isDragging = false;
}

document.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
document.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
document.addEventListener('mouseup', handleEnd);

document.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleStart(e.touches[0].clientX, e.touches[0].clientY);
});

document.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
});

document.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleEnd();
});

let initialDistance = null;

document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        initialDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
});

document.addEventListener('touchmove', (e) => {
    if (!model || e.touches.length !== 2 || !initialDistance) return;
    e.preventDefault();
    
    const currentDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
    );
    
    const delta = currentDistance / initialDistance;
    camera.position.z *= 1 / delta;
    initialDistance = currentDistance;
});

document.addEventListener('wheel', (e) => {
    if (!model) return;
    e.preventDefault();
    camera.position.z += e.deltaY * 0.05;
});

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});