var YAGL;
(function (YAGL) {

    var Layout = (function () {

        //function Layout.Simple (scene, graph, size) {
        function Layout(scene, graph, size) {
            this.scene = scene;
            this.graph = graph;
            this.usedVectors = {};
            this.lineList = {};
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.size = (size == undefined) ? 1: size;
        }

        //Layout.Simple.prototype.placeVertices = function() {
        Layout.prototype.placeVertices = function() {
            var x = this.x;
            var y = this.y;
            var z = this.z;

            for(vid in this.graph.vertices) {
                node = this.graph.vertices[vid];
                if(node.mesh == undefined) {
                    var size = this.size;
                    console.log("x:  " + x + ", y:  " + y + ", z:  " + z);
                    //var obj = new BABYLON.Mesh.CreateSphere(vid, 10, size, scene);
                    node.mesh = new BABYLON.Mesh.CreateSphere("test", 10, size, this.scene, true, BABYLON.Mesh.FRONTSIDE);
                    //console.log("created sphere");
                    node.mesh.position = new BABYLON.Vector3(x, y, z);
                    this.usedVectors[vid] = [x, y, z]
                    if ((x <= y) && (x <= z)){
                        x += (2 * size);
                    } else if (y <= z) {
                        y += (2 * size);
                    } else {
                        z += (2 * size);
                    }

                }

            }
        };

        Layout.prototype.placeLines = function() {
            var edges = this.graph.edges;
            this.removeLines();
            var lines;
            for(eid in edges) {
                lines = [];
                var vid = edges[eid].getFirst().getVid();
                console.log("vid:  " + vid);
                lines.push(this.graph.vertices[vid].mesh.position);
                vid = edges[eid].getSecond().getVid();
                console.log("vid2:  " + vid);
                lines.push(this.graph.vertices[vid].mesh.position);
                //scene.mesh[eid] = edges[eid];
                edges[eid].mesh = new BABYLON.Mesh.CreateLines(eid, lines, this.scene);
            }
            /*new BABYLON.Mesh.CreateLines("lines", lines, this.scene);*/
        };

        /*
         * Removes all lines from the graph.
         */
        Layout.prototype.removeLines = function() {
            var edges = this.graph.edges
            for(eid in edges) {

                if(edges[eid].mesh !== undefined) {
                    edges[eid].mesh.dispose();
                }
            }
        };

    return Layout;
    }());
    YAGL.Layout = Layout;
})(YAGL || (YAGL = {}));
