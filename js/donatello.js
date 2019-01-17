if ( !Detector.webgl ) {
    Detector.addGetWebGLMessage();
}

var renderer, scene, camera, controls;
var ruleListContainer;
var exampleSelect;
var examples;
var sidebar;
var sidebarButton;
var addRuleButton;
var generateButton;
var timeout;

window.onload = function() {
    init();
    animate();
}

function init() {
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight, false );
    renderer.setClearColor( 0xf2f2f2, 1.0 );

    document.getElementById("canvas-container").appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    scene = new THREE.Scene();
    
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.screenSpacePanning = true;
    controls.enableKeys = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;

    exampleSelect = document.getElementById("example-select");
    ruleListContainer = document.getElementById("rule-list-container");
    sidebar = document.getElementById("sidebar");
    sidebarButton = document.getElementById("sidebar-button");
    addRuleButton = document.getElementById("add-rule-button");
    generateButton = document.getElementById("generate-button");

    exampleSelect.value = "";
    sidebar.style.display = "block";
    sidebarButton.className = "visible";

    populateExamples();
    addRule();
    
    addEventListeners();
}

function populateExamples() {
    var requestURL = "examples.json";
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

function addEventListeners() {
    exampleSelect.addEventListener('change', function (event) {
        if(exampleSelect.value != "") {
            var example = examples.find(function(element) {
                return element.id == exampleSelect.value;
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

    // reset the camera and camera controls
    camera.position.set( turters.center.x + 50, turters.center.y + 50, turters.center.z + 50 );
    controls.target = turters.center.clone();
    controls.update();
}

function createGeometry(vertices, leafVertices, petalVertices) {
    var geometry = new THREE.BufferGeometry();
    geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    var material = new THREE.LineBasicMaterial( { color: 0x4c4c4c } );
    var line = new THREE.LineSegments( geometry, material );
    scene.add( line );

    var leafGeometry = new THREE.BufferGeometry();
    leafGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( leafVertices, 3 ) );
    var leafMaterial = new THREE.MeshBasicMaterial( { color: 0x1d8348, side: THREE.DoubleSide } );
    var leafMesh = new THREE.Mesh( leafGeometry, leafMaterial );
    scene.add( leafMesh );

    var petalGeometry = new THREE.BufferGeometry();
    petalGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( petalVertices, 3 ) );
    var petalMaterial = new THREE.MeshBasicMaterial( { color: 0xff5733, side: THREE.DoubleSide } );
    var petalMesh = new THREE.Mesh( petalGeometry, petalMaterial );
    scene.add( petalMesh );
}

function animate() {
    requestAnimationFrame( animate );

    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    renderer.render( scene, camera );
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
        
        this.position = this.position.addScaledVector(h, stepSize);

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

        this.position = this.position.addScaledVector(h, stepSize);
    }

    this.turnLeft = function() {
        var d = -this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(d), Math.sin(d), 0,
            -Math.sin(d), Math.cos(d), 0,
            0, 0, 1
        );
        this.hlu = this.hlu.multiply(rot);
    };

    this.turnRight = function() {
        var d =  this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(d), Math.sin(d), 0,
            -Math.sin(d), Math.cos(d), 0,
            0, 0, 1
        );
        this.hlu = this.hlu.multiply(rot);
    };

    this.pitchDown = function() {
        var d = -this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(d), 0, -Math.sin(d),
            0, 1, 0,
            Math.sin(d), 0, Math.cos(d)
        );
        this.hlu = this.hlu.multiply(rot);
    };

    this.pitchUp = function() {
        var d = this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            Math.cos(d), 0, -Math.sin(d),
            0, 1, 0,
            Math.sin(d), 0, Math.cos(d)
        );
        this.hlu = this.hlu.multiply(rot);
    };

    this.rollLeft = function() {
        var d = -this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            1, 0, 0,
            0, Math.cos(d), -Math.sin(d),
            0, Math.sin(d), Math.cos(d)
        );
        this.hlu = this.hlu.multiply(rot);
    };

    this.rollRight = function() {
        var d = this.rotationAngle;
        var rot = new THREE.Matrix3();
        rot.set(
            1, 0, 0,
            0, Math.cos(d), -Math.sin(d),
            0, Math.sin(d), Math.cos(d)
        );
        this.hlu = this.hlu.multiply(rot);
    };

    this.turnAround = function() {
        var rot = new THREE.Matrix3();
        rot.set(
            -1, 0, 0,
            0, -1, 0,
            0, 0, 1
        );
        this.hlu = this.hlu.multiply(rot);
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
        <span class="rule-arrow">&#8594;</span> \
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