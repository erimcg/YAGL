var YAGL;
(function (YAGL) {

  var Graph = (function () {

    /*
    * Graph is a model for a graph data structure.
    *      vertices contains a set of YAGL.Vertex objects.
    *      edges contains a set of YAGL.Edge objects.
    *      adjacencyList is a mapping of vids to arrays of eids.
    *      connectedComponents is a mapping of component root vids to rank values.
    */

    function Graph(scene, spec) {
      this.vertices = {};             // vid -> Vertex
      this.edges = {};                // eid -> Edge
      this.adjacencyList = {};        // vid -> [eid1 -> vid, eid2 -> vid, ...]
      this.connectedComponents = {};  // root vid -> rank (int)

      this.graphicsManager = new YAGL.GraphicsManager(this, scene, spec);
    }

    /*******************************************************************************
    *                      INITIALIZE THE DATA STRUCTURE
    *******************************************************************************/

    Graph.prototype.initialize = function (spec) {
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
    * addVertex() takes a YAGL.Vertex object as an argument.  It checks to see if v is
    * in this.vertices.  If not, it adds it to the list of vertices, adds a
    * connected component, and returns v.  Otherwise returns null.
    */

    Graph.prototype.addVertex = function (v, data) {

      if (isInt(v)) {
        v = new YAGL.Vertex(v, data);
      }

      if (v instanceof YAGL.Vertex == false) {
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
    * addEdge() receives an YAGL.Edge as an argument.  It checks if the vertices in the edge
    * are in the list of vertices.  If not, it adds them. It then adds the edge's eid to the
    * vertices' adjacency lists and combines components if the vertices are different.
    * Last, it adds the edge to the list of edges and returns the edge eid.
    */

    Graph.prototype.addEdge = function (e, vid1, vid2, weight) {

      if (isInt(e) && isInt(vid1) && isInt(vid2)) {
        e = new YAGL.Edge(e, vid1, vid2, weight);
      }

      if(e instanceof YAGL.Edge == false) {
        throw new Error("addEdge: argument not an Edge");
      }

      if (this.getEdge(e.eid) != null) {
        //console.log("addEdge: edge not added, already exists (" + e.eid + ")");
        return null;
      }

      var v1 = e.v1;
      var v2 = e.v2;

      // use existing vertices with same vid if possible
      var u = this.getVertex(v1.vid);
      if (u === null) {
        u = this.addVertex(v1);
      }
      else {
        //console.log("addEdge: vertex already exists (" + v1.vid + ")");
        e.v1 = u;
      }

      var v = this.getVertex(v2.vid);
      if (v === null) {
        v = this.addVertex(v2);
      }
      else {
        //console.log("addEdge: vertex already exists (" + v2.vid + ")");
        e.v2 = v;
      }

      // increment the degree of each vertex

      u.incrementDegree();
      v.incrementDegree();

      // update adjacency list
      if (this.adjacencyList[u.vid] === undefined) {
        var obj = new Object();
        obj[e.eid] = v.vid;
        this.adjacencyList[u.vid] = obj;
      } else {
        var obj = this.adjacencyList[u.vid];
        obj[e.eid] = v.vid;
        // TODO: check if reassigning u.vid to obj is necessary
        this.adjacencyList[u.vid] = obj;
      }

      if (this.adjacencyList[v.vid] === undefined) {
        obj = new Object();
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

      // adjust closeness centrality for each vertex
      this.setDegreeCentralityForVertex(u.vid);
      this.setDegreeCentralityForVertex(v.vid);

      // adjust degree centrality for all vertices
      this.setClosenessCentralityForAllVertices();

      //console.log("addEdge: edge added (" + e.eid + ")");
      return e;
    };

    /*
    * removeVertex() takes a vid as an argument.  All edges containing the vertex are
    * removed from the adjacency list, the vertex is removed from the list of vertices
    * and the component for the vertex deleted. -1 is returned upon error, 0 is returned
    * upon success.
    */

    Graph.prototype.removeVertex = function (vid) {
      var v =  this.vertices[vid];

      if (v === undefined) {
        console.log("removeVertex: vid does not exist (" + vid + ")");
        return -1;
      }

      var e;
      for(var eid in this.edges) {
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

    Graph.prototype.removeEdge = function (eid) {
      if(eid == null) {
        throw new Error("removeEdge: argument is null or undefined");
      }

      var edge =  this.edges[eid];

      if(edge == null) {
        console.log("removeEdge: eid does not exist (" + eid + ")");
        return -1;
      }

      // decrement the degree of each vertex
      var vid1 = edge.v1.vid;
      this.vertices[vid1].decrementDegree();

      var vid2 = edge.v2.vid;
      this.vertices[vid2].decrementDegree();

      // Remove edge from adjacency lists
      delete this.adjacencyList[vid1][eid];
      delete this.adjacencyList[vid2][eid];

      // Delete the edge
      delete this.edges[eid];

      // Remove mesh in the scene
      this.graphicsManager.removeEdgeMesh(eid);

      // Update components
      var oldRootVid = this.findComponent(vid1);

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

      // adjust degree centrality for each vertex
      this.setDegreeCentralityForVertex(vid1);
      this.setDegreeCentralityForVertex(vid2);

      // adjust closeness centrality for each vertex
      this.setClosenessCentralityForAllVertices();

      //console.log("removeEdge: edge removed (" + eid + ")");
      return 0;
    };

    /*
    * removeEdges() takes two vids as arguments. The function removes all edges connecting
    * those vertices.  The number of edges removed is returned.
    */

    Graph.prototype.removeEdges = function (vid1, vid2) {
      if(vid1 == null || vid2 == null) {
        throw new Error("removeEdges:  arguments are null or undefined");
      }

      var list = this.getEdges(vid1, vid2);
      var count = 0;

      for (var i in list) {
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

    Graph.prototype.getVertex = function (vid) {
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

    Graph.prototype.getAllVertices = function () {
      var set = [];
      for (var vid in this.vertices) {
        set.push(this.vertices[vid]);
      }
      return set;
    };

    /*
    * getEdge() takes an eid as an argument and returns the edge with the given eid
    * or null if none exists.
    */

    Graph.prototype.getEdge = function (eid) {
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

    Graph.prototype.getEdges = function (vid1, vid2) {
      if(vid1 == null || vid2 == null) {
        //console.log("getEdges: args are null or undefined");
        return null;
      }

      var set = [];
      var e;

      for (var eid in this.edges) {
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

    Graph.prototype.getAllEdges = function () {
      var set = [];

      for(var eid in this.edges) {
        set.push(this.edges[eid]);
      }
      return set;
    };

    /*******************************************************************************
    *                              SETTER METHODS
    *******************************************************************************/

    /*
    * Sets all vertices' visited fields to false.
    */

    Graph.prototype.setAllVisitedFalse = function () {
      for (var vid in this.vertices) {
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

    Graph.prototype.isConnected = function () {
      var count = 0;
      for (var vid in this.connectedComponents) {
        count++;
      }

      if (count > 1) {
        return false;
      } else {
        return true;
      }
    };

    /*
    * Receives a vid and returns the vid of the root component connected to
    * iteslf.
    */

    Graph.prototype.findComponent = function (vid) {
      var compVid = this.vertices[vid].component;

      if (compVid == vid) {
        return vid;
      } else {
        return this.findComponent(compVid);
      }
    };

    /*
    * Receives two vid's and if in different components puts them in the same
    * component.
    */

    Graph.prototype.unionComponents = function (vid1, vid2) {
      if (vid1 == null || vid2 == null) {
        return;
      }

      if (this.vertices[vid1] == undefined || this.vertices[vid2] == undefined) {
        return;
      }

      //console.log("in union with: " + u + ", " + v);
      var root1vid = this.findComponent(vid1);
      var root2vid = this.findComponent(vid2);

      if (root1vid == root2vid) {
        return;
      }

      var rank1 = this.connectedComponents[root1vid];
      var rank2 = this.connectedComponents[root2vid];

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

    Graph.prototype.updateComponentLinks = function (newRootVid, oldRootVid) {
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
      var queue = []; //queue contains unvisited vid's
      queue.push(newRootVid);

      this.setAllVisitedFalse();
      this.vertices[newRootVid].setVisited(true);

      var curVid;   // curVid is the current vid taken out of the queue
      while (queue.length != 0) {
        curVid = queue.shift();
        //console.log("processing children of " + curVid);
        var adjList = this.adjacencyList[curVid];

        var v;
        for (var eid in adjList) {
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

    Graph.prototype.getConnectedVertices = function (head) {
      var set = [], vid;

      for (var vid in this.connectedComponents) {
        if(this.findComponent(vid) == this.findComponent(head)) {
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

    Graph.prototype.BFSearch = function (startVid, stopVid) {
      if (startVid == null || stopVid == null) {
        throw new Error("BFSearch: null or undefined arguments");
      }

      if (!this.adjacencyList.hasOwnProperty(startVid)) {
        console.log("Search Failed: Invalid start vertex " + startVid);
        return null;
      }

      var queue = []; //need array object
      queue.push(startVid);

      this.setAllVisitedFalse();
      this.vertices[startVid].setVisited(true);

      this.vertices[startVid].setParent(startVid);

      var curVid;
      while (queue.length !== 0) {
        curVid = queue.shift();

        if (curVid == stopVid) {
          return curVid;
        }
        var list = this.adjacencyList[curVid];

        var e, adjVid, v;
        for (var eid in list) {
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

    Graph.prototype.getShortestPath = function (vid1, vid2) {
      if (this.BFSearch(vid1, vid2) == null) {
        return null;
      }

      var path = [vid2];

      var parentVid = this.vertices[vid2].getParent();

      while (parentVid != vid1) {
        path.push(parentVid);
        parentVid = this.vertices[parentVid].getParent();
      }

      path.push(vid1);
      return path;
    };

    /*******************************************************************************
    *                            CENTRALITY MEASURES
    *******************************************************************************/

    /*
    * setDegreeCentralityForVertex(): sets the degree centrality for a single vertex.
    *
    * The degree centrality of a vertex is the proportion of vertices
    * that are adjacent to the given vertex.
    */

    Graph.prototype.setDegreeCentralityForVertex = function (vid) {
      var numVertices = Object.keys(this.vertices).length;
      this.vertices[vid].degreeCentrality = this.vertices[vid].degree/(numVertices-1);
    };

    /*
    * getMaxDegreeCentrality(): returns the maximum degree centrality of all vertices
    * in the graph.
    */

    Graph.prototype.getMaxDegreeCentrality = function () {
      if (Object.keys(this.vertices).length == 0) {
        return 0;
      }

      var max = this.vertices[0].degreeCentrality;
      for (var vid in this.vertices) {
        var dc = this.vertices[vid].degreeCentrality;
        if (dc > max) {
          max = dc;
        }
      }

      return max;
    };

    /*
    * getDegreeCentrality(): sets the degree centrality for the graph.
    *
    * A star graph has degree centrality of 1.  A circle graph has degree
    * centrality of 0.
    */

    Graph.prototype.getDegreeCentrality = function () {
      var numerator = 0;
      var denominator = 0;
      var degreeCentrality = 0;
      var numVertices = Object.keys(this.vertices).length;

      var max = this.getMaxDegreeCentrality();

      if (numVertices <= 2) {
        //console.log('No degree centrality');
        return NaN;
      }

      for(var vid in this.vertices) {
        numerator += (max - this.vertices[vid].degreeCentrality);
      }

      denominator = (numVertices - 2) * (numVertices - 1);
      var degreeCentrality = (numerator / denominator).toFixed(2);
      //console.log('Degree Centrality: ' + degreeCentrality);

      return degreeCentrality;
    };

    /*
    * setClosenessCentralityForAllVertices(): "The average length of the shortest path between
    * the node and all other nodes in the graph." Wikipedia
    */

    Graph.prototype.setClosenessCentralityForAllVertices = function () {
      //console.log("computing closeness centrality for vid: " + vid1);
      var numVertices = Object.keys(this.vertices).length;

      for (var vid1 in this.vertices) {
        var sumOfShortestPathLengths = 0;
        for(var vid2 in this.vertices) {
          if(vid1 != vid2){
            //console.log("finding path from " + vid1 + "  to " + vid2);
            var path = this.getShortestPath(vid1, vid2);

            if (path != null) {
              //console.log("path length: "  + path.length + " - sum of shortest path lengths: " + sumOfShortestPathLengths);
              sumOfShortestPathLengths += (path.length - 1);
            }
          }
        }
        //console.log("vid: "+ vid1);
        //console.log("set closeness: numVertices: " + numVertices);
        //console.log("set closeness: sumOfShortestPathLengths: " + sumOfShortestPathLengths);
        this.vertices[vid1].closenessCentrality = (1 / sumOfShortestPathLengths) * (numVertices - 1);
      }
    };

    /*
    * getMaxClosenessCentrality(): returns the maximum closeness centrality of all vertices
    * in the graph.
    */

    Graph.prototype.getMaxClosenessCentrality = function () {
      if (Object.keys(this.vertices).length == 0) {
        return 0;
      }

      var max = this.vertices[0].closenessCentrality;
      for (var vid in this.vertices) {
        var dc = this.vertices[vid].closenessCentrality;
        if (dc > max) {
          max = dc;
        }
      }

      return max;
    };

    /*
    * getClosenessCentrality(): a measurement of the closeness of all of the nodes in
    * the graph.
    */

    Graph.prototype.getClosenessCentrality = function () {
      // Graph must be connected
      if(graph.isConnected() == false) {
        console.log("Cannot compute closeness centrality: not connected");
        return;
      }
      var numerator = 0;
      var denominator = 0;
      var closenessCentrality = 0;
      var numVertices = Object.keys(this.vertices).length;

      var max = this.getMaxClosenessCentrality();

      for (var vid in this.vertices) {
        numerator += (max - this.vertices[vid].closenessCentrality);
      }

      denominator = ((numVertices-2)*(numVertices-1)) / ((2*numVertices) - 3);
      closenessCentrality = numerator / denominator;
      //console.log('Closeness centrality: ' + closenessCentrality);

      return closenessCentrality;
    };

    /*
    * getDensity(): the degree to which a graph is fully connected.
    * A clique has a graph density of 1.  A graph with no edges has
    * a density of 0.
    */

    Graph.prototype.getDensity = function () {
      var numVertices = Object.keys(this.vertices).length;
      var numEdges = Object.keys(this.edges).length; //actual connections
      var maxEdges = (numVertices * (numVertices -1)) / 2; //potentional connections

      var graphDensity = numEdges / maxEdges;
      //console.log('Graph Density: ' + graphDensity);

      return graphDensity;
    };

    /*******************************************************************************
    *                            DISPLAY METHODS
    *******************************************************************************/

    /*
    * Prints out a row for each vertex in the vertices list for each
    * vertex adjacent to it
    */

    Graph.prototype.toString = function () {
      var str = "";

      for(var vid1 in this.vertices) {
        str += vid1 + ":  ";
        for(var eid in this.adjacencyList[vid1]) {
          edge = this.edges[eid];
          vid2 = edge.getAdjacentVertex(vid1);
          str += vid2 + " ";
        }
        str += "\n";
      }
      return str;
    };

    Graph.prototype.toHTMLString = function () {
      var str = "";

      for(var vid1 in this.vertices) {
        str += vid1 + ":  ";
        for(var eid in this.adjacencyList[vid1]) {
          edge = this.edges[eid];
          vid2 = edge.getAdjacentVertex(vid1);
          str += vid2 + " ";
        }
        str += "<br>";
      }
      str += "<br>";
      str += "Degree centrality: " + parseFloat(this.getDegreeCentrality()).toFixed(2) + "<br>";
      str += "Closeness centrality: " + parseFloat(this.getClosenessCentrality()).toFixed(2) + "<br>";
      str += "Density: " + parseFloat(this.getDensity()).toFixed(2) + "<br>";
      return str;
    };

    return Graph;
  }());
  YAGL.Graph = Graph;
})(YAGL || (YAGL = {}));
