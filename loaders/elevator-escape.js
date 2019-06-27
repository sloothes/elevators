//  elevator-escape.js (v2.4)

var railMode     = true;
var hallMode     = true;
var flatMode     = true;
var rigidMode    = false;
var wireMode     = false;
var stairMode    = true;
var octreeMode   = false;
var cabineMode   = true;
var mirrorMode   = false;
var elevatorMode = true;

var ElevatorAssets = {};
var ComponentAssets = {};
var octreeGeometries = {};
var octreeMeshHelpers = [];
var octreeEdgesHelpers = [];

var matcapsFolder = "/matcaps/";
var elevatorsGeometryFolder = "/elevators/geometries/";


localPlayer.controller.maxSlopeGradient = 0.001; // Math.cos(THREE.Math.degToRad(89));

//  Add an octree object, which will be the active container of rigid objects such as terrain ect.
    var partition = 4;
    var multiplier = 0.5 * Math.pow(2, partition - 1);
//  Octree boundies must be a bit lower than ground.position.y,
//  to be able to include ground plane in current octree.
    min = new THREE.Vector3( -400,  -0.1, -410 );  
    max = new THREE.Vector3(  400, 499.9,  390 );  
    var octree = new MW.Octree( min, max, partition );
//  This octree will be current overwritting previous world octrees.
    world.add( octree ); 

//  Add all previous rigid objects.
    octree.importThreeMesh( ground );
    octreeGeometries.ground = ground.geometry.uuid;
    octreeHelpers( octree );

var floorlength = 8 // Math.pow(2, partition - 1);
var roofheight  = Math.abs( max.y ) + Math.abs( min.y );
var floorheight = roofheight / floorlength;

//  OCTREE HELPERS.

function octreeHelpers( octree ){
    if ( !octreeMode ) return;

    var octreeMeshHelpers = [];

//  Add octree edges helpers.
    var nodeIndex = octree.nodes.length - 1;
    var node = octree.nodes[ nodeIndex ][0];
    var x = node.max.x - node.min.x;
    var y = node.max.y - node.min.y;
    var z = node.max.z - node.min.z;
    var geometry = new THREE.BoxGeometry(x, y, z);
    var material = new THREE.MeshBasicMaterial({visible:false});

    octree.nodes[ nodeIndex ].forEach(function(node){

        var x = node.max.x - node.min.x;
        var y = node.max.y - node.min.y;
        var z = node.max.z - node.min.z;

        var mesh = new THREE.Mesh(geometry, material);
        var helper = new THREE.EdgesHelper( mesh, 0xffff00 );

        helper.name = "octree helper";

        mesh.position.set(
            node.min.x + (x/2),
            node.min.y + (y/2),
            node.min.z + (z/2)
        );

        scene.add( mesh );
        scene.add( helper );

        octreeMeshHelpers.push(mesh);
        octreeEdgesHelpers.push(helper);
    });

//  Remove octree mesh helpers.
    setTimeout( function(){
        octreeMeshHelpers.forEach( function( item, i ){
            scene.remove( octreeMeshHelpers[i] );
            geometry.dispose();
            material.dispose();
            octreeMeshHelpers[i] = null;
        });
        console.log( "Octree mesh helpers has been removed:", octreeMeshHelpers.filter(Boolean) );
    }, 100);

}

function octreeNodeHelper(node){

    var x = node.max.x - node.min.x;
    var y = node.max.y - node.min.y;
    var z = node.max.z - node.min.z;

    var geometry = new THREE.BoxGeometry(x, y, z);
    var material = new THREE.MeshBasicMaterial({visible:false});

    var mesh = new THREE.Mesh(geometry, material);
    var helper = new THREE.EdgesHelper( mesh, 0xffff00 );

    helper.name = "octree helper";

    mesh.position.set(
        node.min.x + (x/2),
        node.min.y + (y/2),
        node.min.z + (z/2)
    );

    scene.add( mesh );
    scene.add( helper );

//  Remove octree mesh helpers.
    setTimeout( function(){
        scene.remove( mesh );
        geometry.dispose();
        material.dispose();
        mesh = null;
        console.log( "Octree mesh helpers has been removed:", octreeMeshHelpers.filter(Boolean) );
    }, 100);
}


