if ( !Detector.webgl ) {
    Detector.addGetWebGLMessage();
}

var renderer, scene, activeCamera, controls;
var perspectiveCam, orthographicCam;
var orthoFrustumSize = 80;
var aspect;

var ruleListContainer;
var exampleSelect;
var examples;
var sidebar;
var sidebarButton;
var addRuleButton;
var generateButton;
var autoRotateCheckbox;
var orthoCamCheckbox;
var timeout;
var palettes;
var canvasColor = '#f2f2f2';
var lineColor = '#4c4c4c';
var leafColor = '#1d8348';
var petalColor = '#ff5733';

var palettesLoadedEvent = new Event('palettesloaded');

window.onload = function() {
    init();
    animate();
}

function init() {
    exampleSelect = document.getElementById("example-select");
    ruleListContainer = document.getElementById("rule-list-container");
    sidebar = document.getElementById("sidebar");
    sidebarButton = document.getElementById("sidebar-button");
    addRuleButton = document.getElementById("add-rule-button");
    generateButton = document.getElementById("generate-button");
    autoRotateCheckbox = document.getElementById("auto-rotate-checkbox");
    orthoCamCheckbox = document.getElementById("ortho-cam-checkbox");
    
    exampleSelect.value = "";
    sidebar.style.display = "block";
    sidebarButton.className = "visible";

    // set initial camera settings
    autoRotateCheckbox.checked = false;
    orthoCamCheckbox.checked = false;

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight, false );
    renderer.setClearColor(canvasColor);

    document.getElementById("canvas-container").appendChild( renderer.domElement );

    initCameras();

    if (orthoCamCheckbox.checked) {
        activeCamera = orthographicCam;
    } else {
        activeCamera = perspectiveCam;
    }

    scene = new THREE.Scene();
    
    controls = new THREE.OrbitControls( activeCamera, renderer.domElement );
    controls.screenSpacePanning = true;
    controls.enableKeys = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;
    controls.autoRotateSpeed = 8.0;
    controls.autoRotate = false;
    
    populateExamples();
    populatePalettes();
    addRule();

    addEventListeners();
}

function initCameras() {
    aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
    orthographicCam = new THREE.OrthographicCamera( orthoFrustumSize * aspect / -2, orthoFrustumSize * aspect / 2, orthoFrustumSize / 2, orthoFrustumSize / -2, 1, 1000 );
    perspectiveCam = new THREE.PerspectiveCamera( 45, aspect, 1, 1000 );
}

function populateExamples() {
    var requestURL = "data/examples.json";
    var request = new XMLHttpRequest();

    request.open('GET', requestURL);
    request.responseType = 'json';

    request.send();

    request.onload = function() {
        examples = request.response.examples;

        for(var i = 0; i < examples.length; i++) {
            var exampleOption = document.createElement("option");
            exampleOption.setAttribute("value", examples[i].id);
            exampleOption.innerHTML = examples[i].name;
            exampleSelect.appendChild(exampleOption);
        }
    }
}

function populatePalettes() {
    var paletteList = document.getElementById("color-palettes");

    var requestURL = "data/palettes.json";
    var request = new XMLHttpRequest();

    request.open('GET', requestURL);
    request.responseType = 'json';

    request.send();

    request.onload = function() {
        palettes = request.response.palettes;

        for(var i = 0; i < palettes.length; i++) {
            var paletteItem = document.createElement("button");
            paletteItem.classList.add("palette-item");

            var colorBox1 = document.createElement("div");
            colorBox1.classList.add("color-box");
            colorBox1.style.backgroundColor = palettes[i].canvasColor;
            paletteItem.appendChild(colorBox1);

            var colorBox2 = document.createElement("div");
            colorBox2.classList.add("color-box");
            colorBox2.style.backgroundColor = palettes[i].lineColor;
            paletteItem.appendChild(colorBox2);

            var colorBox3 = document.createElement("div");
            colorBox3.classList.add("color-box");
            colorBox3.style.backgroundColor = palettes[i].leafColor;
            paletteItem.appendChild(colorBox3);

            var colorBox4 = document.createElement("div");
            colorBox4.classList.add("color-box");
            colorBox4.style.backgroundColor = palettes[i].petalColor;
            paletteItem.appendChild(colorBox4);

            paletteItem.addEventListener('click', function() {
                var active = document.getElementsByClassName('palette-item active');
                for (var j = 0; active.length; j++) {
                    active[j].classList.remove('active');
                }
                this.classList.add('active');
                var colorBoxes = this.childNodes;
                canvasColor = colorBoxes[0].style.backgroundColor;
                lineColor = colorBoxes[1].style.backgroundColor;
                leafColor = colorBoxes[2].style.backgroundColor;
                petalColor = colorBoxes[3].style.backgroundColor;
            });

            paletteList.appendChild(paletteItem);
        }
        document.dispatchEvent(palettesLoadedEvent);
    }
}

