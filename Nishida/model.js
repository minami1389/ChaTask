//データベースに接続
var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost/nodestudy_login');

//文字列長が0より大きいか？
function validator (v) {
	return v.length > 0;
}

//グループスキーマ
var Group = new mongoose.Schema({
    groupname: {type: String, validate: [validator, "Empty Error"]},
    password: {type: String, validate: [validator, "Empty Error"]},
    //member: {type: String, validate: [validator, "Empty Error"]},
    created: {type: Date, default: Date.now}
})

var Member 
    name
    groupname

//mongodb上では、postsというコレクション名で登録される
//exportsに渡して、外から使えるようにする
//db.model('モデルネーム', 引っ張ってくるスキーマ)
exports.Group = db.model('Group', Group);