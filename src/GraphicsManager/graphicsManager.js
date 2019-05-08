import {getProperty, getVertexProperty} from "../util.js"
import {ForceDirectedLayout} from "../LayoutManager/forceDirectedLayout.js"

export class GraphicsManager {

  constructor(graph1, scene, spec) {
    this.graph = graph1;
    var graph = this.graph;     // TODO: Is there another way ???
    this.scene = scene;

    this.assetsManager = new BABYLON.AssetsManager(scene);
    this.assetsManager.useDefaultLoadingScreen = false;

    this.initialize(spec);
  }

  initialize(spec) {
    this.disposeAllMeshes();
    this.spec = spec;

    let layoutType = getProperty(spec, "layout", null);
    if (layoutType === "Force Directed") {
        this.layoutManager = new ForceDirectedLayout(this.graph, 0.2, 10, 0.9, 0.01);
    } else {
      this.layoutManager = null;
    }
  };

  addVertexMesh(v) {
    this.assetsManager.reset();

    let vid = v.vid;

    // Put a temporary mesh in place while user defined meshes are loaded.
    v.mesh = BABYLON.Mesh.CreatePlane(String(vid), 1.0, this.scene);
    v.mesh.visibility = false;

    let pos = getVertexProperty(this.spec, vid, "position", null);

    if (pos !== null) {
      v.mesh.position = new BABYLON.Vector3(pos[0], pos[1], pos[2]);
    } else if (this.layoutManager != null) {
      this.layoutManager.updateLayout();
    }

    let meshName, rootUrl, sceneFilename;
    // Check if vertex has its own mesh defined in spec file
    let meshInfo = getVertexProperty(this.spec, vid, "mesh", null);

    if (meshInfo != null) {
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

    // If mesh is specified, create it
    if (meshName != null && rootUrl != null && sceneFilename != null) {

      let meshTask = this.assetsManager.addMeshTask(String(vid), meshName, rootUrl, sceneFilename);

      meshTask.onSuccess = (task) => {
        let v = this.graph.getVertex(task.name);

        let oldMesh = v.mesh;
        let pos = oldMesh.position;
        oldMesh.dispose();

        let newMesh = task.loadedMeshes[0];
        newMesh.name = "v" + task.name;
        newMesh.position = pos;

        v.mesh = newMesh;
      };

      meshTask.onError = (task) => {
        console.log("GraphicsManager: unable to load vertex mesh");
      };

      this.assetsManager.load();
      return;
    }

    // If no mesh is specified, use the default sphere
    let oldMesh = v.mesh;
    pos = oldMesh.position;
    oldMesh.dispose();

    let newMesh = BABYLON.Mesh.CreateSphere("v" + v.vid, 32, 1, this.scene, true,  BABYLON.Mesh.DEFAULTSIDE);
    newMesh.position = pos;

    v.mesh = newMesh;
  };

  addEdgeMesh(e) {

    // The layout manager will call setEdgeMesh() when the vertices'
    // positions are set.
    if (this.layoutManager != null) {
      this.layoutManager.updateLayout();
      return;
    }

    this.setEdgeMesh(e);
  };

  setEdgeMesh(e) {

    let path = [];
    path.push(e.v1.mesh.position);
    path.push(e.v2.mesh.position);

    this.createTube(e, path);
  };

  createTube(e, path) {

    let eid = e.eid;

    let radius = getProperty(this.spec, "edgeMesh:args:radius", .1);
    let tess = getProperty(this.spec, "edgeMesh:args:tesselation", 32);

    if (this.graph.edges[e.eid].mesh != null) {
      this.graph.edges[eid].mesh = BABYLON.MeshBuilder.CreateTube(null, {path: path, radius: radius, instance: this.graph.edges[eid].mesh});
      return;
    }

    let mesh = BABYLON.Mesh.CreateTube("e" + eid, path, radius, tess, null, BABYLON.Mesh.NO_CAP, this.scene, true, BABYLON.Mesh.FRONTSIDE);

    mesh.visibility = getProperty(this.spec, "edgeMesh:visibility", true);

    mesh.material = new BABYLON.StandardMaterial("mat", this.scene);

    let rgb = getProperty(this.spec, "edgeMesh:color", [1,1,1]);
    mesh.material.diffuseColor = new BABYLON.Color3(rgb[0], rgb[1], rgb[2]);

    e.mesh = mesh;

    return mesh;
  };

  updateLayout() {
    if (this.layoutManager != null) {
      this.layoutManager.updateLayout();
    }
  };

  removeVertexMesh(vid){
    for (let m in this.scene.meshes) {
      if (this.scene.meshes[m].name === "v" + vid) {
        this.scene.meshes[m].dispose();
        return;
      }
    }
  };

  removeEdgeMesh(eid) {
    for (let m in this.scene.meshes) {
      if (this.scene.meshes[m].name === "e" + eid) {
        console.log("disposing mesh: " + this.scene.meshes[m].name);

        this.scene.meshes[m].dispose();
        return;
      }
    }
  };

  disposeAllMeshes() {
    for (let i in this.scene.meshes) {
      this.scene.meshes[i].dispose();
    }

    this.scene.meshes = [];
  };

}
