/*
 * basicScene.js - A demonstrtion of some of the uses of yagl.
 *
 * Copyright 2016 - Bridgewater College
 */

var canvas = document.querySelector("#renderCanvas");
var engine = new BABYLON.Engine(canvas, true);

var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = BABYLON.Color3.Gray();

    var camera = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 2, 35, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, false);

    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0.5), scene);
    light1.intensity = 1.0;

    builder = new YAGL.GraphBuilder(scene);

    var obj = createRandomYAGLGraphObject(4,4);
    builder.buildUsingJSONObj(obj);

    return scene;
};

var scene = createScene();

/*** EDIT NOTES ***/
function editNotes(html, textColor) {
	var notes = document.getElementById("notes");
	if (notes == null) {
		return;
	}
	notes.innerHTML = html;
	notes.style.color = textColor;
}

var html = "YAGL - Yet Another Graph Library";
editNotes(html, "darkgreen");

/*** BUILD GRAPH BUTTON ***/
var buildGraph = function () {
    var choice = prompt("Please enter build type:\n" +
                        "\t1: User Defined Size\n" +
                        "\t2: Random\n" +
                        "\t3: YAGL File");

    if (choice == 1) {
        var numVertices = Number(prompt("How Many Vertices?"));
        var maxEdges = (numVertices * (numVertices -1))/2;
        var numEdges = maxEdges + 1;

        while (numEdges > maxEdges) {
            numEdges = prompt("How Many Edges (less than or equal to " + maxEdges + "): ");
        }

        var obj = createRandomYAGLGraphObject(numVertices, numEdges);
        builder.buildUsingJSONObj(obj);
    } else if (choice == 2) {
        var obj = createRandomYAGLGraphObject();
        builder.buildUsingJSONObj(obj);
    } else {
        var url = prompt("Please enter the URL.", "http://demo.yagljs.com/yagl_files/dodecahedron.yagl");
        builder.buildUsingJSONFile(url);
    }
};

/*** SLOW/FAST BUILD BUTTON ***/
var toggleBuildSpeed = function () {
    builder.setSlowBuild(!builder.getSlowBuild());

    button = document.getElementById("toggleBuildSpeed");
    var text = button.firstChild.nodeValue;
    button.firstChild.nodeValue = (text == "Slow Build") ? "Fast Build" : "Slow Build";
};

/*** GRAPH PROPERTIES BUTTON ***/
var graphProperties = function () {
    html = "Graph Properties <br><br>";
    html += graph.toHTMLString();
    editNotes(html, "darkgreen");
};

/*** ROTATE CAMERA ***/
var rotateCamera = true;
var step = Math.PI / 720;
var radius = 35;
var tick = 0;

var toggleCamera = function () {
    rotateCamera = rotateCamera ? false : true;

    button = document.getElementById("toggleCamera");
    var text = button.firstChild.nodeValue;
    button.firstChild.nodeValue = (text == "Rotate Camera") ? "Freeze Camera" : "Rotate Camera";
};

/*** RESET COLOR FOR ALL MESHES ***/
function resetMeshColor() {
    scene.meshes.forEach( function (m) {
        if (m.material == null) {
                console.log("new material");
                m.material = new BABYLON.StandardMaterial(m.name, scene);
        }
        m.material.diffuseColor = BABYLON.Color3.White();
    });
}

/*** ONPOINTERDOWN CALLBACK ***/
var currentAction = "none";
var selectedMeshes = [];

scene.onPointerDown = function (evt, pickResult) {
    if (currentAction == "none" && pickResult.hit) {

        var type = pickResult.pickedMesh.name[0];
        var id = Number(pickResult.pickedMesh.name.slice(1));

        if (type == "v") {

            if(graph.vertices[id].data != undefined){
                html = "Vertex " + id + ": " + graph.vertices[id].data + "<br>";
            } else {
                html = "Vertex " + id + ": no data" + "<br>";
            }
        } else {
            html = "Edge " + id + "<br>";
        }
        editNotes(html, "darkgreen");

    }

    if (currentAction == "findPath" && pickResult.hit && pickResult.pickedMesh.name.startsWith("v")) {
        if (selectedMeshes.length == 0) {
            selectedMeshes.push(pickResult.pickedMesh.name.substr(1));
            pickResult.pickedMesh.material.diffuseColor = BABYLON.Color3.Green();
            editNotes("Pick target vertex", "darkgreen");
        }
        else if (selectedMeshes.length == 1 && pickResult.hit && pickResult.pickedMesh.name.startsWith("v")) {
            selectedMeshes.push(pickResult.pickedMesh.name.substr(1));
            pickResult.pickedMesh.material.diffuseColor = BABYLON.Color3.Green();

            path = graph.getPath(Number(selectedMeshes[1]), Number(selectedMeshes[0]));

            if (path == null ) {
                html = "No path exists" + "<br>";
            } else {
                html = "Path:  " + path + "<br>";
            }
            editNotes(html, "darkgreen");

            pathIndex = 0;
            animatePath();
            currentAction = "none";
        }
    }
};

/*** SHORTEST PATH BUTTON ***/
var findPath = function () {
    resetMeshColor();
    currentAction = "findPath";
    editNotes("Pick source vertex", "darkgreen");
    selectedMeshes = [];
    // pick() recognizes a vertex was picked and takes over from here.
};

var pathIndex = 0;
var path = null;

function animatePath() {
    if (path == null) {
        return;
    }

    var vid = path[pathIndex];
    graph.vertices[vid].mesh.material.diffuseColor = BABYLON.Color3.Magenta();

    pathIndex++;

    if (pathIndex == path.length) {
        var audio = new Audio('ding.mp3');
        audio.volume = 0.25;
        audio.play();
        return;
    }

    setTimeout(animatePath, 1000);
}

/*** COLOR COMPONENTS BUTTON ***/
var colorComponents = function() {
    var vid;
    for (vid in graph.vertices) {
        var v = graph.vertices[vid];
        if (v.mesh.material == null) {
            v.mesh.material = new BABYLON.StandardMaterial(v.vid, scene);
        }
    }

    if (graph.isConnected()){
        var color = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
        var vid;
        for(vid in graph.vertices){
            graph.vertices[vid].mesh.material.diffuseColor = color;
        }
    } else {
        var headVids = [];
        var colorSet = {};
        var find = "";
        for(vid in graph.vertices) {
            find = "";
            find += graph.findComponent(vid);

            if (colorSet.hasOwnProperty(find) == false) {
                colorSet[find] = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
            }

            graph.vertices[vid].mesh.material.diffuseColor = colorSet[find];
        }
    }
};

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();

    if (rotateCamera == true) {
        var x = radius * Math.sin(step * ++tick);
		var z = radius * Math.cos(step * tick);
		var y = 7;
		scene.activeCamera.setPosition(new BABYLON.Vector3(x,y,z));
    }

});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
