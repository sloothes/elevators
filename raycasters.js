//  Player raycasters.js

//  var near = 0;        //  cameraControls.minRadius; 
//  var far  = Infinity; //  cameraControls.maxRadius;

    localPlayer.targets = [];
    localPlayer.intersects = [];
    localPlayer.raycaster = new THREE.Raycaster();
    localPlayer.ray = localPlayer.raycaster.ray;
    localPlayer.rayHelper = rayHelper( localPlayer.sphere, localPlayer.ray );
    localPlayer.holder.add( localPlayer.rayHelper );

    localPlayer.raycasterUpdate = function(){

    //  Update raycaster.
        var origin = localPlayer.sphere.position;
        var direction = new THREE.Vector3(origin.x, -10, origin.z);
        this.raycaster.set( origin, direction );

    //  Update ray helper.
        this.rayHelper.geometry.vertices[0] = this.raycaster.ray.origin;
        this.rayHelper.geometry.vertices[1] = this.raycaster.ray.direction;
        this.rayHelper.geometry.verticesNeedUpdate = true;
    };

//  Player raycaster updater for "jquery-update-engine.js".
    var updatesSelector = "#updates";
    var raycasterSelector = "#raycaster";
    var raycasterUpdater = $('<input type="hidden" id="raycaster">').get(0);

//  Add vertical raycaster updater in updates elements.
    $(updatesSelector).append( raycasterUpdater );

//  Update vertical raycaster.
    raycasterUpdater.update = function(){ 
        localPlayer.raycasterUpdate();
    };

//  Activate updater.
    $(raycasterSelector).addClass("update");
//  Update "$updates" list to start updating.
    $updates = $("input[type=hidden].update");

    function rayHelper(sphere, ray){
        var geometry = new THREE.Geometry();
        geometry.vertices = [sphere.position, ray.origin];
        var material = new THREE.LineBasicMaterial( { color:0xffff00, transparent:false } );
        line = new THREE.Line( geometry, material );
        return line;
    }
