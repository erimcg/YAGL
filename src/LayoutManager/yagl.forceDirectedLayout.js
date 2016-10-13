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


var YAGL;
(function (YAGL) {

    var ForceDirectedLayout = (function () {

        function ForceDirectedLayout(graph, size, stiffness, repulsion, damping, minEnergyThreshold) {
            this.graph = graph;

            this.size = (size == undefined) ? 1: size;
            this.stiffness = stiffness; // spring stiffness constant
            this.repulsion = repulsion; // repulsion constant
            this.damping = damping; // velocity damping factor
            this.minEnergyThreshold = minEnergyThreshold || 0.01; //threshold used to determine render stop

            this.nodePoints = {}; // keep track of points associated with nodes
            this.edgeSprings = {}; // keep track of springs associated with edges
        }

        //any data value is shape properties
        ForceDirectedLayout.prototype.point = function(node) {
            vid = node.getVid();
            if (!(vid in this.nodePoints)) {
                var mass = 1.0;
                this.nodePoints[vid] = new ForceDirectedLayout.Point(Vector.random(), mass);
            }
            return this.nodePoints[vid];
        };

        //create a line along an edge
        ForceDirectedLayout.prototype.spring = function(e) {
            if (!(e.getEid() in this.edgeSprings)) {
                var length = 1.0;

                var existingSpring = false;
                //change this stuff
                var edges = this.graph.getEdges(e.v1, e.v2);
                //var pos1 = this.graph.getEdges(edge.source, edge.target);
                for(e in edges) {
                    if (existingSpring === false && e.getEid() in this.edgeSprings) {
                        existingSpring = this.edgeSprings[e.getEid()];
                    }
                }

                if (existingSpring !== false) {
                     return new ForceDirectedLayout.Spring(existingSpring.point1, existingSpring.point2, 0.0, 0.0, 0.0);
                }

                this.edgeSprings[e.eid] = new ForceDirectedLayout.Spring(
                    this.point(e.getFirst()), this.point(e.getSecond()), length, this.stiffness
                );
            }

            return this.edgeSprings[e.eid];
        };

        // callback should accept two arguments: Node, Point
        ForceDirectedLayout.prototype.eachNode = function(callback) {
            var t = this;
            nodes = this.graph.vertices;

            for(vid in nodes) {
                callback.call(t, nodes[vid], t.point(nodes[vid]));

            }
        };

        // callback should accept two arguments: Edge, Spring
        ForceDirectedLayout.prototype.eachEdge = function(callback) {
            var t = this;
            edges = this.graph.edges;
            for(eid in edges) {
                 callback.call(t, edges[eid], t.spring(edges[eid]));
            }
        };

        // callback should accept one argument: Spring
        ForceDirectedLayout.prototype.eachSpring = function(callback) {
            var t = this;
            edges = this.graph.edges;
            for(eid in edges) {
                 callback.call(t, t.spring(edges[eid]));
            }
        };


        // Physics stuff
        ForceDirectedLayout.prototype.applyCoulombsLaw = function() {
            this.eachNode(function(n1, point1) {
                this.eachNode(function(n2, point2) {
                    if (point1 !== point2)
                    {
                        var d = point1.p.subtract(point2.p);
                        var distance = d.magnitude() + 0.1; // avoid massive forces at small distances (and divide by zero)
                        var direction = d.normalise();

                        // apply force to each end point
                        point1.applyForce(direction.multiply(this.repulsion).divide(distance * distance * 0.5));
                        point2.applyForce(direction.multiply(this.repulsion).divide(distance * distance * -0.5));
                    }
                });
            });
        };

        ForceDirectedLayout.prototype.applyHookesLaw = function() {
            this.eachSpring(function(spring){
                var d = spring.point2.p.subtract(spring.point1.p); // the direction of the spring
                var displacement = spring.length - d.magnitude();
                var direction = d.normalise();

                // apply force to each end point
                spring.point1.applyForce(direction.multiply(spring.k * displacement * -0.5));
                spring.point2.applyForce(direction.multiply(spring.k * displacement * 0.5));
            });
        };

        ForceDirectedLayout.prototype.attractToCentre = function() {
            this.eachNode(function(node, point) {
                var direction = point.p.multiply(-1.0);
                point.applyForce(direction.multiply(this.repulsion / 50.0));
            });
        };


        ForceDirectedLayout.prototype.updateVelocity = function(timestep) {
            this.eachNode(function(node, point) {
                point.v = point.v.add(point.a.multiply(timestep)).multiply(this.damping);
                point.a = new Vector(0, 0, 0);
            });
        };

        ForceDirectedLayout.prototype.updatePosition = function(timestep) {
            this.eachNode(function(node, point) {
                point.p = point.p.add(point.v.multiply(timestep));

                // update the position of the node's mesh
                node.mesh.position = new BABYLON.Vector3(point.p.x, point.p.y, point.p.z);

                if (point.p.x == 0 && point.p.y == 0 && point.p.z == 0) {
                    return;
                }

                // update the position of all edges adjacent to the node
                var eidList = this.graph.adjacencyList[node.vid];

                for (eid in eidList) {
                    // TODO: it would be nice animate the movement of existing edge

                    var path = [];

                    var pos1 = this.graph.vertices[node.vid].mesh.position
                    var pos2 = this.graph.vertices[eidList[eid]].mesh.position

                    if (pos1 == pos2) {
                        return;
                    }

                    path.push(pos1);
                    path.push(pos2);
                    //console.log("updating edge between " + vid1 + " and " + vid2);

                    this.graph.edges[eid].mesh.freezeNormals();
                    this.graph.edges[eid].mesh = BABYLON.Mesh.CreateTube(null, path, 0.1, null, null, null, null, null, null, this.graph.edges[eid].mesh);
                }

            });
        };

        // Calculate the total kinetic energy of the system
        ForceDirectedLayout.prototype.totalEnergy = function(timestep) {
            var energy = 0.0;
            this.eachNode(function(node, point) {
                var speed = point.v.magnitude();
                energy += 0.5 * point.m * speed * speed;
            });

            return energy;
        };

        ForceDirectedLayout.prototype.stop = function() {
            this._stop = true;
            this._started = false;
        }

        ForceDirectedLayout.prototype.tick = function(timestep) {
            this.applyCoulombsLaw();
            this.applyHookesLaw();
            this.attractToCentre();
            this.updateVelocity(timestep);
            this.updatePosition(timestep);
        };

        /*
         * Start simulation if it's not running already.
         * In case it's running then the call is ignored, and none of the callbacks passed is ever
         * executed.
         */

        ForceDirectedLayout.prototype.updateLayout = function() {
            var t = this;

            if (this._started) return;

            t._started = true;
            t._stop = false;
            var run = true;
            var counter = 0;

            while(run) {
                t.tick(.03);
                if(t.totalEnergy() < t.minEnergyThreshold){
                    run = false;
                }
                counter++;
            }

            //console.log("counter:  " + counter);
            t.stop();
        };

        /**********************************************************************
         *                             VECTOR
         *********************************************************************/

        var Vector = YAGL.Vector = function(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        };

        Vector.random = function() {
            return new Vector(10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5), 10.0 * (Math.random() - 0.5));
        };

        Vector.prototype.add = function(v2) {
            return new Vector(this.x + v2.x, this.y + v2.y, this.z + v2.z);
        };

        Vector.prototype.subtract = function(v2) {
            return new Vector(this.x - v2.x, this.y - v2.y, this.z - v2.z);
        };

        Vector.prototype.multiply = function(n) {
            return new Vector(this.x * n, this.y * n, this.z * n);
        };

        Vector.prototype.divide = function(n) {
            return new Vector((this.x / n) || 0, (this.y / n) || 0, (this.z / n) || 0); // Avoid divide by zero errors..
        };

        Vector.prototype.magnitude = function() {
            return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        };

        Vector.prototype.normal = function() {
            return new Vector(-this.y, this.x, this.z);
        };

        Vector.prototype.normalise = function() {
            return this.divide(this.magnitude());
        };

        // Point
        ForceDirectedLayout.Point = function(position, mass) {
            this.p = position; // position
            this.m = mass; // mass
            this.v = new Vector(0, 0, 0); // velocity
            this.a = new Vector(0, 0, 0); // acceleration
        };

        ForceDirectedLayout.Point.prototype.applyForce = function(force) {
            this.a = this.a.add(force.divide(this.m));
        };

        // Spring
        ForceDirectedLayout.Spring = function(point1, point2, length, k) {
            this.point1 = point1;
            this.point2 = point2;
            this.length = length; // spring length at rest
            this.k = k; // spring constant (See Hooke's law) .. how stiff the spring is
        };

        return ForceDirectedLayout;
    }());
    YAGL.ForceDirectedLayout = ForceDirectedLayout;
})(YAGL || (YAGL = {}));
