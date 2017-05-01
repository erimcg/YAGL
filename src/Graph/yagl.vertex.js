var YAGL;
(function (YAGL) {

    var Vertex = (function (vid) {

        function Vertex(vid, data) {
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

            this.degree = 0;
            this.degreeCentrality = 0;
            this.closenessCentrality = 0;
        }

        /***********
         * GETTERS
         ***********/

        Vertex.prototype.getVid = function () {
            return this.vid;
        };

        Vertex.prototype.getData = function () {
            return this.data;
        };

        Vertex.prototype.getVisited = function () {
            return this.visited;
        };

        Vertex.prototype.getComponent = function () {
            return this.component;
        };

        Vertex.prototype.getParent = function () {
            return this.parent;
        };

        Vertex.prototype.getMesh = function () {
            return this.mesh;
        };

        Vertex.prototype.getDegree = function () {
          return this.degree;
        };

        Vertex.prototype.getDegreeCentrality = function () {
          return this.degreeCentrality;
        };

        Vertex.prototype.getClosenessCentrality = function () {
          return this.closenessCentrality;
        };

        /***********
         * SETTERS
         ***********/

        Vertex.prototype.setParent = function (vid) {
            if (vid === null) {     // we allow null vid
                this.parent = null;
                return;
            }

            if (!isInt(vid)) {
                throw new Error("setParent: argument is not an int");
            }

            this.parent = vid;
        };

        Vertex.prototype.setVisited = function (visit) {
            if (!(typeof visit == "boolean")) {
                throw new Error("setVisited: attempting to set visited to a non-Boolean value");
            }

            this.visited = visit;
        };

        Vertex.prototype.setData = function (data) {
            this.data = data;
        };

        Vertex.prototype.setMesh = function (mesh) {
            this.mesh = mesh;
        };

        Vertex.prototype.incrementDegree = function() {
            this.degree = this.degree+1;
        };

        Vertex.prototype.decrementDegree = function() {
            this.degree = this.degree-1;
        };

        Vertex.prototype.setDegreeCentrality = function(centrality) {
            this.degreeCentrality = centrality;
        };

        Vertex.prototype.setClosenessCentrality = function(centrality) {
            this.closenessCentrality = centrality;
        };

        /****************
         * OTHER METHODS
         ***************/

        Vertex.prototype.equals = function (v) {
            if (!(v instanceof Vertex))
                return false;

            if (this.vid === v.vid) {
                return true;
            } else {
                return false;
            }
        };

        Vertex.prototype.toString = function () {
            var str = "vid:" + this["vid"] + "\n";
            for (prop in this) {
                if (this.hasOwnProperty(prop)) {
                    prop_str = prop + ": " + this[prop] + "\n";
                    str += prop_str;
                }
            }
            return str;
        };

        return Vertex;
    }());
    YAGL.Vertex = Vertex;
})(YAGL || (YAGL = {}));
