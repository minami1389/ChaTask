var socketio = io.connect('http://localhost:3000');

		socketio.on("connect", function(data) {
			socketio.emit("updateMessage");
		});

		socketio.on("recieveMessage", function(data) {
			addMessage(data);
		});

		socketio.on("openMessage", function(dataArray) {
			if(dataArray.length == 0) { return; }
			else {
				$('#message_input').empty();
				dataArray.forEach(function(data) {
					addMessage(data);
				});
			}
		});

		socketio.on("dropDB", function() {
			$("#message").empty();
		})

		socketio.on("disconnect", function(data) { });

		function start(name) {
			$('#name_input').val(name);
			socketio.emit("connected", name);
		}

		function enterRoom() {
			socket.emit("enter",{

			});
		}

		function sendMessage() {
			var now = new Date();
			var nowHour = now.getHours();
			var nowMin = now.getMinutes();
			if(nowHour < 10){ nowHour = "0"+nowHour; }
			if(nowMin < 10){ nowMin = "0"+nowMin; }
			socketio.emit("sendMessage", {
				message: $('#message_input').val(),
				name: $('#name_input').val(),
				date: now.getFullYear() + "/" + (now.getMonth()+1) + "/" + now.getDay() + " " + nowHour + ":" + nowMin
			});
			$('#message_input').val('').focus();
		}

		function addMessage(data) {
			var domMeg = document.createElement('div');
			domMeg.innerHTML = data.date + ' [' + data.name + '] ' + data.message;
			$('#message').append(domMeg);
		}

		function deleteDB() {
			socketio.emit("deleteDB");
		}

		function roomPut() {

		}

		//main
		var myName = Math.floor(Math.random()*100) + "さん";
		var now = new Date();
		var nowHour = now.getHours();
		var nowMin = now.getMinutes();
		if(nowHour < 10){ nowHour = "0"+nowHour; }
		if(nowMin < 10){ nowMin = "0"+nowMin; }
		var data =  {
			message: "貴方は" + myName + "として入室しました",
			name: '管理者',
			date: now.getFullYear() + "/" + (now.getMonth()+1) + "/" + now.getDay() + " " + nowHour + ":" + nowMin
		}
		addMessage(data);
		start(myName);