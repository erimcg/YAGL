/*
 * basicScene.js - A demonstrtion of some of the uses of yagl.
 *
 * Copyright 2016 - Bridgewater College
 */
var buildGraph;
var toggleBuildSpeed;
var graphProperties;
var toggleCamera;
var findPath;
var colorComponents;
var selectedMesh;
var selectedMeshes;
var scene;
var progress;

window.addEventListener('DOMContentLoaded', function() {

var frames = 0;

var canvas = document.querySelector("#renderCanvas");
var engine = new BABYLON.Engine(canvas, true);

var createScene = function () {
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.7, 0.85, 1);

    scene.ambientColor = new BABYLON.Color3(0.7, 0.85, 1);

    var camera = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 2, 35, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, false);

    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0.5), scene);
    light1.intensity = 1.0;
    light1.specular = new BABYLON.Color3(0.1, 0.1, 0.1);
    light1.groundColor = new BABYLON.Color3(0.4, 0.4, 0.5);

    builder = new YAGL.GraphBuilder(scene);

    var obj = createRandomYAGLGraphObject(4,4);
    builder.buildUsingJSONObj(obj);

    return scene;
};

var scene = createScene();

/*** EDIT NOTES ***/
function editNotes(html, textColor) {
	var notes = document.getElementById("note_span");
	if (notes == null) {
		return;
	}
	notes.innerHTML = html;
	notes.style.color = textColor;
}

var html = "YAGL - Yet Another Graph Library";
editNotes(html, "#666");

/*** BUILD GRAPH FUNCTION ***/
buildGraph = function (choice) {

    if (choice == 1) {
        var numVertices = Number(prompt("How Many Vertices?"));
        var maxEdges = (numVertices * (numVertices -1))/2;
        var numEdges = maxEdges + 1;

        while (numEdges > maxEdges) {
            numEdges = Number(prompt("How Many Edges (less than or equal to " + maxEdges + "): "));
        }
        
        var edgeWeight = Number(prompt("Specify edge weight:"));
        
        var obj = createRandomYAGLGraphObject(numVertices, numEdges, edgeWeight);
        builder.buildUsingJSONObj(obj);
        progress = setInterval(function() {
            if (scene.meshes.length < numVertices + numEdges) {
                var html;
                if (scene.meshes.length < numVertices) {
                    html = "Adding Vertices: " + scene.meshes.length + "/" + numVertices;
                } else {
                    html = "Connecting Edges: " + (scene.meshes.length - numVertices) + "/" + numEdges;
                }
                editNotes(html, "#666");
            } else {
                editNotes("Graph Complete", "#666");
                setTimeout(function() {editNotes("YAGL - Yet Another Graph Library", "#666");}, 3000);
                clearInterval(progress);
            }
        }, 250);
    } else if (choice == 2) {
        var obj = createRandomYAGLGraphObject();
        builder.buildUsingJSONObj(obj);
    } else {
        var url = prompt("Please enter the URL.", "http://demo.yagljs.com/yagl_files/dodecahedron.yagl");
        console.log(url);
        builder.buildUsingJSONFile(url);
    }
};

/*** REBUILD GRAPH FUNCTION ***/
rebuildGraph = function () {
    var obj = {
            "description":"Random Graph",
            "graphicsFramework":"Babylonjs",
            "layout":"Force Directed",
    };

    var numVertices;
    numVertices = graph.getAllVertices().length;

    obj["vertices"] = [];
    for (var i = 0; i < numVertices; i++) {
        obj.vertices.push({"id":i});
    };

    var numEdges = graph.getAllEdges().length;
    
    var vid1;
    var vid2;
    obj["edges"] = [];
    var i = 0;

    while(i < numEdges){
        obj.edges.push({
            "id":i,
            "v1":graph.getAllEdges()[i].getFirst().vid,
            "v2":graph.getAllEdges()[i].getSecond().vid,
            "weight":graph.getAllEdges()[i].weight
        });
        i++;
    }
    
    var vData = [];
    for (var i = 0; i < graph.getAllVertices().length; i++) {
        vData[i] = graph.vertices[i].data;
    }
    
    builder.buildUsingJSONObj(obj);
    progress = setInterval(function() {
        if (scene.meshes.length < numVertices + numEdges) {
            var html;
            if (scene.meshes.length < numVertices) {
                html = "Adding Vertices: " + scene.meshes.length + "/" + numVertices;
            } else {
                html = "Connecting Edges: " + (scene.meshes.length - numVertices) + "/" + numEdges;
            }
            editNotes(html, "#666");
        } else {
            for (var i = 0; i < graph.getAllVertices().length; i++) {
                graph.vertices[i].setData(vData[i]);
            }
            editNotes("Graph Complete", "#666");
            setTimeout(function() {editNotes("YAGL - Yet Another Graph Library", "#666");}, 3000);
            clearInterval(progress);
        }
    }, 250);
}

