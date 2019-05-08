import {downloadFile, getProperty} from "../util.js"
import {Graph} from "../Graph/graph.js";

export class GraphBuilder {

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