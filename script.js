import * as THREE from "./build/three.module.js";
import { OrbitControls } from "./examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "./examples/jsm/loaders/GLTFLoader.js";
import { FontLoader } from './examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from './examples/jsm/geometries/TextGeometry.js';

let scene, cameraP, cameraT, renderer, control, textureLoader, spaceship, spotlight, spaceshipControls, activeCamera, font, intersects, textMesh = null;
let mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, saturnRing, uranusRing, sun, satellite;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

let speed = 0.5;  

const colorList = [
    "#00FFFF", "#00FF00", "#FFCC00", "#E6E6FA", "#FF69B4", 
    "#FF8C00", "#FFB6C1", "#00FFFF", "#87CEEB", "#A8FFB2", 
    "#EE82EE", "#ADD8E6"
];

const planetNames = ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Sun"];

let hoveredObject = null;
let originalRotationSpeeds = {}; 
const rotationSpeedIncrease = 0.05;


let init = () => {
    scene = new THREE.Scene();
    cameraP = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    
    cameraP.position.set(640, 480, 240);
    
    
    cameraT = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 10000);
    cameraT.position.set(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    // Load the skybox textures
    const textureLoaderCube = new THREE.CubeTextureLoader();
    const skyboxTextures = textureLoaderCube.load([
        "./assets/skybox/right.png", 
        './assets/skybox/left.png', 
        './assets/skybox/top.png', 
        './assets/skybox/bottom.png', 
        './assets/skybox/front.png', 
        './assets/skybox/back.png'  
    ]);

    scene.background = skyboxTextures;

    scene.environment = skyboxTextures;
    
    document.body.appendChild(renderer.domElement);
    
    activeCamera = cameraP;

    textureLoader = new THREE.TextureLoader();

    displayPlanet();
    lighting();
    sun = createSun();
    sun.position.set(640, 320, 0);
    scene.add(sun);
    
    control = new OrbitControls(cameraP, renderer.domElement);  
    cameraP.lookAt(sun.position);
    control.target.copy(sun.position);
    
    spaceshipControls = new OrbitControls(cameraT, renderer.domElement);
    spaceshipControls.enablePan = false;
    spaceshipControls.enableZoom = false;

    loadSpaceship();
    addSpotlight();
    createSatellite();
};


let updateThirdPersonCamera = () => {
    if (spaceship) {
        
        const offset = new THREE.Vector3(0, 16, -16); 
        spaceshipControls.target.copy(spaceship.position);
        
        cameraT.position.copy(spaceship.position).add(offset);
        cameraT.lookAt(spaceship.position);
        
        spaceshipControls.update(); 
    }
};

let loadSpaceship = () => {
    const loader = new GLTFLoader();
    loader.load(
        './assets/model/spaceship/scene.gltf',
        (gltf) => {
            spaceship = gltf.scene;

            spaceship.position.set(540, 320, 0);

            spaceship.castShadow = true;
            spaceship.receiveShadow = true;

            scene.add(spaceship);

            addSpotlight();

            spaceshipControls.target.copy(spaceship.position);
        },
        undefined,
    );
};

let addSpotlight = () => {
    if (spaceship && spaceship.position) {
        spotlight = new THREE.SpotLight(0xFFFFFF, 8, 8);  
        spotlight.castShadow = false;  

        spotlight.position.set(spaceship.position.x, spaceship.position.y, spaceship.position.z);

        spotlight.target = spaceship;
        scene.add(spotlight);
    } 
};

let updateSpotlightPosition = () => {
    if (spaceship) {
        spotlight.position.set(
            spaceship.position.x,
            spaceship.position.y + 6,
            spaceship.position.z
        );
    }
};

let lighting = () => {
    let pointLight = new THREE.PointLight(0xFFFFFF, 1, 1280);
    pointLight.position.set(640, 320, 0);

    scene.add(pointLight);
};


let createSatellite = () => {
    const geometry = new THREE.CylinderGeometry(1, 0.5, 0.4, 8);
    const material = new THREE.MeshStandardMaterial({
        color: 0xCCCCCC,
        metalness: 0.5,
        roughness: 0.5,
        side: THREE.DoubleSide,
    });

    satellite = new THREE.Mesh(geometry, material);

    satellite.rotation.x = Math.PI / 2;

    satellite.castShadow = false;
    satellite.receiveShadow = true;

    
    satellite.position.set(earth.position.x + 8, earth.position.y, earth.position.z);

    scene.add(satellite);
};


