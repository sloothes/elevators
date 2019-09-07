//  scene.js

    var fontFolder = "/three/fonts/";
    var fontPath = "/three/fonts/helvetiker_regular.typeface.json";

    var sceneContainerSelector = "#scene-container";
    var renderContainerSelector = "#scene-container";
    var rendererContainerSelector = "#scene-container";

    var sceneContainer = document.getElementById("scene-container");
    var renderContainer = document.getElementById("scene-container");
    var rendererContainer = document.getElementById("scene-container");
    var domElementContainer = document.getElementById("scene-container");

    var scene, 
        camera, 
        renderer, 
        controls;

    var sunLight,
        sceneLights,
        shadowHelper,
        ambientLight,
        groundHelper,
        axisCustomHelper, 
        axisOriginHelper;

    var projector, 
        keyboard, 
        clock,
        mouse;

(function(){

    var container = document.getElementById("scene-container");

    scene = new THREE.Scene();
    scene.name = "DEFAULT SCENE";
    scene.fog = new THREE.FogExp2(0xb1c8e8, 0.00075);
    camera = new FpsCamera(50, 1, 10000);

    sceneBackground([
        "/elevators/skybox/posx.jpg", // "posx.jpg",
        "/elevators/skybox/negx.jpg", // "negx.jpg", 
        "/elevators/skybox/posy.jpg", // "posy.jpg", 
        "/elevators/skybox/negy.jpg", // "negy.jpg", 
        "/elevators/skybox/posz.jpg", // "posz.jpg", 
        "/elevators/skybox/negz.jpg", // "negz.jpg"
    ]);

    camera.position.set(0, 20, 100);
//  controls = new THREE.EditorControls(camera);
    if ( controls && controls instanceof THREE.EditorControls ) {
        camera.lookAt(controls.center); // important!
    }

    ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);

//  Shadow Light.

    sunLight = new THREE.DirectionalLight( 0xdfebff, 0.75 );
    sunLight.position.set( 0, 500, 300 );
    sunLight.position.multiplyScalar( 1.5 );
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width  = Math.pow(2, 10); // 2048;
    sunLight.shadow.mapSize.height = Math.pow(2, 10); // 2048;

    var d = 30;
    sunLight.shadow.camera.left = - d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = - d;
    sunLight.shadow.camera.far = 10000;

    shadowHelper = new THREE.CameraHelper(sunLight.shadow.camera);
    shadowHelper.visible = false;

    scene.add( sunLight, shadowHelper  );

    groundHelper = new GroundHelper(1000, 10);  
    axisCustomHelper = new CustomAxisHelper(5200);
    axisOriginHelper = new OriginAxisHelper(1200);

    clock = new THREE.Clock();
    projector = new THREE.Projector();

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
    });

//  Renderer.

	renderer.shadowMap.enabled = true;
    renderer.setClearColor( 0xb1c8e8 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( container.clientWidth, container.clientHeight );
    container.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

//  Event Listeners.

    mouse = new THREE.Vector2();
    var rendererHalfWidth  = renderer.domElement.width * 0.5;
    var rendererHalfHeight = renderer.domElement.height * 0.5;

    window.addEventListener("resize", onWindowResize);
    window.addEventListener("mousemove", onMouseMove);

    function onWindowResize() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( container.clientWidth, container.clientHeight );
        rendererHalfWidth = renderer.domElement.width * 0.5;
        rendererHalfHeight = renderer.domElement.height * 0.5;
    }

    function onMouseMove(e) {
        mouse.x = ( e.clientX - rendererHalfWidth );
        mouse.y = ( e.clientY - rendererHalfHeight );
    }

//  Settings.

    groundHelper.visible = false;
    axisCustomHelper.visible = false;
    axisOriginHelper.visible = false;

})();
