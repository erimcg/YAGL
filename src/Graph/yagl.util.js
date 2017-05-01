

function isInt(x) {
    var y = parseInt(x, 10);
    return !isNaN(y) && x == y && x.toString() == y.toString();
}

function downloadFile(url, type) {
    return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();

        request.open('GET', url, true);
        request.responseType = type;

        request.onload = function() {
            if (this.status === 200 && this.readyState == 4) {
                resolve(this);
            } else {
                reject(Error('File didn\'t load successfully; error code:' + this.statusText));
            }
        };

        request.onerror = function() {
            reject(Error('There was a network error.'));
        };

        request.send();
    });
}

function getProperty(obj, path, defaultValue) {
    //console.log(obj);

    if (obj == null || path == null) {
        //console.log("getProp: null obj or path");
        return defaultValue;
    }
    var tokens = path.split(":");

    for (var i = 0; i < tokens.length; i++) {
        if (obj.hasOwnProperty(tokens[i])) {
            obj = obj[tokens[i]];
        } else {
            //console.log("getProp: not found");
            return defaultValue;
        }
    }

    //console.log("getProp: found " + path);
    //console.log(obj)
    return obj;
}

function getVertexProperty(obj, vid, path, defaultValue) {

    var vertices = getProperty(obj, "vertices", null);

    if (vertices == null) {
        return defaultValue;
    }

    var i, vertex;
    var len = vertices.length;
    for (i = 0; i < len; i++) {
        vertex = vertices[i];
        if (vertex.id == vid) {
            return getProperty(vertex, path, defaultValue);
        }
    }
    return null;
}

function getEdgeProperty(obj, eid, path, defaultValue) {

    var edges = getProperty(obj, "edges", null);

    if (edges == null) {
        return defaultValue;
    }

    var i, edge;
    var len = edges.length;
    for (i = 0; i < len; i++) {
        edge = edges[i];
        if (edge.id == eid) {
            return getProperty(edge, path, defaultValue);
        }
    }
    return null;
}
