var YAGL;
(function (YAGL) {

  var Edge = (function () {

    function Edge(eid, v1, v2, weight) {
      if (!isInt(eid)) {
        throw new Error("Edge: arg[0] must be an integer");
      }

      if (!((v1 instanceof YAGL.Vertex && v2 instanceof YAGL.Vertex) ||
      (isInt(v1) && isInt(v2)))) {
        throw new Error("Edge: second and third arguments must be both Vertices or integers");
      }

      Object.defineProperty(this, "eid", {
        writable:  false,
        value:  eid
      });

      if (isInt(v1)) {
        this.v1 = new YAGL.Vertex(v1);
        this.v2 = new YAGL.Vertex(v2);
      }
      else {
        this.v1 = v1;
        this.v2 = v2;
      }

      if(isNaN(weight) || weight === undefined){
        this.weight = 1;
      }
      else{
        this.weight = weight;
      }

      this.mesh = undefined;
    }

    Edge.prototype.getEid = function () {
      return this.eid;
    };

    Edge.prototype.getFirst = function () {
      return this.v1;
    };

    Edge.prototype.getSecond = function () {
      return this.v2;
    };

    Edge.prototype.getMesh = function () {
      return this.mesh;
    };

    Edge.prototype.getWeight = function () {
      return this.weight;
    };

    Edge.prototype.getAdjacentVertex = function (vid) {
      if (vid == this.v1.vid) {
        return this.v2.vid;
      } else if (vid == this.v2.vid) {
        return this.v1.vid;
      } else {
        return null;
      }
    };

    Edge.prototype.hasVertex = function(vid) {
      if((vid==this.v1) || (vid==this.v2)){
        return true;
      }
      else{
        return false;
      }
    };

    Edge.prototype.equals = function (e) {
      if(!(e instanceof Edge)) {
        return false;
      }

      if(e.eid == null) {
        return false;
      }

      if(this.eid = e.eid) {
        return true
      }
    };

    Edge.prototype.toString = function () {
      var str = "";
      for (prop in this) {
        if (this.hasOwnProperty(prop)) {
          prop_str = prop + ": " + this[prop] + ", ";
          str += prop_str;
        }
        str += "\t";
      }
      return str;
    };

    Edge.prototype.setMesh = function (mesh) {
      this.mesh = mesh;
    };

    return Edge;
  }());
  YAGL.Edge = Edge;
})(YAGL || (YAGL = {}));
