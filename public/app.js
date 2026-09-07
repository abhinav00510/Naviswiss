// ============================================================
// ORVIA FRONTEND
// ============================================================

// ============================================================
// THREE.JS
// ============================================================

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";


// ============================================================
// SOCKET.IO
// ============================================================

const socket = io();


// ============================================================
// THREE.JS VARIABLES
// ============================================================

let scene = null;
let camera = null;
let renderer = null;
let controls = null;

let femur = null;
let tibia = null;

let anatomyRoot = null;


// ============================================================
// SENSOR DATA
// ============================================================

const sensors = {

    THIGH: {

        connected: false,

        r: 1,
        i: 0,
        j: 0,
        k: 0

    },

    TIBIA: {

        connected: false,

        r: 1,
        i: 0,
        j: 0,
        k: 0

    }

};


// ============================================================
// CALIBRATION
// ============================================================

let calibration = {

    thigh: null,

    tibia: null

};


// ============================================================
// INITIALIZE THREE.JS
// ============================================================

function initThree() {

    const container =
        document.getElementById("threeContainer");


    if (!container) {

        console.error(
            "threeContainer not found!"
        );

        return;

    }


    // ========================================================
    // SCENE
    // ========================================================

    scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(0x050a12);


    // ========================================================
    // CAMERA
    // ========================================================

    camera =
        new THREE.PerspectiveCamera(

            45,

            container.clientWidth /
            container.clientHeight,

            0.01,

            1000

        );


    camera.position.set(
        0,
        0,
        5
    );


    camera.lookAt(
        0,
        0,
        0
    );


    // ========================================================
    // RENDERER
    // ========================================================

    renderer =
        new THREE.WebGLRenderer({

            antialias: true,

            alpha: true

        });


    renderer.setPixelRatio(
        window.devicePixelRatio
    );


    renderer.setSize(

        container.clientWidth,

        container.clientHeight

    );


    container.appendChild(
        renderer.domElement
    );


    // ========================================================
    // LIGHTS
    // ========================================================

    const ambient =
        new THREE.AmbientLight(

            0xffffff,

            2

        );


    scene.add(
        ambient
    );


    const directional =
        new THREE.DirectionalLight(

            0xffffff,

            4

        );


    directional.position.set(
        5,
        8,
        5
    );


    scene.add(
        directional
    );


    const directional2 =
        new THREE.DirectionalLight(

            0x88bbff,

            2

        );


    directional2.position.set(
        -5,
        2,
        -5
    );


    scene.add(
        directional2
    );


    // ========================================================
    // GRID
    // ========================================================

    const grid =
        new THREE.GridHelper(

            10,
            10,
            0x28415c,
            0x142536

        );


    grid.position.y = -2;


    scene.add(
        grid
    );


    // ========================================================
    // AXES
    // ========================================================

    const axes =
        new THREE.AxesHelper(2);


    scene.add(
        axes
    );


    // ========================================================
    // LOAD ANATOMY
    // ========================================================

    loadFemur();


    // ========================================================
    // RESIZE
    // ========================================================

    window.addEventListener(

        "resize",

        resizeThree

    );


    // ========================================================
    // START ANIMATION
    // ========================================================

    animate();

}


// ============================================================
// LOAD ORVIA GLB
// ============================================================

