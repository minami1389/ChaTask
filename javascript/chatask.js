var socketio = io.connect('http://localhost:3000');
var memberCount = 0;

socketio.on("connect", function(data) {
	updateRoomInfo("入室したいルーム名とユーザー名を入力してください。");
});

function didPushEnterRoomButton() {
	var userName = $('#name_input').val();
	var roomName = $('#room_input').val();
	socketio.emit("enter",{
		userName: userName,
		roomName: roomName
	});
	updateRoomInfo(userName + "さんは" + roomName + "に入室しました。");
}

socketio.on("openMessage", function(messageArray) {
	if(messageArray.length == 0) {
		return;
	} else {
		$('#message').empty();
		messageArray.forEach(function(message) {
			addMessage(message);
		});
	}
});

socketio.on("recieveMessage", function(message) {
	addMessage(message);
});

socketio.on("dropDB", function() {
	$("#message").empty();
	$("#member").empty();
});

 socketio.on("updateRoomList", function(roomList){
 	if (!roomList) { return; }
 	$('#roomList').text("");
	for (var roomName in roomList) {
		var parent_div = $('#roomList');
		var child_div = document.createElement('div');
		child_div.innerHTML = roomName + "：" + roomList[roomName] + "人";
		parent_div.append(child_div);
 	}
 });

 socketio.on("updateOnlineUserCount", function(userCount) {
 	$('#onlineUserCount').text( "（現在" + userCount  + "人がオンライン）");
 });

 socketio.on("updateRoomMember", function(userArray) {
 	if(userArray.length == 0) { return; }
 	memberCount = userArray.length;
	$('#memberList').empty();
	var index = 0;
	userArray.forEach(function(data) {
		var parent_div = $('#memberList');
		var child_div = document.createElement('div');
		child_div.innerHTML = "<input type=\"radio\" name=\"member\" value=\"" + data.name + "\">" + data.name;
		parent_div.append(child_div);
		index++;
	});
});

socketio.on("disconnect", function(data) { });

function didPushSendMessageButton() {
	var checkedUser = $(':radio[name="member"]:checked').val();
	socketio.emit("sendMessage",  {
		message:$('#message_input').val(),
		user:checkedUser
	});
	$('#message_input').val('').focus();
}

function addMessage(data) {
	var parent_div = $('#message');
	var child_div = document.createElement('div');
	child_div.innerHTML = data.date + ' [' + data.name + '] ' + data.message;
	parent_div.append(child_div);
}

function updateRoomInfo(info) {
	$('#roomInfo').text(info);
}

function didPushDeleteDBButon() {
	socketio.emit("deleteDB");
}