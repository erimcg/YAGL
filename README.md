# YAGL

YAGL (pronouned 'yæ gəl) is a javascript library that can create and render graphs in a 3D [BabylonJS](http://babylonjs.com) scene.  

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

Graphs are predefined in JSON files.  See template below.

- [YAGL 0.2.0](https://github.com/erimcg/YAGL/blob/master/doc/templates/0.2.0.yagl)

## Demonstrations

- [Web App](http://n0code.net/yagl/demo/basic/)

## Download

Version 0.2.0 in iife format can be download [here](https://github.com/erimcg/YAGL/blob/master/dist/0-2-0/yagl.js).  This version has not been tested on the current version of Babylon.js.

## License
All files in this repository are released under the [MIT](https://opensource.org/licenses/MIT) license unless
specified otherwise at the beginning of the file.