/*** SLOW/FAST BUILD BUTTON ***/
toggleBuildSpeed = function () {
    builder.setSlowBuild(!builder.getSlowBuild());

    button = document.getElementById("toggleBuildSpeed");
    var text = button.firstChild.nodeValue;
    button.firstChild.nodeValue = (text == "Slow Build") ? "Fast Build" : "Slow Build";
};

/*** GRAPH PROPERTIES BUTTON ***/
graphProperties = function () {
    html = "Graph Properties <br><br>";
    html += graph.toHTMLString();
    editNotes(html, "#666");
};

/*** ROTATE CAMERA ***/
var rotateCamera = true;
var step = Math.PI / 720;
var radius = 35;
var tick = 0;

toggleCamera = function () {
    rotateCamera = rotateCamera ? false : true;

    button = document.getElementById("toggleCamera");
    var text = button.firstChild.nodeValue;
    button.firstChild.nodeValue = (text == "Rotate Camera") ? "Freeze Camera" : "Rotate Camera";
};

/*** RESET COLOR FOR ALL MESHES ***/
function resetMeshColor(reset) {
    scene.meshes.forEach( function (m) {
        if (m.material == null) {
                console.log("new material");
                m.material = new BABYLON.StandardMaterial(m.name, scene);
        }
        if (reset) {
            m.material.diffuseColor = BABYLON.Color3.White();
        }
    });
}

/*** TEMPORARY VERTEX REMOVAL FUNCTION ***/
removeEdges = function (vid) {
    var eid, e;
    for(eid in graph.edges) {
        e = graph.edges[eid];
        if(vid == (e.v1.vid) || vid == (e.v2.vid)) {
            for (i in scene.meshes) {
                if (scene.meshes[i].name == "e" + eid)
                    scene.meshes[i].dispose();
            }
        }
    }
}


/*** ONPOINTERDOWN CALLBACK ***/
var currentAction = "none";

