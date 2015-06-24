// view3d.js
// A 3D viewer for UK weather data from a modified WCS server.
// VERY EXPERIMENTAL. DATA COULD BE WRONG, UNAVAILABLE, ETC.
// MOST DEFINITELY NOT FOR OPERATIONAL USE!!
//
// Michael Saunby
//
//

var LAND = {
  setSeaColour: function setSeaColour( canvas, image, colour ){
    var context = canvas.getContext( '2d' )
    context.drawImage( image, 0, 0 )
    var imgdata = context.getImageData(0,0,canvas.width,canvas.height)
    var pixels = imgdata.data
    for(var i=0; i<pixels.length; i+=4){
      if( pixels[i+3] == 0){
        pixels[i] = colour.r
        pixels[i+1] = colour.g
        pixels[i+2] = colour.b
        pixels[i+3] = 0xff
      }
    }
    context.putImageData( imgdata, 0, 0 )
  },

  buildLand: function buildLand( data, width, height, scale_fac, canvas ){
    var texture = new THREE.Texture( canvas )
    texture.needsUpdate = true
    var material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide,
      map: texture, transparent: false, specular: 0xffffff, shininess: 10})
      // could add bumpmap

      var geometry = new THREE.PlaneGeometry(2000, 2000, width-1, height-1)

      for(i = 0; i < data.length; i++){
        var ht = data[i]
        if(ht < 0){ht = 0}
        geometry.vertices[i].z = (ht * 10.0 * scale_fac) + 5.0
      }
      var bufferGeometry = new THREE.BufferGeometry()
      bufferGeometry.fromGeometry( geometry )
      geometry = null
      var mesh = new THREE.Mesh(bufferGeometry, material)
      mesh.castShadow = false
      mesh.receiveShadow = true
      mesh.position.z = 0
      mesh.rotation.x = - Math.PI * 0.5
      return mesh
    }
  }

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
    navigate: false,
    video: null,
    video_canv: null,
    video_canv_context: null,
    update_mesh: null,
    wx_layers: null,
    dst_ctx: null,
    dst_canv: null,
    init_video : function init_video()
    {
      this.video_canv  = document.createElement( 'canvas' )
      var file = "cloud_frac2_623_812_70_4096_4096.ogv"

      this.video = document.createElement( 'video' )
      this.video.loop = true
      this.video.id = 'video'
      this.video.type = ' video/ogg; codecs="theora, vorbis" '
      this.video.src = file
      this.video.crossOrigin = "Anonymous"
      this.video.autoplay = true
      this.video.load() // must call after setting/changing source
      this.video.playbackRate = 1.0
      this.video.addEventListener("loadedmetadata", function () {
        //alert( 'video metadata loaded' )
        var o = VIEW3D
        o.video_canv.width = o.video.videoWidth
        o.video_canv.height = o.video.videoHeight
        console.log("vid width", o.video_canv.width)
      })
      this.video.addEventListener('loadeddata', function() {
        VIEW3D.video.play()
        VIEW3D.navigate = false


      })
      this.video_canv_context = this.video_canv.getContext("2d")
    },

    buildWxLayer: function buildWxLayer( width, height, vert ){
      console.log('buildWxLayer')
      var canv = document.createElement('canvas')
      canv.width = 1024 //2048
      canv.height = 1024 //2048
      var texture = new THREE.Texture( canv )
      texture.needsUpdate = true
      var material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide, map: texture, transparent: true, specular: 0xffffff, shininess: 90})

        var geom =  new THREE.PlaneGeometry(2000, 2000)
        var mesh = new THREE.Mesh(geom, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.position.y = (vert * 10)
        mesh.rotation.x = - Math.PI * 0.5
        return {mesh:mesh, canvas:canv, vertical:vert}
      },

      video_extract_layers : function video_extract_layers(){
        var ptcldIdx = function( n ){
          // The Point Cloud PNG has a grid of 5 x 6 tiles
          // after 30 the tiles are reused switching from R to
          // G channel, and finally B.
          var ptcld = {}
          ptcld.xi = n % 6
          ptcld.yi = (~~(n / 6)) % 5
          ptcld.ci = ~~(n / 30)
          return ptcld
        }
        var getLayer = function ( ptcld, src, srcHeight, dstcanv, ctx ){

          var x_0 = 623 * ptcld.xi
          var y_0 = srcHeight - (812 * (ptcld.yi + 1))
          ctx.drawImage(src,
            x_0, y_0, 623, 812,
            0, 0, dstcanv.width, dstcanv.height)

            var imgdata = ctx.getImageData(0,0,dstcanv.width,dstcanv.height)
            var pixels = imgdata.data
            var buf = new ArrayBuffer(imgdata.data.length)
            var buf8 = new Uint8ClampedArray(buf)
            var buf32 = new Uint32Array(buf)
            buf8.set(imgdata.data)
            /*
            for(var i=0; i<buf8.length; i += 4){
            var v = buf8[i+ptcld.ci]
            buf8[i+0] = v
            buf8[i+1] = v
            buf8[i+2] = v
            buf8[i+3] = v * 0.4
          }
          */
          for(var i=0; i<buf32.length; i++){
            var v = (buf32[i] >> (ptcld.ci*8)) & 0xff
            buf32[i] = ((v*0.4) << 24) | // a
            (v << 16) | // b
            (v << 8) | // g
            v // r

          }
          imgdata.data.set(buf8)
          ctx.putImageData( imgdata, 0, 0 )

        }
        for(var l=0; l<this.wx_layers.length; l++){
          var lyr = this.wx_layers[l]
          var pt = ptcldIdx(lyr.vertical)
          getLayer( pt, this.video, this.video.videoHeight, lyr.canvas, lyr.context )
        }
        for(var l=0; l<this.wx_layers.length; l++){
          var lyr = this.wx_layers[l]
          lyr.mesh.material.map.needsUpdate = true
        }
      },
      init_scene : function init_scene(){
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(55.0,
          window.innerWidth / window.innerHeight, 0.5, 3000000);
          this.camera.position.set(130, 2000, 1300);
          this.camera.lookAt(new THREE.Vector3(0, 0, 0));

          this.controls = new THREE.TrackballControls(this.camera);
          this.controls.addEventListener( 'change', function(){
            // VIEW3D.fps=30
            VIEW3D.video.pause()
            VIEW3D.navigate = true
            setTimeout( function() {
              VIEW3D.navigate = false
            }, 2000 )
            setTimeout( function() {
              if(VIEW3D.navigate == false){
                VIEW3D.video.play()
              }
            }, 3000 )

          })

          this.mycanvas = document.createElement('canvas');
          this.renderer = new THREE.WebGLRenderer({canvas: this.mycanvas,
            preserveDrawingBuffer   : true,
            alpha: true});
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setClearColor( 0x6666ff, 1);


            var light = new THREE.AmbientLight( 0xaaaaaa ); // white light
            this.scene.add( light )
            //this.directionalLight = new THREE.DirectionalLight(0xffffdd, 1);
            //this.directionalLight.position.set(200, 800, 1500);
            //this.scene.add(this.directionalLight);

            var uniforms1 = {
              time: { type: "f", value: 1.0 },
              resolution: { type: "v2", value: new THREE.Vector2() }
            }

            var attributes = {
              displacement: {
                type: 'f', // a float
                value: [] // an empty array
              }
            }

            this.container = new THREE.Object3D()
            this.scene.add(this.container)
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
            if(this.navigate == false){
              if ( this.video.readyState === this.video.HAVE_ENOUGH_DATA)
              {
                this.video_extract_layers()
              }
            }
            this.camera_position = this.camera.position
            this.controls.update()
            this.display()
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

            //if(this.fps>5){this.fps--;}
            VIEW3D.update();
          }

        };

        VIEW3D.init_video()
        VIEW3D.init_scene()


        angular.module('viewer', []).controller("MainController", function($scope, $http, $location){

          $scope.dem_width = 256;
          $scope.dem_height = 256;
          // Don't use huge numbers for width or height.  300x300 is just fine.
          // For a start, localStorage will fail with large data files as it's stored as text!!
          //
          // Issuing localStorage.clear() in console is useful too :-)

          $scope.position = null; // camera position

          // The OpenShift application allows cross origin requests (for now).
          $scope.demProviderUrl = "http://python-wetoffice.rhcloud.com/dembin";
          //$scope.wxProviderUrl = "http://python-wetoffice.rhcloud.com/capbin";
          // To use your own (local) server for data replace with these -
          //$scope.demProviderUrl = "/dembin";
          //$scope.wxProviderUrl = "/capbin";

          $scope.cld_low = "cld_low.bin";
          $scope.cld_med = "cld_med.bin";
          $scope.cld_hig = "cld_hig.bin";

          $scope.data_prefix = "/utils/";


          //$scope.bboxes = {"UK":"-14,47.5,7,61", "Exeter":"-4.93266,49.31965,-2.12066,52.13165"};
          $scope.bboxes = {"UK":"-12,50,3.5,59", "Exeter":"-4.93266,49.31965,-2.12066,52.13165"};
          $scope.bboxChoice = $scope.bboxes["UK"]; // watched
          $scope.paletteColour0 =  "rgba(255,255,255,0)";
          $scope.paletteColour1 =  "rgba(255,255,255,0.8)";
          $scope.shininess = "90";

          $scope.wx_mult = 20;
          $scope.wx_add = 50;
          $scope.wx_mesh = null;

          $scope.light_x = -1000;
          $scope.light_y = 1500;
          $scope.light_z = -900;

          $scope.camera_x = 0;
          $scope.camera_y = 2000;
          $scope.camera_z = 2000;

          //$scope.rawdata = null

          $scope.$watch('bboxChoice', function(){
            if($scope.wx_mesh){VIEW3D.container.remove( $scope.wx_mesh )};
            //if($scope.dem_mesh){VIEW3D.container.remove( $scope.dem_mesh )};
            var params = angular.copy( $location.search());
            params.BBOX = $scope.bboxChoice;
            //console.log('PATH', $location.path());
            //console.log('SEARCH', params);
            $scope.getDEM( $location.path(), params );
            $scope.getCoverage( $location.path(), params );
          })

          $scope.$watchGroup(['light_x','light_y','light_z'], function(){
            //VIEW3D.directionalLight.position.set(Number($scope.light_x), Number($scope.light_y), Number($scope.light_z));
          });

          $scope.$watchGroup(['camera_x','camera_y','camera_z'], function(){
            VIEW3D.camera.position.set(Number($scope.camera_x), Number($scope.camera_y), Number($scope.camera_z));
          });

          $scope.getCameraPosition = function() {
            $scope.position = VIEW3D.camera.position
          }

          $scope.rebuildWx = function() {

          }

          $scope.saveCanvas = function() {
            var tmpcanv = document.createElement('canvas')
            var src_aspect = VIEW3D.mycanvas.width / VIEW3D.mycanvas.height
            tmpcanv.width = 128
            tmpcanv.height = 128
            max_x = tmpcanv.height * src_aspect
            min_x = (tmpcanv.width - max_x) * 0.5
            max_y = tmpcanv.height
            min_y = 0
            tmpcanv.getContext('2d').drawImage(VIEW3D.mycanvas, min_x, min_y, max_x, max_y)
            $scope.thumb0=tmpcanv.toDataURL('image/png')

          }

          $scope.setCamera = function(n) {
            console.log('camera', VIEW3D.camera);
            VIEW3D.controls.reset();
            VIEW3D.camera.position.set(0, 2000, 2000);
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
            var imageObj = new Image()
            var landCanvas  = document.createElement( 'canvas' )
            var demdata = null
            var scale_fac = 2000.0 /  ($scope.distns * 1000.0)
            imageObj.onload = function(){
              landCanvas.width = imageObj.width
              landCanvas.height = imageObj.height
              LAND.setSeaColour( landCanvas, imageObj, {r:0x11,g:0x44,b:0xaa} )
              // DEM data isn't going to change so save to local storage.
              // Also source is external (not Met Office) provider, so be responsible.
              if(localStorage[storageName]){
                console.log('LOADING FROM LOCAL STORAGE', storageName)
                console.log('To clear type localStorage.clear() in console')
                demdata = JSON.parse(localStorage[storageName])
                VIEW3D.container.add(LAND.buildLand( demdata, $scope.dem_width, $scope.dem_height, scale_fac, landCanvas))
              }else{
                $http.get($scope.demProviderUrl, {params:requestParams, responseType: "arraybuffer"}  ).
                success(function(data, status, headers, config) {
                  demdata = Array.prototype.slice.call(new Int16Array(data))
                  localStorage[storageName] = JSON.stringify(demdata)
                  VIEW3D.container.add(LAND.buildLand( demdata, $scope.dem_width, $scope.dem_height, scale_fac, landCanvas))
                }).
                error(function(data, status, headers, config) {
                  console.log(status, data)
                });
              }
            }
            imageObj.src = '/utils/uk_hi.png'

          }

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
              alert( 'Unable to load sample cloud data. Get help.' )
              console.log(status, data)
            })
          }

          $scope.getCoverage = function( path, params ){

            $scope.wx_mesh = new THREE.Object3D()
            VIEW3D.container.add( $scope.wx_mesh )
            VIEW3D.wx_layers = []

            var verts = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
            for(var v=0; v<verts.length; v++ ){
              //var lyr = VIEW3D.buildWxLayer( 1024, 1024, verts[v])
              var lyr = VIEW3D.buildWxLayer( 256, 256, verts[v])
              lyr.context = lyr.canvas.getContext('2d')
              VIEW3D.wx_layers.push( lyr )
              $scope.wx_mesh.add(lyr.mesh)
              $scope.wx_mesh.updateMatrix()
            }
          }
        })
