import {Vertex} from "./vertex.js";
import {isInt} from "../util.js"

export class Edge{

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
