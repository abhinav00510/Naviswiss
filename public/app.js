const socket = io();

const m1yaw = document.getElementById("m1yaw");
const m1pitch = document.getElementById("m1pitch");
const m1roll = document.getElementById("m1roll");

const m2yaw = document.getElementById("m2yaw");
const m2pitch = document.getElementById("m2pitch");
const m2roll = document.getElementById("m2roll");

const log = document.getElementById("log");

function createChart(ctx) {
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Yaw", data: [], borderWidth: 1, tension: 0.2 },
        { label: "Pitch", data: [], borderWidth: 1, tension: 0.2 },
        { label: "Roll", data: [], borderWidth: 1, tension: 0.2 },
      ],
    },
    options: {
      animation: false,
      scales: {
        y: { suggestedMin: -180, suggestedMax: 180 },
        x: { display: false },
      },
    },
  });
}

const chart1 = createChart(document.getElementById("chart1").getContext("2d"));
const chart2 = createChart(document.getElementById("chart2").getContext("2d"));

function push(chart, y, p, r) {
  chart.data.labels.push("");
  chart.data.datasets[0].data.push(y);
  chart.data.datasets[1].data.push(p);
  chart.data.datasets[2].data.push(r);

  if (chart.data.labels.length > 80) {
    chart.data.labels.shift();
    chart.data.datasets.forEach((d) => d.data.shift());
  }

  chart.update("none");
}

// ---------------- 3D ----------------

let scene, camera, renderer, cube1, cube2;

function init3D() {
  const container = document.getElementById("threeCanvas");
  const width = container.clientWidth;
  const height = container.clientHeight;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 2.5, 6);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  const g = new THREE.BoxGeometry(1.2, 1.2, 1.2);

  cube1 = new THREE.Mesh(g, new THREE.MeshNormalMaterial());
  cube1.position.set(-1.8, 0.6, 0);
  scene.add(cube1);

  cube2 = new THREE.Mesh(g, new THREE.MeshNormalMaterial());
  cube2.position.set(1.8, 0.6, 0);
  scene.add(cube2);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

init3D();

// Smooth interpolation
function lerp(a, b, t) {
  return a + (b - a) * t;
}

let last = {
  m1: { yaw: 0, pitch: 0, roll: 0 },
  m2: { yaw: 0, pitch: 0, roll: 0 },
};

socket.on("sensor", (data) => {
  const m1 = data.mpu1;
  const m2 = data.mpu2;

  m1yaw.innerText = m1.yaw.toFixed(2);
  m1pitch.innerText = m1.pitch.toFixed(2);
  m1roll.innerText = m1.roll.toFixed(2);

  m2yaw.innerText = m2.yaw.toFixed(2);
  m2pitch.innerText = m2.pitch.toFixed(2);
  m2roll.innerText = m2.roll.toFixed(2);

  push(chart1, m1.yaw, m1.pitch, m1.roll);
  push(chart2, m2.yaw, m2.pitch, m2.roll);

  last.m1.yaw = lerp(last.m1.yaw, m1.yaw * Math.PI / 180, 0.15);
  last.m1.pitch = lerp(last.m1.pitch, m1.pitch * Math.PI / 180, 0.15);
  last.m1.roll = lerp(last.m1.roll, m1.roll * Math.PI / 180, 0.15);

  last.m2.yaw = lerp(last.m2.yaw, m2.yaw * Math.PI / 180, 0.15);
  last.m2.pitch = lerp(last.m2.pitch, m2.pitch * Math.PI / 180, 0.15);
  last.m2.roll = lerp(last.m2.roll, m2.roll * Math.PI / 180, 0.15);

  cube1.rotation.set(last.m1.pitch, last.m1.yaw, last.m1.roll);
  cube2.rotation.set(last.m2.pitch, last.m2.yaw, last.m2.roll);

  log.innerText = "Last packet: " + new Date(data.time).toLocaleTimeString();
});