(async function(){

    var Signal = signals.Signal;

    var staircasesUrl     = elevatorsGeometryFolder + "staircase-outdoor.json";    //  materials: [4].
    var stairoctreeUrl    = elevatorsGeometryFolder + "staircase-octree.json";
    var onestoctreeUrl    = elevatorsGeometryFolder + "one-stair-octree.json";
    var elevatorCabineUrl = elevatorsGeometryFolder + "elevator-cabin.json";       //  materials: [6].
    var elevatorFrameUrl  = elevatorsGeometryFolder + "elevator-doorframe.json";   //  materials: [6].
    var railingPipeUrl    = elevatorsGeometryFolder + "railing-pipe.json";
    var woodenRailingUrl  = elevatorsGeometryFolder + "wooden-railing.json";
    var apartDoorLeafUrl  = elevatorsGeometryFolder + "apartment-doorleaf.json";   //  materials: [4].
    var apartDoorFrameUrl = elevatorsGeometryFolder + "apartment-doorframe.json";  //  materials: [2].

//  Build elevator.
    await buildElevator( new THREE.Vector3( 250,0,0), 0, "elevatorR", 0.5, 0.75, false );
    await buildElevator( new THREE.Vector3(-250,0,0), 0, "elevatorL", 0.75, 0.25, false );

    async function buildElevator( position, rotation, selector, timescale, startfactor, wireframe ){

        if ( !rotation ) rotation = 0;
        if ( !position ) position = new THREE.Vector3(0,0,0);

        var x = position.x;  if ( isNaN(x) ) x = 0;
        var y = position.y;  if ( isNaN(y) ) y = 0;
        var z = position.z;  if ( isNaN(z) ) z = 0;
        var rotation = THREE.Math.degToRad( rotation );

        var component = new THREE.Group();
        component.name = "elevator component";
        component.position.set(x, y, z);
    //  scene.add( component );

        var material = new THREE.MeshBasicMaterial({visible:true});
        var standardMaterial = new THREE.MeshStandardMaterial();

        var ascnheight = 9 * floorheight/10;
        var descheight = 9 * floorheight/10;
        var slowheight = 1 * floorheight/10;

        var elevatheight = 40;
        var elevatAdjust = 0;

        var key = {
            "time":0.0, 
            "pos":[0,0,0],
            "rot":[0,0,0], 
            "scl":[1,1,1]
        };

        var elevatorData = {
            "name"      : "elevator",
            "fps"       : 25,
            "length"    : 0,
            "hierarchy" : [{
                "parent" : -1,  //  root.
                "keys":[]
            }]
        };

    //  Initial key.
        elevatorData.hierarchy[0].keys.push( { "time":key.time, "pos":key.pos, "rot":key.rot, "scl":key.scl } );

    //  Ascent.

        for ( var i = 1; i < floorlength; i++ ) {

            key.time += 1;
            var position = [ key.pos[0], key.pos[1], key.pos[2] ];
            elevatorData.hierarchy[0].keys.push({ "time":key.time, "pos":position, "rot":key.rot, "scl":key.scl });

            key.time += 1; key.pos[1] += ascnheight; 
            var position = [ key.pos[0], key.pos[1], key.pos[2] ];
            elevatorData.hierarchy[0].keys.push({ "time":key.time, "pos":position, "rot":key.rot, "scl":key.scl });

            key.time += 1; key.pos[1] += slowheight; 
            var position = [ key.pos[0], key.pos[1], key.pos[2] ];
            elevatorData.hierarchy[0].keys.push({ "time":key.time, "pos":position, "rot":key.rot, "scl":key.scl });

            key.time += 1;
            var position = [ key.pos[0], key.pos[1], key.pos[2] ];
            elevatorData.hierarchy[0].keys.push({ "time":key.time, "pos":position, "rot":key.rot, "scl":key.scl });

        }

        elevatorData.length = key.time;
    //  debugMode && console.log({"ascent elevatorData": elevatorData});


    //  Descent.

        for ( k = i; k > 1; k-- ) {

            key.time += 1;
            var position = [ key.pos[0], key.pos[1], key.pos[2] ];
            elevatorData.hierarchy[0].keys.push({ "time":key.time, "pos":position, "rot":key.rot, "scl":key.scl });

            key.time += 1; key.pos[1] -= descheight;
            var position = [ key.pos[0], key.pos[1], key.pos[2] ];
            elevatorData.hierarchy[0].keys.push({ "time":key.time, "pos":position, "rot":key.rot, "scl":key.scl });

            key.time += 1; key.pos[1] -= slowheight;
            var position = [ key.pos[0], key.pos[1], key.pos[2] ];
            elevatorData.hierarchy[0].keys.push({ "time":key.time, "pos":position, "rot":key.rot, "scl":key.scl });

            key.time += 1;
            var position = [ key.pos[0], key.pos[1], key.pos[2] ];
            elevatorData.hierarchy[0].keys.push({ "time":key.time, "pos":position, "rot":key.rot, "scl":key.scl });

        }

        elevatorData.length = key.time;
    //  debugMode && console.log({"descent elevatorData": elevatorData});


        if ( true ) {

        //  Elevator flat.

            var geometry = new THREE.BoxGeometry(40, 4, 50, 1,1,1 );
            var material = new THREE.MeshStandardMaterial({transparent:false, opacity:0.1, side:0});
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set( x, y-2, z+25 );
            octree.importThreeMesh( mesh );
            octreeMeshHelpers.push( mesh );
            var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
            if ( wireframe ) {
                scene.add( mesh );   // optional.
                scene.add( helper ); // optional.
            }
            addFlatstair( mesh );

        }

        if ( flatMode ) {

        //  Elevator door flats.

            var geometry = new THREE.BoxGeometry(40, 18, 10, 1,1,1 );
            var material = new THREE.MeshStandardMaterial({transparent:false, opacity:0.1, side:0});
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set( x, y-9, z+45 );

            for (var i = 1; i < floorlength; i++) {

                var mesh = mesh.clone();
                mesh.position.y += floorheight;
                octree.importThreeMesh( mesh );
                octreeMeshHelpers.push( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }

                addFlatstair( mesh );
            }

        }

        function addFlatstair( octreeObject ){
            var flat = mesh.clone();
            flat.material = new THREE.MeshStandardMaterial();
            flat.rotation.copy(octreeObject.rotation);
            flat.position.copy(octreeObject.position);
            scene.add(flat);
            return flat;
        }

    //   Cabine.

        await caches.match( elevatorCabineUrl ).then(function(response){

            if ( !response ) 
                throw response;
            else
                return response;

        }).catch(function(err){

            return fetch( elevatorCabineUrl );

        }).then(async function(response){

            var cache = await caches.open("geometries")
                .then(function(cache){ return cache; });

        //  Clone is needed because put() consumes the response body.
        //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

            var clone = response.clone();
            await cache.put( elevatorCabineUrl, clone );
            return response.json();

        }).then( function( json ){

            return loadComponentAsset( json );

        }).then( function( mesh ){
            mesh.name = "elevator cabine";

            var url = matcapsFolder + "ChromeReflect.jpg";
            caches.match( url ).then(function(response){

                if ( !response ) 
                    throw response;
                else
                    return response;

            }).catch(function(err){

            //  We use cors origin mode to avoid
            //  texture tainted canvases, images.
                return fetch( url, {
                    mode: "cors",
                    method: "GET",
                });

            }).then(async function(response){

                var cache = await caches.open("textures")
                    .then(function(cache){ return cache; });

            //  Clone is needed because put() consumes the response body.
            //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

                var clone = response.clone();
                await cache.put( url, clone );
                return response.blob();

            }).then(function(blob){

                var img = new Image();
                img.crossOrigin = "anonymous";

                $(img).on("load", function(){
                    matcapMaterial(mesh, img, 0);
                });

            //  Get dataURL from blob.

                var reader = new FileReader();
                reader.onload = function() {
                    img.src = reader.result;
                };

                reader.readAsDataURL(blob);

            });

            return mesh;

        }).then( function( mesh ){

            var url = matcapsFolder + "silver_tinman.png";
            caches.match( url ).then(function(response){

                if ( !response ) 
                    throw response;
                else
                    return response;

            }).catch(function(err){

            //  We use cors origin mode to avoid
            //  texture tainted canvases, images.
                return fetch( url, {
                    mode: "cors",
                    method: "GET",
                });

            }).then(async function(response){

                var cache = await caches.open("textures")
                    .then(function(cache){ return cache; });

            //  Clone is needed because put() consumes the response body.
            //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

                var clone = response.clone();
                await cache.put( url, clone );
                return response.blob();

            }).then(function(blob){

                var img = new Image();
                img.crossOrigin = "anonymous";

                $(img).on("load", function(){
                    matcapMaterial(mesh, img, 3);
                    matcapMaterial(mesh, img, 5);
                });

            //  Get dataURL from blob.

                var reader = new FileReader();
                reader.onload = function() {
                    img.src = reader.result;
                };

                reader.readAsDataURL(blob);

            });

            return mesh;

        }).then( function( mesh ){

            var url = elevatorsGeometryFolder + "elevator.jpg";
            caches.match( url ).then(function(response){

                if ( !response ) 
                    throw response;
                else
                    return response;

            }).catch(function(err){

            //  We use cors origin mode to avoid
            //  texture tainted canvases, images.
                return fetch( url, {
                    mode: "cors",
                    method: "GET",
                });

            }).then(async function(response){

                var cache = await caches.open("textures")
                    .then(function(cache){ return cache; });

            //  Clone is needed because put() consumes the response body.
            //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

                var clone = response.clone();
                await cache.put( url, clone );
                return response.blob();

            }).then(function(blob){

                var img = new Image();
                img.crossOrigin = "anonymous";

                $(img).on("load", function(){
                    var canvas = makePowerOfTwo( img, true );
                    var texture = new THREE.Texture( canvas );
                    mesh.material.materials[1] = new THREE.MeshStandardMaterial({ 
                        emissive: 0xffffff, 
                        emissiveMap: texture,
                        bumpMap: texture,
                        bumpScale: -0.03,
                        shading: THREE.SmoothShading,
                    });
                    mesh.material.materials[1].bumpMap.needsUpdate = true;
                    mesh.material.materials[1].emissiveMap.needsUpdate = true;
                    $(img).remove();
                });

            //  Get dataURL from blob.

                var reader = new FileReader();
                reader.onload = function() {
                    img.src = reader.result;
                };

                reader.readAsDataURL(blob);

            });

            return mesh;

        }).then( async function( mesh ){

        //  Elevator doors.

        //  Double-leaf elevator door.
            var geometry1 = new THREE.BoxGeometry(18, 45, 1, 1,1,1);
            var geometry2 = new THREE.BoxGeometry(18, 45, 2, 1,1,1);

            var filter = function( door ){ 
                return function( item ){
                    return item.meshID == door.geometry.uuid;
                };
            };

        //  Elevator door material.

            var url = matcapsFolder + "ChromeReflect.jpg";
            var elevatorDoorMaterial = await caches.match(url).then(function(response){

                if ( !response ) 
                    throw response;
                else
                    return response;

            }).catch(function(err){

            //  We use cors origin mode to avoid
            //  texture tainted canvases, images.
                return fetch( url, {
                    mode: "cors",
                    method: "GET",
                });

            }).then(async function(response){

                var cache = await caches.open("textures")
                    .then(function(cache){ return cache; });

            //  Clone is needed because put() consumes the response body.
            //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

                var clone = response.clone();
                await cache.put( url, clone );
                return response.blob();

            }).then(function(blob){

                return new Promise(function(resolve, reject){

                    var img = new Image();
                    img.crossOrigin = "anonymous";

                    $(img).on("load", function(){
                        var normal = new THREE.Texture( normalPixel() );
                        var canvas = makePowerOfTwo( img, true );
                        var matcap = new THREE.Texture( canvas );
                        var material = ShaderMaterial( normal, matcap );
                        resolve( material );
                        $(img).remove();
                    });

                //  Get dataURL from blob.

                    var reader = new FileReader();
                    reader.onload = function() {
                        img.src = reader.result;
                    };

                    reader.readAsDataURL(blob);

                });

            });

        //  Elevator door F0 (F00/F01).

            var doorF00 = new THREE.Mesh( geometry1.clone(), elevatorDoorMaterial );
            var doorF01 = new THREE.Mesh( geometry2.clone(), elevatorDoorMaterial );
            doorF00.position.set( x-9, y+22.5, z+41.5);  doorF00.name = "elevator door F00"; 
            doorF01.position.set( x+9, y+22.5, z+41.5);  doorF01.name = "elevator door F01";
            doorF00.positionClose = parseFloat(doorF00.position.x);          //  debugMode && console.log({"door F00 positionClose": doorF00.positionClose});
            doorF01.positionClose = parseFloat(doorF01.position.x);          //  debugMode && console.log({"door F01 positionClose": doorF01.positionClose});
            doorF00.positionOpen  = parseFloat(doorF01.positionClose + 9);   //  debugMode && console.log({"door F00 positionOpen" : doorF00.positionOpen });
            doorF01.positionOpen  = parseFloat(doorF01.positionClose + 10);  //  debugMode && console.log({"door F01 positionOpen" : doorF01.positionOpen });
            doorF00.filter = filter( doorF00 ); 
            doorF01.filter = filter( doorF01 );
            if ( rigidMode ) cameraControls.rigidObjects.push( doorF00 );
            if ( rigidMode ) cameraControls.rigidObjects.push( doorF01 );
            octree.importThreeMesh( doorF00 ); octreeGeometries["elevator_door_F00"] = doorF00.geometry.uuid;
            octree.importThreeMesh( doorF01 ); octreeGeometries["elevator_door_F01"] = doorF01.geometry.uuid;
            scene.add( doorF00, doorF01 );

        //  Elevator doors generator.

            var opendoor  = doorF00.positionOpen;  //  debugMode && console.log({"door F00 positionOpen": doorF00.positionOpen});
            var opendoor1 = doorF01.positionOpen;  //  debugMode && console.log({"door F01 positionOpen": doorF01.positionOpen});

            var doorF10 = cloneElevatorDoor( geometry1, floorheight, "F10", doorF00, opendoor );
            var doorF20 = cloneElevatorDoor( geometry1, floorheight, "F20", doorF10, opendoor );
            var doorF30 = cloneElevatorDoor( geometry1, floorheight, "F30", doorF20, opendoor );
            var doorF40 = cloneElevatorDoor( geometry1, floorheight, "F40", doorF30, opendoor );
            var doorF50 = cloneElevatorDoor( geometry1, floorheight, "F50", doorF40, opendoor );
            var doorF60 = cloneElevatorDoor( geometry1, floorheight, "F60", doorF50, opendoor );
            var doorF70 = cloneElevatorDoor( geometry1, floorheight, "F70", doorF60, opendoor );

            var doorF11 = cloneElevatorDoor( geometry2, floorheight, "F11", doorF01, opendoor1 );
            var doorF21 = cloneElevatorDoor( geometry2, floorheight, "F21", doorF11, opendoor1 );
            var doorF31 = cloneElevatorDoor( geometry2, floorheight, "F31", doorF21, opendoor1 );
            var doorF41 = cloneElevatorDoor( geometry2, floorheight, "F41", doorF31, opendoor1 );
            var doorF51 = cloneElevatorDoor( geometry2, floorheight, "F51", doorF41, opendoor1 );
            var doorF61 = cloneElevatorDoor( geometry2, floorheight, "F61", doorF51, opendoor1 );
            var doorF71 = cloneElevatorDoor( geometry2, floorheight, "F71", doorF61, opendoor1 );

            function cloneElevatorDoor( geometry, height, name, seed, positionOpen ){
                var door = new THREE.Mesh( geometry.clone(), elevatorDoorMaterial );
                door.position.copy( seed.position );
                door.position.y += height; // floorheight;
                door.name = ["elevator", "door", name].join(" "); 
                door.positionClose = parseFloat(door.position.x);
                door.positionOpen  = parseFloat( positionOpen );
                door.filter = filter( door );
                octree.importThreeMesh( door ); 
                octreeGeometries[ "elevator_door_" + name ] = door.geometry.uuid;
                if ( rigidMode ) cameraControls.rigidObjects.push( door );
                debugMode && console.log({
                    [`elevator door ${name}`]: door,
                    "positionOpen": door.positionOpen,
                });
                scene.add(door);
                return door;
            }


        //  Elevator.

            var geometry = new THREE.PlaneGeometry(35, 35, 1);
            var material = new THREE.MeshBasicMaterial({transparent:true, opacity:0.5, side:2});
            var elevator = new THREE.Mesh(geometry, material);
            elevator.name = selector;
            elevator.rotation.x = THREE.Math.degToRad( -90 );

        //  Geometry uuid.
            var uuid = elevator.geometry.uuid;

        //  Set position.
            elevator.position.set( x, y, z+22.5 );

        //  Add to current octree.
            octree.importThreeMesh( elevator );
        //  octreeMeshHelpers.push( elevator );
            octreeGeometries[ selector ] = elevator.geometry.uuid;

        //  Edges helper.
            var helper = new THREE.EdgesHelper( elevator, 0xffffff );

        //  Add to scene (optional).
            if ( wireframe ) {
                scene.add( elevator );  // optional.
                scene.add( helper );    // optional.
            }

            for (var i = 1; i < floorlength; i++) {
                elevator.position.y += floorheight;
                octree.importThreeMesh( elevator );
                if ( wireframe ) {
                    var meshelper = elevator.clone();
                    octreeMeshHelpers.push( meshelper );
                    var helper = new THREE.EdgesHelper( meshelper, 0xffff00 );
                    scene.add( meshelper ); // optional.
                    scene.add ( helper );   // optional.
                }
            }


        //  Elevator cabine.

            var cabine = mesh.clone();
            cabine.position.copy( elevator.position );
            cabine.position.z += 1;
            cabine.rotation.y = THREE.Math.degToRad( 90 );
            if ( rigidMode ) cameraControls.rigidObjects.push( cabine );
            scene.add( cabine );


        //  Elevator mirror. 

            var mirror = new THREE.Mirror( 
                renderer, camera, { 
                    clipBias:0.003, 
                    textureWidth: sceneContainer.clientWidth,
                    textureHeight: sceneContainer.clientHeight, 
                    color:0x888888,
                },
            );

            var geometry = new THREE.PlaneGeometry( 25, 20 );
            var elevatorMirror = new THREE.Mesh( geometry, mirror.material );
            elevatorMirror.name = [ selector, "mirror" ].join("-");
            elevatorMirror.add( mirror );
            elevatorMirror.position.x = 13.5;
            elevatorMirror.position.y = 29;
            elevatorMirror.rotation.y = THREE.Math.degToRad( -90 );
            cabine.add( elevatorMirror );

            if ( !!mirror ){

            //  Mirror renderer for "jquery-render-engine.js".
                var rendersSelector = "#renders";
                var mirrorsRenderer = $('<input type="hidden">').get(0);
                mirrorsRenderer.id = [ selector, "mirror" ].join("-");
                var mirrorsRendererSelector = "#" + mirrorsRenderer.id;
                $("#renders").append( mirrorsRenderer );
                $(mirrorsRendererSelector).addClass("mirror");
                mirrorsRenderer.mirror = mirror;

            //  Render (update) mirror.
                mirrorsRenderer.render = function(){ 
                    mirror.render();
                };

            //  Activate mirror jqurery renderer.
                if ( mirrorMode ) {
                    $(mirrorsRendererSelector).addClass("render");
                //  Update "renders" list to start rendering.
                //  $renders = $(".render"); // at end of promise.all().
                }
            }

        //  Elevator Animator.

        //  Setup elevator animator.
            var animator = new THREE.Object3D();
            animator.position.copy( elevator.position );

        //  Create elevator animation.
            var animation = new THREE.Animation( animator, elevatorData );
        //  debugMode && console.log({"animation": animation});

        //  Start animation.
            if ( !timescale ) var timescale = 0.5;
            animation.timeScale = timescale;

        //  Elevator updater for "jquery-update-engine.js".
            var updatesSelector  = "#updates";
            var elevatorSelector = "#" + selector;
            var elevatorUpdater  = $('<input type="hidden">').get(0);
            elevatorUpdater.id   = selector; // "main-elevator";

        //  Add elevator updater in updates elements.
            $("#updates").append( elevatorUpdater );
            $(elevatorSelector).addClass("elevator");

            elevatorUpdater.elevator = elevator;

        //  Resolving the octree elevator problem:
        //  You add a elevator plane with the same geometry uuid on every octree partition (floor). 
        //  You do not need to create animator or update every floor. The trick is every plane to
        //  be clone of the first elevator plane and have the same geometry uuid. The updater updates
        //  only the current partition of the octree nodes so when you change octree partition,
        //  updates the next floor elevator. With this you resolve the partition elevator problem.

        //  Conclusion: If you want to move vertical (or horizontal) between octree partitions,
        //  you must clone the mesh object with the same geometry.uuid to these partitions (not need
        //  to add on scene as octree use clone of geometry faces), add the clone mesh to octree,
        //  and update the player controller collisionCandidate faces vectors (a, b, c) of this 
        //  geometry.meshID (but not to every partition); the clones meshes do not need update task.

        //  Elevator doors handlers.

            var doorOpening = new Signal();
            var doorClosing = new Signal();

            doorOpening.add(function( door ){

                var name = animation.data.name; // e.g. "elevetor"
                var currentTime = animation.currentTime;
                var prevKeyTime = animator.animationCache.animations[name].prevKey.pos.time;

                var offset = (prevKeyTime - currentTime);

            //  debugMode && console.log( "opening offset:", offset );
                if ( door.position.x - offset < door.positionOpen ) {
                //  Update collision faces in player controller.
                    localPlayer.controller.collisionCandidate
                    .filter(door.filter).forEach( function( item ){
                        item.a.x -= offset;
                        item.b.x -= offset; 
                        item.c.x -= offset;
                    });
                    door.position.x -= offset; 
                //  debugMode && console.log( "opening position-x:", door.position.x );
                }
            });

            doorClosing.add(function( door ){

                var name = animation.data.name; // e.g. "elevetor"
                var currentTime = animation.currentTime;
                var nextKeyTime = animator.animationCache.animations[name].nextKey.pos.time;

                var offset = (nextKeyTime - currentTime); 

            //  debugMode && console.log( "closing offset:", offset );
                if ( door.position.x - offset > door.positionClose ) {
                //  Update collision faces in player controller.
                    localPlayer.controller.collisionCandidate
                    .filter(door.filter).forEach( function( item ){
                        item.a.x -= offset;
                        item.b.x -= offset; 
                        item.c.x -= offset;
                    });
                    door.position.x -= offset;
                //  debugMode && console.log( "closing position-x:", door.position.x );
                }
            });

            var collisionCandidate = localPlayer.controller.collisionCandidate;

            elevatorUpdater.update = function(){

            //  Current floor.
                elevatorUpdater.floor = elevator.floor = parseInt( animator.position.y / floorheight );

            //  Elevator doors handler.
                var name = animation.data.name; // e.g. "elevetor"
                var animationCache = animator.animationCache.animations[name];

                var currentTime  = animation.currentTime;
                var prevKeyIndex = animationCache.prevKey.pos.index;
                var nextKeyIndex = animationCache.nextKey.pos.index;
            //  debugMode && console.log( animationCache.prevKey.pos.index, animationCache.nextKey.pos.index );

                switch( prevKeyIndex, nextKeyIndex){

                //  BASE FLOOR.

                    //  opening:
                    case (54, 55):
                        if ( !!collisionCandidate.find(doorF00.filter) ) doorOpening.dispatch( doorF00 ); 
                        if ( !!collisionCandidate.find(doorF01.filter) ) doorOpening.dispatch( doorF01 ); 
                    break;

                    //  closing:
                    case (0, 1):
                        doorClosing.dispatch( doorF00 ); 
                        doorClosing.dispatch( doorF01 ); 
                    break;

                        
                //  ASCENT - DESCENT.

                    //  opening:
                    case (2, 3): 
                    case (50, 51):
                        if ( !!collisionCandidate.find(doorF10.filter) ) doorOpening.dispatch( doorF10 ); 
                        if ( !!collisionCandidate.find(doorF11.filter) ) doorOpening.dispatch( doorF11 ); 
                    break;

                    //  closing:
                    case (4, 5): 
                    case (52, 53):
                        doorClosing.dispatch( doorF10 ); 
                        doorClosing.dispatch( doorF11 ); 
                    break;

                    //  opening:
                    case (6, 7): 
                    case (46, 47):
                        if ( !!collisionCandidate.find(doorF20.filter) ) doorOpening.dispatch( doorF20 ); 
                        if ( !!collisionCandidate.find(doorF21.filter) ) doorOpening.dispatch( doorF21 ); 
                    break;

                    //  closing:
                    case (8, 9): 
                    case (48, 49):
                        doorClosing.dispatch( doorF20 ); 
                        doorClosing.dispatch( doorF21 );
                    break;

                    //  opening:
                    case (10, 11):
                    case (42, 43):
                        if ( !!collisionCandidate.find(doorF30.filter) ) doorOpening.dispatch( doorF30 ); 
                        if ( !!collisionCandidate.find(doorF31.filter) ) doorOpening.dispatch( doorF31 ); 
                    break;

                    //  closing:
                    case (12, 13): 
                    case (44, 45):
                        doorClosing.dispatch( doorF30 ); 
                        doorClosing.dispatch( doorF31 );
                    break;

                    //  opening:
                    case (38, 39):
                    case (14, 15):
                        if ( !!collisionCandidate.find(doorF40.filter) ) doorOpening.dispatch( doorF40 ); 
                        if ( !!collisionCandidate.find(doorF41.filter) ) doorOpening.dispatch( doorF41 ); 
                    break;

                    //  closing:
                    case (16, 17): 
                    case (40, 41):
                        doorClosing.dispatch( doorF40 ); 
                        doorClosing.dispatch( doorF41 );
                    break;

                    //  opening:
                    case (18, 19):
                    case (34, 35):
                        if ( !!collisionCandidate.find(doorF50.filter) ) doorOpening.dispatch( doorF50 ); 
                        if ( !!collisionCandidate.find(doorF51.filter) ) doorOpening.dispatch( doorF51 ); 
                    break;

                    //  closing:
                    case (20, 21): 
                    case (36, 37):
                        doorClosing.dispatch( doorF50 ); 
                        doorClosing.dispatch( doorF51 );
                    break;

                    //  opening:
                    case (22, 23):
                    case (30, 31):
                        if ( !!collisionCandidate.find(doorF60.filter) ) doorOpening.dispatch( doorF60 ); 
                        if ( !!collisionCandidate.find(doorF61.filter) ) doorOpening.dispatch( doorF61 ); 
                    break;

                    //  closing:
                    case (24, 25): 
                    case (32, 33):
                        doorClosing.dispatch( doorF60 ); 
                        doorClosing.dispatch( doorF61 );
                    break;


                //  LAST FLOOR.

                    //  opening:
                    case (26, 27): 
                        if ( !!collisionCandidate.find(doorF70.filter) ) doorOpening.dispatch( doorF70 ); 
                        if ( !!collisionCandidate.find(doorF71.filter) ) doorOpening.dispatch( doorF71 ); 
                    break;

                    //  closing:
                    case (28, 29): 
                        doorClosing.dispatch( doorF70 ); 
                        doorClosing.dispatch( doorF71 );
                    break;

                }

            //  Update elevator.
                elevator.position.y = animator.position.y + elevatAdjust;

            //  Update elevator collisions in player controller.
                localPlayer.controller.collisionCandidate.filter(function( item ){
                    return item.meshID == uuid;
                }).forEach( function( item ){
                    item.a.y = item.b.y = item.c.y = elevator.position.y;
                });

            //  Update cabine position.
                if ( cabineMode ) cabine.position.y = elevator.position.y;

            };

        //  Activate updater.
            $(elevatorSelector).addClass("update");
        //  Update "$updates" list to start updating.
        //  $updates = $(".update"); // at end of promise.all().

        //  Start elevator near to middle (descenting).
            animation.play( animation.data.length * startfactor );

            elevator.start = () => {
            //  Start elevator animation.
                animation.timeScale = timescale;
            //  Activate updater.
                $(elevatorSelector).addClass("update");
            //  Update "$updates" list to start updating.
                $updates = $(".update");   // IMPORTANT //
            };

            elevator.stop = () => {
            //  Pause elevator animation.
                animation.timeScale = 0;
            //  Disactivate updater.
                $(elevatorSelector).removeClass("update");
            //  Update "$update" list to start updating.
                $updates = $(".update");   // IMPORTANT //
            };

        //  return mesh;

        }).then( function(){
        //  Update "$renders" list to start rendering.
            if ( mirrorMode ) $renders = $(".render");
        });

    //  Elevator walls.

        var backWall = elevatorBackWall();
        var sideWalls = elevatorSideWall();

        function elevatorBackWall(){
            var octreeMeshHelpers = [];
            var w = 40, h = roofheight, d = 15;
            var geometry = new THREE.BoxGeometry(w, h, d, 1,1,1 );
            var mesh = new THREE.Mesh(geometry, material);
            mesh.name = "elevator back wall";
            octreeGeometries["elevator_back_wall"] = mesh.geometry.uuid;

            var mesh = mesh.clone();
            mesh.position.set( x, y+(h/2), z+(d/2)  );
            octree.importThreeMesh( mesh );
            octreeMeshHelpers.push( mesh );
            var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
            if ( wireframe ) {
                scene.add( mesh );   // optional.
                scene.add( helper ); // optional.
            }

        //  Remove octree mesh helpers.
            setTimeout( function(){
                if ( !wireframe ) return;
                octreeMeshHelpers.forEach( function( item, i ){
                    scene.remove( octreeMeshHelpers[i] );
                    var geometry = octreeMeshHelpers[i].geometry;
                    geometry.dispose();
                    octreeMeshHelpers[i] = null;
                });
                console.log( "Octree mesh helpers has been removed:", octreeMeshHelpers.filter(Boolean) );
            }, 100);

            return mesh;
        }

        function elevatorSideWall(){
            var octreeMeshHelpers = [];
            var w = 10, h = roofheight, d = 40;
            var geometry = new THREE.BoxGeometry(w, h, d, 1,1,1 );
            var mesh = new THREE.Mesh(geometry, material);
            mesh.name = "elevator side wall";
            octreeGeometries["elevator_side_wall"] = mesh.geometry.uuid;

            var mesh = mesh.clone();
            mesh.position.set( x-15, y+(h/2), z+(d/2)  );
            octree.importThreeMesh( mesh );
            octreeMeshHelpers.push( mesh );
            var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
            if ( wireframe ) {
                scene.add( mesh );   // optional.
                scene.add( helper ); // optional.
            }

            var mesh = mesh.clone();
            mesh.position.set( x+15, y+(h/2), z+(d/2)  );
            octree.importThreeMesh( mesh );
            octreeMeshHelpers.push( mesh );
            var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
            if ( wireframe ) {
                scene.add( mesh );   // optional.
                scene.add( helper ); // optional.
            }

        //  Remove octree mesh helpers.
            setTimeout( function(){
                if ( !wireframe ) return;
                octreeMeshHelpers.forEach( function( item, i ){
                    scene.remove( octreeMeshHelpers[i] );
                    var geometry = octreeMeshHelpers[i].geometry;
                    geometry.dispose();
                    octreeMeshHelpers[i] = null;
                });
                console.log( "Octree mesh helpers has been removed:", octreeMeshHelpers.filter(Boolean) );
            }, 100);

            return mesh;
        }


    //  Elevator frames.

        await caches.match( elevatorFrameUrl ).then(function(response){

            if ( !response ) 
                throw response;
            else
                return response;

        }).catch(function(err){

            return fetch( elevatorFrameUrl );

        }).then(async function(response){

            var cache = await caches.open("geometries")
                .then(function(cache){ return cache; });

        //  Clone is needed because put() consumes the response body.
        //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

            var clone = response.clone();
            await cache.put( elevatorFrameUrl, clone );
            return response.json();

        }).then( function( json ){

            return loadComponentAsset( json );

        }).then( function( mesh ){

            var url = elevatorsGeometryFolder + "elevator-door.jpg";
            caches.match( url ).then(function(response){

                if ( !response ) 
                    throw response;
                else
                    return response;

            }).catch(function(err){

            //  We use cors origin mode to avoid
            //  texture tainted canvases, images.
                return fetch( url, {
                    mode: "cors",
                    method: "GET",
                });

            }).then(async function(response){

                var cache = await caches.open("textures")
                    .then(function(cache){ return cache; });

            //  Clone is needed because put() consumes the response body.
            //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

                var clone = response.clone();
                await cache.put( url, clone );
                return response.blob();

            }).then(function(blob){

                var img = new Image();
                img.crossOrigin = "anonymous";

                $(img).on("load", function(){
                    var canvas = makePowerOfTwo( img, true );
                    var texture = new THREE.Texture( canvas );
                    var material = new THREE.MeshStandardMaterial({ 
                        color: 0x000000,
                        emissive: 0xffffff, 
                        emissiveMap: texture,
                        emissiveIntensity: 1,
                        shading: THREE.SmoothShading,
                    });
                    mesh.material.materials[1] = material;
                    mesh.material.materials[2] = material.clone();
                    mesh.material.materials[2].emissiveIntensity = 2;
                    material.emissiveMap.needsUpdate = true;
                    material.needsUpdate = true;
                    $(img).remove();
                });

            //  Get dataURL from blob.

                var reader = new FileReader();
                reader.onload = function() {
                    img.src = reader.result;
                };

                reader.readAsDataURL(blob);

            });

            return mesh;

        }).then( function( mesh ){

            mesh.name = "elevator frame";
            mesh.rotation.y = THREE.Math.degToRad( 90 );
            mesh.position.set( 0, 0, 41.5);
            component.add( mesh );

            return mesh;

        }).then( function( mesh ){

            for (var i = 1; i < floorlength; i++) {
                var mesh = mesh.clone();
                mesh.position.y += floorheight;
                component.add( mesh );
            }

            return mesh;

        }).then( function( mesh ){
            scene.add( component );
            return component;
        });

    }

//  Build stairtowers.
    buildStairtower( new THREE.Vector3(370,0,0), 0, false );
//  buildStairtowerMirror( new THREE.Vector3(-310,0,0), 0, false );

//  Build stairtower.
    async function buildStairtower( position, rotation, wireframe ){

        if ( !rotation ) rotation = 0;
        if ( !position ) position = new THREE.Vector3(0,0,0);

        var x = position.x;  if ( isNaN(x) ) x = 0;
        var y = position.y;  if ( isNaN(y) ) y = 0;
        var z = position.z;  if ( isNaN(z) ) z = 0;
        var rotation = THREE.Math.degToRad( rotation );

        var octreeMeshHelpers = [];

        var material = new THREE.MeshBasicMaterial({visible:false});
        var standardMaterial = new THREE.MeshStandardMaterial();

        await caches.match( staircasesUrl ).then(function(response){

            if ( !response ) 
                throw response;
            else
                return response;

        }).catch(function(err){

            return fetch( staircasesUrl );

        }).then(async function(response){

            var cache = await caches.open("geometries")
                .then(function(cache){ return cache; });

        //  Clone is needed because put() consumes the response body.
        //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

            var clone = response.clone();
            await cache.put( staircasesUrl, clone );
            return response.json();

        }).then( function( json ){

            return loadComponentAsset( json );

        }).then( async function( staircase ){

            var component = new THREE.Group();
            component.position.set(x, y, z);

        //  Stairs.
            await caches.match( stairoctreeUrl ).then(function(response){

                if ( !response ) 
                    throw response;
                else
                    return response;

            }).catch(function(err){

                return fetch( stairoctreeUrl );

            }).then(async function(response){

                var cache = await caches.open("geometries")
                    .then(function(cache){ return cache; });

            //  Clone is needed because put() consumes the response body.
            //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

                var clone = response.clone();
                await cache.put( stairoctreeUrl, clone );
                return response.json();

            }).then( function( json ){

                return loadComponentAsset( json );

            }).then( function( mesh ){

                mesh.material = material;
                return mesh;

            }).then( function( mesh ){

                var mesh = mesh.clone();
                mesh.position.set( x-29, y-0.5, z+37.5 );
                mesh.rotation.y = THREE.Math.degToRad( -180 );
                octree.importThreeMesh( mesh );
                octreeMeshHelpers.push( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );

                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }

                addStaircase( mesh );

                for (var i = 0; i < 10; i++) {

                    var mesh = mesh.clone();
                    mesh.position.y += 2*floorheight/3;
                    octree.importThreeMesh( mesh );
                    octreeMeshHelpers.push( mesh );
                    var helper = new THREE.EdgesHelper( mesh, 0x0000ff );

                    if ( wireframe ) {
                        scene.add( mesh );   // optional.
                        scene.add( helper ); // optional.
                    }

                    addStaircase( mesh );
                }

                return mesh;

            }).then( function( mesh ){

                var mesh = mesh.clone();
                mesh.position.set( x-43, y+20.5, z+12 );
                mesh.rotation.y = THREE.Math.degToRad( 180 );
                octree.importThreeMesh( mesh );
                octreeMeshHelpers.push( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );

                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }

                addStaircase( mesh );

                for (var i = 1; i < 10; i++) {
                    var mesh = mesh.clone();
                    mesh.position.y += 2*floorheight/3; // 41.5;
                    octree.importThreeMesh( mesh );
                    octreeMeshHelpers.push( mesh );
                    var helper = new THREE.EdgesHelper( mesh, 0x0000ff );

                    if ( wireframe ) {
                        scene.add( mesh );   // optional.
                        scene.add( helper ); // optional.
                    }

                    addStaircase( mesh );
                }

            });

        //  Walls.

            await (async function(){
                var geometry = new THREE.BoxGeometry(120, roofheight, 10, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "wall back";
                octreeGeometries["wall_back"] = mesh.geometry.uuid;
                return( mesh );
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-40, y+(roofheight/2), z+0 ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
            });

            await (async function(){
                var geometry = new THREE.BoxGeometry(10, roofheight, 60, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "wall side";
                octreeGeometries["wall_side"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x+20, y+(roofheight/2), z+25 ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
            });

        //  Elevator walls.

            await (async function(){
                var geometry = new THREE.BoxGeometry(8, roofheight, 55, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "elevator side wall";
                octreeGeometries["elevator_side_wall"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-93, y+(roofheight/2), z+22.5  ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
            });

        //  Stairs middle walls.

            await (async function(){
                var geometry = new THREE.BoxGeometry(50, roofheight, 8, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                octreeGeometries["wall_stairs_middle"] = mesh.geometry.uuid;
                mesh.name = "wall stairs middle";
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-35, y+(roofheight/2), z+25 ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                return mesh;
            }).then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-35, y+(roofheight/2), z+50 ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
            });

        //  Stairs middle columns.

            await (async function(){
                var geometry = new THREE.CylinderGeometry( 5, 5, roofheight, 6 );
                var mesh = new THREE.Mesh(geometry, material);
                octreeGeometries["column_stairs_middle"] = mesh.geometry.uuid;
                mesh.name = "column stairs middle";
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-60, y+(roofheight/2), z+25 ); // ok.
                mesh.rotation.y = THREE.Math.degToRad( -90 )
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                return mesh;
            }).then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-60, y+(roofheight/2), z+50 ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                return mesh;
            }).then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-10, y+(roofheight/2), z+25 ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                return mesh;
            }).then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-10, y+(roofheight/2), z+50 ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                return mesh;
            }).then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-93, y+(roofheight/2), z+50 ); // ok.
                mesh.rotation.y = THREE.Math.degToRad( 0 )
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
            });

        //  Flatboxes.

            await (async function(){
                var geometry = new THREE.BoxGeometry(30, 20, 50, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "flatbox";
                octreeGeometries["flatbox"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x+5, y+10, z+25 );
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                addflatstair( mesh );
            });

            await (async function(){
                var geometry = new THREE.BoxGeometry(85, 20, 26, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "understairs flatbox";
                octreeGeometries["understairs_flatbox"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-52.5, y+10, z+13 ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
            });

            await (async function(){
                var geometry = new THREE.BoxGeometry(55, 16, 26, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "understairs flatbox 1";
                octreeGeometries["understairs_flatbox_1"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-67.5, y+28, z+13 ); // ok.
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
            });

        //  Flatstairs.

            await (async function(){
                var geometry = new THREE.BoxGeometry(30, 4, 50, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "flatstair";
                octreeGeometries["flatstair"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x+5, y-2+(floorheight/3), z+25 );
                for (var i = 0; i < 10; i++) {
                    var mesh = mesh.clone();
                    mesh.position.y += 2*floorheight/3;
                    octreeMeshHelpers.push( mesh );
                    octree.importThreeMesh( mesh );
                    var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                    if ( wireframe ) {
                        scene.add( mesh );   // optional.
                        scene.add( helper ); // optional.
                    }
                    addflatstair( mesh );
                }
            });

            await (async function(){
                var geometry = new THREE.BoxGeometry(40, 4, 50, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "elevator flatstair";
                octreeGeometries["elevator_flatstair"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-80, y-2, z+25 );
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                addflatstair( mesh );
                return mesh;
            }).then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.y += 2*floorheight/3;
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                addflatstair( mesh );
                return mesh;
            }).then( function( mesh ){
                for (var i = 1; i < 10; i++) {
                    var mesh = mesh.clone();
                    mesh.position.y += 2*floorheight/3;
                    octreeMeshHelpers.push( mesh );
                    octree.importThreeMesh( mesh );
                    var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                    if ( wireframe ) {
                        scene.add( mesh );   // optional.
                        scene.add( helper ); // optional.
                    }
                    addflatstair( mesh );
                }
            });

        //  Railwalls.

            await (async function(){
                var geometry = new THREE.BoxGeometry(30, floorheight, 8, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "railwall 1";
                octreeGeometries["railwall_1"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x+5, y+(floorheight/2)-2, z+50  );
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
            });

            await (async function(){
                var geometry = new THREE.BoxGeometry(30, 4*floorheight/3, 8, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "railwall 2";
                octreeGeometries["railwall_2"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x+5, y+(7*floorheight/3)-2, z+50  );
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                return mesh;
            }).then( function( mesh ){
                for (var i = 1; i < 3; i++) {
                    var mesh = mesh.clone();
                    mesh.position.y += 2*floorheight;
                    octreeMeshHelpers.push( mesh );
                    octree.importThreeMesh( mesh );
                    var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                    if ( wireframe ) {
                        scene.add( mesh );   // optional.
                        scene.add( helper ); // optional.
                    }
                }
            });

            await (async function(){
                var geometry = new THREE.BoxGeometry(40, 4*floorheight/3, 8, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "railwall 3";
                octreeGeometries["railwall_3"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-77.5, y+(4*floorheight/3)-2, z+50  );
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
                return mesh;
            }).then( function( mesh ){
                for (var i = 0; i < 3; i++) {
                    var mesh = mesh.clone();
                    mesh.position.y += 2*floorheight; // 124.5;
                    octreeMeshHelpers.push( mesh );
                    octree.importThreeMesh( mesh );
                    var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                    if ( wireframe ) {
                        scene.add( mesh );   // optional.
                        scene.add( helper ); // optional.
                    }
                }
            });

            await (async function(){
                var geometry = new THREE.BoxGeometry(15, 66, 35, 1,1,1 );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.name = "railwall deadend";
                octreeGeometries["railwall_deadend"] = mesh.geometry.uuid;
                return mesh;
            })().then( function( mesh ){
                var mesh = mesh.clone();
                mesh.position.set( x-10, y+roofheight-(floorheight/2)-2, z+13  ); // ok. 446.5
                octreeMeshHelpers.push( mesh );
                octree.importThreeMesh( mesh );
                var helper = new THREE.EdgesHelper( mesh, 0x0000ff );
                if ( wireframe ) {
                    scene.add( mesh );   // optional.
                    scene.add( helper ); // optional.
                }
            });

        //  Rails.

            await caches.match( woodenRailingUrl ).then(function(response){

                if ( !response ) 
                    throw response;
                else
                    return response;

            }).catch(function(err){

                return fetch( woodenRailingUrl );

            }).then(async function(response){

                var cache = await caches.open("geometries")
                    .then(function(cache){ return cache; });

            //  Clone is needed because put() consumes the response body.
            //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

                var clone = response.clone();
                await cache.put( woodenRailingUrl, clone );
                return response.json();

            }).then( function( json ){

                return loadComponentAsset( json );

            }).then( function( mesh ){

                group = new THREE.Group();
                group.name = "rail component";
                mesh.name = "wooden rail";
                mesh.scale.set(1,1,1);
                mesh.rotation.y = THREE.Math.degToRad( 180 );
                group.add( mesh );

                return caches.match( railingPipeUrl ).then(function(response){

                    if ( !response ) 
                        throw response;
                    else
                        return response;

                }).catch(function(err){

                    return fetch( railingPipeUrl );

                }).then(async function(response){

                    var cache = await caches.open("geometries")
                        .then(function(cache){ return cache; });

                //  Clone is needed because put() consumes the response body.
                //  See: "https://developer.mozilla.org/en-US/docs/Web/API/Cache/put"

                    var clone = response.clone();
                    await cache.put( railingPipeUrl, clone );
                    return response.json();

                }).then( function( json ){

                    return loadComponentAsset( json );

                }).then( function( pipe ){

                //  Create rail component.
                    pipe.name = "aluminum pipe";
                    var pipe = pipe.clone();
                    pipe.position.x = 1;
                    group.add( pipe );
                    for (var i = 1; i < 11; i++ ) {
                        pipe = pipe.clone();
                        pipe.position.x += 2;
                        group.add( pipe );
                    }

                    return group;

                });

            }).then( function( group ){
                var group = group.clone();
                group.rotation.y = THREE.Math.degToRad(-180);
                group.position.set( 18, 1.5+(floorheight/3), 49 );
                component.add( group );
                for (var i=0; i < 3; i++){
                    var group = group.clone();
                    group.position.y += 4*floorheight/3;
                    component.add(group);
                    var group = group.clone();
                    group.position.y += 2*floorheight/3;
                    component.add(group);
                }
                return group;
            }).then( function( group ){
                var group = group.clone();
                group.position.set( -70, 1.5+(2*floorheight/3), 49 );
                component.add( group );
                for (var i=0; i < 3; i++){
                    var group = group.clone();
                    group.position.y += 2*floorheight/3;
                    component.add(group);
                    var group = group.clone();
                    group.position.y += 4*floorheight/3;
                    component.add(group);
                }
                return group;
            }).then(function(group){
                var group = group.clone();
                group.position.set( 18, 1.5+(floorheight/3), 1 );
                component.add( group );
                var group = group.clone();
                component.add(group);
                for (var i=0; i < 10; i++){
                    var group = group.clone();
                    group.position.y += 2*floorheight/3;
                    component.add(group);
                }
                return group;
            }).then( function( group ){
                var group = group.clone();
                group.position.set( -93, 1.5+(2*floorheight/3), 1 );
                group.rotation.y = THREE.Math.degToRad(-180);
                component.add( group );
                var group = group.clone();
                component.add(group);
                for (var i=1; i < 10; i++){
                    var group = group.clone();
                    group.position.y += 2*floorheight/3;
                    component.add(group);
                }
                return group;
            }).then( function( group ){
                var group = group.clone();
                group.position.set( -93, 1.5, 23 );
                component.add( group );
                var group = group.clone();
                group.rotation.y = THREE.Math.degToRad(-90);
                component.add( group );
                return group;
            }).then( function( group ){
                var group = group.clone();
                group.rotation.y = THREE.Math.degToRad(-90);
                group.position.set( -5, 1.5+( (floorlength-1)*(3*floorheight/3) ), 0 );
                component.add( group );
                return group;
            }).then(function(group){

            //  Create new component.
                var group = group.clone();
                var scale = 2.24;
                group.children.length = 2;
                group.children[0].scale.x = scale;
                group.position.set( 19, 1.5+(floorheight/3), 0 );

                var pipe = group.children[1];
                for (var i = 1; i < 11 * scale; i++){
                    var pipe = pipe.clone();
                    pipe.position.x += 2;
                    group.add( pipe );
                }

                component.add( group );

                for (var i=0; i < 10; i++){
                    var group = group.clone();
                    group.position.y += 2*floorheight/3;
                    component.add(group);
                }

                return group;

            }).then( function( group ){
                var group = group.clone();
                group.position.set( -93, 1.5+(2*floorheight/3), 0 );
                component.add( group );
                for (var i=1; i < 10; i++){
                    var group = group.clone();
                    group.position.y += 2*floorheight/3;
                    component.add(group);
                }
            });

        //  Remove octree mesh helpers.

            setTimeout( function(){
                if ( !wireframe ) return;
                octreeMeshHelpers.forEach( function( item, i ){
                    scene.remove( octreeMeshHelpers[i] );
                    var geometry = octreeMeshHelpers[i].geometry;
                    geometry.dispose();
                    octreeMeshHelpers[i] = null;
                });
                console.log( "Octree mesh helpers has been removed:", octreeMeshHelpers.filter(Boolean) );
            }, 100);
                
            scene.add( component );  // stairstower.

            function addflatstair( mesh ){
                var mesh = mesh.clone();
                mesh.material = standardMaterial;
                mesh.position.x -= x;
                mesh.position.y -= y;
                mesh.position.z -= z;
                component.add( mesh );
            }

            function addStaircase( object ){
                if ( !stairMode ) return;
                var stairs = staircase.clone();
                stairs.rotation.copy(object.rotation);
                stairs.position.copy(object.position);
                stairs.position.x -= x;
                stairs.position.y -= y;
                stairs.position.z -= z;
                component.add(stairs);
                return stairs;
            }

        });

    }



















    function loadComponentAsset( json ){

        var name = json.name;
        var loader = new THREE.JSONLoader();
        var object = loader.parse( json );

        var geometry = object.geometry;
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();
        geometry.name = object.geometry.name;

        if ( !!object.materials )
            var material = new THREE.MeshFaceMaterial( object.materials );
        else 
            var material = new THREE.MeshFaceMaterial( new THREE.MeshStandardMaterial() );

        var mesh = new THREE.Mesh(geometry, material);

        return mesh;
    }

    function matcapMaterial(mesh, img, index){
        var normal = new THREE.Texture( normalPixel() );
        var canvas = makePowerOfTwo( img, true );
        var matcap = new THREE.Texture( canvas );
        mesh.material.materials[index] = ShaderMaterial( normal, matcap );
        $(img).remove();
    }

})();