scene.onPointerDown = function (evt, pickResult) {
    
    resetMeshColor(false);
    if (selectedMesh != null && !(evt.shiftKey || evt.ctrlKey)) {
        for (mesh in selectedMeshes) {
            console.log(selectedMeshes[mesh]);
            selectedMeshes[mesh].material.emissiveColor = new BABYLON.Color3(0, 0, 0);
        }
        selectedMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
    }
    if (pickResult.hit) {
        if ((evt.shiftKey || evt.ctrlKey)) {
            if (selectedMesh != null && selectedMeshes.length == 0) {
                selectedMeshes[0] = selectedMesh;
            }
            selectedMeshes[selectedMeshes.length] = pickResult.pickedMesh;
        }
        selectedMesh = pickResult.pickedMesh;
        pickResult.pickedMesh.material.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7);
        if (pickResult.pickedMesh.name[0]=='v') {
            $$('sideView').removeView("selectionInfo");
            $$('sideView').addView({header: "<span class='webix_icon fa-mouse-pointer' style='font-size:90%'>&#62021</span><span style='padding-left: 0px'>Selection Info</span>", body: nodeInfo});
            var str = "";
            for(eid in graph.adjacencyList[pickResult.pickedMesh.name.slice(1)]) {
                edge = graph.edges[eid];
                vid2 = edge.getAdjacentVertex(pickResult.pickedMesh.name.slice(1));
                str += vid2 + ", ";
            }
            str = str.slice(0, str.length - 2);
            
            var degreeCentrality = parseFloat(graph.vertices[pickResult.pickedMesh.name.slice(1)].getDegreeCentrality()).toFixed(5);
            if (Number.isInteger(parseFloat(degreeCentrality)))
                degreeCentrality = parseInt(degreeCentrality);
            
            var closenessCentrality = parseFloat(graph.vertices[pickResult.pickedMesh.name.slice(1)].getClosenessCentrality()).toFixed(5);
            if (Number.isInteger(parseFloat(closenessCentrality)))
                closenessCentrality = parseInt(closenessCentrality);
            
            var degree = parseFloat(graph.vertices[pickResult.pickedMesh.name.slice(1)].getDegree()).toFixed(5);
            if (Number.isInteger(parseFloat(degree)))
                degree = parseInt(degree);
            
            $$('selectionInfo').setValues({
                index: pickResult.pickedMesh.name.slice(1),
                adjacency: str,data:graph.vertices[pickResult.pickedMesh.name.slice(1)].data,
                ndegree: degree,
                dcentr: degreeCentrality,
                ccentr: closenessCentrality
            });
        } else {
            $$('sideView').removeView("selectionInfo");
            $$('sideView').addView({header: "<span class='webix_icon fa-mouse-pointer' style='font-size:90%'>&#62021</span><span style='padding-left: 0px'>Selection Info</span>", body: edgeInfo});
            $$('selectionInfo').setValues({
                index: pickResult.pickedMesh.name.slice(1),
                weight: graph.edges[pickResult.pickedMesh.name.slice(1)].getWeight(),
                node1: graph.edges[pickResult.pickedMesh.name.slice(1)].v1.vid,
                node2: graph.edges[pickResult.pickedMesh.name.slice(1)].v2.vid
            });
        }
        $$("sideView").setValue("selectionInfo");
    } else if (!(evt.shiftKey || evt.ctrlKey)) {
        selectedMesh = null;
        selectedMeshes = [];
        $$('selectionInfo').setValues({});
        editNotes("YAGL - Yet Another Graph Library", "#666");
    }
    if (currentAction == "none" && pickResult.hit) {
        write_notes = function() {
            var type;
            var id;
            html = "";

            if ((evt.shiftKey || evt.ctrlKey)) {
                for (var i = 0; i < selectedMeshes.length; i++) {
                    type = selectedMeshes[i].name[0];
                    id = Number(selectedMeshes[i].name.slice(1));

                    if (type == "v") {

                        if(graph.vertices[id].data != undefined){
                            html += "Vertex " + id + ": " + graph.vertices[id].data + "<br>";
                        } else {
                            html += "Vertex " + id + ": no data" + "<br>";
                        }

                    } else {
                        html += "Edge " + id + ": weight " + graph.edges[id].getWeight() + "<br>";
                    }
                }
            } else {
                type = pickResult.pickedMesh.name[0];
                id = Number(pickResult.pickedMesh.name.slice(1));

                if (type == "v") {

                    if(graph.vertices[id].data != undefined){
                        html = "Vertex " + id + ": " + graph.vertices[id].data + "<br>";
                    } else {
                        html = "Vertex " + id + ": no data" + "<br>";
                    }

                } else {
                    html = "Edge " + id + ": weight " + graph.edges[id].getWeight() + "<br>";
                }
            }

            editNotes(html, "#666");
        }
        write_notes();
    }
    
    var menu;
    if (selectedMeshes.length == 2 && selectedMeshes[0].name[0] == 'v' && selectedMeshes[1].name[0] == 'v') {
        menu = ["Add Edge", "Edit", "Delete", { $template:"Separator" } ,"Info"];
        if (selectedMesh.name[0] != 'v')
            menu = ["Add Edge", "Delete", { $template:"Separator" } ,"Info"];
    } else if (selectedMesh != null) {
        menu = ["Edit", "Delete", { $template:"Separator" } ,"Info"];
        if (selectedMesh.name[0] != 'v')
            menu = menu.slice(1);
    } else {
        menu = ["Info"];
    }
    $$('display_context').clearAll();
    $$('display_context').parse(menu);
    
    if (currentAction == "findPath" && pickResult.hit && pickResult.pickedMesh.name[0]=='v') {
        if (selectedMeshes.length == 0) {
            selectedMeshes.push(pickResult.pickedMesh);
            pickResult.pickedMesh.material.diffuseColor = BABYLON.Color3.Green();
            editNotes("Pick target vertex", "#666");
        }
        else if (selectedMeshes.length == 1 && pickResult.hit && pickResult.pickedMesh.name[0]=='v') {
            selectedMeshes.push(pickResult.pickedMesh);
            pickResult.pickedMesh.material.diffuseColor = BABYLON.Color3.Green();

            path = graph.getShortestPath(Number(selectedMeshes[1].name.substr(1)), Number(selectedMeshes[0].name.substr(1)));

            if (path == null ) {
                html = "No path exists" + "<br>";
            } else {
                html = "Path:  " + path + "<br>";
            }
            editNotes(html, "#666");

            pathIndex = 0;
            animatePath();
            currentAction = "none";
            document.getElementById("yagl_scene").style.cursor = "auto";
        }
    }
};

