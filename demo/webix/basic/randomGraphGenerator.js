

function createRandomYAGLGraphObject (numV, numE) {
    var obj = {
            "description":"Random Graph",
            "graphicsFramework":"Babylonjs",
            "layout":"Force Directed",
    };

    var numVertices;
    if (isInt(numV)) {
        numVertices = numV;
    } else {
        numVertices = Math.ceil(Math.random() * 12);
    }

    obj["vertices"] = [];
    for (var i = 0; i < numVertices; i++) {
        obj.vertices.push({"id":i});
    };

    var numEdges;
    var maxEdges = (numVertices * (numVertices -1))/2;
    if (isInt(numE)) {
        numEdges = Math.min(numE, maxEdges);
    } else {
        numEdges = Math.ceil(Math.random() * maxEdges);
    }

    var vid1;
    var vid2;
    obj["edges"] = [];
    var i = 0;

    while(i < numEdges){
        vid1 = Math.round(Math.random() * (numVertices-1));
        vid2 = Math.round(Math.random() * (numVertices-1));

        // Only allow one edge between pairs of vertices
        if (vid1 != vid2 && !edgeExists(obj, vid1, vid2)) {
            obj.edges.push({
                "id":i,
                "v1":vid1,
                "v2":vid2
            });
            i++;
        }
    }
    return obj;
}

function edgeExists(obj, vid1, vid2) {
    var edges = getProperty(obj, "edges", null);

    if (edges == null) {
        return false;
    }

    if (!isInt(vid1) || !isInt(vid2)) {
        return false;
    }

    var i, edge;
    var len = edges.length;
    for (i = 0; i < len; i++) {
        edge = edges[i];

        if ((edge.v1 == vid1 && edge.v2 == vid2) ||
            (edge.v2 == vid1 && edge.v1 == vid2)) {
            return true;
        }
    }

    return false;
}