function loadFemur() {

    const loader =
        new GLTFLoader();


    console.log(
        "Loading ORVIA anatomy..."
    );


    loader.load(

        "/orvia.glb",


        function (gltf) {

            console.log(
                "================================"
            );

            console.log(
                "ORVIA GLB LOADED SUCCESSFULLY"
            );

            console.log(
                "================================"
            );


            // =================================================
            // ROOT MODEL
            // =================================================

            anatomyRoot =
                gltf.scene;


            femur =
                anatomyRoot;


            tibia =
                null;


            // =================================================
            // PRINT ALL GLB OBJECTS
            // =================================================

            console.log(
                "========== GLB OBJECTS =========="
            );


            anatomyRoot.traverse(

                function (object) {

                    console.log(

                        "OBJECT:",

                        object.name,

                        "| TYPE:",

                        object.type

                    );

                }

            );


            console.log(
                "================================="
            );


            // =================================================
            // SEARCH FOR TIBIA
            // =================================================

            anatomyRoot.traverse(

                function (object) {

                    if (!object.isMesh) {

                        return;

                    }


                    const objectName =
                        (
                            object.name || ""
                        ).toLowerCase();


                    if (

                        objectName.includes("tibia") ||

                        objectName.includes("lower") ||

                        objectName.includes("leg")

                    ) {

                        tibia =
                            object;


                        console.log(

                            "TIBIA OBJECT FOUND:",

                            object.name

                        );

                    }

                }

            );


            // =================================================
            // IF NO TIBIA OBJECT FOUND
            // =================================================

            if (!tibia) {

                console.warn(
                    "No separate tibia object found in GLB."
                );

                console.warn(
                    "Current GLB appears to contain one mesh."
                );

                console.warn(
                    "Using complete anatomy as temporary movement target."
                );

                tibia =
                    anatomyRoot;

            }


            // =================================================
            // ADD MODEL TO SCENE
            // =================================================

            scene.add(
                anatomyRoot
            );


            // =================================================
            // MODEL SIZE
            // =================================================

            const box =
                new THREE.Box3()
                    .setFromObject(
                        anatomyRoot
                    );


            const size =
                box.getSize(
                    new THREE.Vector3()
                );


            const center =
                box.getCenter(
                    new THREE.Vector3()
                );


            console.log(
                "Original model size:",
                size
            );


            console.log(
                "Original model center:",
                center
            );


            // =================================================
            // CENTER MODEL
            // =================================================

            anatomyRoot.position.sub(
                center
            );


            // =================================================
            // SCALE MODEL
            // =================================================

            const maxDimension =
                Math.max(

                    size.x,

                    size.y,

                    size.z

                );


            if (maxDimension > 0) {

                const scale =
                    3 / maxDimension;


                anatomyRoot.scale.set(

                    scale,

                    scale,

                    scale

                );

            }


            // =================================================
            // PORTRAIT ORIENTATION
            // =================================================

            anatomyRoot.rotation.z =
                Math.PI / 2;


            console.log(
                "Model centered."
            );


            console.log(
                "Model scaled."
            );


            console.log(
                "Model rotated to portrait."
            );


            console.log(
                "================================"
            );

        },


        // =====================================================
        // LOADING PROGRESS
        // =====================================================

        function (xhr) {

            if (xhr.total > 0) {

                const progress =
                    (
                        xhr.loaded /
                        xhr.total
                    ) * 100;


                console.log(

                    "GLB Loading:",

                    progress.toFixed(2) + "%"

                );

            }

        },


        // =====================================================
        // ERROR
        // =====================================================

        function (error) {

            console.error(
                "================================"
            );


            console.error(
                "ERROR LOADING ORVIA GLB"
            );


            console.error(
                error
            );


            console.error(
                "================================"
            );

        }

    );

}


// ============================================================
// UPDATE FEMUR ROTATION
// ============================================================

function updateFemurRotation() {

    if (!femur) {

        return;

    }


    const sensor =
        sensors.THIGH;


    if (!sensor.connected) {

        return;

    }


    // --------------------------------------------------------
    // SENSOR QUATERNION
    // --------------------------------------------------------

    const sensorQuaternion =
        new THREE.Quaternion(

            sensor.i,

            sensor.j,

            sensor.k,

            sensor.r

        );


    // --------------------------------------------------------
    // CALIBRATION
    // --------------------------------------------------------

    if (calibration.thigh) {

        const calibrationQuaternion =
            new THREE.Quaternion(

                calibration.thigh.i,

                calibration.thigh.j,

                calibration.thigh.k,

                calibration.thigh.r

            );


        const inverseCalibration =
            calibrationQuaternion
                .clone()
                .invert();


        sensorQuaternion.premultiply(
            inverseCalibration
        );

    }


    // --------------------------------------------------------
    // APPLY ROTATION
    // --------------------------------------------------------

    femur.quaternion.copy(
        sensorQuaternion
    );

}


// ============================================================
// UPDATE TIBIA ROTATION
// ============================================================

function updateTibiaRotation() {

    if (!tibia) {

        return;

    }


    const sensor =
        sensors.TIBIA;


    if (!sensor.connected) {

        return;

    }


    // --------------------------------------------------------
    // SENSOR QUATERNION
    // --------------------------------------------------------

    const sensorQuaternion =
        new THREE.Quaternion(

            sensor.i,

            sensor.j,

            sensor.k,

            sensor.r

        );


    // --------------------------------------------------------
    // CALIBRATION
    // --------------------------------------------------------

    if (calibration.tibia) {

        const calibrationQuaternion =
            new THREE.Quaternion(

                calibration.tibia.i,

                calibration.tibia.j,

                calibration.tibia.k,

                calibration.tibia.r

            );


        const inverseCalibration =
            calibrationQuaternion
                .clone()
                .invert();


        sensorQuaternion.premultiply(
            inverseCalibration
        );

    }


    // --------------------------------------------------------
    // APPLY TIBIA ROTATION
    // --------------------------------------------------------

    tibia.quaternion.copy(
        sensorQuaternion
    );

}


