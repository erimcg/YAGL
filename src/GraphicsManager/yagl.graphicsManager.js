var YAGL;
(function (YAGL) {

  var GraphicsManager = (function () {

    function GraphicsManager(graph1, scene, spec) {
      this.graph = graph1;
      graph = this.graph;     // Is there another way ???
      this.scene = scene;

      this.assetsManager = new BABYLON.AssetsManager(scene);
      this.assetsManager.useDefaultLoadingScreen = false;

      this.initialize(spec);
    }

    GraphicsManager.prototype.initialize = function (spec) {
      this.disposeAllMeshes();
      this.spec = spec;

      var layoutType = getProperty(spec, "layout", null);
      if (layoutType == "Force Directed") {
        this.layoutManager = new YAGL.ForceDirectedLayout(this.graph, 5, .9, 10, .9, .01);
      } else {
        this.layoutManager = null;
      }
    };

    GraphicsManager.prototype.addVertexMesh = function (v) {
      this.assetsManager.reset();

      var vid = v.vid;

      // Put a temporary mesh in place while user defined meshes are loaded.
      v.mesh = BABYLON.Mesh.CreatePlane(String(vid), 1.0, this.scene);
      v.mesh.visibility = false;

      var pos = getVertexProperty(this.spec, vid, "position", null);
      if (pos !== null) {
        v.mesh.position = new BABYLON.Vector3(pos[0], pos[1], pos[2]);
      } else if (this.layoutManager != null) {
        this.layoutManager.updateLayout();
      }

      var meshName, rootUrl, sceneFilename;
      // Check if vertex has its own mesh defined in spec file
      var meshInfo = getVertexProperty(this.spec, vid, "mesh", null);

      if (meshInfo !== null) {
        meshName = getProperty(meshInfo, "meshName", null);
        rootUrl = getProperty(meshInfo, "rootUrl", null);
        sceneFilename = getProperty(meshInfo, "sceneFilename", null);
      }
      // Otherwise check if spec file has default mesh defined
      else {
        meshName = getProperty(this.spec, "vertexMesh:meshName", null);
        rootUrl = getProperty(this.spec, "vertexMesh:rootUrl", null);
        sceneFilename = getProperty(this.spec, "vertexMesh:sceneFilename", null);
      }

      // If no mesh is specified, use the default sphere
      if (meshName == null || rootUrl == null || sceneFilename == null) {

        var oldMesh = v.mesh;
        var pos = oldMesh.position;
        oldMesh.dispose();

        var newMesh = BABYLON.Mesh.CreateSphere("v" + v.vid, 32, 1, this.scene, true,  BABYLON.Mesh.DEFAULTSIDE);
        newMesh.position = pos;

        v.mesh = newMesh;
        return;
      }

      var meshTask = this.assetsManager.addMeshTask(String(vid), meshName, rootUrl, sceneFilename);

      meshTask.onSuccess = function (task) {
        var v = graph.getVertex(task.name);

        var oldMesh = v.mesh;
        var pos = oldMesh.position;
        oldMesh.dispose();

        var newMesh = task.loadedMeshes[0];
        newMesh.name = "v" + task.name;
        newMesh.position = pos;

        v.mesh = newMesh;
      };

      meshTask.onError = function (task) {
        console.log("GraphicsManager: unable to load vertex mesh");
      };

      this.assetsManager.load();
    };

    GraphicsManager.prototype.addEdgeMesh = function (e) {
      var eid = e.eid;

      var path = [];
      path.push(e.v1.mesh.position);
      path.push(e.v2.mesh.position);

      if(getProperty(this.spec, "directed", false)) {
        this.createDirectedTube(e, path);
      }
      else {
        e.mesh = this.createTube(e, path);
      }
      //this.updateLayout();
    };

    GraphicsManager.prototype.createTube = function (e, path) {

      var eid = e.eid;

      var radius = getProperty(this.spec, "edgeMesh:args:radius", .1);
      var tess = getProperty(this.spec, "edgeMesh:args:tesselation", 32);

      var mesh = BABYLON.Mesh.CreateTube("e" + eid, path, radius, tess, null, BABYLON.Mesh.NO_CAP, this.scene, true, BABYLON.Mesh.FRONTSIDE);

      var visibility = getProperty(this.spec, "edgeMesh:visibility", true);
      mesh.visibility = visibility;

      mesh.material = new BABYLON.StandardMaterial("mat", this.scene);

      var rgb = getProperty(this.spec, "edgeMesh:color", [1,1,1]);
      mesh.material.diffuseColor = new BABYLON.Color3(rgb[0], rgb[1], rgb[2]);

      return mesh;
    };

    // createDirectedTube takes in two vectors, the second of which is the
    //location the cone will point to, and imports e from the addEdgeMesh function
    // Based on: (http://www.html5gamedevs.com/topic/9015-cylinder-between-two-points/)

    GraphicsManager.prototype.createDirectedTube = function (e, path) {

      var eid = e.eid;

      var vecFrom = path[0];
      var vecTo = path[1];

      // create a new point to serve as the end point of the cone
      var coneEnd = vecTo.subtract(vecFrom);

      // determine scale of cone endpoint
      coneEnd.x /= 6;
      coneEnd.y /= 6;
      coneEnd.z /= 6;

      // add vecEnd to get final position vector, finish the calculus
      coneEnd = coneEnd.add(vecFrom);

      // create length variable for the cone
      var length = BABYLON.Vector3.Distance(vecFrom, coneEnd);

      // create cone mesh
      var cone = BABYLON.Mesh.CreateCylinder("e" + eid, length, 0, .6, 36, scene, true);

      // move pivot point from center of cone to the point of the cone
      cone.setPivotMatrix(BABYLON.Matrix.Translation(0, -length / 2, 0));

      // make Vector3 to serve as arrow location
      var coneStart = vecFrom.subtract(vecTo);

      coneStart.x /= 20;
      coneStart.y /= 20;
      coneStart.z /= 20;

      coneStart = coneStart.add(vecTo);

      // move cone to the sphere location
      cone.position = coneStart;

      // create two vectors to become axis points
      var t1 = vecFrom.subtract(vecTo);
      t1.normalize();
      var t2 = new BABYLON.Vector3(0, 1, 0);
      // create an axis to align the cone on
      var axis = BABYLON.Vector3.Cross(t1, t2);
      axis.normalize();
      //console.log(axis);

      // create an angle to align the cone with
      var angle = BABYLON.Vector3.Dot(t1, t2);
      //console.log(angle);

      // align the cone using the created axis and angle
      cone.rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis,  Math.PI / 2 + angle);

      // create endpoint Vector3 for tube that will be inside of the arrow
      var tubeEnd = vecFrom.subtract(vecTo);

      tubeEnd.x /= 5;
      tubeEnd.y /= 5;
      tubeEnd.z /= 5;

      tubeEnd = tubeEnd.add(vecTo);

      // create tube for directed graph
      //this.createTube("e" + eid, [tubeEnd, vecFrom]);

      var path = [];
      path.push(tubeEnd);
      path.push(vecFrom);
      this.createTube(eid, path);

      // give the cone cool flames, sadly not yet functional (ONE DAY!!!)
      /*var flameMat = new BABYLON.StandardMaterial("material01",scene);
      flameMat.diffuseColor = new BABYLON.Color3(0,0,0);
      flameMat.diffuseTexture = new BABYLON.Texture("flames.jpg", scene);
      cone.material = flameMat;*/
    };

    GraphicsManager.prototype.updateLayout = function () {
      if (this.layoutManager != null) {
        this.layoutManager.updateLayout();
      }
    };

    GraphicsManager.prototype.removeVertexMesh = function (vid){
      for (var m in this.scene.meshes) {
        if (this.scene.meshes[m].name == "v" + vid) {
          this.scene.meshes[m].dispose();
        }
      }
    };

    GraphicsManager.prototype.removeEdgeMesh = function (eid) {
      for (var m in this.scene.meshes) {
        if (this.scene.meshes[m].name == "e" + eid) {
          this.scene.meshes[m].dispose();
        }
      }
    };

    GraphicsManager.prototype.disposeAllMeshes = function () {
      for (var i in this.scene.meshes) {
        this.scene.meshes[i].dispose();
      }

      this.scene.meshes = [];
    };

    return GraphicsManager;
  }());

  YAGL.GraphicsManager = GraphicsManager;
})(YAGL || (YAGL = {}));
