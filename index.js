var express = require('express');
var app = express();
var server = require('http').createServer(app);

var totalConnections = 0;
var players = {};


var fakeplayer = {
  "id": "fakeplayer",
  "position": {"x":"2.0","y":"2.0","z":"3.0","playerId":"fakeplayer"},
  "direction": {"x":"2.0","y":"2.0","z":"3.0","yaw": "0.0","pitch":"0.0"}
}
players["fakeplayer"] = fakeplayer;
var testCount = 0;

function fakePlayerPosTest(test) {
  switch(test) {
    case 0: return {"x":"2.0","y":"2.0","z":"2.0","playerId":"fakeplayer"};
    case 1: return {"x":"3.0","y":"2.0","z":"3.0","playerId":"fakeplayer"};
    case 2: return {"x":"4.0","y":"2.0","z":"4.0","playerId":"fakeplayer"};
    case 3: return {"x":"5.0","y":"2.0","z":"5.0","playerId":"fakeplayer"};
    default: return {"x":"2.0","y":"2.0","z":"2.0","playerId":"fakeplayer"};
  }
}

function fakePlayerDirTest(test) {
  switch(test) {
    case 0: return {"x":"1.0","y":"0.0","z":"0.0","yaw": "0.0","pitch":"0.0"};
    case 1: return {"x":"1.0","y":"0.0","z":"0.0","yaw": "90.0","pitch":"0.0"};
    case 2: return {"x":"1.0","y":"0.0","z":"0.0","yaw": "180.0","pitch":"0.0"};
    case 3: return {"x":"1.0","y":"0.0","z":"0.0","yaw": "270.0","pitch":"0.0"};
    default: return {"x":"1.0","y":"0.0","z":"0.0","yaw": "0.0","pitch":"0.0"};
  }
}

function fakePlayerBulletTest(test) {
  switch(test) {
    case 0: return {"2":{"x":"2.0","y":"3.0","z":"2.0"}};
    case 1: return {"2":{"x":"2.0","y":"3.0","z":"3.0"}};
    case 2: return {"2":{"x":"2.0","y":"3.0","z":"4.0"}};
    case 3: return {"2":{"x":"2.0","y":"3.0","z":"3.0"}};
    default: return {"2":{"x":"2.0","y":"3.0","z":"2.0"}};
  }
}

function addConnections(n) {
  totalConnections += n;
}

var io = require('socket.io')(server,{
  cors: {
    origin: ["http://localhost:3001"],
    methods: ["GET", "POST"],
	  credentials: true
  }
});
var port = process.env.PORT || 3001;

var bodyParser = require('body-parser');
app.use(bodyParser.json());       
app.use(bodyParser.urlencoded({
  extended: true
})); 

app.io = io;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});


app.get('/', function(req, res){
  console.log('opengl-node');
  //io.emit('root', null);
  res.send('opengl-node');
});

app.get('/yourPosition', function(req, res){
    console.log("yourPosition");
    io.emit('yourPosition', null);
    res.send('yourPosition');
});


io.on('connection', (socket) => {
    addConnections(1);
    console.log("Connection " + totalConnections);
    console.log(socket.id);
    players[socket.id] = {
      "id": socket.id,
      "position": null
    }

    socket.emit("playerId", socket.id);
    io.emit('totalConnections', totalConnections);

    socket.on('disconnect', () => {
        players[socket.id] = null
        delete players[socket.id];
        addConnections(-1);
        console.log("Disconnection " + totalConnections);
        io.emit('totalConnections', totalConnections);
    });

    socket.on('newPosition', (data) => {
      console.log("newPosition");
      //console.log(data)
      
      //console.log(dataObject)

      // TODO check timestamp and if more than 5 secs reject
      players[socket.id]["position"] = data;

      var dataFixed = data.replace(/"{/g, "{");
      dataFixed = dataFixed.replace(/}"/g, "}");
      const dataObject = JSON.parse(dataFixed);

      var startTime = parseInt(dataObject.time);
      var endTime = Date.now();
      var ping = (endTime - startTime);

      console.log(ping.toString() + " ms");
    });

    socket.on('newDirection', (data) => {
      console.log("newDirection");
      // TODO check timestamp and if more than 5 secs reject
      

      var dataFixed = data.replace(/"{/g, "{");
      dataFixed = dataFixed.replace(/}"/g, "}");
      const dataObject = JSON.parse(dataFixed);

      players[socket.id]["direction"] = JSON.stringify(dataObject.direction); 
    });
    
    socket.on('newBullets', (data) => {
      console.log("newBullets");
      console.log(data);

      // TODO check timestamp and if more than 5 secs reject
      

      var dataFixed = data.replace(/"{/g, "{");
      dataFixed = dataFixed.replace(/}"/g, "}");
      const dataObject = JSON.parse(dataFixed);

      players[socket.id]["bullets"] = JSON.stringify(dataObject.bullets); 
    });
});

setInterval(() => {
  var time = Date.now()
  io.emit('yourPosition', time.toString());
}, 5000);
  

setInterval(() => {
  players["fakeplayer"]["position"] = fakePlayerPosTest(testCount % 3);
  players["fakeplayer"]["direction"] = fakePlayerDirTest(testCount % 3);
  players["fakeplayer"]["bullets"] = fakePlayerBulletTest(testCount % 3);

  var json = JSON.stringify(players);
  io.emit('updatePositions', json);
  console.log("players");
  console.log(players);

  testCount++;
}, 3000);