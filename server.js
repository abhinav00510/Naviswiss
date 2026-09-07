const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const WebSocket = require("ws");
const path = require("path");


// ============================================================
// ESP32 CONFIGURATION
// ============================================================

const KITS = {
    THIGH: {
        ip: "10.25.58.84",
        port: 81
    },

    KNEE: {
        ip: "192.168.0.156",
        port: 81
    },

    TIBIA: {
        ip: "10.25.58.28",
        port: 81
    }
};


// ============================================================
// EXPRESS
// ============================================================

const app = express();

const server =
    http.createServer(app);

const io =
    socketio(server);


app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "index.html"
            )
        );

    }
);


// ============================================================
// START SERVER
// ============================================================

server.listen(
    3000,
    () => {

        console.log(
            "================================"
        );

        console.log(
            "ORVIA DASHBOARD"
        );

        console.log(
            "================================"
        );

        console.log(
            "Dashboard:"
        );

        console.log(
            "http://localhost:3000"
        );

        console.log(
            "================================"
        );

    }
);


// ============================================================
// CONNECT TO ESP32
// ============================================================

function connectToKit(name, config) {

    console.log(
        `Connecting to ${name} (${config.ip}:${config.port})...`
    );

    const ws = new WebSocket(
        `ws://${config.ip}:${config.port}`
    );


    ws.on("open", () => {

        console.log(
            `✔ ${name} CONNECTED`
        );

    });


    ws.on("message", (msg) => {

        try {

            const data =
                JSON.parse(
                    msg.toString()
                );


            data.time =
                Date.now();


            data.kit =
                name;


            io.emit(
                "sensor",
                data
            );


            console.log(
                `${name}:`,
                `r=${data.r}`,
                `i=${data.i}`,
                `j=${data.j}`,
                `k=${data.k}`
            );

        }

        catch (error) {

            console.log(
                `${name} sent invalid JSON:`,
                msg.toString()
            );

        }

    });


    ws.on("close", () => {

        console.log(
            `⚠ ${name} disconnected. Retrying in 2 seconds...`
        );


        setTimeout(
            () => connectToKit(
                name,
                config
            ),
            2000
        );

    });


    ws.on("error", () => {

        console.log(
            `✖ ${name} connection failed.`
        );

    });

}


// ============================================================
// START ALL THREE KITS
// ============================================================

connectToKit(
    "THIGH",
    KITS.THIGH
);

connectToKit(
    "KNEE",
    KITS.KNEE
);

connectToKit(
    "TIBIA",
    KITS.TIBIA
);