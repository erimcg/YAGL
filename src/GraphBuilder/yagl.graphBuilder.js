var YAGL;
(function (YAGL) {

    var GraphBuilder = (function () {

        function GraphBuilder(scene, spec) {
            this.scene = scene;
            this.slowBuild = true;
            this.vIndex = 0;
            this.eIndex = 0;
            this.spec = spec;

            this.graph = new YAGL.Graph(scene, spec);
        }

        GraphBuilder.prototype.initialize = function(spec) {
            this.graph.initialize(spec);
            this.spec = spec;
            this.vIndex = 0;
            this.eIndex = 0;
        };

        GraphBuilder.prototype.getGraph = function() {
            return this.graph;
        };

        GraphBuilder.prototype.build = function () {
            if (this.spec !== null && typeof this.spec === 'object') {
                this.buildFromJSONObj(this.spec);
            }
        };

        GraphBuilder.prototype.buildUsingJSONFile = function (url) {
            downloadFile(url, "json", this)
                .then(function(request) {
                    builder.buildUsingJSONObj(request.response);})
                .catch(function(Error) {
                    console.log(Error);
                });
        };

        GraphBuilder.prototype.buildUsingJSONObj = function (spec) {
            this.initialize(spec);

            var vertices = getProperty(spec, "vertices", null);
            var edges = getProperty(spec, "edges", null);

            // Start by adding vertices.  addVertices() will call addEdges().
            this.addVertices(vertices, edges, this);
        };

        GraphBuilder.prototype.appendUsingJSONObj = function (obj) {
            var vertices = getProperty(obj, "vertices", null);
            var edges = getProperty(obj, "edges", null);

            this.vIndex = 0;
            this.eIndex = 0;
            // Start by adding vertices.  addVertices() will call addEdges().
            this.addVertices(vertices, edges, this);
        }

        GraphBuilder.prototype.addVertices = function magic (vertices, edges, gb) {
            if (vertices == null || gb.vIndex == vertices.length) {
                gb.addEdges(edges, gb);
                return;
            }

            var vertex, id, data, v;
            while(gb.vIndex < vertices.length) {
                vertex = vertices[gb.vIndex];
                id = vertex.hasOwnProperty('id') ? vertex.id: null;
                data = vertex.hasOwnProperty('data') ? vertex.data: null;

                v = gb.graph.addVertex(id, data);
                gb.vIndex++;

                if (gb.slowBuild) {
                    setTimeout(magic, 400, vertices, edges, gb);
                    return;
                }
            }

            gb.addEdges(edges, gb);
        };

        GraphBuilder.prototype.addEdges = function magic2 (edges, gb) {
            if (edges == null || gb.eIndex == edges.length) {
                return;
            }

            var eid, vid1, vid2, e, path;
            while(gb.eIndex < edges.length) {
                eid = edges[gb.eIndex].id;
                vid1 = edges[gb.eIndex].v1;
                vid2 = edges[gb.eIndex].v2;

                e = gb.graph.addEdge(eid, vid1, vid2);
                gb.eIndex++;

                if(gb.slowBuild) {
                    setTimeout(magic2, 600, edges, gb);
                    return;
                }
            }
        };

        GraphBuilder.prototype.setSlowBuild = function (value) {
            this.slowBuild = value;
        };

        GraphBuilder.prototype.getSlowBuild = function () {
            return this.slowBuild;
        };

        return GraphBuilder;
    }());

    YAGL.GraphBuilder = GraphBuilder;
})(YAGL || (YAGL = {}));
