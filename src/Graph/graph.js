import {isInt} from "../util.js"
import {Vertex} from "./vertex.js"
import {Edge} from "./edge.js"
import {GraphicsManager} from "../GraphicsManager/graphicsManager.js"
import {getProperty} from "../util";

export class Graph {
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
      let set = [], vid;

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
