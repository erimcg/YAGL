/*
 * facebookScene.js
 * Author: Eric McGregor
 * Copyright 2016, Bridgwater College
 */


// Get the canvas element from our HTML below
var canvas = document.querySelector("#renderCanvas");
// Load the BABYLON 3D engine
var engine = new BABYLON.Engine(canvas, true);

var createScene = function () {
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = BABYLON.Color3.White();

    var camera = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 2, 35, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, false);

    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light1.intensity = 1.0;

    builder = new YAGL.GraphBuilder(scene);
    builder.setSlowBuild(true);

    return scene;
};

/*** CREATE SCENE ***/
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

var html = "Login to facebook to YAGL your frields.";
editNotes(html, "darkgreen");

/*** INITIALIZE THE YAGL OBJECT ***/
var fbo = {
    "graphicsFramework":"babylonjs",
    "layout":"Force Directed",
    "vertexMesh":{
        "meshName":"Cube",
        "rootUrl":"http://demo.yagljs.com/assets/",
        "sceneFilename":"cube.babylon"
    }
};

var loaded = false;

/* Callback for Create FB Graph button */
var createFacebookGraph = function() {
    if (loaded == true) {
        return;
    }
    loaded = true;

    var html = "Click on the cubes to see <br>your friends who have used this app.";
    editNotes(html, "darkgreen");

    FB.api('/me?fields=id,first_name,link,picture{url}', 'get', function(response) {

        me = {
            "id": +response.id,
            "data": {
                "first_name": response.first_name,
                "profile_pic_url": response.picture.data.url,
                "timeline_url":response.link
            }
        };

        document.getElementById('status').innerHTML =
            'Hello ' + me.data.first_name + '!&nbsp&nbsp' +
            '<img src=\"' + me.data.profile_pic_url + '\"></img><br>' +
            'Your facebook <a target=\"_blank\" href=\"' + me.data.timeline_url + '\">timeline</a>';

        fbo["vertices"] = [me];
    });

    FB.api('/me?fields=friends{id,first_name,link,picture{url}}', 'get', function (response) {

        var data = response.friends.data;
        friend_count = data.length;

        var id, first_name, profile_pic_url, timeline_url;

        var vertices = fbo["vertices"];
        var edges = [];

        for (var i = 0; i < friend_count; i++) {
            id = data[i].id;
            first_name = data[i].first_name;
            profile_pic_url = data[i].picture.data.url;
            timeline_url = data[i].link;

            vertices.push({
                    "id":+id,
                    "data": {
                        "first_name": first_name,
                        "profile_pic_url": profile_pic_url,
                        "timeline_url":timeline_url
                    }
            });

            edges.push({
                    "id":+id,        // TODO: Fix this so that its not dependent on id
                    "v1":+me.id,
                    "v2":+id
            });
        }

        fbo["vertices"] = vertices;
        fbo["edges"] = edges;

        builder.buildUsingJSONObj(fbo);
    });
};

var vertexTextureMap = {};

var loadFacebookPictures = function() {
    var graph = builder.getGraph();

    var vid;
    for (vid in graph.vertices) {
        loadFacebookPic(graph.vertices[vid]);
    }
};

var loadFacebookPic = function(v) {
    url = v.data.profile_pic_url;

    vertexTextureMap[url] = v.vid;

    downloadFile(url, "arraybuffer").then(function(request) {
        var response = request.response;
        var url = request.responseURL;

        var vid = vertexTextureMap[url];
        delete vertexTextureMap[url];

        var tex = new BABYLON.Texture(url, scene, false, false, BABYLON.Texture.SPHERICAL_MODE, null, null, response, true);

        var mesh = graph.getVertex(vid).mesh;
        mesh.rotation.z = Math.PI/2;
        mesh.scaling = new BABYLON.Vector3(1.3,1.3,1.3);
        mesh.material = new BABYLON.StandardMaterial("texture1", scene);

        mesh.material.diffuseTexture = tex;

    }, function(Error) {
        console.log(Error);
    });
};

/*** CALLBACK FOR WHEN MESHES ARE PICKED ***/
var currentAction = "none";
var selectedMeshes = [];

var pick = function (evt, pickResult) {
    if (currentAction == "none" && pickResult.hit) {
        var type = pickResult.pickedMesh.name[0];
        var id = Number(pickResult.pickedMesh.name.slice(1));

        if (type == "v") {
            var v = graph.vertices[id];

            if(v.data != null){
                var data = graph.vertices[id].data;
                var html = '<img src=' + data.profile_pic_url + '><br>' +
                data.first_name + '\'s facebook <a target=\"_blank\" href=\"' + data.timeline_url + '\">timeline</a><br>' +
                'Id: ' + id;
                editNotes(html, "darkgreen");
            }

            loadFacebookPic(v);
        }
    }
};

scene.onPointerDown = pick;

var rotateCamera = true;
var step = Math.PI / 360;
var radius = 35;
var tick = 0;

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

/*** ROTATE CAMERA TOGGLE BUTTON ***/
var toggleCamera = function () {
    console.log("toggling");
    rotateCamera = rotateCamera ? false : true;

    button = document.getElementById("toggleCamera");
    var text = button.firstChild.nodeValue;
    button.firstChild.nodeValue = (text == "Rotate Camera") ? "Freeze Camera" : "Rotate Camera";
};


/*** GRAPH PROPERTIES BUTTON ***/
var graphProperties = function () {
    html = "Graph Properties <br><br>";
    html += graph.toHTMLString();
    editNotes(html, "darkgreen");
};

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});