function addEventListeners() {
    exampleSelect.addEventListener('change', function (event) {
        if(exampleSelect.value != "") {
            loadExampleByID(exampleSelect.value);
        }
    });

    document.addEventListener('touchstart', function (event) {
        if (sidebar.style.display == "none") {
            sidebarButton.className = "visible";

            clearTimeout(timeout);
        }
    });

    document.addEventListener('touchend', function (event) {
        if (sidebar.style.display == "none") {
            timeout = setTimeout(function() {
                if (sidebar.style.display == "none") {
                    sidebarButton.className = "hidden";
                }
            }, 2000);
        }
    });

    document.addEventListener('mousemove', function (event) {
        if (sidebar.style.display == "none") {
            sidebarButton.className = "visible";

            clearTimeout(timeout);
            
            timeout = setTimeout(function() {
                if (sidebar.style.display == "none") {
                    sidebarButton.className = "hidden";
                }
            }, 2000);
        }
    });

    document.addEventListener('palettesloaded', function (event) {
        var paletteItems = document.getElementsByClassName('palette-item');

        if (paletteItems.length > 0) {
            var colorBoxes = paletteItems[0].childNodes;
            canvasColor = colorBoxes[0].style.backgroundColor;
            lineColor = colorBoxes[1].style.backgroundColor;
            leafColor = colorBoxes[2].style.backgroundColor;
            petalColor = colorBoxes[3].style.backgroundColor;

            paletteItems[0].classList.add('active');
        }
    });

    sidebarButton.addEventListener('click', function (event) {
        if (sidebar.style.display == "none") {
            sidebar.style.display = "block";
            sidebarButton.className = "visible";

            clearTimeout(timeout);
        } else {
            sidebar.style.display = "none";

            timeout = setTimeout(function() {
                if (sidebar.style.display == "none") {
                    sidebarButton.className = "hidden";
                }
            }, 2000);
        }
    });

    var coll = document.getElementsByClassName("collapsible");

    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener('click', function() {
            this.classList.toggle('collapsible-active');
            var content = this.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        });
    }

    autoRotateCheckbox.addEventListener('click', function(event) {
        if (autoRotateCheckbox.checked) {
            controls.autoRotate = true;
        } else {
            controls.autoRotate = false;
        }
    });

    orthoCamCheckbox.addEventListener('click', function(event) {
        // store the current camera's position
        var position = activeCamera.position.clone();

        aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
        
        if (orthoCamCheckbox.checked) {
            orthographicCam.left = orthoFrustumSize * aspect / -2;
            orthographicCam.right = orthoFrustumSize * aspect / 2;
            orthographicCam.top = orthoFrustumSize / 2;
            orthographicCam.bottom = orthoFrustumSize / -2;
            orthographicCam.updateProjectionMatrix();
            activeCamera = orthographicCam;
        } else {
            perspectiveCam.aspect = aspect;
            perspectiveCam.updateProjectionMatrix();
            activeCamera = perspectiveCam;
        }
        console.log(activeCamera.zoom);
        activeCamera.position.copy(position);
        controls.object = activeCamera;
        controls.update();
    });

    addRuleButton.addEventListener('click', addRule);
    generateButton.addEventListener('click', generateModel);
}

