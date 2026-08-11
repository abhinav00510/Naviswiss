const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const WebSocket = require("ws");
const path = require("path");

const ESP_IP = "192.168.19.88";       // <===== YOUR ESP32 IP
const ESP_PORT = 81;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Serve dashboard files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Start dashboard server
server.listen(3000, () => {
  console.log("Dashboard running: http://localhost:3000");
});

// =============== CONNECT TO ESP32 ===============
function connectToESP() {
  console.log("Connecting to ESP32 WebSocket...");

  const ws = new WebSocket(`ws://${ESP_IP}:${ESP_PORT}`);

  ws.on("open", () => {
    console.log("✔ Connected to ESP32");
  });

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      data.time = Date.now();
      io.emit("sensor", data);
    } catch (err) {
      console.log("Invalid JSON:", msg.toString());
    }
  });

  ws.on("close", () => {
    console.log("ESP disconnected — retrying...");
    setTimeout(connectToESP, 2000);
  });

  ws.on("error", () => {
    console.log("Connection failed — retrying...");
  });
}

connectToESP();
