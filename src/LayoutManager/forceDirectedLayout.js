/*
* Copyright (c) 2010-2013 Dennis Hotson
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/


export class ForceDirectedLayout {

  constructor(graph, stiffness, repulsion, damping, minEnergyThreshold) {
    this.graph = graph;

    this.stiffness = stiffness;                           // spring stiffness constant: k
    this.repulsion = repulsion;                           // repulsion constant

    this.damping = damping;                               // velocity damping factor
    this.minEnergyThreshold = minEnergyThreshold || 0.01; //threshold used to determine render stop

    this.nodePoints = {}; // keep track of points associated with nodes
    this.edgeSprings = {}; // keep track of springs associated with edges
  }

  /**********************************************************************
   * Setter methods
   *********************************************************************/

  setStiffness(stiffness) {
    this.stiffness = stiffness;
    this.updateLayout();
  }

  setRepulsion(repulsion) {
    this.repulsion = repulsion;
    this.updateLayout();
  }

  setDamping(damping) {
    this.damping = damping;
    this.updateLayout();
  }

  setMinEnergyThreshold(minEnergyThreshold) {
    this.minEnergyThreshold = minEnergyThreshold;
    this.updateLayout();
  }

  /**********************************************************************
   * Getter methods
   *********************************************************************/

  getPoint(node) {
    let vid = node.getVid();
    if (!(vid in this.nodePoints)) {
      this.nodePoints[vid] = new Point(Vector.random(), 1.0);
    }
    return this.nodePoints[vid];
  };

  getSpring(e) {
    let eid = e.getEid();

    if (!(eid in this.edgeSprings)) {
      this.edgeSprings[eid] = new Spring(this.getPoint(e.getFirst()), this.getPoint(e.getSecond()),
        e.getWeight(), this.stiffness);
    }

    return this.edgeSprings[eid];
  };

  /**********************************************************************
   * Callback methods
   *********************************************************************/

  // callback should accept two arguments: Node, Point
  eachNode(callback) {
    let t = this;
    let nodes = this.graph.vertices;

    for (let vid in nodes) {
      callback.call(t, nodes[vid], t.getPoint(nodes[vid]));

    }
  };

  // callback should accept two arguments: Edge, Spring
  eachEdge(callback) {
    let t = this;
    let edges = this.graph.edges;
    for (let eid in edges) {
      callback.call(t, edges[eid], t.getSpring(edges[eid]));
    }
  };

  // callback should accept one argument: Spring
  eachSpring(callback) {
    let t = this;
    let edges = this.graph.edges;
    for (let eid in edges) {
      callback.call(t, t.getSpring(edges[eid]));
    }
  };

  /**********************************************************************
   * Physics methods
   *********************************************************************/

  applyCoulombsLaw() {
    this.eachNode(function (n1, point1) {
      this.eachNode(function (n2, point2) {
        if (point1 !== point2) {
          let d = point1.p.subtract(point2.p);
          let distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
          let direction = d.normalise();

          let edgeSet = this.graph.getEdges(n1.getVid(), n2.getVid());
          let edge = edgeSet[0];
          //console.log(edge);
          let weight = (edge === undefined) ? 1 : edge.getWeight();

          // apply force to each end point
          point1.applyForce(direction.multiply(this.repulsion * weight).divide(distance * distance * 0.5));
          point2.applyForce(direction.multiply(this.repulsion * weight).divide(distance * distance * -0.5));
        }
      });
    });
  };

  applyHookesLaw() {
    this.eachSpring(function (spring) {

      let d = spring.point2.p.subtract(spring.point1.p); // the direction of the spring
      let displacement = spring.length - d.magnitude();
      let direction = d.normalise();

      // apply force to each end point
      spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
      spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
    });
  };

  attractToCentre() {
    this.eachNode(function (node, point) {
      let direction = point.p.multiply(-1.0);
      point.applyForce(direction.multiply(this.repulsion / 50.0));
    });
  };



  /**********************************************************************
   * updateLayout (below) starts the simulation if it's not running already.
   *********************************************************************/

  updateVelocity(timestep) {
    this.eachNode(function (node, point) {
      point.v = point.v.add(point.a.multiply(timestep)).multiply(this.damping);
      point.a = new Vector(0, 0, 0);
    });
  };

  updatePosition(timestep) {
    this.eachNode(function (node, point) {
      point.p = point.p.add(point.v.multiply(timestep));

      // update the position of the node's mesh
      node.mesh.position = new BABYLON.Vector3(point.p.x, point.p.y, point.p.z);

      if (point.p.x === 0 && point.p.y === 0 && point.p.z === 0) {
        return;
      }

      // update the position of all edges adjacent to the node
      let eidList = this.graph.adjacencyList[node.vid];

      for (let eid in eidList) {
        this.graph.graphicsManager.setEdgeMesh(this.graph.edges[eid]);
      }

    });
  };

  // Calculate the total kinetic energy of the system
  totalEnergy(timestep) {
    let energy = 0.0;
    this.eachNode(function (node, point) {
      let speed = point.v.magnitude();
      energy += 0.5 * point.m * speed * speed;
    });

    return energy;
  };

  stop() {
    this._stop = true;
    this._started = false;
  };

  tick(timestep) {
    this.applyCoulombsLaw();
    this.applyHookesLaw();
    this.attractToCentre();
    this.updateVelocity(timestep);
    this.updatePosition(timestep);
  };

  updateLayout() {
    let t = this;

    if (this._started) return;

    t._started = true;
    t._stop = false;
    let run = true;
    let counter = 0;

    while (run) {
      t.tick(.03);
      if (t.totalEnergy() < t.minEnergyThreshold) {
        run = false;
      }
      counter++;
    }

    //console.log("counter:  " + counter);
    t.stop();
  };

}

/**********************************************************************
 *                             VECTOR
 *********************************************************************/

class Vector {

  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  };

  static random() {
    return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
  };

  add(v2) {
    return new Vector(this.x + v2.x, this.y + v2.y, this.z + v2.z);
  };

  subtract(v2) {
    return new Vector(this.x - v2.x, this.y - v2.y, this.z - v2.z);
  };

  multiply(n) {
    return new Vector(this.x * n, this.y * n, this.z * n);
  };

  divide(n) {
    return new Vector((this.x / n) || 0, (this.y / n) || 0, (this.z / n) || 0); // Avoid divide by zero errors..
  };

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  };

  normal() {
    return new Vector(-this.y, this.x, this.z);
  };

  normalise() {
    return this.divide(this.magnitude());
  };
}

/**********************************************************************
 *                             Point
 *********************************************************************/

class Point {
  constructor(position, mass) {
    this.p = position; // position
    this.m = mass; // mass
    this.v = new Vector(0, 0, 0);   // velocity
    this.a = new Vector(0, 0, 0);   // acceleration
  };

  applyForce(force) {
    this.a = this.a.add(force.divide(this.m));
  };
}

/**********************************************************************
 *                             Spring
 *********************************************************************/

class Spring {
  constructor(point1, point2, length, k) {
    this.point1 = point1;
    this.point2 = point2;
    this.length = length;   // spring length at rest
    this.k = k;             // spring constant/stiffness (See Hooke's law)
  };

}