let createSun = (rotationSpeed = 0.005) => {
    const textureSun = textureLoader.load('./assets/textures/sun.jpg');
    let geo = new THREE.SphereGeometry(40, 50, 50);
    let mat = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        map: textureSun
    });
    
    let sun = new THREE.Mesh(geo, mat);
    sun.name = "Sun";
    sun.rotationSpeed = rotationSpeed;  

    return sun;
};

let displayPlanet = () => {
    // Mercury
    const textureMercury = textureLoader.load('./assets/textures/mercury.jpg');
    mercury = createPlanet(3.2, textureMercury);
    mercury.position.set(58, 320, 0);
    mercury.castShadow = true;
    mercury.receiveShadow = true;
    mercury.name = "Mercury";

    // Venus
    const textureVenus = textureLoader.load('./assets/textures/venus.jpg');
    venus = createPlanet(4.8, textureVenus);
    venus.position.set(80, 320, 0);
    venus.castShadow = true;
    venus.receiveShadow = true;
    venus.name = "Venus";

    // Earth
    const textureEarth = textureLoader.load('./assets/textures/earth.jpg');
    earth = createPlanet(4.8, textureEarth);
    earth.position.set(100, 320, 0);
    earth.castShadow = true;
    earth.receiveShadow = true;
    earth.name = "Earth";

    // Mars
    const textureMars = textureLoader.load('./assets/textures/mars.jpg');
    mars = createPlanet(4, textureMars);
    mars.position.set(130, 320, 0);
    mars.castShadow = true;
    mars.receiveShadow = true;
    mars.name = "Mars";

    // Jupiter
    const textureJupiter = textureLoader.load('./assets/textures/jupiter.jpg');
    jupiter = createPlanet(13, textureJupiter);
    jupiter.position.set(175, 320, 0);
    jupiter.castShadow = true;
    jupiter.receiveShadow = true;
    jupiter.name = "Jupiter";

    // Saturn
    const textureSaturn = textureLoader.load('./assets/textures/saturn.jpg');
    const textureSaturnRing = textureLoader.load('./assets/textures/saturn_ring.png');
    saturn = createPlanet(10, textureSaturn);
    saturn.position.set(240, 320, 0);
    saturn.castShadow = true;
    saturn.receiveShadow = true;
    saturn.name = "Saturn";

    createRingForPlanet(saturn, 16, 32, textureSaturnRing);

    // Uranus
    const textureUranusRing = textureLoader.load('./assets/textures/uranus_ring.png');
    const textureUrAnus = textureLoader.load('./assets/textures/uranus.jpg');
    uranus = createPlanet(8, textureUrAnus);
    uranus.position.set(280, 320, 0);
    uranus.castShadow = true;
    uranus.receiveShadow = true;
    uranus.name = "Uranus";

    createRingForPlanet(uranus, 16, 20, textureUranusRing);

    // Neptune
    const textureNeptune = textureLoader.load('./assets/textures/neptune.jpg');
    neptune = createPlanet(6, textureNeptune);
    neptune.position.set(320, 320, 0);
    neptune.castShadow = true;
    neptune.receiveShadow = true;
    neptune.name = "Neptune";
    
    scene.add(mercury, venus, mars, earth, jupiter, saturn, uranus, neptune);
};

let createRingForPlanet = (planet, innerRadius, outerRadius, texture) => {
    
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        map: texture
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    
    ring.position.set(planet.position.x, planet.position.y, planet.position.z);
    ring.rotation.y = Math.PI / 2;  
    ring.castShadow = false;
    ring.receiveShadow = true;
    
    scene.add(ring);
    
    if (planet === saturn) {
        saturnRing = ring;
    } else if (planet === uranus) {
        uranusRing = ring;
    }
};

let createPlanet = (radius, texture, rotationSpeed = 0.01) => {
    let geo = new THREE.SphereGeometry(radius, 50, 50);
    let mat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        map: texture
    });
    
    let planet = new THREE.Mesh(geo, mat);
    planet.rotationSpeed = rotationSpeed;  
    
    return planet;
     
};

const orbitSpeed = 0.0025;
let angle = 0;
const center = new THREE.Vector3(640, 320, 0);

const orbitRadius = [58, 80, 100, 130, 175, 240, 280, 320];
const planetOrbitSpeed = [1.5, 1.2, 1, 0.9, 0.5, 0.3, 0.2, 0.1];



