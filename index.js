const path = require('path');
const bodyParser = require('body-parser');
const cookie = require('cookie-parser');
const express = require('express');
const app = express();
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const identityKey = 'skey';
const mysql = require('mysql');
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'ashun666',
    database: 'down_list'
});

app.use(cookie());
app.use(session({
    resave: true, // 是指每次请求都重新设置session cookie，假设你的cookie是6000毫秒过期，每次请求都会再设置6000毫秒
    saveUninitialized: false, // 是指无论有没有session cookie，每次请求都设置个session cookie
    store: new FileStore(), // 本地存储session（文本文件，也可以选择其他store，比如redis的）
    secret: '123456', //  加密
    name: identityKey, //这里的name值得是cookie的name，默认cookie的name是：connect.sid
    cookie: {
        maxAge: 16000
    }, //设置maxAge是80000ms，即80s后session和相应的cookie失效过期
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.resolve(__dirname, './static')));


var myUser = {
    userName: 'ashun',
    password: '123456'
}

app.get('/aaa', function (req, res, next) {
    var sess = req.session;
    var loginUser = sess.loginUser;
    var isLogined = !!loginUser;
    console.log(sess, 'sess==========')
    res.json({
        isLogined: isLogined,
        name: loginUser || ''
    });
});

app.post('/login', function (req, res, next) {
    var user = '';
    if (req.body.name === myUser.userName && req.body.password === myUser.password) {
        user = true;
    }
    if (user) {
        req.session.regenerate(function (err) {
            if (err) {
                return res.json({ ret_code: 2, ret_msg: '登录失败' });
            }
            req.session.loginUser = '123456';
            res.json({ ret_code: 0, ret_msg: '登录成功' });
        });
    } else {
        res.json({ ret_code: 1, ret_msg: '账号或密码错误' });
    }
});

// 退出登录
app.post('/logout', function (req, res, next) {
    // 备注：这里用的 session-file-store 在destroy 方法里，并没有销毁cookie
    // 所以客户端的 cookie 还是存在，导致的问题 --> 退出登陆后，服务端检测到cookie
    // 然后去查找对应的 session 文件，报错
    // session-file-store 本身的bug  

    req.session.destroy(function (err) {
        if (err) {
            res.json({ ret_code: 2, ret_msg: '退出登录失败' });
            return;
        }
        req.session.loginUser = null;
        res.clearCookie(identityKey);
        res.json({aa:'退出成功'});
    });
});

app.listen(8686);
