var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var date = require('date-utils');

app.get('/', function(req, res){
  res.sendfile('views/index.html');
});

//app.use(express.static(__dirname + '/public'));

//mongodb
var Schema = mongoose.Schema; //スキーマ取得

var ChatSchema = new Schema({  //目的のスキーマを作成
 	message: String,
      name: String,
      date: String,
      room: String
});
mongoose.model('Chat', ChatSchema);  //スキーマからモデル作成
var Chat = mongoose.model('Chat');  //モデルできあがり

var UserSchema = new Schema({  //ユーザーの名前とルーム名を紐づけるもの
 	name: String,
 	room: String
});
mongoose.model('User', UserSchema);  //スキーマからモデル作成
var User = mongoose.model('User');  //モデルできあがり

mongoose.connect('mongodb://localhost/chatask'); //mongoDBに接続


//socketio
var userCount = 0;
var roomList = new Object();
var jsonBoth = {};
var userList = new Object(); //ユーザーの名前とsocketidを紐づけるもの

io.on('connection', function(socket){
	console.log('a user connected');

	userCount++;
	io.sockets.emit("port", userCount);

	updateRoomList(roomList);
	function updateRoomList(roomList) {
		if(roomList) { io.sockets.emit("roomList", roomList); }
	}

	socket.on("enter", function(data) {
		socket.name = data.userName;
		var roomName = data.roomName;
		if (!roomList[roomName]) {
			createRoom(roomName);
		} else if(roomList[roomName]) {
			var roomUserCount = roomList[roomName]
			enterRoom(roomName);
		}
	});

	socket.on("sendMessage", function(data) {
		var roomName = socket.roomName;
		var now = nowDate()
		io.sockets.to(roomName).emit("recieveMessage", {
			message: data.message,
			name: socket.name,
			date: now
		});
		var chat = new Chat();
		chat.message = data.message;
		chat.name = socket.name;
		chat.date = now;
		chat.room = socket.roomName;
		chat.save(function(err) {
			if(err) { console.log(err); }
		});
	});

	socket.on("deleteDB", function() {
		socket.emit('dropDB');
		Chat.remove({  __v : 0 }, function(err, result){
    			if (err) {
        			res.send({'error': 'An error has occurred - ' + err});
    			} else {
        			console.log('Success: ' + result + ' document(s) deleted');
    			}
 		});
	})

	socket.on("disconnect", function() {
		userCount--;
		var roomName = socket.roomName;
		if (roomName) {
			roomList[roomName]--;
			socket.leave(roomName);
			io.sockets.to(roomName).emit("recieveMessage", {
				message: "退出",
				name: socket.name,
				date: nowDate()
			});
			updateRoomList(roomList);
		}
		console.log("ウェブサイトから退室：現在" + userCount + "人");
		io.sockets.emit("port", userCount);
	});

	function nowDate() {
		var now = new Date()
		return now.toFormat("YYYY/MM/DD HH24:MI");
	}

	function createRoom(roomName) {
		roomList[roomName] = 1;
		console.log("create ChatRoom : " + roomName + " ( " + roomList[roomName] + "members )");
		joinRoom(roomName);
	}

	function enterRoom(roomName) {
		roomList[roomName]++;
		console.log("\"" + socket.name + "\" enter ChatRoom : " + roomName + " ( " + roomList[roomName] + "members )");
		joinRoom(roomName);
	}

	function joinRoom(roomName) {
		socket.roomName = roomName;
		socket.join(roomName);
		Chat.find({room:socket.roomName},function(err, docs) {
  			socket.emit('openMessage', docs);
  			io.sockets.to(roomName).emit("recieveMessage", {
				message: "入室",
				name: socket.name,
				date: nowDate()
			});
  		});
		updateRoomList(roomList);
		var user = new User();
		user.name = socket.name;
		user.room = socket.roomName;
		user.save(function(err) {
			if(err) { console.log(err); }
		});
		User.find({room:socket.roomName},function(err, docs) {
  			io.sockets.to(roomName).emit("roomMember", docs);
  		});
	}

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});