//modelを実行
var model = require('../model');
var Group = model.Group;

//exports.hoge で　hoge を外で使えるようにしている

exports.index = function (req, res) {
	res.render('index');
};

exports.create = function (req, res) {
	res.render('create', {title: 'New Entry'});
};

exports.login = function (req, res) {
	res.render('login', {title: 'New Entry'})
};

exports.create_done = function (req, res) {
	var newGroup = new Group(req.body);
	//新しいグループを作成
	newGroup.save(function (err, items) {
		if (err) {
			console.log(err);
		}
		else {
			res.render('create_done', {items: newGroup["groupname"]});
		}
	})
}

exports.logon = function (req, res) {
	//セッションを保持しているとき
	if (req.session.session) {
		name = req.session.session;
		console.log(req.session);
		console.log('^^');
		res.render('logon_ok', { title: 'Hello, world', items: name});		
	}
	//セッションがないとき
	else {
		var newGroup = new Group(req.body);
		//文字列の検索
		Group.find({groupname: newGroup["groupname"], password: newGroup["password"]}, function (err, items) {
			if (err) {
				console.log(err);
			}else {
				//一致するものがないとき…ログイン失敗
				if (items.length == 0) {
					res.render('logon_ng');
					console.log(items);
				}
				//一致したとき…ログイン成功、セッションスタート
				else{
					req.session.session = newGroup["member"];
					res.render('logon_ok', { title: 'Hello, world', items: newGroup["member"]});
					console.log('started session');
				}
			}
	});}

}

