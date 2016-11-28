var express = require('express');
var app = express();
var synchronizer = require('./synchronizer.js');
var request = require('request');
var dbconf = require('./config/dropboxConfig');
var bodyParser = require('body-parser');

// set template engine
app.set('views', './views');
app.set('view engine', 'pug');

// serve client side files as static files
app.use(express.static('public'));

// support parsing post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// routes
app.get('/', function(req, res) {
    res.render('index');
});

// gets oauth url for dropbox and redirect user to there
app.get('/dbauth', function(req, res) {
    var baseUrl = 'https://www.dropbox.com/oauth2/authorize';
    baseUrl += '?response_type=code&client_id='+dbconf.key+'&redirect_uri=http://localhost:3000'
    res.redirect(baseUrl);
});

// gets access token from dropbox
app.get('/gettoken', function(req, res) {
    var code = req.query.code;
    if (code) {
        var data = {
            code: code,
            grant_type: 'authorization_code',
            client_id: dbconf.key,
            client_secret: dbconf.secret,
            redirect_uri: 'http://localhost:3000'
        }
        request.post({url: 'https://api.dropboxapi.com/oauth2/token', formData: data}, function (error, response, body) {
            if (error) {
                res.send(error);
                return;
            }

            // parse access token
            var accessToken = JSON.parse(body).access_token
            // if access token not found, return error
            if(!accessToken) {
                res.send(body);
                return;
            }

            // render index page with information of successful authentication
            res.render('index', {dbaccesstoken: accessToken, dbauth: true});
        });
    } else {
        res.send('error happened!');
    }
});

// starts the synchronize progress and returns ok/fail response
app.post('/synchronize', function(req, res) {
    var user = req.body.user;
    var password = req.body.password;
    var dbaccesstoken = req.body.dbaccesstoken;

    // synchronize files and return response
    synchronizer(dbaccesstoken, user, password).then(function(response) {
        console.log('All good!')
        res.send('All good!');
    }).catch(function(error) {
        console.log(error);
        res.send(error);
    });
});

// starts the server
app.listen(3000, function() {
    console.log("Server running in port 3000!");
});