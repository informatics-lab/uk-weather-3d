document.getElementById('webgl').appendChild(VIEW3D.renderer.domElement);
var stats = new Stats();
//document.getElementById('info').appendChild( stats.domElement );
window.addEventListener( 'resize', function(){
  VIEW3D.resize(window.innerWidth, window.innerHeight)}, false );

mainLoop();
