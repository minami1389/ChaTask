var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var date = require('date-utils');

app.get('/', function(req, res){
  res.sendfile('views/index.html');
});

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/javascript'));


//mongodb
var Schema = mongoose.Schema;

	//Chat
	var ChatSchema = new Schema({
	 	message: String,
	      name: String,
	      date: String,
	      room: String
	});
	mongoose.model('Chat', ChatSchema);
	var Chat = mongoose.model('Chat');

	//Member
	var MemberSchema = new Schema({  //ユーザーの名前とルーム名を紐づけるもの
	 	name: String,
	 	room: String
	});
	mongoose.model('Member', MemberSchema);
	var Member = mongoose.model('Member');

mongoose.connect('mongodb://localhost/chatask'); //mongoDBに接続


//socketio
var onlineUserCount = 0;
var roomList = new Object();		//[roomName] = roomUserCount
var memberList = new Object(); 	//[userName] = socketid

io.on('connection', function(socket){
	console.log('a user connected');

	onlineUserCount++;
	io.sockets.emit("updateOnlineUserCount", onlineUserCount);

	updateRoomList();

	socket.on("enter", function(data) {
		socket.name = data.userName;
		var roomName = data.roomName;
		memberList[socket.name] = socket.id;
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
		Member.remove({  __v : 0 }, function(err, result){
    			if (err) {
        			res.send({'error': 'An error has occurred - ' + err});
    			} else {
        			console.log('MemberRemoveSuccess: ' + result + ' document(s) deleted');
    			}
 		});
		Chat.remove({  __v : 0 }, function(err, result){
    			if (err) {
        			res.send({'error': 'An error has occurred - ' + err});
    			} else {
        			console.log('CharRemoveSuccessSuccess: ' + result + ' document(s) deleted');
    			}
 		});
	})

	socket.on("disconnect", function() {
		onlineUserCount--;
		var roomName = socket.roomName;
		Member.remove({  name : socket.name }, function(err, result){
    			if (err) {
        			res.send({'error': 'An error has occurred - ' + err});
    			} else {
    				updateRoomMember();
    			}
 		});
 		delete memberList[socket.name];
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
		console.log("ウェブサイトから退室：現在" + onlineUserCount + "人");
		io.sockets.emit("updateOnlineUserCount", onlineUserCount);
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
		var member = new Member();
		member.name = socket.name;
		member.room = socket.roomName;
		member.save(function(err) {
			if(err) {
				console.log(err);
			} else {
				updateRoomMember();
			}
		});
	}

	function updateRoomList() {
		if(roomList) { io.sockets.emit("updateRoomList", roomList); }
	}

	function updateRoomMember() {
		Member.find({room:socket.roomName},function(err, docs) {
  					io.sockets.to(socket.roomName).emit("updateRoomMember", docs);
  		});
	}

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});