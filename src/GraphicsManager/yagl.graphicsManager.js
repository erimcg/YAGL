var YAGL;
(function (YAGL) {

    var GraphicsManager = (function () {

        function GraphicsManager(graph1, scene, spec) {
            this.graph = graph1;
            graph = this.graph;     // Is there another way ???
            this.scene = scene;

            this.assetsManager = new BABYLON.AssetsManager(scene);
            this.assetsManager.useDefaultLoadingScreen = false;

            this.initialize(spec);
        }

        GraphicsManager.prototype.initialize = function (spec) {
            this.disposeAllMeshes();
            this.spec = spec;

            var layoutType = getProperty(spec, "layout", null);
            if (layoutType == "Force Directed") {
                this.layoutManager = new YAGL.ForceDirectedLayout(this.graph, 5, .9, 10, .9, .01);
            } else {
                this.layoutManager = null;
            }
        };

        GraphicsManager.prototype.addVertexMesh = function (v) {
            this.assetsManager.reset();

            var vid = v.vid;

            // Put a temporary mesh in place while user defined meshes are loaded.
            v.mesh = BABYLON.Mesh.CreatePlane(String(vid), 1.0, this.scene);
            v.mesh.visibility = false;

            var pos = getVertexProperty(this.spec, vid, "position", null);
            if (pos !== null) {
                v.mesh.position = new BABYLON.Vector3(pos[0], pos[1], pos[2]);
            } else if (this.layoutManager != null) {
                this.layoutManager.updateLayout();
            }

            var meshName, rootUrl, sceneFilename;
            // Check if vertex has its own mesh defined in spec file
            var meshInfo = getVertexProperty(this.spec, vid, "mesh", null);

            if (meshInfo !== null) {
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

            // If no mesh is specified, use the default sphere
            if (meshName == null || rootUrl == null || sceneFilename == null) {

                var oldMesh = v.mesh;
                var pos = oldMesh.position;
                oldMesh.dispose();

                var newMesh = BABYLON.Mesh.CreateSphere("v" + v.vid, 32, 2, this.scene, true,  BABYLON.Mesh.DEFAULTSIDE);
                newMesh.position = pos;

                v.mesh = newMesh;
                return;
            }

            var meshTask = this.assetsManager.addMeshTask(String(vid), meshName, rootUrl, sceneFilename);

            meshTask.onSuccess = function (task) {
                var v = graph.getVertex(task.name);

                var oldMesh = v.mesh;
                var pos = oldMesh.position;
                oldMesh.dispose();

                var newMesh = task.loadedMeshes[0];
                newMesh.name = "v" + task.name;
                newMesh.position = pos;

                v.mesh = newMesh;
            };

            meshTask.onError = function (task) {
                console.log("GraphicsManager: unable to load vertex mesh");
            };

            this.assetsManager.load();
        };

        GraphicsManager.prototype.addEdgeMesh = function (e) {
            var eid = e.eid;

            var path = [];
            path.push(e.v1.mesh.position);
            path.push(e.v2.mesh.position);

            e.mesh = this.createTube(eid, path);
            //this.updateLayout();
        };

        GraphicsManager.prototype.createTube = function (eid, path) {

            var radius = getProperty(this.spec, "edgeMesh:args:radius", 0.1);
            var tess = getProperty(this.spec, "edgeMesh:args:tesselation", 32);

            var mesh = BABYLON.Mesh.CreateTube("e" + eid, path, radius, tess, null, BABYLON.Mesh.NO_CAP, this.scene, true, BABYLON.Mesh.FRONTSIDE);

            var visibility = getProperty(this.spec, "edgeMesh:visibility", true);
            mesh.visibility = visibility;

            mesh.material = new BABYLON.StandardMaterial("mat", this.scene);

            var rgb = getProperty(this.spec, "edgeMesh:color", [1,1,1]);
            mesh.material.diffuseColor = new BABYLON.Color3(rgb[0], rgb[1], rgb[2]);

            return mesh;
        };

        GraphicsManager.prototype.updateLayout = function () {
            if (this.layoutManager != null) {
                this.layoutManager.updateLayout();
            }
        };

        GraphicsManager.prototype.disposeAllMeshes = function () {
            for (i in this.scene.meshes) {
                this.scene.meshes[i].dispose();
            }

            this.scene.meshes = [];
        };

        return GraphicsManager;
    }());

    YAGL.GraphicsManager = GraphicsManager;
})(YAGL || (YAGL = {}));
