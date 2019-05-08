import {isInt} from "../util.js"

export class Vertex {

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
