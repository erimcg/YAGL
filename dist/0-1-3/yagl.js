function isInt(e){var t=parseInt(e,10);return!isNaN(t)&&e==t&&e.toString()==t.toString()}function downloadFile(e,t){return new Promise(function(i,n){var r=new XMLHttpRequest;r.open("GET",e,!0),r.responseType=t,r.onload=function(){200===this.status&&4==this.readyState?i(this):n(Error("File didn't load successfully; error code:"+this.statusText))},r.onerror=function(){n(Error("There was a network error."))},r.send()})}function getProperty(e,t,i){if(null==e||null==t)return i;for(var n=t.split(":"),r=0;r<n.length;r++){if(!e.hasOwnProperty(n[r]))return i;e=e[n[r]]}return e}function getVertexProperty(e,t,i,n){var r=getProperty(e,"vertices",null);if(null==r)return n;var s,o,h=r.length;for(s=0;s<h;s++)if(o=r[s],o.id==t)return getProperty(o,i,n);return null}function getEdgeProperty(e,t,i,n){var r=getProperty(e,"edges",null);if(null==r)return n;var s,o,h=r.length;for(s=0;s<h;s++)if(o=r[s],o.id==t)return getProperty(o,i,n);return null}var YAGL;!function(e){var t=function(){function t(t,i,n,r){if(!isInt(t))throw new Error("Edge: arg[0] must be an integer");if(!(i instanceof e.Vertex&&n instanceof e.Vertex||isInt(i)&&isInt(n)))throw new Error("Edge: second and third arguments must be both Vertices or integers");Object.defineProperty(this,"eid",{writable:!1,value:t}),isInt(i)?(this.v1=new e.Vertex(i),this.v2=new e.Vertex(n)):(this.v1=i,this.v2=n),isNaN(r)||void 0===r?this.weight=1:this.weight=r,this.mesh=void 0}return t.prototype.getEid=function(){return this.eid},t.prototype.getFirst=function(){return this.v1},t.prototype.getSecond=function(){return this.v2},t.prototype.getMesh=function(){return this.mesh},t.prototype.getWeight=function(){return this.weight},t.prototype.getAdjacentVertex=function(e){return e==this.v1.vid?this.v2.vid:e==this.v2.vid?this.v1.vid:null},t.prototype.hasVertex=function(e){return e==this.v1||e==this.v2},t.prototype.equals=function(e){return e instanceof t&&(null!=e.eid&&(!!(this.eid=e.eid)||void 0))},t.prototype.toString=function(){var e="";for(prop in this)this.hasOwnProperty(prop)&&(prop_str=prop+": "+this[prop]+", ",e+=prop_str),e+="\t";return e},t.prototype.setMesh=function(e){this.mesh=e},t}();e.Edge=t}(YAGL||(YAGL={}));var YAGL;!function(e){var t=function(){function t(t,i){this.vertices={},this.edges={},this.adjacencyList={},this.connectedComponents={},this.graphicsManager=new e.GraphicsManager(this,t,i)}return t.prototype.initialize=function(e){this.graphicsManager.initialize(e),this.vertices={},this.edges={},this.adjacencyList={},this.connectedComponents={}},t.prototype.addVertex=function(t,i){if(isInt(t)&&(t=new e.Vertex(t,i)),t instanceof e.Vertex==0)throw new Error("addVertex: argument not a Vertex");return null!=this.getVertex(t.vid)?null:(this.vertices[t.vid]=t,this.connectedComponents[t.vid]=0,this.graphicsManager.addVertexMesh(t),t)},t.prototype.addEdge=function(t,i,n,r){if(isInt(t)&&isInt(i)&&isInt(n)&&(t=new e.Edge(t,i,n,r)),t instanceof e.Edge==0)throw new Error("addEdge: argument not an Edge");if(null!=this.getEdge(t.eid))return null;var s=t.v1,o=t.v2,h=this.getVertex(s.vid);null===h?h=this.addVertex(s):t.v1=h;var a=this.getVertex(o.vid);if(null===a?a=this.addVertex(o):t.v2=a,h.incrementDegree(),a.incrementDegree(),void 0===this.adjacencyList[h.vid]){var d=new Object;d[t.eid]=a.vid,this.adjacencyList[h.vid]=d}else{var d=this.adjacencyList[h.vid];d[t.eid]=a.vid,this.adjacencyList[h.vid]=d}return void 0===this.adjacencyList[a.vid]?(d=new Object,d[t.eid]=h.vid,this.adjacencyList[a.vid]=d):(d=this.adjacencyList[a.vid],d[t.eid]=h.vid,this.adjacencyList[a.vid]=d),a.equals(h)||this.unionComponents(h.vid,a.vid),this.edges[t.eid]=t,this.graphicsManager.addEdgeMesh(t),this.setDegreeCentralityForVertex(h.vid),this.setDegreeCentralityForVertex(a.vid),this.setClosenessCentralityForAllVertices(),t},t.prototype.removeVertex=function(e){var t=this.vertices[e];if(void 0===t)return console.log("removeVertex: vid does not exist ("+e+")"),-1;var i;for(var n in this.edges)i=this.edges[n],(t.equals(i.v1)||t.equals(i.v2))&&this.removeEdges(i.v1.vid,i.v2.vid);return delete this.connectedComponents[e],delete this.vertices[e],this.graphicsManager.removeVertexMesh(e),0},t.prototype.removeEdge=function(e){if(null==e)throw new Error("removeEdge: argument is null or undefined");var t=this.edges[e];if(null==t)return console.log("removeEdge: eid does not exist ("+e+")"),-1;var i=t.v1.vid;this.vertices[i].decrementDegree();var n=t.v2.vid;this.vertices[n].decrementDegree(),delete this.adjacencyList[i][e],delete this.adjacencyList[n][e],delete this.edges[e],this.graphicsManager.removeEdgeMesh(e);var r=this.findComponent(i);return null==this.BFSearch(i,r)?(this.updateComponentLinks(i,r),this.updateComponentLinks(r,i),void 0===this.connectedComponents[i]&&(this.connectedComponents[i]=0)):null==this.BFSearch(n,r)&&(this.updateComponentLinks(n,r),this.updateComponentLinks(r,n),void 0===this.connectedComponents[n]&&(this.connectedComponents[n]=0)),this.setDegreeCentralityForVertex(u.vid),this.setDegreeCentralityForVertex(v.vid),this.setClosenessCentralityForAllVertices(),0},t.prototype.removeEdges=function(e,t){if(null==e||null==t)throw new Error("removeEdges:  arguments are null or undefined");var i=this.getEdges(e,t),n=0;for(var r in i)this.removeEdge(i[r].eid),n++;return n},t.prototype.getVertex=function(e){if(null==e)throw new Error("getVertex: null or undefined argument");return void 0===this.vertices[e]?null:this.vertices[e]},t.prototype.getAllVertices=function(){var e=[];for(var t in this.vertices)e.push(this.vertices[t]);return e},t.prototype.getEdge=function(e){if(null==e)throw new Error("getEdge: null or undefined argument");return void 0===this.edges[e]?null:this.edges[e]},t.prototype.getEdges=function(e,t){if(null==e||null==t)return null;var i,n=[];for(var r in this.edges)i=this.edges[r],(e===i.v1.vid&&t===i.v2.vid||e===i.v2.vid&&t===i.v1.vid)&&n.push(i);return n},t.prototype.getAllEdges=function(){var e=[];for(var t in this.edges)e.push(this.edges[t]);return e},t.prototype.setAllVisitedFalse=function(){for(var e in this.vertices)this.vertices[e].visited=!1},t.prototype.isConnected=function(){var e=0;for(var t in this.connectedComponents)e++;return!(e>1)},t.prototype.findComponent=function(e){var t=this.vertices[e].component;return t==e?e:this.findComponent(t)},t.prototype.unionComponents=function(e,t){if(null!=e&&null!=t&&void 0!=this.vertices[e]&&void 0!=this.vertices[t]){var i=this.findComponent(e),n=this.findComponent(t);if(i!=n){var r=this.connectedComponents[i],s=this.connectedComponents[n];r>s?(this.vertices[n].component=i,this.connectedComponents[n]=s++,delete this.connectedComponents[n]):(this.vertices[i].component=n,this.connectedComponents[i]=r++,delete this.connectedComponents[i])}}},t.prototype.updateComponentLinks=function(e,t){if(null!==e&&null!==t||console.log("splitComponent: null vid"),!this.adjacencyList.hasOwnProperty(e)||!this.adjacencyList.hasOwnProperty(t))return void console.log("splitComponent: vid does not exist");this.vertices[e].component=e;var i=[];i.push(e),this.setAllVisitedFalse(),this.vertices[e].setVisited(!0);for(var n;0!=i.length;){n=i.shift();var r,s=this.adjacencyList[n];for(var o in s)r=this.vertices[this.edges[o].getAdjacentVertex(n)],!1===r.getVisited()&&(r.setVisited(!0),r.component=n,i.push(r.vid))}return null},t.prototype.getConnectedVertices=function(e){var t,i=[];for(var t in this.connectedComponents)this.findComponent(t)==this.findComponent(e)&&i.push(t);return i},t.prototype.BFSearch=function(e,t){if(null==e||null==t)throw new Error("BFSearch: null or undefined arguments");if(!this.adjacencyList.hasOwnProperty(e))return console.log("Search Failed: Invalid start vertex "+e),null;var i=[];i.push(e),this.setAllVisitedFalse(),this.vertices[e].setVisited(!0),this.vertices[e].setParent(e);for(var n;0!==i.length;){if((n=i.shift())==t)return n;var r,s,o,h=this.adjacencyList[n];for(var a in h)r=this.edges[a],s=r.getAdjacentVertex(n),o=this.vertices[s],!1===o.getVisited()&&(o.setVisited(!0),o.setParent(n),i.push(s))}return null},t.prototype.getShortestPath=function(e,t){if(null==this.BFSearch(e,t))return null;for(var i=[t],n=this.vertices[t].getParent();n!=e;)i.push(n),n=this.vertices[n].getParent();return i.push(e),i},t.prototype.setDegreeCentralityForVertex=function(e){var t=Object.keys(this.vertices).length;this.vertices[e].degreeCentrality=this.vertices[e].degree/(t-1)},t.prototype.getMaxDegreeCentrality=function(){if(0==Object.keys(this.vertices).length)return 0;var e=this.vertices[0].degreeCentrality;for(var t in this.vertices){var i=this.vertices[t].degreeCentrality;i>e&&(e=i)}return e},t.prototype.getDegreeCentrality=function(){var e=0,t=0,i=Object.keys(this.vertices).length,n=this.getMaxDegreeCentrality();if(i<=2)return NaN;for(var r in this.vertices)e+=n-this.vertices[r].degreeCentrality;return t=(i-2)*(i-1),(e/t).toFixed(2)},t.prototype.setClosenessCentralityForAllVertices=function(){var e=Object.keys(this.vertices).length;for(var t in this.vertices){var i=0;for(var n in this.vertices)if(t!=n){var r=this.getShortestPath(t,n);null!=r&&(i+=r.length-1)}this.vertices[t].closenessCentrality=1/i*(e-1)}},t.prototype.getMaxClosenessCentrality=function(){if(0==Object.keys(this.vertices).length)return 0;var e=this.vertices[0].closenessCentrality;for(var t in this.vertices){var i=this.vertices[t].closenessCentrality;i>e&&(e=i)}return e},t.prototype.getClosenessCentrality=function(){if(0==graph.isConnected())return void console.log("Cannot compute closeness centrality: not connected");var e=0,t=0,i=Object.keys(this.vertices).length,n=this.getMaxClosenessCentrality();for(var r in this.vertices)e+=n-this.vertices[r].closenessCentrality;return t=(i-2)*(i-1)/(2*i-3),e/t},t.prototype.getDensity=function(){var e=Object.keys(this.vertices).length;return Object.keys(this.edges).length/(e*(e-1)/2)},t.prototype.toString=function(){var e="";for(var t in this.vertices){e+=t+":  ";for(var i in this.adjacencyList[t])edge=this.edges[i],vid2=edge.getAdjacentVertex(t),e+=vid2+" ";e+="\n"}return e},t.prototype.toHTMLString=function(){var e="";for(var t in this.vertices){e+=t+":  ";for(var i in this.adjacencyList[t])edge=this.edges[i],vid2=edge.getAdjacentVertex(t),e+=vid2+" ";e+="<br>"}return e+="<br>",e+="Degree centrality: "+parseFloat(this.getDegreeCentrality()).toFixed(2)+"<br>",e+="Closeness centrality: "+parseFloat(this.getClosenessCentrality()).toFixed(2)+"<br>",e+="Density: "+parseFloat(this.getDensity()).toFixed(2)+"<br>"},t}();e.Graph=t}(YAGL||(YAGL={}));var YAGL;!function(e){var t=function(e){function t(e,t){if(!isInt(e))throw new Error("Vertex: vid is not a number: "+String(e));Object.defineProperty(this,"vid",{writable:!1,value:e}),this.data=t,this.visited=!1,this.component=this.vid,this.mesh=null,this.parent=null,this.degree=0,this.degreeCentrality=0,this.closenessCentrality=0}return t.prototype.getVid=function(){return this.vid},t.prototype.getData=function(){return this.data},t.prototype.getVisited=function(){return this.visited},t.prototype.getComponent=function(){return this.component},t.prototype.getParent=function(){return this.parent},t.prototype.getMesh=function(){return this.mesh},t.prototype.getDegree=function(){return this.degree},t.prototype.getDegreeCentrality=function(){return this.degreeCentrality},t.prototype.getClosenessCentrality=function(){return this.closenessCentrality},t.prototype.setParent=function(e){if(null===e)return void(this.parent=null);if(!isInt(e))throw new Error("setParent: argument is not an int");this.parent=e},t.prototype.setVisited=function(e){if("boolean"!=typeof e)throw new Error("setVisited: attempting to set visited to a non-Boolean value");this.visited=e},t.prototype.setData=function(e){this.data=e},t.prototype.setMesh=function(e){this.mesh=e},t.prototype.incrementDegree=function(){this.degree=this.degree+1},t.prototype.decrementDegree=function(){this.degree=this.degree-1},t.prototype.setDegreeCentrality=function(e){this.degreeCentrality=e},t.prototype.setClosenessCentrality=function(e){this.closenessCentrality=e},t.prototype.equals=function(e){return e instanceof t&&this.vid===e.vid},t.prototype.toString=function(){var e="vid:"+this.vid+"\n";for(prop in this)this.hasOwnProperty(prop)&&(prop_str=prop+": "+this[prop]+"\n",e+=prop_str);return e},t}();e.Vertex=t}(YAGL||(YAGL={}));var YAGL;!function(e){var t=function(){function t(e,t,i){this.graph=e,graph=this.graph,this.scene=t,this.assetsManager=new BABYLON.AssetsManager(t),this.assetsManager.useDefaultLoadingScreen=!1,this.initialize(i)}return t.prototype.initialize=function(t){this.disposeAllMeshes(),this.spec=t,"Force Directed"==getProperty(t,"layout",null)?(console.log("layout is force directed"),this.layoutManager=new e.ForceDirectedLayout(this.graph,5,.2,1,.9,.01)):this.layoutManager=null},t.prototype.addVertexMesh=function(e){this.assetsManager.reset();var t=e.vid;e.mesh=BABYLON.Mesh.CreatePlane(String(t),1,this.scene),e.mesh.visibility=!1;var i=getVertexProperty(this.spec,t,"position",null);null!==i?e.mesh.position=new BABYLON.Vector3(i[0],i[1],i[2]):null!=this.layoutManager&&this.layoutManager.updateLayout();var n,r,s,o=getVertexProperty(this.spec,t,"mesh",null);if(null!==o?(n=getProperty(o,"meshName",null),r=getProperty(o,"rootUrl",null),s=getProperty(o,"sceneFilename",null)):(n=getProperty(this.spec,"vertexMesh:meshName",null),r=getProperty(this.spec,"vertexMesh:rootUrl",null),s=getProperty(this.spec,"vertexMesh:sceneFilename",null)),null==n||null==r||null==s){var h=e.mesh,i=h.position;h.dispose();var a=BABYLON.Mesh.CreateSphere("v"+e.vid,32,1,this.scene,!0,BABYLON.Mesh.DEFAULTSIDE);return a.position=i,void(e.mesh=a)}var d=this.assetsManager.addMeshTask(String(t),n,r,s);d.onSuccess=function(e){var t=graph.getVertex(e.name),i=t.mesh,n=i.position;i.dispose();var r=e.loadedMeshes[0];r.name="v"+e.name,r.position=n,t.mesh=r},d.onError=function(e){console.log("GraphicsManager: unable to load vertex mesh")},this.assetsManager.load()},t.prototype.addEdgeMesh=function(e){if(null!=this.layoutManager)return void this.layoutManager.updateLayout();this.setEdgeMesh(e)},t.prototype.setEdgeMesh=function(e){var t=[];t.push(e.v1.mesh.position),t.push(e.v2.mesh.position),getProperty(this.spec,"directed",!1)?this.createDirectedTube(e,t):this.createTube(e,t)},t.prototype.createDirectedTube=function(e,t){var i=e.eid,n=t[0],r=t[1],s=r.subtract(n);s.x/=6,s.y/=6,s.z/=6,s=s.add(n);var o=BABYLON.Vector3.Distance(n,s),h=BABYLON.Mesh.CreateCylinder("e"+i,o,0,.6,36,scene,!0);h.setPivotMatrix(BABYLON.Matrix.Translation(0,-o/2,0));var a=n.subtract(r);a.x/=20,a.y/=20,a.z/=20,a=a.add(r),h.position=a;var d=n.subtract(r);d.normalize();var p=new BABYLON.Vector3(0,1,0),c=BABYLON.Vector3.Cross(d,p);c.normalize();var u=BABYLON.Vector3.Dot(d,p);h.rotationQuaternion=BABYLON.Quaternion.RotationAxis(c,Math.PI/2+u);var l=n.subtract(r);l.x/=5,l.y/=5,l.z/=5,l=l.add(r);var t=[];t.push(l),t.push(n),this.createTube(e,t)},t.prototype.createTube=function(e,t){var i=e.eid,n=getProperty(this.spec,"edgeMesh:args:radius",.1),r=getProperty(this.spec,"edgeMesh:args:tesselation",32);null!=this.graph.edges[e.eid].mesh&&this.removeEdgeMesh(e.eid);var s=BABYLON.Mesh.CreateTube("e"+i,t,n,r,null,BABYLON.Mesh.NO_CAP,this.scene,!0,BABYLON.Mesh.FRONTSIDE),o=getProperty(this.spec,"edgeMesh:visibility",!0);s.visibility=o,s.material=new BABYLON.StandardMaterial("mat",this.scene);var h=getProperty(this.spec,"edgeMesh:color",[1,1,1]);return s.material.diffuseColor=new BABYLON.Color3(h[0],h[1],h[2]),e.mesh=s,s},t.prototype.updateLayout=function(){null!=this.layoutManager&&this.layoutManager.updateLayout()},t.prototype.removeVertexMesh=function(e){for(var t in this.scene.meshes)this.scene.meshes[t].name=="v"+e&&this.scene.meshes[t].dispose()},t.prototype.removeEdgeMesh=function(e){for(var t in this.scene.meshes)this.scene.meshes[t].name=="e"+e&&this.scene.meshes[t].dispose()},t.prototype.disposeAllMeshes=function(){for(var e in this.scene.meshes)this.scene.meshes[e].dispose();this.scene.meshes=[]},t}();e.GraphicsManager=t}(YAGL||(YAGL={}));var YAGL;!function(e){var t=function(){function t(e,t,i,n,r,s){this.graph=e,this.size=void 0==t?1:t,this.stiffness=i,this.repulsion=n,this.damping=r,this.minEnergyThreshold=s||.01,this.nodePoints={},this.edgeSprings={}}t.prototype.setStiffness=function(e){console.log("in setStiffness"),this.stiffness=e,this.updateLayout()},t.prototype.setRepulsion=function(e){this.repulsion=e,this.updateLayout()},t.prototype.setDamping=function(e){this.damping=e,this.updateLayout()},t.prototype.setMinEnergyThreshold=function(e){this.minEnergyThreshold=e,this.updateLayout()},t.prototype.point=function(e){if(vid=e.getVid(),!(vid in this.nodePoints)){this.nodePoints[vid]=new t.Point(i.random(),1)}return this.nodePoints[vid]},t.prototype.spring=function(e){if(!(e.getEid()in this.edgeSprings)){var i=!1,n=this.graph.getEdges(e.v1,e.v2);for(e in n)!1===i&&e.getEid()in this.edgeSprings&&(i=this.edgeSprings[e.getEid()]);if(!1!==i)return new t.Spring(i.point1,i.point2,0,0);this.edgeSprings[e.eid]=new t.Spring(this.point(e.getFirst()),this.point(e.getSecond()),1,this.stiffness)}return this.edgeSprings[e.eid]},t.prototype.eachNode=function(e){var t=this;nodes=this.graph.vertices;for(vid in nodes)e.call(t,nodes[vid],t.point(nodes[vid]))},t.prototype.eachEdge=function(e){var t=this;edges=this.graph.edges;for(eid in edges)e.call(t,edges[eid],t.spring(edges[eid]))},t.prototype.eachSpring=function(e){var t=this;edges=this.graph.edges;for(eid in edges)e.call(t,t.spring(edges[eid]))},t.prototype.applyCoulombsLaw=function(){this.eachNode(function(e,t){this.eachNode(function(i,n){if(t!==n){var r=t.p.subtract(n.p),s=r.magnitude()+.1,o=r.normalise(),h=this.graph.getEdges(e.getVid(),i.getVid()),a=h[0];if(void 0!==a)var d=a.getWeight();else d=1;t.applyForce(o.multiply(this.repulsion).divide(s*s*Math.pow(d,2)*.5)),n.applyForce(o.multiply(this.repulsion).divide(s*s*Math.pow(d,2)*-.5))}})})},t.prototype.applyHookesLaw=function(){this.eachSpring(function(e){edges=this.graph.edges;var t=e.point2.p.subtract(e.point1.p),i=e.length-t.magnitude(),n=t.normalise();e.point1.applyForce(n.multiply(e.k*i*-.5)),e.point2.applyForce(n.multiply(e.k*i*.5))})},t.prototype.attractToCentre=function(){this.eachNode(function(e,t){var i=t.p.multiply(-1);t.applyForce(i.multiply(this.repulsion/50))})},t.prototype.updateVelocity=function(e){this.eachNode(function(t,n){n.v=n.v.add(n.a.multiply(e)).multiply(this.damping),n.a=new i(0,0,0)})},t.prototype.updatePosition=function(e){this.eachNode(function(t,i){if(i.p=i.p.add(i.v.multiply(e)),t.mesh.position=new BABYLON.Vector3(i.p.x,i.p.y,i.p.z),0!=i.p.x||0!=i.p.y||0!=i.p.z){var n=this.graph.adjacencyList[t.vid];for(eid in n)this.graph.graphicsManager.setEdgeMesh(this.graph.edges[eid])}})},t.prototype.totalEnergy=function(e){var t=0;return this.eachNode(function(e,i){var n=i.v.magnitude();t+=.5*i.m*n*n}),t},t.prototype.stop=function(){this._stop=!0,this._started=!1},t.prototype.tick=function(e){this.applyCoulombsLaw(),this.applyHookesLaw(),this.attractToCentre(),this.updateVelocity(e),this.updatePosition(e)},t.prototype.updateLayout=function(){var e=this;if(!this._started){e._started=!0,e._stop=!1;for(var t=!0,i=0;t;)e.tick(.03),e.totalEnergy()<e.minEnergyThreshold&&(t=!1),i++;e.stop()}};var i=e.Vector=function(e,t,i){this.x=e,this.y=t,this.z=i};return i.random=function(){return new i(10*(Math.random()-.5),10*(Math.random()-.5),10*(Math.random()-.5))},i.prototype.add=function(e){return new i(this.x+e.x,this.y+e.y,this.z+e.z)},i.prototype.subtract=function(e){return new i(this.x-e.x,this.y-e.y,this.z-e.z)},i.prototype.multiply=function(e){return new i(this.x*e,this.y*e,this.z*e)},i.prototype.divide=function(e){return new i(this.x/e||0,this.y/e||0,this.z/e||0)},i.prototype.magnitude=function(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)},i.prototype.normal=function(){return new i(-this.y,this.x,this.z)},i.prototype.normalise=function(){return this.divide(this.magnitude())},t.Point=function(e,t){this.p=e,this.m=t,this.v=new i(0,0,0),this.a=new i(0,0,0)},t.Point.prototype.applyForce=function(e){this.a=this.a.add(e.divide(this.m))},t.Spring=function(e,t,i,n){this.point1=e,this.point2=t,this.length=i,this.k=n},t}();e.ForceDirectedLayout=t}(YAGL||(YAGL={}));var YAGL;!function(e){var t=function(){function e(e,t,i){this.scene=e,this.graph=t,this.usedVectors={},this.lineList={},this.x=0,this.y=0,this.z=0,this.size=void 0==i?1:i}return e.prototype.placeVertices=function(){var e=this.x,t=this.y,i=this.z;for(vid in this.graph.vertices)if(node=this.graph.vertices[vid],void 0==node.mesh){var n=this.size;console.log("x:  "+e+", y:  "+t+", z:  "+i),node.mesh=new BABYLON.Mesh.CreateSphere("test",10,n,this.scene,!0,BABYLON.Mesh.FRONTSIDE),node.mesh.position=new BABYLON.Vector3(e,t,i),this.usedVectors[vid]=[e,t,i],e<=t&&e<=i?e+=2*n:t<=i?t+=2*n:i+=2*n}},e.prototype.placeLines=function(){var e=this.graph.edges;this.removeLines();var t;for(eid in e){t=[];var i=e[eid].getFirst().getVid();console.log("vid:  "+i),t.push(this.graph.vertices[i].mesh.position),i=e[eid].getSecond().getVid(),console.log("vid2:  "+i),t.push(this.graph.vertices[i].mesh.position),e[eid].mesh=new BABYLON.Mesh.CreateLines(eid,t,this.scene)}},e.prototype.removeLines=function(){var e=this.graph.edges;for(eid in e)void 0!==e[eid].mesh&&e[eid].mesh.dispose()},e}();e.Layout=t}(YAGL||(YAGL={}));var YAGL;!function(e){var t=function(){function t(t,i){this.scene=t,this.slowBuild=!0,this.vIndex=0,this.eIndex=0,this.spec=i,this.graph=new e.Graph(t,i)}return t.prototype.initialize=function(e){this.graph.initialize(e),this.spec=e,this.vIndex=0,this.eIndex=0},t.prototype.getGraph=function(){return this.graph},t.prototype.build=function(){null!==this.spec&&"object"==typeof this.spec&&this.buildFromJSONObj(this.spec)},t.prototype.buildUsingJSONFile=function(e){downloadFile(e,"json",this).then(function(e){builder.buildUsingJSONObj(e.response)}).catch(function(e){console.log(e)})},t.prototype.buildUsingJSONObj=function(e){this.initialize(e);var t=getProperty(e,"vertices",null),i=getProperty(e,"edges",null);this.addVertices(t,i,this)},t.prototype.appendUsingJSONObj=function(e){var t=getProperty(e,"vertices",null),i=getProperty(e,"edges",null);this.vIndex=0,this.eIndex=0,this.addVertices(t,i,this)},t.prototype.addVertices=function e(t,i,n){if(null==t||n.vIndex==t.length)return void n.addEdges(i,n);for(var r,s,o;n.vIndex<t.length;)if(r=t[n.vIndex],s=r.hasOwnProperty("id")?r.id:null,o=r.hasOwnProperty("data")?r.data:null,n.graph.addVertex(s,o),n.vIndex++,n.slowBuild)return void setTimeout(e,400,t,i,n);n.addEdges(i,n)},t.prototype.addEdges=function e(t,i){if(null!=t&&i.eIndex!=t.length)for(var n,r,s,o;i.eIndex<t.length;)if(n=t[i.eIndex].id,r=t[i.eIndex].v1,s=t[i.eIndex].v2,o=t[i.eIndex].weight,i.graph.addEdge(n,r,s,o),i.eIndex++,i.slowBuild)return void setTimeout(e,600,t,i)},t.prototype.setSlowBuild=function(e){this.slowBuild=e},t.prototype.getSlowBuild=function(){return this.slowBuild},t}();e.GraphBuilder=t}(YAGL||(YAGL={}));