//  world.js

//  MW WORLD.

    var world = new MW.World();

//  OCTREE.

//  Make a octree object, which will be the 
//  container of rigid objects such as terrain ect.

    var partition = 1;
    var min = new THREE.Vector3( -1000, -1000, -1000 );
    var max = new THREE.Vector3(  1000,  1000,  1000 );
    var octree = new MW.Octree( min, max, partition );
    world.add( octree );

//  GROUND.

    var ground = new THREE.Mesh(
        new THREE.PlaneGeometry( 2500, 2500, 1, 1 ),
        new THREE.MeshPhongMaterial({ 
            color:0x829ec4,
            transparent:false,
            opacity:1, 
            shininess: 80,
            wireframe:false,
        })
    );

    ground.rotation.x = THREE.Math.degToRad( -90 );

//  We want the ground as collision surface only,
//  so we do not add the ground in the scene.

    scene.add( ground );
    ground.visible = false;
//  ground.receiveShadow = true;

//  Add the ground to WALKMESH world octree object.
//  MESHWALK use octree system to detect collision objects.

    octree.importThreeMesh( ground ); // IMPORTANT //

//  Octree helpers.

    var octMeshHelpers = [];
    var octEdgesHelpers = [];

//  Add octree edges helpers.
//  octreeHelpers( octree );

    function octreeHelpers( octree ){
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
    
            mesh.position.set(
                node.min.x + (x/2),
                node.min.y + (y/2),
                node.min.z + (z/2)
            );
        
        //  scene.add( mesh );
            scene.add( mesh, helper );
    
            octMeshHelpers.push(mesh);
            octEdgesHelpers.push(helper);
        });
    }

    function octreeNodeHelper( node ){
        var x = node.max.x - node.min.x;
        var y = node.max.y - node.min.y;
        var z = node.max.z - node.min.z;
        var geometry = new THREE.BoxGeometry(x, y, z);
        var material = new THREE.MeshBasicMaterial({visible:false});
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            node.min.x + (x/2),
            node.min.y + (y/2),
            node.min.z + (z/2)
        );
        scene.add( mesh );
        octMeshHelpers.push(mesh);
        var helper = new THREE.EdgesHelper( mesh, 0xffff00 );
        helper.name = "octree helper";
        scene.add( helper );
        octEdgesHelpers.push(helper);
    }

/*
//  Remove octree mesh helpers.
    setTimeout(function(){
        octMeshHelpers.forEach( function( item, i ){
            scene.remove( octMeshHelpers[i] );
            var geometry = octMeshHelpers[i].geometry;
            var material = octMeshHelpers[i].material;
            geometry.dispose();
            material.dispose();
        });
        console.log( "octree mesh helpers has been removed." );
    }, 5000);
*/

