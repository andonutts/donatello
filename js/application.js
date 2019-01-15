if ( !Detector.webgl ) {
    Detector.addGetWebGLMessage();
}

var renderer, scene, camera, controls;
var ruleListContainer;

window.onload = function() {
    init();
    loadHilbertCurve();
    generateModel();
    animate();
}

function init() {
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight, false );
    renderer.setClearColor( 0xf2f2f2, 1.0 );

    document.getElementById("canvas-container").appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 50, 50, 50 );
    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

    scene = new THREE.Scene();
    
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.screenSpacePanning = true;
    controls.enableKeys = false;
    controls.minDistance = 10;
    controls.maxDistance = 500;

    ruleListContainer = document.getElementById("rule-list-container");
    
    addRule();
    
    document.getElementById("preset-select").value = "";
    document.getElementById("sidebar").style.display = "none";
    
    addEventListeners();
}

function addEventListeners() {
    var presetSelect = document.getElementById("preset-select");
    presetSelect.onchange = function() {
        switch(presetSelect.value) {
            case "hilbert":
                loadHilbertCurve();
                break;
            case "bush":
                loadBush();
                break;
            case "plant":
                loadPlant();
                break;
            case "dragon-1":
                loadDragon1();
                break;
            case "dragon-2":
                loadDragon2();
                break;
            case "sierpinski-1":
                loadSierpinskiGasket1();
                break;
            case "sierpinski-2":
                loadSierpinskiGasket2();
                break;
            case "koch-curve-1":
                loadKochCurve1();
                break;
            case "koch-curve-2":
                loadKochCurve2();
                break;
            case "koch-curve-3":
                loadKochCurve3();
                break;
            case "koch-snowflake":
                loadKochSnowflake();
                break;
            case "koch-island":
                loadKochIsland();
                break;
            case "koch-island-lake":
                loadKochIslandsAndLakes();
                break;
            case "2d-tree":
                load2dTree();
                break;
            default:
        }
    }

    var sidebar = document.getElementById("sidebar");
    var sidebarButton = document.getElementById("sidebar-button");
    var addRuleButton = document.getElementById("add-rule-button");
    var generateButton = document.getElementById("generate-button");

    sidebarButton.addEventListener('click', function (event) {
        if (sidebar.style.display == "none") {
            sidebar.style.display = "block";
        } else {
            sidebar.style.display = "none";
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

    // reset the camera and camera controls
    camera.position.set( 50, 50, 50 );
    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
    controls.reset();

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

function loadHilbertCurve() {
    setRuleCount(4);

    document.getElementById("step-size").value = "4";
    document.getElementById("iterations").value = "2";
    document.getElementById("rotation-angle").value = "90";
    document.getElementById("base-axiom").value = "A";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "A";
    ruleList[0].value = "B-F+CFC+F-D&F^D-F+&&CFC+F+B//";

    symbolList[1].value = "B";
    ruleList[1].value = "A&F^CFB^F^D^^-F-D^|F^B|FC^F^A//";

    symbolList[2].value = "C";
    ruleList[2].value = "|D^|F^B-F+C^F^A&&FA&F^C+F+B^F^D//";

    symbolList[3].value = "D";
    ruleList[3].value = "|CFB-F+B|FA&F^A&&FB-F+B|FC//";
}

function loadBush() {
    setRuleCount(4);

    document.getElementById("step-size").value = "2";
    document.getElementById("iterations").value = "4";
    document.getElementById("rotation-angle").value = "22.5";
    document.getElementById("base-axiom").value = "A";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "A";
    ruleList[0].value = "[&FLA]/////[&FLA]///////[&FLA]";

    symbolList[1].value = "F";
    ruleList[1].value = "S/////F";

    symbolList[2].value = "S";
    ruleList[2].value = "FL";

    symbolList[3].value = "L";
    ruleList[3].value = "[^^-L]";
}

function loadPlant() {
    setRuleCount(7);

    document.getElementById("step-size").value = "1";
    document.getElementById("iterations").value = "4";
    document.getElementById("rotation-angle").value = "18";
    document.getElementById("base-axiom").value = "A";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "A";
    ruleList[0].value = "I+[A+w]--//[--L]I[++L]-[Aw]++Aw";

    symbolList[1].value = "I";
    ruleList[1].value = "FS[//&&L][//^^L]FS";

    symbolList[2].value = "S";
    ruleList[2].value = "SFS";

    symbolList[3].value = "L";
    ruleList[3].value = "['L]";

    symbolList[4].value = "w";
    ruleList[4].value = "[&&&p'/W////W////W////W////W]";

    symbolList[5].value = "p";
    ruleList[5].value = "FF";

    symbolList[6].value = "W";
    ruleList[6].value = "['^F][&&&&P]";
}

function loadDragon1() {
    setRuleCount(2);

    document.getElementById("step-size").value = "1";
    document.getElementById("iterations").value = "10";
    document.getElementById("rotation-angle").value = "90";
    document.getElementById("base-axiom").value = "FX";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "X";
    ruleList[0].value = "X+YF+";

    symbolList[1].value = "Y";
    ruleList[1].value = "-FX-Y";
}

function loadDragon2() {
    setRuleCount(1);

    document.getElementById("step-size").value = "2";
    document.getElementById("iterations").value = "5";
    document.getElementById("rotation-angle").value = "30";
    document.getElementById("base-axiom").value = "F";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "F";
    ruleList[0].value = "-F++++F----F+";
}

function loadSierpinskiGasket1() {
    setRuleCount(1);

    document.getElementById("step-size").value = "1.5";
    document.getElementById("iterations").value = "4";
    document.getElementById("rotation-angle").value = "120";
    document.getElementById("base-axiom").value = "F";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "F";
    ruleList[0].value = "F+F-F-F+F";
}

function loadSierpinskiGasket2() {
    setRuleCount(3);

    document.getElementById("step-size").value = "1.5";
    document.getElementById("iterations").value = "4";
    document.getElementById("rotation-angle").value = "60";
    document.getElementById("base-axiom").value = "FX";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "F";
    ruleList[0].value = "Z";
    
    symbolList[1].value = "X";
    ruleList[1].value = "+FY-FX-FY+";

    symbolList[2].value = "Y";
    ruleList[2].value = "-FX+FY+FX-";
}

function loadKochCurve1() {
    setRuleCount(1);

    document.getElementById("step-size").value = "2";
    document.getElementById("iterations").value = "3";
    document.getElementById("rotation-angle").value = "90";
    document.getElementById("base-axiom").value = "F-F-F-F";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "F";
    ruleList[0].value = "FF-F+F-F-FF";
}

function loadKochCurve2() {
    setRuleCount(1);

    document.getElementById("step-size").value = "3";
    document.getElementById("iterations").value = "3";
    document.getElementById("rotation-angle").value = "90";
    document.getElementById("base-axiom").value = "F-F-F-F";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "F";
    ruleList[0].value = "F-FF--F-F";
}

function loadKochCurve3() {
    setRuleCount(1);

    document.getElementById("step-size").value = "1";
    document.getElementById("iterations").value = "3";
    document.getElementById("rotation-angle").value = "90";
    document.getElementById("base-axiom").value = "F-F-F-F";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "F";
    ruleList[0].value = "FF-F-F-F-FF";
}

function loadKochSnowflake() {
    setRuleCount(1);

    document.getElementById("step-size").value = "1";
    document.getElementById("iterations").value = "3";
    document.getElementById("rotation-angle").value = "60";
    document.getElementById("base-axiom").value = "F++F++F";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "F";
    ruleList[0].value = "F-F++F-F";
}

function loadKochIsland() {
    setRuleCount(1);

    document.getElementById("step-size").value = "1";
    document.getElementById("iterations").value = "2";
    document.getElementById("rotation-angle").value = "90";
    document.getElementById("base-axiom").value = "F-F-F-F";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "F";
    ruleList[0].value = "F-F+F+FF-F-F+F";
}

function loadKochIslandsAndLakes() {
    setRuleCount(2);

    document.getElementById("step-size").value = "0.6";
    document.getElementById("iterations").value = "2";
    document.getElementById("rotation-angle").value = "90";
    document.getElementById("base-axiom").value = "F+F+F+F";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "F";
    ruleList[0].value = "F+f-FF+F+FF+Ff+FF-f+FF-F-FF-Ff-FFF";

    symbolList[1].value = "f";
    ruleList[1].value = "ffffff";
}

function load2dTree() {
    setRuleCount(2);

    document.getElementById("step-size").value = "0.2";
    document.getElementById("iterations").value = "7";
    document.getElementById("rotation-angle").value = "20";
    document.getElementById("base-axiom").value = "X";

    symbolList = document.querySelectorAll("input.symbol-input");
    ruleList = document.querySelectorAll("input.rule-input");
    
    symbolList[0].value = "X";
    ruleList[0].value = "F[+X]F[-X]+X";

    symbolList[1].value = "F";
    ruleList[1].value = "FF";
}