var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('*', function(req, res){
  res.sendFile(__dirname + req.url);
});

io.on('connection', function(socket){
  console.log('user ' + socket.id + ' connected');
  socket.on('disconnect', function(){
    console.log('user ' + socket.id + ' disconnected');
  });
  socket.on('camera-pos', function(msg){
    console.log(msg.x);
    io.emit('camera-pos', msg);
  });
  socket.on('camera-ang', function(msg){
    io.emit('camera-ang', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