/*** SHORTEST PATH BUTTON ***/
findPath = function () {
    document.getElementById("yagl_scene").style.cursor = "alias";
    resetMeshColor(true);
    currentAction = "findPath";
    editNotes("Pick source vertex", "#666");
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
colorComponents = function(option) {
    var vid;
    for (vid in graph.vertices) {
        var v = graph.vertices[vid];
        if (v.mesh.material == null) {
            v.mesh.material = new BABYLON.StandardMaterial(v.vid, scene);
        }
    }
    switch (option) {
        case 0:
            var color = new BABYLON.Color3(1, 1, 1);
            var vid;
            for(vid in graph.vertices){
                graph.vertices[vid].mesh.material.diffuseColor = color;
            }
            break;
        case 1:
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
            break;
        case 2:
            var color;
            var vid;
            for(vid in graph.vertices){
                var centrality = graph.vertices[vid].getDegreeCentrality();
                color = new BABYLON.Color3(Math.sqrt(centrality), Math.sqrt(centrality), Math.sqrt(centrality));
                /*if (centrality < 0.5) {
                    color = new BABYLON.Color3((0.5) * (0.5 + 0.5 * centrality), (0.5 + (centrality)) * (0.5 + 0.5 * centrality), (0.5 + (0.5 - (centrality))) * (0.5 + 0.5 * centrality));
                } else {
                    color = new BABYLON.Color3((0.5 + (centrality - 0.5)) * (0.5 + 0.5 * centrality), (0.5 + (1 - (centrality))) * (0.5 + 0.5 * centrality), (0.5) * (0.5 + 0.5 * centrality));
                }*/
                graph.vertices[vid].mesh.material.diffuseColor = color;
            }
            break;
        case 3:
            var color;
            var vid;
            var max = 0;
            for(vid in graph.vertices){
                if (graph.vertices[vid].getClosenessCentrality() > max)
                    max = graph.vertices[vid].getClosenessCentrality();
            }
            var min = 1;
            for(vid in graph.vertices){
                if (graph.vertices[vid].getClosenessCentrality() < min)
                    min = graph.vertices[vid].getClosenessCentrality();
            }
            var scale;
            if (max - min == 0) {
                scale = 1;
            } else {
                scale = 1 / (max - min);
            }
            console.log(max);
            for(vid in graph.vertices){
                var centrality = graph.vertices[vid].getClosenessCentrality();
                var value = Math.sqrt((scale * (centrality - min) + centrality) / 2);
                color = new BABYLON.Color3(value, value, value);
                graph.vertices[vid].mesh.material.diffuseColor = color;
            }
            break;
    }
};

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
    frames++;

    if (rotateCamera == true) {
        var x = radius * Math.sin(step * ++tick);
		var z = radius * Math.cos(step * tick);
		var y = 7;
		scene.activeCamera.setPosition(new BABYLON.Vector3(x,y,z));
    }

});

setInterval(function() {
    document.getElementById("fps").innerHTML = frames + " fps";
    frames = 0;
}, 1000);

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
});