function generateModel() {
    // clear the scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    var stepSize = document.getElementById("step-size").value;
    var iterations = document.getElementById("iterations").value;
    var rotationAngle = document.getElementById("rotation-angle").value;

    var rules = [];
    var command = document.getElementById("base-axiom").value;
    var symbolList = document.querySelectorAll("input.symbol-input");
    var ruleList = document.querySelectorAll("input.rule-input");

    for(var i = 0; i < symbolList.length; i++) {
        rules[symbolList[i].value] = ruleList[i].value;
    }

    var turters = new Turtle(stepSize, rotationAngle);

    var commandEx = processLSystem(iterations, command, rules);
    drawLSystem(turters, commandEx);
    createGeometry(turters.vertices, turters.leafVertices, turters.petalVertices);

    renderer.setClearColor(canvasColor);

    // reset the camera and camera controls
    activeCamera.zoom = 1;
    activeCamera.position.set( turters.center.x + 50, turters.center.y + 50, turters.center.z + 50 );
    activeCamera.updateProjectionMatrix();

    controls.target = turters.center.clone();
    controls.update();
}

function createGeometry(lineVertices, leafVertices, petalVertices) {
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( lineVertices, 3 ) );
    var material = new THREE.LineBasicMaterial( { color: lineColor } );
    var line = new THREE.LineSegments( geometry, material );
    scene.add( line );

    var leafGeometry = new THREE.BufferGeometry();
    leafGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( leafVertices, 3 ) );
    var leafMaterial = new THREE.MeshBasicMaterial( { color: leafColor, side: THREE.DoubleSide } );
    var leafMesh = new THREE.Mesh( leafGeometry, leafMaterial );
    scene.add( leafMesh );

    var petalGeometry = new THREE.BufferGeometry();
    petalGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( petalVertices, 3 ) );
    var petalMaterial = new THREE.MeshBasicMaterial( { color: petalColor, side: THREE.DoubleSide } );
    var petalMesh = new THREE.Mesh( petalGeometry, petalMaterial );
    scene.add( petalMesh );
}

function animate() {
    requestAnimationFrame( animate );

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        aspect = canvas.clientWidth / canvas.clientHeight;

        if (orthoCamCheckbox.checked) {
            orthographicCam.left = orthoFrustumSize * aspect / -2;
            orthographicCam.right = orthoFrustumSize * aspect / 2;
            orthographicCam.top = orthoFrustumSize / 2;
            orthographicCam.bottom = orthoFrustumSize / -2;
            orthographicCam.updateProjectionMatrix();
        } else {
            perspectiveCam.aspect = aspect;
            perspectiveCam.updateProjectionMatrix();
        }
    }

    controls.update();

    renderer.render( scene, activeCamera );
}

