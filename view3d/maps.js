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

  buildLand: function buildLand( imageObj, data, params ){

    requestParams = this.demParams(params)
    width = requestParams.width
    height  = requestParams.height
    var bbox = requestParams['bbox'].split(',')
    var bb = {'w':Number(bbox[0]),'s':Number(bbox[1]),'e':Number(bbox[2]),'n':Number(bbox[3])}

    // Find mid point of each edge of the bounding box.
    var nmid = new LatLon(bb.n, (bb.w + bb.e)*0.5)
    var smid = new LatLon(bb.s, (bb.w + bb.e)*0.5)
    var wmid = new LatLon((bb.n + bb.s)*0.5, bb.w)
    var emid = new LatLon((bb.n + bb.s)*0.5, bb.e)
    var distns = nmid.distanceTo(smid)
    var distew = wmid.distanceTo(emid)

    var scale_fac = 2000.0 /  (distns * 1000.0)

    var canvas  = document.createElement( 'canvas' )
    canvas.width = imageObj.width
    canvas.height = imageObj.height
    this.setSeaColour( canvas, imageObj, {r:0x11,g:0x44,b:0xaa} )

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
    },

    defaultParams: {
      request: "GetCoverage",
      crs: "EPSG:4326",
      //bbox: $scope.bboxChoice,
      //width: $scope.dem_width,
      //height: $scope.dem_height,
      width: 256,
      height: 256,
      format: "AAIGrid_INT16"
    },

    demProviderUrl: "http://python-wetoffice.rhcloud.com/dembin",
    demProviderPng: "http://python-wetoffice.rhcloud.com/demcanv?bbox=-12,50,3.5,59&srs=EPSG:4326",

    pngParamsStr: function( params ){
      var p = {}
      var k
      for(k in this.defaultParams){
        p[k] = this.defaultParams[k]
      }
      for(k in params){
        p[k] = params[k]
      }
      return "?bbox="+p.bbox+"&srs="+p.crs+"&width="+2048+"&height="+2048
    },

    demParams: function demParams( params ){
      var p = {}
      var k
      for(k in this.defaultParams){
        p[k] = this.defaultParams[k]
      }
      for(k in params){
        p[k] = params[k]
      }
      return p
    }
  }