let animate = () => {
    angle += orbitSpeed;

    updateTextOrientation();
    
    if (sun.rotationSpeed) {
        sun.rotation.y += sun.rotationSpeed;  
    }

    if (satellite && earth) {
        satellite.position.set(
            earth.position.x + 8 * Math.cos(earth.rotation.y), 
            earth.position.y,
            earth.position.z + 8 * Math.sin(earth.rotation.y)
        );
    }

    // Update Mercury
    mercury.position.x = center.x + orbitRadius[0] * Math.cos(angle * planetOrbitSpeed[0]);
    mercury.position.z = center.z + orbitRadius[0] * Math.sin(angle * planetOrbitSpeed[0]);
    
    // Update Venus
    venus.position.x = center.x + orbitRadius[1] * Math.cos(angle * planetOrbitSpeed[1]);
    venus.position.z = center.z + orbitRadius[1] * Math.sin(angle * planetOrbitSpeed[1]);
    
    // Update Earth
    earth.position.x = center.x + orbitRadius[2] * Math.cos(angle * planetOrbitSpeed[2]);
    earth.position.z = center.z + orbitRadius[2] * Math.sin(angle * planetOrbitSpeed[2]);
    
    // Update Mars
    mars.position.x = center.x + orbitRadius[3] * Math.cos(angle * planetOrbitSpeed[3]);
    mars.position.z = center.z + orbitRadius[3] * Math.sin(angle * planetOrbitSpeed[3]);
    
    // Update Jupiter
    jupiter.position.x = center.x + orbitRadius[4] * Math.cos(angle * planetOrbitSpeed[4]);
    jupiter.position.z = center.z + orbitRadius[4] * Math.sin(angle * planetOrbitSpeed[4]);
    
    // Update Saturn
    saturn.position.x = center.x + orbitRadius[5] * Math.cos(angle * planetOrbitSpeed[5]);
    saturn.position.z = center.z + orbitRadius[5] * Math.sin(angle * planetOrbitSpeed[5]);
    
    if (saturnRing) {
        saturnRing.position.set(saturn.position.x, saturn.position.y, saturn.position.z);
        saturnRing.lookAt(640, 1500, 0);
    }
    
    // Update Uranus
    uranus.position.x = center.x + orbitRadius[6] * Math.cos(angle * planetOrbitSpeed[6]);
    uranus.position.z = center.z + orbitRadius[6] * Math.sin(angle * planetOrbitSpeed[6]);
    
    if (uranusRing) {
        uranusRing.position.set(uranus.position.x, uranus.position.y, uranus.position.z);
        uranusRing.lookAt(640, 1500, 0);
        
    }
    
    // Update Neptune
    neptune.position.x = center.x + orbitRadius[7] * Math.cos(angle * planetOrbitSpeed[7]);
    neptune.position.z = center.z + orbitRadius[7] * Math.sin(angle * planetOrbitSpeed[7]);


};


let updateSpaceshipMovement = () => {
    if (spaceship) {
        const velocity = new THREE.Vector3();
        
        if (moveForward) {
            velocity.z += speed;
        }
        
        if (moveBackward) {
            velocity.z -= speed;
        }
        
        if (moveUp) {
            velocity.y += speed;
        }
        
        if (moveDown) {
            velocity.y -= speed;
        }
        
        if (moveLeft) {
            velocity.x += speed;
        }
        
        if (moveRight) {
            velocity.x -= speed;
        }
        
        spaceship.translateOnAxis(velocity.clone().normalize(), speed);
    }
};

window.addEventListener('keyup', (event) => {
    if (event.key === 'w' || event.key === 'W') {
        moveForward = false;
    } else if (event.key === 's' || event.key === 'S') {
        moveBackward = false;
    } else if (event.key === 'a' || event.key === 'A') {
        moveLeft = false;
    } else if (event.key === 'd' || event.key === 'D') {
        moveRight = false;
    } else if (event.key === 'e' || event.key === 'E') {
        moveUp = false;
    } else if (event.key === 'q' || event.key === 'Q') {
        moveDown = false;
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'w' || event.key === 'W') {
        moveForward = true;
    } else if (event.key === 's' || event.key === 'S') {
        moveBackward = true;
    } else if (event.key === 'a' || event.key === 'A') {
        moveLeft = true;
    } else if (event.key === 'd' || event.key === 'D') {
        moveRight = true;
    } else if (event.key === 'e' || event.key === 'E') {
        moveUp = true;
    } else if (event.key === 'q' || event.key === 'Q') {
        moveDown = true;
    } else if (event.key === '2') {
        activeCamera = cameraT;
        toggleControls();
    } else if (event.key === '1') {
        activeCamera = cameraP;
        toggleControls();
    } 
});

let toggleControls = () => {
    if (activeCamera == cameraP) {
        control.enabled = true;
        spaceshipControls.enabled = false;
    } else {
        control.enabled = false;
        spaceshipControls.enabled = true;
    }
};

