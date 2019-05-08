/*
 * util.js
 */

function isInt(x) {
  let y = parseInt(x, 10);
  return !isNaN(y) && x == y && x.toString() == y.toString();
}

function downloadFile(url, type) {
  return new Promise(function(resolve, reject) {
    let request = new XMLHttpRequest();

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
  let tokens = path.split(":");

  for (let i = 0; i < tokens.length; i++) {
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

  let vertices = getProperty(obj, "vertices", null);

  if (vertices == null) {
    return defaultValue;
  }

  let i, vertex;
  let len = vertices.length;
  for (i = 0; i < len; i++) {
    vertex = vertices[i];
    if (vertex.id == vid) {
      return getProperty(vertex, path, defaultValue);
    }
  }
  return null;
}

function getEdgeProperty(obj, eid, path, defaultValue) {

  let edges = getProperty(obj, "edges", null);

  if (edges == null) {
    return defaultValue;
  }

  let i, edge;
  let len = edges.length;
  for (i = 0; i < len; i++) {
    edge = edges[i];
    if (edge.id == eid) {
      return getProperty(edge, path, defaultValue);
    }
  }
  return null;
}

export {isInt, downloadFile, getEdgeProperty, getProperty, getVertexProperty};