// ============================================================
// SOCKET.IO CONNECT
// ============================================================

socket.on(

    "connect",

    function () {

        console.log(
            "Socket.IO connected to server."
        );

    }

);


socket.on(

    "disconnect",

    function () {

        console.log(
            "Socket.IO disconnected."
        );

    }

);


// ============================================================
// RECEIVE SENSOR DATA
// ============================================================

socket.on(

    "sensor",

    function (data) {

        console.log(
            "Dashboard received:",
            data
        );


        // ----------------------------------------------------
        // KIT
        // ----------------------------------------------------

        const kit =
            data.kit;


        if (

            kit !== "THIGH" &&

            kit !== "TIBIA"

        ) {

            console.warn(
                "Unknown kit:",
                kit
            );


            return;

        }


        // ----------------------------------------------------
        // SAVE SENSOR DATA
        // ----------------------------------------------------

        sensors[kit] = {

            connected: true,

            r: Number(data.r) || 0,

            i: Number(data.i) || 0,

            j: Number(data.j) || 0,

            k: Number(data.k) || 0

        };


        // ----------------------------------------------------
        // UPDATE UI
        // ----------------------------------------------------

        updateSensorUI();

        updateConnectionStatus();

        updateMetrics();


        // ----------------------------------------------------
        // UPDATE 3D MODEL
        // ----------------------------------------------------

        if (kit === "THIGH") {

            updateFemurRotation();

        }


        if (kit === "TIBIA") {

            updateTibiaRotation();

        }

    }

);


// ============================================================
// SENSOR UI
// ============================================================

function updateSensorUI() {


    // ========================================================
    // THIGH
    // ========================================================

    if (sensors.THIGH.connected) {

        const s =
            sensors.THIGH;


        const element =
            document.getElementById(
                "femurData"
            );


        if (element) {

            element.textContent =

                `${s.r.toFixed(3)} ` +

                `${s.i.toFixed(3)} ` +

                `${s.j.toFixed(3)} ` +

                `${s.k.toFixed(3)}`;

        }


        const status =
            document.getElementById(
                "thighStatus"
            );


        if (status) {

            status.textContent =
                "LIVE";

        }

    }


    // ========================================================
    // TIBIA
    // ========================================================

    if (sensors.TIBIA.connected) {

        const s =
            sensors.TIBIA;


        const element =
            document.getElementById(
                "tibiaData"
            );


        if (element) {

            element.textContent =

                `${s.r.toFixed(3)} ` +

                `${s.i.toFixed(3)} ` +

                `${s.j.toFixed(3)} ` +

                `${s.k.toFixed(3)}`;

        }


        const status =
            document.getElementById(
                "tibiaStatus"
            );


        if (status) {

            status.textContent =
                "LIVE";

        }

    }

}


// ============================================================
// CONNECTION STATUS
// ============================================================

function updateConnectionStatus() {

    let count = 0;


    if (sensors.THIGH.connected) {

        count++;

    }


    if (sensors.TIBIA.connected) {

        count++;

    }


    const countElement =
        document.getElementById(
            "sensorCount"
        );


    if (countElement) {

        countElement.textContent =

            `${count}/3 SENSORS CONNECTED`;

    }


    const status =
        document.getElementById(
            "systemStatus"
        );


    const dot =
        document.getElementById(
            "statusDot"
        );


    if (count > 0) {

        if (status) {

            status.textContent =
                "SYSTEM ONLINE";

        }


        if (dot) {

            dot.classList.add(
                "online"
            );

        }

    }

}


// ============================================================
// METRICS
// ============================================================