function Turtle(stepSize, rotationAngle) {
    this.stepSize = stepSize;
    this.rotationAngle = rotationAngle * Math.PI / 180;
    this.stateStack = [];
    this.vertices = [];
    this.leafVertices = [];
    this.petalVertices = [];
    this.center = new THREE.Vector3(0, 0, 0);
    this.vertexSum = new THREE.Vector3(0, 0, 0);
    this.vertexCount = 1;

    // initialize at origin
    this.position = new THREE.Vector3( 0, 0, 0 );

    // initialize heading in the +y direction
    this.hlu = new THREE.Matrix3();
    this.hlu.set(
        0, 1, 0,
        1, 0, 0,
        0, 0, -1
    );

    this.moveForward = function() {
        var h = new THREE.Vector3(
            this.hlu.elements[0],
            this.hlu.elements[1],
            this.hlu.elements[2]
        );
        
        this.vertices.push(
            this.position.x,
            this.position.y,
            this.position.z
        );
        
        this.position.addScaledVector(h, stepSize);

        this.vertexSum.add(this.position);
        this.vertexCount++;
        this.center = this.vertexSum.clone().divideScalar(this.vertexCount);
        
        this.vertices.push(
            this.position.x,
            this.position.y,
            this.position.z
        );
    }

    this.moveForwardNoDraw = function() {
        var h = new THREE.Vector3(
            this.hlu.elements[0],
            this.hlu.elements[1],
            this.hlu.elements[2]
        );

        this.position.addScaledVector(h, stepSize);
    }

    this.turnLeft = function() {
        var d = -this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(d), Math.sin(d), 0,
            -Math.sin(d), Math.cos(d), 0,
            0, 0, 1
        );
        this.hlu.multiply(rot);
    };

    this.turnRight = function() {
        var d =  this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(d), Math.sin(d), 0,
            -Math.sin(d), Math.cos(d), 0,
            0, 0, 1
        );
        this.hlu.multiply(rot);
    };

    this.pitchDown = function() {
        var d = -this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(d), 0, -Math.sin(d),
            0, 1, 0,
            Math.sin(d), 0, Math.cos(d)
        );
        this.hlu.multiply(rot);
    };

    this.pitchUp = function() {
        var d = this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(d), 0, -Math.sin(d),
            0, 1, 0,
            Math.sin(d), 0, Math.cos(d)
        );
        this.hlu.multiply(rot);
    };

    this.rollLeft = function() {
        var d = -this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            1, 0, 0,
            0, Math.cos(d), -Math.sin(d),
            0, Math.sin(d), Math.cos(d)
        );
        this.hlu.multiply(rot);
    };

    this.rollRight = function() {
        var d = this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            1, 0, 0,
            0, Math.cos(d), -Math.sin(d),
            0, Math.sin(d), Math.cos(d)
        );
        this.hlu.multiply(rot);
    };

    this.turnAround = function() {
        var rot = new THREE.Matrix3();
        rot.set(
            -1, 0, 0,
            0, -1, 0,
            0, 0, 1
        );
        this.hlu.multiply(rot);
    }

    this.pushState = function() {
        var turtleState = {
            position : this.position.clone(),
            hlu : this.hlu.clone()
        };
        this.stateStack.push(turtleState);
    };

    this.popState = function() {
        var turtleState = this.stateStack.pop();
        this.position = turtleState["position"];
        this.hlu = turtleState["hlu"];
    };

    this.drawLeaf = function() {
        var pos = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
        var head = new THREE.Vector3(this.hlu.elements[0], this.hlu.elements[1], this.hlu.elements[2]);
        var left = new THREE.Vector3(this.hlu.elements[3], this.hlu.elements[4], this.hlu.elements[5]);
        var up = new THREE.Vector3(this.hlu.elements[6], this.hlu.elements[7], this.hlu.elements[8]);

        var edge1 = left.clone().multiplyScalar(0.5).add(head).normalize().multiplyScalar(this.stepSize);
        var edge2 = left.clone().multiplyScalar(0.5).negate().add(head).normalize().multiplyScalar(this.stepSize);
        var diag = edge1.clone().add(edge2);

        this.leafVertices.push(
            pos.x, pos.y, pos.z,
            (pos.clone().add(edge1)).x, (pos.clone().add(edge1)).y, (pos.clone().add(edge1)).z,
            (pos.clone().add(diag)).x, (pos.clone().add(diag)).y, (pos.clone().add(diag)).z,
            (pos.clone().add(diag)).x, (pos.clone().add(diag)).y, (pos.clone().add(diag)).z,
            (pos.clone().add(edge2)).x, (pos.clone().add(edge2)).y, (pos.clone().add(edge2)).z,
            pos.x, pos.y, pos.z,
        );
    }

    this.drawPetal = function() {
        var pos = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
        var head = new THREE.Vector3(this.hlu.elements[0], this.hlu.elements[1], this.hlu.elements[2]);
        var left = new THREE.Vector3(this.hlu.elements[3], this.hlu.elements[4], this.hlu.elements[5]);
        var up = new THREE.Vector3(this.hlu.elements[6], this.hlu.elements[7], this.hlu.elements[8]);

        var edge1 = left.clone().multiplyScalar(0.5).add(head).normalize().multiplyScalar(this.stepSize);
        var edge2 = left.clone().multiplyScalar(0.5).negate().add(head).normalize().multiplyScalar(this.stepSize);
        var diag = edge1.clone().add(edge2);

        this.petalVertices.push(
            pos.x, pos.y, pos.z,
            (pos.clone().add(edge1)).x, (pos.clone().add(edge1)).y, (pos.clone().add(edge1)).z,
            (pos.clone().add(diag)).x, (pos.clone().add(diag)).y, (pos.clone().add(diag)).z,
            (pos.clone().add(diag)).x, (pos.clone().add(diag)).y, (pos.clone().add(diag)).z,
            (pos.clone().add(edge2)).x, (pos.clone().add(edge2)).y, (pos.clone().add(edge2)).z,
            pos.x, pos.y, pos.z,
        );
    }
}

