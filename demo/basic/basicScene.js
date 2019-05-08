/*
 * basicScene.js - A demonstration of some of the uses of YAGL.
 *
 * Copyright &copy; 2019, Eric McGregor
 * All rights reserved.
 */

import {createRandomYAGLGraphObject} from "./randomGraphGenerator.js"

let canvas = document.querySelector("#renderCanvas");
let engine = new BABYLON.Engine(canvas, true);

let builder = undefined;
let graph = undefined;

let createScene = function () {
  let scene = new BABYLON.Scene(engine);
  scene.clearColor = BABYLON.Color3.White();

  let camera = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 2, 35, new BABYLON.Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, false);

  let light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0.5), scene);
  light1.intensity = 1.0;

  builder = new YAGL.GraphBuilder(scene);

  let obj = createRandomYAGLGraphObject(5,4);
  builder.buildUsingJSONObj(obj);

  graph = builder.getGraph();

  return scene;
};

let scene = createScene();

/*** EDIT NOTES ***/
function editNotes(html, textColor) {
  let notes = document.getElementById("notes");
  if (notes == null) {
    return;
  }
  notes.innerHTML = html;
  notes.style.color = textColor;
}

let html = "YAGL - Yet Another Graph Library";
editNotes(html, "darkgreen");

/*** BUILD GRAPH BUTTON ***/
window.buildGraph = function () {
  let choice = prompt("Please enter build type:\n" +
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

    let obj = createRandomYAGLGraphObject(numVertices, numEdges);
    builder.buildUsingJSONObj(obj);
  } else if (choice == 2) {
    let obj = createRandomYAGLGraphObject();
    builder.buildUsingJSONObj(obj);
  } else {
    //var url = prompt("Please enter the URL.", "http://demo.yagljs.com/yagl_files/dodecahedron.yagl");
    let url = prompt("Please enter the URL.", "http://n0code.net/yagl/demo/yagl_files/weighted.yagl");
    builder.buildUsingJSONFile(url);
  }
};

/*** SLOW/FAST BUILD BUTTON ***/
window.toggleBuildSpeed = function () {
  builder.setSlowBuild(!builder.getSlowBuild());

  let button = document.getElementById("toggleBuildSpeed");
  var text = button.firstChild.nodeValue;
  button.firstChild.nodeValue = (text == "Slow Build") ? "Fast Build" : "Slow Build";
};

/*** GRAPH PROPERTIES BUTTON ***/
window.graphProperties = function () {
  html = "Graph Properties <br><br>";
  html += graph.toHTMLString();
  editNotes(html, "darkgreen");
};

/*** ROTATE CAMERA ***/
let rotateCamera = false;
let step = Math.PI / 720;
let radius = 35;
let tick = 0;

window.toggleCamera = function () {
  rotateCamera = rotateCamera ? false : true;

  let button = document.getElementById("toggleCamera");
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
let currentAction = "none";
let selectedMeshes = [];

scene.onPointerDown = function (evt, pickResult) {
  if (currentAction === "none" && pickResult.hit) {

    let type = pickResult.pickedMesh.name[0];
    let id = Number(pickResult.pickedMesh.name.slice(1));
    console.log("clicked on " + pickResult.pickedMesh.name);

    if (type == "v") {
      let v = graph.vertices[id];
      html = "Vertex id: " + id + "<br>";
      if(graph.vertices[id].data != undefined){
        html += "Data: " + v.data + "<br>";
      } else {
        html += "Data: no data" + "<br>";
      }
    } else if (type == "e") {
      console.log("clicked on edge " + id);
      if(graph.edges[id] != undefined){

        let e = graph.edges[id];
        html = "Edge id: " + e.getEid() + "<br>";
        html += "Weight: " + e.getWeight() + "<br>";
      }
      else {
        console.log("cant find edge");
      }

    }
    editNotes(html, "darkgreen");
    return;
  }

  if (currentAction === "findPath" && pickResult.hit && pickResult.pickedMesh.name.startsWith("v")) {
    if (selectedMeshes.length === 0) {
      selectedMeshes.push(pickResult.pickedMesh.name.substr(1));
      pickResult.pickedMesh.material.diffuseColor = BABYLON.Color3.Green();
      editNotes("Pick target vertex", "darkgreen");
    }
    else if (selectedMeshes.length === 1 && pickResult.hit && pickResult.pickedMesh.name.startsWith("v")) {
      selectedMeshes.push(pickResult.pickedMesh.name.substr(1));
      pickResult.pickedMesh.material.diffuseColor = BABYLON.Color3.Green();

      path = graph.getShortestPath(Number(selectedMeshes[1]), Number(selectedMeshes[0]));

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
window.findPath = function () {
  resetMeshColor();
  currentAction = "findPath";
  editNotes("Pick source vertex", "darkgreen");
  selectedMeshes = [];
  // pick() recognizes a vertex was picked and takes over from here.
};

let pathIndex = 0;
let path = null;

function animatePath() {
  if (path == null) {
    return;
  }

  var vid = path[pathIndex];
  graph.vertices[vid].mesh.material.diffuseColor = BABYLON.Color3.Magenta();

  pathIndex++;

  if (pathIndex === path.length) {
    let audio = new Audio('ding.mp3');
    audio.volume = 0.25;
    audio.play();
    return;
  }

  setTimeout(animatePath, 1000);
}

/*** COLOR COMPONENTS BUTTON ***/
window.colorComponents = function() {
  let vid;
  for (vid in graph.vertices) {
    let v = graph.vertices[vid];
    if (v.mesh.material == null) {
      v.mesh.material = new BABYLON.StandardMaterial(v.vid, scene);
    }
  }

  if (graph.isConnected()){
    let color = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
    let vid;
    for(vid in graph.vertices){
      graph.vertices[vid].mesh.material.diffuseColor = color;
    }
  } else {
    let headVids = [];
    let colorSet = {};
    let find = "";
    for(vid in graph.vertices) {
      find = "";
      find += graph.findComponent(vid);

      if (colorSet.hasOwnProperty(find) === false) {
        colorSet[find] = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
      }

      graph.vertices[vid].mesh.material.diffuseColor = colorSet[find];
    }
  }
};

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
  scene.render();

  if (rotateCamera === true) {
    let x = radius * Math.sin(step * ++tick);
    let z = radius * Math.cos(step * tick);
    let y = 7;
    scene.activeCamera.setPosition(new BABYLON.Vector3(x,y,z));
  }

});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
  engine.resize();
});