function updateMetrics() {

    const s =
        sensors.THIGH;


    if (!s.connected) {

        return;

    }


    const euler =
        quaternionToEuler(

            s.r,

            s.i,

            s.j,

            s.k

        );


    const roll =
        document.getElementById(
            "rollValue"
        );


    const pitch =
        document.getElementById(
            "pitchValue"
        );


    const yaw =
        document.getElementById(
            "yawValue"
        );


    if (roll) {

        roll.textContent =
            `${euler.roll.toFixed(1)}°`;

    }


    if (pitch) {

        pitch.textContent =
            `${euler.pitch.toFixed(1)}°`;

    }


    if (yaw) {

        yaw.textContent =
            `${euler.yaw.toFixed(1)}°`;

    }

}


// ============================================================
// QUATERNION → EULER
// ============================================================

function quaternionToEuler(
    r,
    i,
    j,
    k
) {

    const sinr_cosp =
        2 * (
            r * i +
            j * k
        );


    const cosr_cosp =
        1 -
        2 * (
            i * i +
            j * j
        );


    const roll =
        Math.atan2(

            sinr_cosp,

            cosr_cosp

        );


    const sinp =
        2 * (
            r * j -
            k * i
        );


    let pitch;


    if (
        Math.abs(sinp) >= 1
    ) {

        pitch =
            (
                Math.sign(sinp) *
                Math.PI
            ) / 2;

    }

    else {

        pitch =
            Math.asin(sinp);

    }


    const siny_cosp =
        2 * (
            r * k +
            i * j
        );


    const cosy_cosp =
        1 -
        2 * (
            j * j +
            k * k
        );


    const yaw =
        Math.atan2(

            siny_cosp,

            cosy_cosp

        );


    return {

        roll:
            (
                roll *
                180
            ) /
            Math.PI,


        pitch:
            (
                pitch *
                180
            ) /
            Math.PI,


        yaw:
            (
                yaw *
                180
            ) /
            Math.PI

    };

}


// ============================================================
// THREE.JS ANIMATION
// ============================================================

function animate() {

    requestAnimationFrame(
        animate
    );


    if (

        renderer &&

        scene &&

        camera

    ) {

        renderer.render(

            scene,

            camera

        );

    }

}


// ============================================================
// RESIZE
// ============================================================

function resizeThree() {

    const container =
        document.getElementById(
            "threeContainer"
        );


    if (!container) {

        return;

    }


    const width =
        container.clientWidth;


    const height =
        container.clientHeight;


    if (

        width === 0 ||

        height === 0

    ) {

        return;

    }


    camera.aspect =
        width / height;


    camera.updateProjectionMatrix();


    renderer.setSize(

        width,

        height

    );

}


// ============================================================
// RESET CAMERA
// ============================================================

document
    .getElementById("resetCamera")
    ?.addEventListener(

        "click",

        function () {

            if (!camera) {

                return;

            }


            camera.position.set(

                0,

                0,

                5

            );


            camera.lookAt(

                0,

                0,

                0

            );

        }

    );


// ============================================================
// FULLSCREEN
// ============================================================

document
    .getElementById("fullscreen")
    ?.addEventListener(

        "click",

        function () {

            const panel =
                document.querySelector(
                    ".visual-panel"
                );


            if (
                panel &&
                panel.requestFullscreen
            ) {

                panel.requestFullscreen();

            }

        }

    );


// ============================================================
// CALIBRATION
// ============================================================

document
    .getElementById("calibrateBtn")
    ?.addEventListener(

        "click",

        function () {

            // ------------------------------------------------
            // THIGH CALIBRATION
            // ------------------------------------------------

            if (
                sensors.THIGH.connected
            ) {

                calibration.thigh = {

                    ...sensors.THIGH

                };

            }


            // ------------------------------------------------
            // TIBIA CALIBRATION
            // ------------------------------------------------

            if (
                sensors.TIBIA.connected
            ) {

                calibration.tibia = {

                    ...sensors.TIBIA

                };

            }


            const status =
                document.getElementById(
                    "alignmentStatus"
                );


            if (status) {

                status.textContent =
                    "Reference Calibrated";

            }


            console.log(
                "Calibration saved."
            );

        }

    );


// ============================================================
// RESET
// ============================================================

document
    .getElementById("resetBtn")
    ?.addEventListener(

        "click",

        function () {

            calibration.thigh =
                null;


            calibration.tibia =
                null;


            const status =
                document.getElementById(
                    "alignmentStatus"
                );


            if (status) {

                status.textContent =
                    "Awaiting Movement";

            }


            const angle =
                document.getElementById(
                    "kneeAngle"
                );


            if (angle) {

                angle.textContent =
                    "0.0°";

            }

        }

    );


// ============================================================
// START APPLICATION
// ============================================================

initThree();