//  elevators-build.js (v2.4)

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
    var elevatorsGeometryFolder = "/elevator/geometries/";

    var staircasesUrl     = elevatorsGeometryFolder + "staircase-outdoor.js";    //  materials: [4].
    var stairoctreeUrl    = elevatorsGeometryFolder + "staircase-octree.js";
    var onestoctreeUrl    = elevatorsGeometryFolder + "one-stair-octree-v1.js";
    var elevatorCabineUrl = elevatorsGeometryFolder + "elevator-cabin.js";       //  materials: [6].
    var elevatorFrameUrl  = elevatorsGeometryFolder + "elevator-doorframe.js";   //  materials: [6].
    var railingPipeUrl    = elevatorsGeometryFolder + "railing-pipe.js";
    var woodenRailingUrl  = elevatorsGeometryFolder + "wooden-railing.js";
    var apartDoorLeafUrl  = elevatorsGeometryFolder + "apartment-doorleaf.js";  //  materials: [4].
    var apartDoorFrameUrl = elevatorsGeometryFolder + "apartment-doorframe.js"; //  materials: [2].

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
        setTimeout( () => {
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
        setTimeout( () => {
            scene.remove( mesh );
            geometry.dispose();
            material.dispose();
            mesh = null;
            console.log( "Octree mesh helpers has been removed:", octreeMeshHelpers.filter(Boolean) );
        }, 100);
    }


















