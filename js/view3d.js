// view3d.js
// A 3D viewer for UK weather data from a modified WCS server.
// VERY EXPERIMENTAL. DATA COULD BE WRONG, UNAVAILABLE, ETC.
// MOST DEFINITELY NOT FOR OPERATIONAL USE!!
//
// Michael Saunby
//
//

var VIEW3D = {

  scene : null,
  camera : null,
  controls : null,
  renderer : null,
  container : null,
  //water : null,
  directionalLight : null,
  fps: 30,  // 30 is current Firefox max, as far as I can tell.
  // Chrome will go up to 60 which gets GPU hot.

  init_scene : function init_scene(){
  this.then = Date.now();
  this.now = null;
  this.delta = null;

  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera(55.0, window.innerWidth / window.innerHeight, 0.5, 3000000);
  this.camera.position.set(130, 2000, 1300);
  this.camera.lookAt(new THREE.Vector3(0, 0, 0));

  this.renderer = new THREE.WebGLRenderer({alpha: true});
  this.renderer.setSize(window.innerWidth, window.innerHeight);
  this.renderer.setClearColor( 0x6666ff, 1);

  this.controls = new DeviceOrientationController( this.camera, this.renderer.domElement );
  this.controls.connect();
  this.controls.addEventListener( 'change', function(){VIEW3D.fps=30;});

  this.directionalLight = new THREE.DirectionalLight(0xffffdd, 1);
  //directionalLight.position.set(-600, 300, -600);
  this.directionalLight.position.set(200, 800, 1500);
  this.scene.add(this.directionalLight);

  // see http://www.html5rocks.com/en/tutorials/webgl/shaders/


  var uniforms1 = {
    time: { type: "f", value: 1.0 },
    resolution: { type: "v2", value: new THREE.Vector2() }
  };

  var attributes = {
    displacement: {
        type: 'f', // a float
        value: [] // an empty array
    }
  };

  var shader_material = new THREE.MeshPhongMaterial({color: 0x444488});


  var aMeshMirror = new THREE.Mesh(
           new THREE.PlaneGeometry(2000, 2000, 100, 100), shader_material
           );
  aMeshMirror.rotation.x = - Math.PI * 0.5;

  aMeshMirror.castShadow = false;
  aMeshMirror.receiveShadow = true;

  this.scene.add(aMeshMirror);

  this.container = new THREE.Object3D();
  this.scene.add(this.container);
    },


  display: function display() {
    this.renderer.render(this.scene, this.camera);
    if(stats){
      stats.update();
    }
  },

  update: function update() {
    this.now = Date.now();
    this.delta = this.now - this.then;
    this.then = this.now;
    if (this.controls.forwardMovement) {
      console.log("aaaaah");
      VIEW3D.camera.translateZ(- this.delta * 0.1);
    }
    this.camera_position = VIEW3D.camera.position;
    this.controls.update();
    this.display();
  },

  resize: function resize(inWidth, inHeight) {
    this.camera.aspect =  inWidth / inHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(inWidth, inHeight);
    this.canvas.html(this.renderer.domElement);
    this.display();
  }
};

VIEW3D.init_scene();

function mainLoop() {
  // Left to run at max speed I get almost 60fps on a Macbook Pro.
  // Which will cause the fan to come on and drain the battery.
  // The timeout sets the max frame rate.  1000/5 gives 5fps.
  // fps is increased when the controls are moved.  Gives a much
  // smoother experience.
  setTimeout( function() {
    requestAnimationFrame(mainLoop);
  }, 1000 / VIEW3D.fps );

  VIEW3D.update();
}

document.getElementById('webgl').appendChild(VIEW3D.renderer.domElement);
var stats = new Stats();
window.addEventListener( 'resize', function(){
  VIEW3D.resize(window.innerWidth, window.innerHeight)}, false );

mainLoop();
