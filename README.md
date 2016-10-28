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

Graphs are predefined in JSON formatted files.  See template below.

- [YAGL 0.1.0](http://doc.yagljs.com/templates/0.1.0.yagl)

## Demonstrations

- [Random and Predefined Graphs] (http://demo.yagljs.com/basic/basicScene.html)
- [A Facebook App] (http://demo.yagljs.com/fb/facebookScene.html)

## Documentation

Please be patient with us.  We hope to have documentation out soon.


We've petitioned our college's administration to approve the release of this software as open source and are awaiting their response.
