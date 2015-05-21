var socket = io();
var socketroom = '';

socket.emit('openroom', true);

socket.on('camera-pos', function(msg){
  VIEW3D.camera.position.x = msg.x;
  VIEW3D.camera.position.y = msg.y;
  VIEW3D.camera.position.z = msg.z;
});

socket.on('x-delta', function(msg){
  VIEW3D.camera.position.x = VIEW3D.camera.position.x + parseInt(msg);
  socket.emit('x', VIEW3D.camera.position.x);
});
socket.on('y-delta', function(msg){
  VIEW3D.camera.position.y = VIEW3D.camera.position.y + parseInt(msg);
  socket.emit('y', VIEW3D.camera.position.y);
});
socket.on('z-delta', function(msg){
  VIEW3D.camera.position.z = VIEW3D.camera.position.z + parseInt(msg);
  socket.emit('z', VIEW3D.camera.position.z);
});
socket.on('x', function(msg){
  VIEW3D.camera.position.x = parseInt(msg);
});
socket.on('y', function(msg){
  VIEW3D.camera.position.y = parseInt(msg);
});
socket.on('z', function(msg){
  VIEW3D.camera.position.z = parseInt(msg);
});
socket.on('reset', function(msg){
  VIEW3D.camera.position.x = 0;
  VIEW3D.camera.position.y = 2000;
  VIEW3D.camera.position.z = 2000;

  socket.emit('x', VIEW3D.camera.position.x);
  socket.emit('y', VIEW3D.camera.position.y);
  socket.emit('z', VIEW3D.camera.position.z);
});

socket.on('camera-ang', function(msg){
  console.log(VIEW3D.camera.rotation.x);
  VIEW3D.camera.rotation._x = msg._x;
  console.log(VIEW3D.camera.rotation.x);
  VIEW3D.camera.rotation._y = msg._y;
  VIEW3D.camera.rotation._z = msg._z;
});

socket.on('room', function(msg){
  socketroom = msg;
  console.log("Joined room " + socketroom);
});
