/*
 * randomGraphGenerator.js
 *
 * Copyright &copy; 2019, Eric McGregor
 * All rights reserved.
 */

export function createRandomYAGLGraphObject (numV, numE) {
  let obj = {
    "description":"Random Graph",
    "graphicsFramework":"Babylonjs",
    "layout":"Force Directed",
  };

  let numVertices;
  if (isInt(numV)) {
    numVertices = numV;
  } else {
    numVertices = Math.ceil(Math.random() * 12);
  }

  obj["vertices"] = [];
  for (let i = 0; i < numVertices; i++) {
    obj.vertices.push({"id":i});
  }

  let numEdges;
  let maxEdges = (numVertices * (numVertices -1))/2;
  if (isInt(numE)) {
    numEdges = Math.min(numE, maxEdges);
  } else {
    numEdges = Math.ceil(Math.random() * maxEdges);
  }

  let vid1;
  let vid2;
  obj["edges"] = [];
  let i = 0;

  while(i < numEdges){
    vid1 = Math.round(Math.random() * (numVertices-1));
    vid2 = Math.round(Math.random() * (numVertices-1));

    // Only allow one edge between pairs of vertices
    if (vid1 !== vid2 && !edgeExists(obj, vid1, vid2)) {
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

function isInt(x) {
  let y = parseInt(x, 10);
  return !isNaN(y) && x == y && x.toString() == y.toString();
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

function edgeExists(obj, vid1, vid2) {
  let edges = getProperty(obj, "edges", null);

  if (edges == null) {
    return false;
  }

  if (!isInt(vid1) || !isInt(vid2)) {
    return false;
  }

  let i, edge;
  let len = edges.length;
  for (i = 0; i < len; i++) {
    edge = edges[i];

    if ((edge.v1 === vid1 && edge.v2 === vid2) ||
      (edge.v2 === vid1 && edge.v1 === vid2)) {
      return true;
    }
  }

  return false;
}