window.addEventListener('mousemove', (event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraP);

    intersects = raycaster.intersectObjects(scene.children);

    // Hover logic
    if (intersects.length > 0) {
        let object = intersects[0].object;
        if (object !== hoveredObject) {
            if (hoveredObject) {
                resetPlanetColor(hoveredObject); 
            }
            hoveredObject = object;
            changePlanetColor(object); 

            // Call function to display text
            onPlanetHover(object);
        }
    } else {
        if (hoveredObject) {
            resetPlanetColor(hoveredObject); 
            hoveredObject = null;
        }
    }
});

window.addEventListener('click', () => {
    if (hoveredObject) {
        let object = hoveredObject;
        increaseRotationSpeed(object);  
    }
});

const fontLoader = new THREE.FontLoader();


fontLoader.load('./examples/fonts/helvetiker_regular.typeface.json', (loadedFont) => {
    font = loadedFont;
    console.log('Font loaded successfully.');
}, undefined, (error) => {
    console.error('Error loading font:', error);
});

function createText(text, size, height, color = 0xFFA500) {
    if (!font) {
        console.warn("Font not loaded yet! Cannot create text.");
        return null;
    }

    const textGeometry = new THREE.TextGeometry(text, {
        font: font,
        size: size,
        height: height,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.1,
        bevelSegments: 3,
    });

    const textMaterial = new THREE.MeshBasicMaterial({ color: color });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    textMesh.castShadow = true;
    textMesh.receiveShadow = true;

    return textMesh;
}

function onPlanetHover(object) {
    if (!object || !font) return;

    // If a textMesh already exists, remove it from the scene
    if (textMesh) {
        scene.remove(textMesh);
        textMesh = null;
    }

    const objectName = object.name;  // Use object name, fallback to a default name
    console.log(`Creating text for: ${objectName}`); // Debug log

    textMesh = createText(objectName, 40, 4, 0xFFA500);  // Set text color to orange and make it bigger and taller

    if (textMesh) {
        // For spheres, calculate position based on radius (for non-overlapping text)
        let position = object.position.clone();  // Start with the center of the object

        // Check if the object is a sphere and adjust position based on radius
        if (object.geometry && object.geometry.type === "SphereGeometry") {
            const radius = object.geometry.parameters.radius;  // Get the radius of the sphere
            position.y += radius + 2;  // Adjust position slightly above the sphere's center to avoid overlap
        } else {
            // For non-spherical objects, use the bounding box to estimate size
            const boundingBox = new THREE.Box3().setFromObject(object);
        }

        // Position text at the center of the object (slightly above for large text)
        textMesh.position.set(position.x - 40, position.y, position.z);

        scene.add(textMesh);

        // Remove text after a short duration
        setTimeout(() => {
            scene.remove(textMesh);
            textMesh = null;
        }, 2000);
    }
}

function updateTextOrientation() {
    if (textMesh) {
        // Make the text always face the camera
        textMesh.lookAt(cameraP.position);  // Ensure text faces the camera
    }
}

const mouse = new THREE.Vector2();

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove);

let increaseRotationSpeed = (object) => {
    if (!originalRotationSpeeds[object.name]) {
        originalRotationSpeeds[object.name] = object.rotationSpeed || 0.01; 
    }
    object.rotationSpeed = originalRotationSpeeds[object.name] + rotationSpeedIncrease; 


    setTimeout(() => {
        object.rotationSpeed = originalRotationSpeeds[object.name];
    }, 1000);
};

let resetPlanetColor = (object) => {
    object.material.color.set(0xffffff); 
};

let changePlanetColor = (object) => {
    object.material.color.set(Math.random() * 0xffffff); 
};


let render = () => {
    requestAnimationFrame(render);
    updateThirdPersonCamera();
    updateSpotlightPosition();
    animate();
    updateSpaceshipMovement();

    if (activeCamera == cameraP) {
        control.update();  
    } else if (activeCamera == cameraT){
        spaceshipControls.update();  
    }

    [mercury, venus, earth, mars, jupiter, saturn, uranus, neptune].forEach(planet => {
        if (planet.rotationSpeed) {
            planet.rotation.y += planet.rotationSpeed;
        }
    });
    
    renderer.render(scene, activeCamera);
};

window.onload = () => {
    init();
    render();
};

window.onresize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    cameraP.aspect = window.innerWidth / window.innerHeight;
    cameraP.updateProjectionMatrix();
    cameraT.aspect = window.innerWidth / window.innerHeight;
    cameraT.updateProjectionMatrix();
};