function processLSystem(iterations, command, rules) {
    var re = /[\+\-\&\^\\\/\|\[\]]/g;
    for(var i = 0; i < iterations; i++) {
        var buffer = "";
        for(var j = 0; j < command.length; j++) {
            var symbol = command.charAt(j);
            if(!re.test(symbol) && rules[symbol] != null) {
                buffer += rules[symbol];
            } else {
                buffer += symbol;
            }
        }
        command = buffer;
    }
    return command;
}

function drawLSystem(turtle, command) {
    for(var i = 0; i < command.length; i++) {
        switch(command.charAt(i)) {
            case "F":
            case "G":
                turtle.moveForward();
                break;
            case "f":
                turtle.moveForwardNoDraw();
                break;
            case "+":
                turtle.turnLeft();
                break;
            case "-":
                turtle.turnRight();
                break;
            case "&":
                turtle.pitchDown();
                break;
            case "^":
                turtle.pitchUp();
                break;
            case "\\":
                turtle.rollLeft();
                break;
            case "/":
                turtle.rollRight();
                break;
            case "|":
                turtle.turnAround();
                break;
            case "[":
                turtle.pushState();
                break;
            case "]":
                turtle.popState();
                break;
            case "L":
                turtle.drawLeaf();
                break;
            case "P":
                turtle.drawPetal();
                break;
            default:

        }
    }
}

function addRule() {
    var rule = document.createElement("div");
    ruleListContainer.appendChild(rule);
    rule.classList.add("rule");

    rule.innerHTML = 
        '<input type="text" class="symbol-input" maxlength="1" /> \
        <span class="rule-arrow noselect">&#8594;</span> \
        <input type="text" class="rule-input" /> \
        <div onclick="deleteRule(this.parentNode)" class="delete-rule-button">&#10005;</div>';
}

function deleteRule(r) {
    ruleListContainer.removeChild(r);
}

function setRuleCount(count) {
    var ruleList = ruleListContainer.childNodes;
    while(ruleList.length < count) {
        addRule();
    }
    while(ruleList.length > count) {
        var lastRuleIndex = ruleList.length - 1;
        ruleListContainer.removeChild(ruleList[lastRuleIndex]);
    }
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;

    if (needResize) {
        renderer.setSize(width, height, false);
    }

    return needResize;
}

function loadExampleByID(id) {
    var example = examples.find(function(element) {
        return element.id == id;
    });

    document.getElementById("step-size").value = example.stepSize;
    document.getElementById("iterations").value = example.iterations;
    document.getElementById("rotation-angle").value = example.rotationAngle;
    document.getElementById("base-axiom").value = example.baseAxiom;
    
    setRuleCount(example.ruleList.length);

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    for(var i = 0; i < example.ruleList.length; i++) {
        symbolList[i].value = example.ruleList[i].symbol;
        ruleList[i].value = example.ruleList[i].rule;
    }
}