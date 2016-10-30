# YAGL

YAGL (pronouned 'yæ gəl) is a javascript library that can create and render graphs in a 3D [BabylonJS](http://babylonjs.com) scene.  It was started as an undergraduate research project by John Moran (jcmcivic@gmail.com) and Eric McGregor (eric@n0code.net) at Bridgewater College.

It's easy to use.

- Create a Babylon scene object.
- Define a graph in a YAGL object or file.
- Create a YAGL GraphBuilder object, passing in the scene object.
- Load your YAGL object or file using one of the functions in the GraphBuilder class.

```
var builder = new YAGL.GraphBuilder(scene);
bulder.buildUsingJSONFile(url_of_yagl_file);
```

The builder will build a graph using the specifications defined in the YAGL file and render it in the scene.

## YAGL Files

Graphs are predefined in JSON formatted files.  See template below.

- [YAGL 0.1.0](http://doc.yagljs.com/templates/0.1.0.yagl)

## Demonstrations

- [Random and Predefined Graphs] (http://demo.yagljs.com/basic/basicScene.html)
- [A Facebook App] (http://demo.yagljs.com/fb/facebookScene.html)

## Documentation

Please be patient with us.  We hope to have documentation out soon.

## License
All files in this repository are released under the following license unless
specified at the beginning of the file.

Copyright &copy; 2016, Bridgewater College
<br />All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
-	Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
-	Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
-	Neither the name of Bridgewater College nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

