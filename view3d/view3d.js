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
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55.0, window.innerWidth / window.innerHeight, 0.5, 3000000);
    this.camera.position.set(130, 2000, 1300);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));

    this.controls = new THREE.TrackballControls(this.camera);
    this.controls.addEventListener( 'change', function(){VIEW3D.fps=30;});

    //this.renderer = new THREE.WebGLRenderer({alpha: true});
    this.mycanvas = document.createElement('canvas');
    this.renderer = new THREE.WebGLRenderer({canvas: this.mycanvas,
      preserveDrawingBuffer   : true,
      alpha: true});
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setClearColor( 0x6666ff, 1);


      this.directionalLight = new THREE.DirectionalLight(0xffffdd, 1);
      //directionalLight.position.set(-600, 300, -600);
      this.directionalLight.position.set(200, 800, 1500);
      this.scene.add(this.directionalLight);

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
        new THREE.PlaneBufferGeometry(2000, 2000, 100, 100), shader_material
      );
      aMeshMirror.rotation.x = - Math.PI * 0.5;

      aMeshMirror.castShadow = false;
      aMeshMirror.receiveShadow = true;

      this.scene.add(aMeshMirror);

      this.container = new THREE.Object3D();
      this.scene.add(this.container);
    },


    display: function display() {
      //this.water.render();
      this.renderer.render(this.scene, this.camera);
      if(stats){
        stats.update();
      }
    },

    update: function update() {
      //this.water.material.uniforms.time.value += 1.0 / 60.0;
      this.camera_position = VIEW3D.camera.position;
      this.controls.update();
      this.display();
    },

    resize: function resize(inWidth, inHeight) {
      this.camera.aspect =  inWidth / inHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(inWidth, inHeight);
      //this.canvas.html(this.renderer.domElement);
      this.display();
    },

    mainLoop: function() {
      // Left to run at max speed I get almost 60fps on a Macbook Pro.
      // Which will cause the fan to come on and drain the battery.
      // The timeout sets the max frame rate.  1000/5 gives 5fps.
      // fps is increased when the controls are moved.  Gives a much
      // smoother experience.
      setTimeout( function() {
        requestAnimationFrame(VIEW3D.mainLoop);
      }, 1000 / this.fps );

      if(this.fps>5){this.fps--;}
      VIEW3D.update();
    }

  };

  VIEW3D.init_scene();


  angular.module('viewer', []).controller("MainController", function($scope, $http, $location){

    $scope.dem_width = 256;
    $scope.dem_height = 256;
    // Don't use huge numbers for width or height.  300x300 is just fine.
    // For a start, localStorage will fail with large data files as it's stored as text!!
    //
    // Issuing localStorage.clear() in console is useful too :-)

    $scope.landCanvas = null;
    $scope.position = null; // camera position

    // The OpenShift application allows cross origin requests (for now).
    //$scope.demProviderUrl = "http://python-wetoffice.rhcloud.com/dembin";
    //$scope.wxProviderUrl = "http://python-wetoffice.rhcloud.com/capbin";
    // To use your own (local) server for data replace with these -
    //$scope.demProviderUrl = "/dembin";
    //$scope.wxProviderUrl = "/capbin";

    $scope.cld_low = "cld_low.bin";
    $scope.cld_med = "cld_med.bin";
    $scope.cld_hig = "cld_hig.bin";

    $scope.data_prefix = "../utils/";


    //$scope.bboxes = {"UK":"-14,47.5,7,61", "Exeter":"-4.93266,49.31965,-2.12066,52.13165"};
    $scope.bboxes = {"UK":"-12,50,3.5,59", "Exeter":"-4.93266,49.31965,-2.12066,52.13165"};
    $scope.bboxChoice = $scope.bboxes["UK"]; // watched
    $scope.paletteColour0 =  "rgba(255,255,255,0)";
    $scope.paletteColour1 =  "rgba(255,255,255,0.8)";
    $scope.shininess = "90";

    $scope.wx_mult = 200;
    $scope.wx_add = 50;
    $scope.wx_mesh = null;

    $scope.dem_mesh = null;

    $scope.light_x = -1000;
    $scope.light_y = 1500;
    $scope.light_z = -900;

    $scope.camera_x = 0;
    $scope.camera_y = 2000;
    $scope.camera_z = 2000;


    $scope.demdata = null
    $scope.rawdata = null

    $scope.$watch('level_range', function(){
      VIEW3D.container.remove( $scope.wx_mesh )
      $scope.wx_mesh = new THREE.Object3D()
      console.log('level', $scope.level_range)
      $scope.loadwxpng( $scope.level_range )
    })

    $scope.$watch('bboxChoice', function(){
      if($scope.wx_mesh){VIEW3D.container.remove( $scope.wx_mesh )};
      if($scope.dem_mesh){VIEW3D.container.remove( $scope.dem_mesh )};
      var params = angular.copy( $location.search());
      params.BBOX = $scope.bboxChoice;
      //console.log('PATH', $location.path());
      //console.log('SEARCH', params);
      $scope.getDEM( $location.path(), params );
      $scope.getCoverage( $location.path(), params );
    })

    $scope.$watchGroup(['light_x','light_y','light_z'], function(){
      VIEW3D.directionalLight.position.set(Number($scope.light_x), Number($scope.light_y), Number($scope.light_z));
      //VIEW3D.water.sunDirection = VIEW3D.directionalLight.position.normalize();
    });

    $scope.$watchGroup(['camera_x','camera_y','camera_z'], function(){
      VIEW3D.camera.position.set(Number($scope.camera_x), Number($scope.camera_y), Number($scope.camera_z));
    });

    $scope.getCameraPosition = function() {
      $scope.position = VIEW3D.camera.position;
    }

    $scope.rebuildWx = function() {
      //VIEW3D.container.remove( $scope.wx_mesh );
      //$scope.buildWx( $scope.rawdata, $scope.dem_width, $scope.dem_height );
    }

    $scope.saveCanvas = function() {
      var tmpcanv = document.createElement('canvas');
      var src_aspect = VIEW3D.mycanvas.width / VIEW3D.mycanvas.height;
      tmpcanv.width = 128;
      tmpcanv.height = 128;
      max_x = tmpcanv.height * src_aspect;
      min_x = (tmpcanv.width - max_x) * 0.5;
      max_y = tmpcanv.height;
      min_y = 0;
      tmpcanv.getContext('2d').drawImage(VIEW3D.mycanvas, min_x, min_y, max_x, max_y);
      //window.open(tmpcanv.toDataURL('image/png'));
      $scope.thumb0=tmpcanv.toDataURL('image/png');

    }

    $scope.setCamera = function(n) {
      console.log('camera', VIEW3D.camera);
      VIEW3D.controls.reset();
      VIEW3D.camera.position.set(0, 2000, 2000);
    }

    // If you'd rather not use the followimg HTML5 canvas gradient trick,
    // you can create palettes like this.
    /*
    $scope.paletteFn = function( v ){
    var rgba = {'r':0,'g':0,'b':0,'a':0};
    if (v < 1 ){
    rgba.r = 15;
    rgba.g = 15;
    rgba.b = 255;
    rgba.a = 0;
  }else{
  rgba.r = (v < 500) ? v/3 : 160;
  rgba.g = (rgba.r < 100) ? 200-rgba.r: 128;
  rgba.b = 0;
  rgba.a = 255;
}
return rgba;
}
*/

$scope.DemPaletteFn = function() {
  var canvas = document.createElement( 'canvas' );
  canvas.width = 256;
  canvas.height = 1;

  var context = canvas.getContext( '2d' );
  var grad = context.createLinearGradient(0,0,256,0);
  grad.addColorStop(0, "#108010");
  grad.addColorStop(.6, "#606010");
  grad.addColorStop(1, "#906030");

  context.fillStyle = grad;
  context.fillRect(0, 0, 256, 1);

  var palette = [], r, g, b, a;
  var image = context.getImageData( 0, 0, canvas.width, 1 );
  for ( var i = 0; i < image.data.length; i += 4 ) {
    r = image.data[ i ];
    g = image.data[ i + 1 ];
    b = image.data[ i + 2 ];
    a = image.data[ i + 3 ];
    palette.push({r:r,g:g,b:b,a:a});
  }
  var fn = function(v){
    v = ~~v;
    if(v < 1){
      return {r:0,g:0,b:0,a:0};
    }else{
      v = (v>255) ? 255 : v;
      return palette[v];
    }
  };
  return fn;
}

$scope.generateTexture = function(data, dem_width, dem_height ) {
  var palfn = $scope.DemPaletteFn();
  var canvas = document.createElement( 'canvas' );
  canvas.width = 600;
  canvas.height = 600;

  var context = canvas.getContext( '2d' );
  var image = context.getImageData( 0, 0, canvas.width, canvas.height );

  // N.B. image.data is a Uint8ClampedArray. See http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/
  var x = 0, y = 0, v;
  for ( var i = 0, j = 0, l = image.data.length; i < l; i += 4, j ++ ) {
    x = j % canvas.width;
    y = x == 0 ? y + 1 : y;
    // ~~ faster that .toFixed(0)
    var xi = ~~(dem_width/canvas.width  * x);
    var yi = ~~(dem_height/canvas.height * y);
    v = data[(yi % dem_height )* dem_width + (xi % dem_width)];
    var rgba = palfn( v * 0.5 );
    image.data[i] = rgba.r;
    image.data[i+1] = rgba.g;
    image.data[i+2] = rgba.b;
    image.data[i+3] = rgba.a;
  }
  context.putImageData( image, 0, 0 );
  return canvas;
}

$scope.WxPaletteFn = function() {
  var canvas = document.createElement( 'canvas' );
  canvas.width = 255;
  canvas.height = 1;

  var context = canvas.getContext( '2d' );
  var grad = context.createLinearGradient(0,0,256,0);
  grad.addColorStop(0, $scope.paletteColour0);
  grad.addColorStop(1, $scope.paletteColour1);
  context.fillStyle = grad;
  context.fillRect(0, 0, 255, 1);

  var palette = [{r:0,g:0,b:0,a:0}], r, g, b, a;
  var image = context.getImageData( 0, 0, canvas.width, 1 );
  for ( var i = 0; i < image.data.length; i += 4 ) {
    r = image.data[ i ];
    g = image.data[ i + 1 ];
    b = image.data[ i + 2 ];
    a = image.data[ i + 3 ];
    palette.push({r:r,g:g,b:b,a:a});
  }
  var fn = function(v){
    v = ~~v;
    v = v > 255 ? 255 : v;
    return palette[v];
  };
  return fn;
}

$scope.generateCloudTexture = function(data, width, height) {
  var palfn = $scope.WxPaletteFn();
  var canvas = document.createElement( 'canvas' );
  canvas.width = 600;
  canvas.height = 600;
  var context = canvas.getContext( '2d' );
  var image = context.getImageData( 0, 0, canvas.width, canvas.height);

  // N.B. image.data is a Uint8ClampedArray. See http://www.html5rocks.com/en/tutorials/webgl/typed_arrays/
  var x = 0, y = 0, v;
  var w_ratio = width/canvas.width;
  var h_ratio = height/canvas.height;
  for ( var i = 0, j = 0, l = image.data.length; i < l; i += 4, j ++ ) {
    x = j % canvas.width;
    y = x == 0 ? y + 1 : y;
    // The ~~ operator removes decimal part of float. Much quicker than .toFixed(0)
    var xi = ~~(w_ratio  * x);
    var yi = ~~(h_ratio * y);
    v = data[(yi % height )* width + (xi % width)];
    var rgba = palfn( v * 255/100 );
    image.data[i] = rgba.r;
    image.data[i+1] = rgba.g;
    image.data[i+2] = rgba.b;
    image.data[i+3] = rgba.a;
  }
  context.putImageData( image, 0, 0 );
  return canvas;
}

$scope.test = function( n ){
  VIEW3D.controls.enabled = false;
  console.log('test', n);
  $scope.overlayStyle = {'z-index':-1};
};

$scope.controlsActive = function( enabled ){
  VIEW3D.controls.enabled = enabled;
  $scope.position = VIEW3D.camera.position;
  $scope.camera_x = $scope.position.x;
  $scope.camera_y = $scope.position.y;
  $scope.camera_z = $scope.position.z;

};

$scope.defaultDEMParams = {
  request: "GetCoverage",
  crs: "EPSG:4326",
  bbox: $scope.bboxChoice,
  width: $scope.dem_width,
  height: $scope.dem_height,
  format: "AAIGrid_INT16"
};
$scope.defaultWxParams = {
  REQUEST: "GetCoverage",
  SERVICE: "WCS",
  VERSION: "1.0",
  CRS: "EPSG:4326",
  BBOX: $scope.bboxChoice,
  WIDTH: $scope.dem_width,
  HEIGHT: $scope.dem_height,
};

$scope.distns = 0;
$scope.distew = 0;

$scope.location = $location;

$scope.coverage = {};

// Should we update the data selection, etc. if the search changes?
// Probably, yes.
$scope.$watch('location.search()', function(){
  //console.log('PATH', $location.path());
  //console.log('SEARCH',  $location.search());
  //$scope.getDEM( $location.path(), $location.search() );
  //$scope.getCoverage( $location.path(), $location.search() );
});


$scope.buildLand = function( data ){
  $scope.landCanvas
  var texture = new THREE.Texture( $scope.landCanvas );
  //var texture = new THREE.Texture( $scope.generateTexture(data, $scope.dem_width, $scope.dem_height) );
  texture.needsUpdate = true;
  var material = new THREE.MeshPhongMaterial({
    map: texture, transparent: true, specular: 0x444444, shininess: 10,
    bumpMap: texture });
    // (tranparent = true) allows sea to be seen.  Perhaps sea level should be dropped.

    var geometry = new THREE.PlaneGeometry(2000, 2000, $scope.dem_width-1, $scope.dem_height-1);
    var scale_fac = 2000.0 /  ($scope.distns * 1000.0);
    for(i = 0; i < data.length; i++){
      var ht = data[i];
      if(ht < 0){ht = 0;}
      geometry.vertices[i].z = (ht * 10.0 * scale_fac) + 5.0;
    }
    var bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.fromGeometry( geometry );
    geometry = null;
    var mesh = new THREE.Mesh(bufferGeometry, material);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.position.z = 0;
    mesh.rotation.x = - Math.PI * 0.5;
    //THREE.GeometryUtils.merge(geometry, mesh);
    $scope.dem_mesh = mesh;
    VIEW3D.container.add(mesh);
  }

  $scope.buildWx = function( dest, data, width, height, add, mult, canv ){
    //var texture = new THREE.Texture( $scope.generateCloudTexture(data, width, height) )
    var texture = new THREE.Texture( canv )
    texture.needsUpdate = true
    var material = new THREE.MeshPhongMaterial({side: THREE.DoubleSide,
      map: texture, transparent: true,
      specular: 0xffffff,
      shininess: Number($scope.shininess)})
      //,bumpMap: texture})

      var geometry = new THREE.PlaneGeometry(2000, 2000, width-1, height-1)
      var scale_fac = 1.0 / $scope.distns
      console.log("BUILDING WITH", add)
      for(i = 0; i < data.length; i++){
        geometry.vertices[i].z = (data[i] * mult * scale_fac) + add
      }
      var bufferGeometry = new THREE.BufferGeometry()
      bufferGeometry.fromGeometry( geometry )
      geometry = null
      var mesh = new THREE.Mesh(bufferGeometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.position.z = 0
      mesh.rotation.x = - Math.PI * 0.5
      dest.add(mesh)
    }

    $scope.getDEM = function( path, params ){
      var requestParams = angular.copy( $scope.defaultDEMParams );
      if(params.WIDTH){ requestParams.width=params.WIDTH; }
      if(params.HEIGHT){ requestParams.height=params.HEIGHT; }
      if(params.BBOX){ requestParams.bbox=params.BBOX; }

      $scope.dem_width = requestParams.width;
      $scope.dem_height = requestParams.height;

      var bbox = requestParams['bbox'].split(',');
      var bb = {'w':Number(bbox[0]),'s':Number(bbox[1]),'e':Number(bbox[2]),'n':Number(bbox[3])};
      var storageName = requestParams['bbox'] + '_' + requestParams['width'] + '_' + requestParams['height']

      // Find mid point of each edge of the bounding box.
      var nmid = new LatLon(bb.n, (bb.w + bb.e)*0.5);
      var smid = new LatLon(bb.s, (bb.w + bb.e)*0.5);
      var wmid = new LatLon((bb.n + bb.s)*0.5, bb.w);
      var emid = new LatLon((bb.n + bb.s)*0.5, bb.e);
      $scope.distns = nmid.distanceTo(smid);
      $scope.distew = wmid.distanceTo(emid);

      // load dem png
      var imageObj = new Image();
      $scope.landCanvas  = document.createElement( 'canvas' );
      imageObj.onload = function(){
        $scope.landCanvas.width = imageObj.width;
        $scope.landCanvas.height = imageObj.height;
        var context = $scope.landCanvas.getContext( '2d' );
        context.drawImage( imageObj, 0, 0 );
      };
      imageObj.src = $scope.data_prefix + '/uk_hi.png';


      // DEM data unlikely to change so save to local storage.
      // Also source is external (NASA) provider, so be responsible.
      // To clear type 'localStorage.clear()' in console.
      //if(localStorage[storageName]){
      if(0){
        console.log('LOADING FROM LOCAL STORAGE', storageName);
        $scope.demdata = JSON.parse(localStorage[storageName]);
        $scope.buildLand( $scope.demdata );
      }else{
        //$http.get($scope.demProviderUrl, {params:requestParams, responseType: "arraybuffer"}  ).
        $http.get($scope.data_prefix + '/dem.bin', {responseType: "arraybuffer"}).
        success(function(data, status, headers, config) {
          $scope.demdata = Array.prototype.slice.call(new Int16Array(data));
          localStorage[storageName] = JSON.stringify($scope.demdata);
          $scope.buildLand( $scope.demdata );
        }).
        error(function(data, status, headers, config) {
          console.log(status, data);
        });
      }
    };

    $scope.fetchBuild = function( item, dest, done){
      $http.get($scope.data_prefix + item.u, { responseType: "arraybuffer"}  ).
      success(function(data, status, headers, config) {
        var rawdata = Array.prototype.slice.call(new Float32Array(data));
        //var rawdata = Array.prototype.slice.call(new Int16Array(data));
        //var rawdata = Array.prototype.slice.call(new Uint8Array(data));
        $scope.buildWx( dest, rawdata, $scope.dem_width, $scope.dem_height, item.a, Number($scope.wx_mult) );
        done();
      }).
      error(function(data, status, headers, config) {
        alert( 'Unable to load sample cloud data. Get help.' );
        console.log(status, data);
      });
    };

    $scope.ptcldIdx = function( n ){
        // The Point Cloud PNG has a grid of 5 x 6 tiles
        // after 30 the tiles are reused switching from R to
        // G channel, and finally B.
        var ptcld = {}
        ptcld.xi = n % 6
        ptcld.yi = (~~(n / 6)) % 5
        ptcld.ci = ~~(n / 30)
        return ptcld
    }

    $scope.loadwxpng = function( level ){

      // get 70 level png
      var imageObj = new Image()
      var ptcldcanv  = document.createElement( 'canvas' )
      imageObj.onload = function(){
        ptcldcanv.width = imageObj.width
        ptcldcanv.height = imageObj.height
        var context = ptcldcanv.getContext( '2d' )
        context.drawImage( imageObj, 0, 0 )
        console.log("HAZ DATA " + ptcldcanv.width)

        ptcld = $scope.ptcldIdx( level )
        console.log(ptcld)
        var x_0 = 623 * ptcld.xi
        var y_0 = ptcldcanv.height - (812 * (ptcld.yi + 1))

        var slicecanv = document.createElement('canvas')
        slicecanv.width = 4096 //2048
        slicecanv.height = 4096 //2048
        var ctx = slicecanv.getContext('2d')
        ctx.drawImage(ptcldcanv,
          x_0, y_0, 623, 812,
          0, 0, slicecanv.width, slicecanv.height)
        var ctx = slicecanv.getContext('2d')
        var pixels = ctx.getImageData(0,0,slicecanv.width,slicecanv.height)
        for(var i=0; i<pixels.data.length; i += 4){
          var v = pixels.data[i+ptcld.ci]
          pixels.data[i+0] = v
          pixels.data[i+1] = v
          pixels.data[i+2] = v
          pixels.data[i+3] = v * 0.8
        }
        ctx.putImageData( pixels, 0, 0 )

        var smlcanv = document.createElement('canvas')
        smlcanv.width = $scope.dem_width
        smlcanv.height = $scope.dem_height
        // Reduce resolution and calc heights
        ctx = smlcanv.getContext('2d')
        ctx.drawImage(slicecanv,
          0, 0, 1024, 1024,
          0, 0, smlcanv.width, smlcanv.height)
        pixels = ctx.getImageData(0,0,smlcanv.width,smlcanv.height)
        var floatdata = new Float32Array(pixels.data.length/4)
        for(var i=0; i<pixels.data.length; i += 4){
          floatdata[i/4] =  (100.0/255.0) * pixels.data[i+0]
        }

        var rawdata = Array.prototype.slice.call(floatdata)
        $scope.buildWx( $scope.wx_mesh, rawdata, $scope.dem_width,
          $scope.dem_height,
          (level * 5) + 10, Number($scope.wx_mult) , slicecanv)
          //$scope.saveCanvas()
        $scope.wx_mesh.updateMatrix()
        VIEW3D.container.add( $scope.wx_mesh )
      }
      imageObj.src = $scope.data_prefix + '/datashadows.png'



    }

    $scope.getCoverage = function( path, params ){

      $scope.wx_mesh = new THREE.Object3D()

      $scope.loadwxpng( 0 )
      $scope.loadwxpng( 10 )
      $scope.loadwxpng( 20 )
      $scope.loadwxpng( 30 )
      $scope.loadwxpng( 40 )
    }
  });
