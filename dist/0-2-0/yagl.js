var YAGL = (function (exports) {
  'use strict';

  function isInt(x) {
    let y = parseInt(x, 10);
    return !isNaN(y) && x == y && x.toString() == y.toString();
  }

  function downloadFile(url, type) {
    return new Promise(function(resolve, reject) {
      let request = new XMLHttpRequest();

      request.open('GET', url, true);
      request.responseType = type;

      request.onload = function() {
        if (this.status === 200 && this.readyState == 4) {
          resolve(this);
        } else {
          reject(Error('File didn\'t load successfully; error code:' + this.statusText));
        }
      };

      request.onerror = function() {
        reject(Error('There was a network error.'));
      };

      request.send();
    });
  }

  function getProperty(obj, path, defaultValue) {
    //console.log(obj);

    if (obj == null || path == null) {
      //console.log("getProp: null obj or path");
      return defaultValue;
    }
    let tokens = path.split(":");

    for (let i = 0; i < tokens.length; i++) {
      if (obj.hasOwnProperty(tokens[i])) {
        obj = obj[tokens[i]];
      } else {
        //console.log("getProp: not found");
        return defaultValue;
      }
    }

    //console.log("getProp: found " + path);
    //console.log(obj)
    return obj;
  }

  function getVertexProperty(obj, vid, path, defaultValue) {

    let vertices = getProperty(obj, "vertices", null);

    if (vertices == null) {
      return defaultValue;
    }

    let i, vertex;
    let len = vertices.length;
    for (i = 0; i < len; i++) {
      vertex = vertices[i];
      if (vertex.id == vid) {
        return getProperty(vertex, path, defaultValue);
      }
    }
    return null;
  }

  function getEdgeProperty(obj, eid, path, defaultValue) {

    let edges = getProperty(obj, "edges", null);

    if (edges == null) {
      return defaultValue;
    }

    let i, edge;
    let len = edges.length;
    for (i = 0; i < len; i++) {
      edge = edges[i];
      if (edge.id == eid) {
        return getProperty(edge, path, defaultValue);
      }
    }
    return null;
  }

  class Vertex {

    constructor(vid, data) {
      if (!isInt(vid)) {
        throw new Error("Vertex: vid is not a number: " + String(vid));
      }

      Object.defineProperty(this, "vid", {
        writable:  false,
        value:  vid
      });

      this.data = data;
      this.visited = false;
      this.component = this.vid;
      this.mesh = null;
      this.parent = null;
    }

    /***********
     * GETTERS
     ***********/

    getVid () {
      return this.vid;
    };

    getData() {
      return this.data;
    };

    getVisited() {
      return this.visited;
    };

    getComponent() {
      return this.component;
    };

    getParent() {
      return this.parent;
    };

    getMesh() {
      return this.mesh;
    };

    /***********
     * SETTERS
     ***********/

    setParent(vid) {
      if (vid === null) {     // we allow null vid
        this.parent = null;
        return;
      }

      if (!isInt(vid)) {
        throw new Error("setParent: argument is not an int");
      }

      this.parent = vid;
    };

    setVisited(visit) {
      if (!(typeof visit == "boolean")) {
        throw new Error("setVisited: attempting to set visited to a non-Boolean value");
      }

      this.visited = visit;
    };

    setData(data) {
      this.data = data;
    };

    setMesh(mesh) {
      this.mesh = mesh;
    };

    /****************
     * OTHER METHODS
     ***************/

    equals(v) {
      if (!(v instanceof Vertex))
        return false;

      return this.vid === v.vid;
    };

    toString() {
      let str = "vid:" + this["vid"] + "\n";
      for (let prop in this) {
        if (this.hasOwnProperty(prop)) {
          let prop_str = prop + ": " + this[prop] + "\n";
          str += prop_str;
        }
      }
      return str;
    };

  }

  class Edge{

    constructor(eid, v1, v2, weight) {
      if (!isInt(eid)) {
        throw new Error("Edge: arg[0] must be an integer");
      }

      if (!((v1 instanceof Vertex && v2 instanceof Vertex) ||
        (isInt(v1) && isInt(v2)))) {
        throw new Error("Edge: second and third arguments must be both Vertices or integers");
      }

      Object.defineProperty(this, "eid", {
        writable:  false,
        value:  eid
      });

      if (isInt(v1)) {
        this.v1 = new Vertex(v1);
        this.v2 = new Vertex(v2);
      }
      else {
        this.v1 = v1;
        this.v2 = v2;
      }

      this.weight = (isNaN(weight) || weight === undefined) ? 1 : weight;

      this.mesh = undefined;
    }

    getEid() {
      return this.eid;
    };

    getFirst() {
      return this.v1;
    };

    getSecond() {
      return this.v2;
    };

    getMesh() {
      return this.mesh;
    };

    getWeight() {
      return this.weight;
    };

    getAdjacentVertex(vid) {
      if (vid === this.v1.vid) {
        return this.v2.vid;
      } else if (vid === this.v2.vid) {
        return this.v1.vid;
      } else {
        return null;
      }
    };

    setMesh(mesh) {
      this.mesh = mesh;
    };

    hasVertex(vid) {
      return (vid === this.v1) || (vid === this.v2);
    };

    equals(e) {
      if(!(e instanceof Edge)) {
        return false;
      }

      if(e.eid == null) {
        return false;
      }

      if(this.eid === e.eid) {
        return true
      }
    };

    toString() {
      let str = "";
      for (let prop in this) {
        if (this.hasOwnProperty(prop)) {
          let prop_str = prop + ": " + this[prop] + ", ";
          str += prop_str;
        }
        str += "\t";
      }
      return str;
    };
  }

  /*
  * Copyright (c) 2010-2013 Dennis Hotson
  *
  * Permission is hereby granted, free of charge, to any person
  * obtaining a copy of this software and associated documentation
  * files (the "Software"), to deal in the Software without
  * restriction, including without limitation the rights to use,
  * copy, modify, merge, publish, distribute, sublicense, and/or sell
  * copies of the Software, and to permit persons to whom the
  * Software is furnished to do so, subject to the following
  * conditions:
  *
  * The above copyright notice and this permission notice shall be
  * included in all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  * OTHER DEALINGS IN THE SOFTWARE.
  */


  class ForceDirectedLayout {

    constructor(graph, stiffness, repulsion, damping, minEnergyThreshold) {
      this.graph = graph;

      this.stiffness = stiffness;                           // spring stiffness constant: k
      this.repulsion = repulsion;                           // repulsion constant

      this.damping = damping;                               // velocity damping factor
      this.minEnergyThreshold = minEnergyThreshold || 0.01; //threshold used to determine render stop

      this.nodePoints = {}; // keep track of points associated with nodes
      this.edgeSprings = {}; // keep track of springs associated with edges
    }

    /**********************************************************************
     * Setter methods
     *********************************************************************/

    setStiffness(stiffness) {
      this.stiffness = stiffness;
      this.updateLayout();
    }

    setRepulsion(repulsion) {
      this.repulsion = repulsion;
      this.updateLayout();
    }

    setDamping(damping) {
      this.damping = damping;
      this.updateLayout();
    }

    setMinEnergyThreshold(minEnergyThreshold) {
      this.minEnergyThreshold = minEnergyThreshold;
      this.updateLayout();
    }

    /**********************************************************************
     * Getter methods
     *********************************************************************/

    getPoint(node) {
      let vid = node.getVid();
      if (!(vid in this.nodePoints)) {
        this.nodePoints[vid] = new Point(Vector.random(), 1.0);
      }
      return this.nodePoints[vid];
    };

    getSpring(e) {
      let eid = e.getEid();

      if (!(eid in this.edgeSprings)) {
        this.edgeSprings[eid] = new Spring(this.getPoint(e.getFirst()), this.getPoint(e.getSecond()),
          e.getWeight(), this.stiffness);
      }

      return this.edgeSprings[eid];
    };

    /**********************************************************************
     * Callback methods
     *********************************************************************/

    // callback should accept two arguments: Node, Point
    eachNode(callback) {
      let t = this;
      let nodes = this.graph.vertices;

      for (let vid in nodes) {
        callback.call(t, nodes[vid], t.getPoint(nodes[vid]));

      }
    };

    // callback should accept two arguments: Edge, Spring
    eachEdge(callback) {
      let t = this;
      let edges = this.graph.edges;
      for (let eid in edges) {
        callback.call(t, edges[eid], t.getSpring(edges[eid]));
      }
    };

    // callback should accept one argument: Spring
    eachSpring(callback) {
      let t = this;
      let edges = this.graph.edges;
      for (let eid in edges) {
        callback.call(t, t.getSpring(edges[eid]));
      }
    };

    /**********************************************************************
     * Physics methods
     *********************************************************************/

    applyCoulombsLaw() {
      this.eachNode(function (n1, point1) {
        this.eachNode(function (n2, point2) {
          if (point1 !== point2) {
            let d = point1.p.subtract(point2.p);
            let distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
            let direction = d.normalise();

            let edgeSet = this.graph.getEdges(n1.getVid(), n2.getVid());
            let edge = edgeSet[0];
            //console.log(edge);
            let weight = (edge === undefined) ? 1 : edge.getWeight();

            // apply force to each end point
            point1.applyForce(direction.multiply(this.repulsion * weight).divide(distance * distance * 0.5));
            point2.applyForce(direction.multiply(this.repulsion * weight).divide(distance * distance * -0.5));
          }
        });
      });
    };

    applyHookesLaw() {
      this.eachSpring(function (spring) {

        let d = spring.point2.p.subtract(spring.point1.p); // the direction of the spring
        let displacement = spring.length - d.magnitude();
        let direction = d.normalise();

        // apply force to each end point
        spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
        spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
      });
    };

    attractToCentre() {
      this.eachNode(function (node, point) {
        let direction = point.p.multiply(-1.0);
        point.applyForce(direction.multiply(this.repulsion / 50.0));
      });
    };



    /**********************************************************************
     * updateLayout (below) starts the simulation if it's not running already.
     *********************************************************************/

    updateVelocity(timestep) {
      this.eachNode(function (node, point) {
        point.v = point.v.add(point.a.multiply(timestep)).multiply(this.damping);
        point.a = new Vector(0, 0, 0);
      });
    };

    updatePosition(timestep) {
      this.eachNode(function (node, point) {
        point.p = point.p.add(point.v.multiply(timestep));

        // update the position of the node's mesh
        node.mesh.position = new BABYLON.Vector3(point.p.x, point.p.y, point.p.z);

        if (point.p.x === 0 && point.p.y === 0 && point.p.z === 0) {
          return;
        }

        // update the position of all edges adjacent to the node
        let eidList = this.graph.adjacencyList[node.vid];

        for (let eid in eidList) {
          this.graph.graphicsManager.setEdgeMesh(this.graph.edges[eid]);
        }

      });
    };

    // Calculate the total kinetic energy of the system
    totalEnergy(timestep) {
      let energy = 0.0;
      this.eachNode(function (node, point) {
        let speed = point.v.magnitude();
        energy += 0.5 * point.m * speed * speed;
      });

      return energy;
    };

    stop() {
      this._stop = true;
      this._started = false;
    };

    tick(timestep) {
      this.applyCoulombsLaw();
      this.applyHookesLaw();
      this.attractToCentre();
      this.updateVelocity(timestep);
      this.updatePosition(timestep);
    };

    updateLayout() {
      let t = this;

      if (this._started) return;

      t._started = true;
      t._stop = false;
      let run = true;

      while (run) {
        t.tick(.03);
        if (t.totalEnergy() < t.minEnergyThreshold) {
          run = false;
        }
      }

      //console.log("counter:  " + counter);
      t.stop();
    };

  }

  /**********************************************************************
   *                             VECTOR
   *********************************************************************/

  class Vector {

    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    };

    static random() {
      return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
    };

    add(v2) {
      return new Vector(this.x + v2.x, this.y + v2.y, this.z + v2.z);
    };

    subtract(v2) {
      return new Vector(this.x - v2.x, this.y - v2.y, this.z - v2.z);
    };

    multiply(n) {
      return new Vector(this.x * n, this.y * n, this.z * n);
    };

    divide(n) {
      return new Vector((this.x / n) || 0, (this.y / n) || 0, (this.z / n) || 0); // Avoid divide by zero errors..
    };

    magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    };

    normal() {
      return new Vector(-this.y, this.x, this.z);
    };

    normalise() {
      return this.divide(this.magnitude());
    };
  }

  /**********************************************************************
   *                             Point
   *********************************************************************/

  class Point {
    constructor(position, mass) {
      this.p = position; // position
      this.m = mass; // mass
      this.v = new Vector(0, 0, 0);   // velocity
      this.a = new Vector(0, 0, 0);   // acceleration
    };

    applyForce(force) {
      this.a = this.a.add(force.divide(this.m));
    };
  }

  /**********************************************************************
   *                             Spring
   *********************************************************************/

  class Spring {
    constructor(point1, point2, length, k) {
      this.point1 = point1;
      this.point2 = point2;
      this.length = length;   // spring length at rest
      this.k = k;             // spring constant/stiffness (See Hooke's law)
    };

  }

  class GraphicsManager {

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

  class Graph {
      /*
      * Graph is a model for a graph data structure.
      *      vertices contains a set of Vertex objects.
      *      edges contains a set of Edge objects.
      *      adjacencyList is a mapping of vids to arrays of eids.
      *      connectedComponents is a mapping of component root vids to rank values.
      */

      constructor(scene, spec) {
        this.vertices = {};             // vid -> Vertex
        this.edges = {};                // eid -> Edge
        this.adjacencyList = {};        // vid -> [eid1 -> vid, eid2 -> vid, ...]
        this.connectedComponents = {};  // root vid -> rank (int)

        this.directed = (getProperty(spec, "layout", null) === "true");

        this.graphicsManager = new GraphicsManager(this, scene, spec);
      }

      /*******************************************************************************
      *                      INITIALIZE THE DATA STRUCTURE
      *******************************************************************************/

      initialize(spec) {
        this.graphicsManager.initialize(spec);
        this.vertices = {};
        this.edges = {};
        this.adjacencyList = {};
        this.connectedComponents = {};
      };

      /*******************************************************************************
      *                          ADD AND REMOVE METHODS
      *******************************************************************************/

      /*
      * addVertex() takes a Vertex object as an argument.  It checks to see if v is
      * in this.vertices.  If not, it adds it to the list of vertices, adds a
      * connected component, and returns v.  Otherwise returns null.
      */

      addVertex(v, data) {

        if (isInt(v)) {
          v = new Vertex(v, data);
        }

        if (v instanceof Vertex === false) {
          throw new Error("addVertex: argument not a Vertex");
        }

        if (this.getVertex(v.vid) != null) {
          //console.log("addVertex: vertex not added, already exists (" + v.vid + ")");
          return null;
        }

        this.vertices[v.vid] = v;
        this.connectedComponents[v.vid] = 0;  // set rank to 0
        this.graphicsManager.addVertexMesh(v);

        //console.log("addVertex: vertex added (" + v.vid + ")");
        return v;
      };

      /*
      * addEdge() receives an Edge as an argument.  It checks if the vertices in the edge
      * are in the list of vertices.  If not, it adds them. It then adds the edge's eid to the
      * vertices' adjacency lists and combines components if the vertices are different.
      * Last, it adds the edge to the list of edges and returns the edge eid.
      */

      addEdge(e, vid1, vid2, weight) {

        let obj;
        if (isInt(e) && isInt(vid1) && isInt(vid2)) {
          e = new Edge(e, vid1, vid2, weight);
        }

        if(e instanceof Edge === false) {
          throw new Error("addEdge: argument not an Edge");
        }

        if (this.getEdge(e.eid) != null) {
          //console.log("addEdge: edge not added, already exists (" + e.eid + ")");
          return null;
        }

        let v1 = e.v1;
        let v2 = e.v2;

        // use existing vertices with same vid if possible
        let u = this.getVertex(v1.vid);
        if (u === null) {
          u = this.addVertex(v1);
        }
        else {
          //console.log("addEdge: vertex already exists (" + v1.vid + ")");
          e.v1 = u;
        }

        let v = this.getVertex(v2.vid);
        if (v === null) {
          v = this.addVertex(v2);
        }
        else {
          //console.log("addEdge: vertex already exists (" + v2.vid + ")");
          e.v2 = v;
        }

        // update adjacency list
        if (this.adjacencyList[u.vid] === undefined) {
          obj = {};
          obj[e.eid] = v.vid;
          this.adjacencyList[u.vid] = obj;
        } else {
          obj = this.adjacencyList[u.vid];
          obj[e.eid] = v.vid;
          // TODO: check if reassigning u.vid to obj is necessary
          this.adjacencyList[u.vid] = obj;
        }

        if (this.adjacencyList[v.vid] === undefined) {
          obj = {};
          obj[e.eid] = u.vid;
          this.adjacencyList[v.vid] = obj;
        } else {
          obj = this.adjacencyList[v.vid];
          obj[e.eid] = u.vid;
          // TODO: check if reassigning u.vid to obj is necessary
          this.adjacencyList[v.vid] = obj;
        }

        if (!v.equals(u)) {
          this.unionComponents(u.vid, v.vid);
        }

        // add edge to list of edges
        this.edges[e.eid] = e;
        //console.log("edge added between " + u.vid + " and " + v.vid);
        this.graphicsManager.addEdgeMesh(e);

        //console.log("addEdge: edge added (" + e.eid + ")");
        return e;
      };

      /*
      * removeVertex() takes a vid as an argument.  All edges containing the vertex are
      * removed from the adjacency list, the vertex is removed from the list of vertices
      * and the component for the vertex deleted. -1 is returned upon error, 0 is returned
      * upon success.
      */

      removeVertex(vid) {
        let v =  this.vertices[vid];

        if (v === undefined) {
          console.log("removeVertex: vid does not exist (" + vid + ")");
          return -1;
        }

        let e;
        for(let eid in this.edges) {
          e = this.edges[eid];
          if(v.equals(e.v1) || v.equals(e.v2)) {
            this.removeEdges(e.v1.vid, e.v2.vid);
          }
        }

        delete this.connectedComponents[vid];
        delete this.vertices[vid];

        // remove vertex mesh
        this.graphicsManager.removeVertexMesh(vid);

        //console.log("removeVertex: vertex removed (" + vid + ")");
        return 0;
      }

      /*
      * removeEdge() takes an edge eid as an argument, removes the edge from
      * both the adjacent vertices's adjacencey lists and the edge list.  If one
      * of the vertices are now in a new component, the old component is split.
      * -1 is returned upon error, 0 is returned upon success.
      */

      removeEdge(eid) {
        if(eid == null) {
          throw new Error("removeEdge: argument is null or undefined");
        }

        let edge =  this.edges[eid];

        if(edge == null) {
          console.log("removeEdge: eid does not exist (" + eid + ")");
          return -1;
        }

        let vid1 = edge.v1.vid;
        let vid2 = edge.v2.vid;

        // Remove edge from adjacency lists
        delete this.adjacencyList[vid1][eid];
        delete this.adjacencyList[vid2][eid];

        // Delete the edge
        delete this.edges[eid];

        // Remove mesh in the scene
        this.graphicsManager.removeEdgeMesh(eid);

        // Update components
        let oldRootVid = this.findComponent(vid1);

        if (this.BFSearch(vid1, oldRootVid) == null) {
          this.updateComponentLinks(vid1, oldRootVid);
          this.updateComponentLinks(oldRootVid, vid1);
          if (this.connectedComponents[vid1] === undefined) {
            //TODO: fix the rank
            this.connectedComponents[vid1] = 0;
          }
        } else if (this.BFSearch(vid2, oldRootVid) == null) {
          this.updateComponentLinks(vid2, oldRootVid);
          this.updateComponentLinks(oldRootVid, vid2);
          if (this.connectedComponents[vid2] === undefined) {
            //TODO: fix the rank
            this.connectedComponents[vid2] = 0;
          }
        }

        //console.log("removeEdge: edge removed (" + eid + ")");
        return 0;
      };

      /*
      * removeEdges() takes two vids as arguments. The function removes all edges connecting
      * those vertices.  The number of edges removed is returned.
      */

      removeEdges(vid1, vid2) {
        if(vid1 == null || vid2 == null) {
          throw new Error("removeEdges:  arguments are null or undefined");
        }

        let list = this.getEdges(vid1, vid2);
        let count = 0;

        for (let i in list) {
          this.removeEdge(list[i].eid);
          count++;
        }

        return count;
      };

      /*******************************************************************************
      *                             GETTER METHODS
      *******************************************************************************/

      /*
      * getVertex() takes a vid as an argument and returns the vertex with the given vid
      * or null if none exists.
      */

      getVertex(vid) {
        if (vid == null) {
          throw new Error("getVertex: null or undefined argument");
        }

        if (this.vertices[vid] === undefined) {
          return null;
        } else {
          return this.vertices[vid];
        }
      };

      /*
      * getAllVertices() returns an array containing the vertices in the graph.
      */

      getAllVertices() {
        let set = [];
        for (let vid in this.vertices) {
          set.push(this.vertices[vid]);
        }
        return set;
      };

      /*
      * getEdge() takes an eid as an argument and returns the edge with the given eid
      * or null if none exists.
      */

      getEdge(eid) {
        if (eid == null) {
          throw new Error("getEdge: null or undefined argument");
        }

        if (this.edges[eid] === undefined) {
          return null;
        } else {
          return this.edges[eid];
        }
      };

      /*
      * getEdges() takes two vids as arguments and returns an array containing the edges that
      * connect the two vertices.
      */

      getEdges(vid1, vid2) {
        if(vid1 == null || vid2 == null) {
          //console.log("getEdges: args are null or undefined");
          return null;
        }

        let set = [];
        let e;

        for (let eid in this.edges) {
          e = this.edges[eid];
          if ((vid1 === e.v1.vid && vid2 === e.v2.vid) ||
          (vid1 === e.v2.vid && vid2 === e.v1.vid)) {
            set.push(e);
            //console.log("edge exists *******");
          }
        }
        return set;
      };

      /*
      * getAllEdges() returns an array containing the edges in the graph.
      */

      getAllEdges() {
        let set = [];

        for(let eid in this.edges) {
          set.push(this.edges[eid]);
        }
        return set;
      };

      /*
       * isDirected() returns true if graph is a directed graph, otherwise returns false
       */

      isDirected() {
        return this.directed;
      };

      /*******************************************************************************
      *                              SETTER METHODS
      *******************************************************************************/

      /*
      * Sets all vertices' visited fields to false.
      */

      setAllVisitedFalse() {
        for (let vid in this.vertices) {
          this.vertices[vid].visited = false;
        }
      };

      /*******************************************************************************
      *                            COMPONENT METHODS
      *******************************************************************************/

      /*
      * isConnected() returns true if every pair of vertices are connected by a path in
      * the graph.
      */

      isConnected() {
        let count = 0;
        for (let vid in this.connectedComponents) {
          count++;
        }

        return count <= 1;
      };

      /*
      * Receives a vid and returns the vid of the root component connected to
      * iteslf.
      */

      findComponent(vid) {
        let compVid = this.vertices[vid].component;

        if (compVid === vid) {
          return vid;
        } else {
          return this.findComponent(compVid);
        }
      };

      /*
      * Receives two vid's and if in different components puts them in the same
      * component.
      */

      unionComponents(vid1, vid2) {
        if (vid1 == null || vid2 == null) {
          return;
        }

        if (this.vertices[vid1] === undefined || this.vertices[vid2] === undefined) {
          return;
        }

        //console.log("in union with: " + u + ", " + v);
        let root1vid = this.findComponent(vid1);
        let root2vid = this.findComponent(vid2);

        if (root1vid === root2vid) {
          return;
        }

        let rank1 = this.connectedComponents[root1vid];
        let rank2 = this.connectedComponents[root2vid];

        if (rank1 > rank2) {
          this.vertices[root2vid].component = root1vid;
          this.connectedComponents[root2vid] = rank2++;
          delete this.connectedComponents[root2vid];
        } else {
          this.vertices[root1vid].component = root2vid;
          this.connectedComponents[root1vid] = rank1++;
          delete this.connectedComponents[root1vid];
        }

        return;
      };

      /*
      * splitComponent() takes two vids as arguments and updates the
      * connectedComponent values for all of the children of the vids.
      */

      updateComponentLinks(newRootVid, oldRootVid) {
        if (newRootVid === null || oldRootVid === null) {
          console.log("splitComponent: null vid");
        }

        if (!this.adjacencyList.hasOwnProperty(newRootVid) || !this.adjacencyList.hasOwnProperty(oldRootVid)) {
          console.log("splitComponent: vid does not exist");
          return;
        }

        /*
        * Traverse graph.  For each vertex v that is visited, set v.component to
        * it's parent's vid.
        */

        this.vertices[newRootVid].component = newRootVid;
        let queue = []; //queue contains unvisited vid's
        queue.push(newRootVid);

        this.setAllVisitedFalse();
        this.vertices[newRootVid].setVisited(true);

        let curVid;   // curVid is the current vid taken out of the queue
        while (queue.length !== 0) {
          curVid = queue.shift();
          //console.log("processing children of " + curVid);
          let adjList = this.adjacencyList[curVid];

          let v;
          for (let eid in adjList) {
            v = this.vertices[this.edges[eid].getAdjacentVertex(curVid)];
            if (v.getVisited() === false) {
              v.setVisited(true);
              v.component = curVid;
              //console.log("setting child " + v.vid);
              queue.push(v.vid);
            }
          }
        }

        return null;
      };

      /*
      * TODO FIX: Returns an array containing all the vids connected to the
      * vid passed in as an arg.
      */

      getConnectedVertices(head) {
        let set = [];

        for (let vid in this.connectedComponents) {
          if(this.findComponent(vid) === this.findComponent(head)) {
            set.push(vid);
          }
        }
        return set;
      };

      /*******************************************************************************
      *                             SEARCH METHODS
      *******************************************************************************/

      /*
       * Takes a starting vid then adds each mapped value to a queue to check.
       * returns the vid of the found element found. else reurns null
       */

      BFSearch (startVid, stopVid) {
        if (startVid == null || stopVid == null) {
          throw new Error("BFSearch: null or undefined arguments");
        }

        if (!this.adjacencyList.hasOwnProperty(startVid)) {
          console.log("Search Failed: Invalid start vertex " + startVid);
          return null;
        }

        let queue = []; //need array object
        queue.push(startVid);

        this.setAllVisitedFalse();
        this.vertices[startVid].setVisited(true);

        this.vertices[startVid].setParent(startVid);

        let curVid;
        while (queue.length !== 0) {
          curVid = queue.shift();

          if (curVid === stopVid) {
            return curVid;
          }
          let list = this.adjacencyList[curVid];

          let e, adjVid, v;
          for (let eid in list) {
            e = this.edges[eid];
            adjVid = e.getAdjacentVertex(curVid);
            v = this.vertices[adjVid];
            if (v.getVisited() === false) {
              v.setVisited(true);
              v.setParent(curVid);

              queue.push(adjVid);
            }
          }
        }

        return null;
      };

      /*
      * getShortestPath() returns an array of vids from vid2 to vid1.
      */

      getShortestPath(vid1, vid2) {
        if (this.BFSearch(vid1, vid2) == null) {
          return null;
        }

        let path = [vid2];

        let parentVid = this.vertices[vid2].getParent();

        while (parentVid !== vid1) {
          path.push(parentVid);
          parentVid = this.vertices[parentVid].getParent();
        }

        path.push(vid1);
        return path;
      };

      /*******************************************************************************
      *                            DISPLAY METHODS
      *******************************************************************************/

      /*
      * Prints out a row for each vertex in the vertices list for each
      * vertex adjacent to it
      */

      toString() {
        let str = "";

        for(let vid1 in this.vertices) {
          str += vid1 + ":  ";
          for(let eid in this.adjacencyList[vid1]) {
            const edge = this.edges[eid];
            const vid2 = edge.getAdjacentVertex(vid1);
            str += vid2 + " ";
          }
          str += "\n";
        }
        return str;
      };

      toHTMLString() {
        let str = "";

        for(let vid1 in this.vertices) {
          str += vid1 + ":  ";
          for(let eid in this.adjacencyList[vid1]) {
            const edge = this.edges[eid];
            const vid2 = edge.getAdjacentVertex(vid1);
            str += vid2 + " ";
          }
          str += "<br>";
        }
        str += "<br>";
        return str;
      };

  }

  class GraphBuilder {

    constructor(scene, spec) {
      this.scene = scene;
      this.slowBuild = true;
      this.vIndex = 0;
      this.eIndex = 0;
      this.spec = spec;

      this.graph = new Graph(scene, spec);
    }

    initialize(spec) {
      this.graph.initialize(spec);
      this.spec = spec;
      this.vIndex = 0;
      this.eIndex = 0;
    };

    getGraph() {
      return this.graph;
    };

    build() {
      if (this.spec !== null && typeof this.spec === 'object') {
        this.buildUsingJSONObj(this.spec);
      }
    };

    buildUsingJSONFile(url) {
      downloadFile(url, "json", this)
        .then((request) => {
          this.buildUsingJSONObj(request.response);})
        .catch((Error) => {
          console.log(Error);
        });
    };

    buildUsingJSONObj(spec) {
      this.initialize(spec);

      var vertices = getProperty(spec, "vertices", null);
      var edges = getProperty(spec, "edges", null);

      // Start by adding vertices.  addVertices() will call addEdges().
      this.addVertices(vertices, edges, this);
    };

    appendUsingJSONObj(obj) {
      var vertices = getProperty(obj, "vertices", null);
      var edges = getProperty(obj, "edges", null);

      this.vIndex = 0;
      this.eIndex = 0;
      // Start by adding vertices.  addVertices() will call addEdges().
      this.addVertices(vertices, edges, this);
    }

    addVertices (vertices, edges, gb) {
      if (vertices == null || gb.vIndex === vertices.length) {
        gb.addEdges(edges, gb);
        return;
      }

      let vertex, id, data, v;
      while(gb.vIndex < vertices.length) {
        vertex = vertices[gb.vIndex];
        id = vertex.hasOwnProperty('id') ? vertex.id: null;
        data = vertex.hasOwnProperty('data') ? vertex.data: null;

        v = gb.graph.addVertex(id, data);
        gb.vIndex++;

        if (gb.slowBuild) {
          setTimeout(this.addVertices.bind(this), 400, vertices, edges, gb);
          return;
        }
      }

      gb.addEdges(edges, gb);
    };

    addEdges(edges, gb) {
      if (edges == null || gb.eIndex === edges.length) {
        return;
      }

      var eid, vid1, vid2, weight, e;
      while(gb.eIndex < edges.length) {
        eid = edges[gb.eIndex].id;
        vid1 = edges[gb.eIndex].v1;
        vid2 = edges[gb.eIndex].v2;
        weight = edges[gb.eIndex].weight;

        e = gb.graph.addEdge(eid, vid1, vid2, weight);
        gb.eIndex++;

        if(gb.slowBuild) {
          setTimeout(this.addEdges.bind(this), 600, edges, gb);
          return;
        }
      }
    };

    setSlowBuild(value) {
      this.slowBuild = value;
    };

    getSlowBuild() {
      return this.slowBuild;
    };

  }

  exports.Edge = Edge;
  exports.ForceDirectedLayout = ForceDirectedLayout;
  exports.Graph = Graph;
  exports.GraphBuilder = GraphBuilder;
  exports.GraphicsManager = GraphicsManager;
  exports.Vertex = Vertex;
  exports.downloadFile = downloadFile;
  exports.getEdgeProperty = getEdgeProperty;
  exports.getProperty = getProperty;
  exports.getVertexProperty = getVertexProperty;
  exports.isInt = isInt;

  return exports;

}({}));
