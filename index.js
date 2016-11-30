var express = require('express');
var app = express();
var synchronizer = require('./synchronizer.js');
var request = require('request');
var dbconf = require('./config/dropboxConfig');
var bodyParser = require('body-parser');

// set the port
var port = process.env.PORT || 8080;

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

// middleware functions
/**
 * render home page
 * @param req request
 * @param res response
 */
var renderHome = function(req, res) {
    var params = req.renderParams || {}
    res.render('index', params);
}

/**
 * middleware function for requesting access token from dropbox
 * @param req request
 * @param res response
 * @param next next middleware function
 */
var getDropboxToken = function(req, res, next) {
    var code = req.query.code;
    if (code) {
        var data = {
            code: code,
            grant_type: 'authorization_code',
            client_id: dbconf.key,
            client_secret: dbconf.secret,
            redirect_uri: dbconf.redirectUrl
        }
        request.post({url: 'https://api.dropboxapi.com/oauth2/token', formData: data}, function (error, response, body) {
            if (error) {
                req.renderParams = {error: error}
                next();
            }

            // parse access token
            var accessToken = JSON.parse(body).access_token
            // if access token not found, return error
            if(!accessToken) {
                req.renderParams = {error: body};
                next();
            }

            // render index page with information of successful authentication
            req.renderParams = {dbaccesstoken: accessToken, dbauth: true}
            next();
        });
    } else {
        req.renderParams = {error: 'Error happened during dropbox authorization!'};
        next();
    }
}

// routes
/**
 * home page
 */
app.get('/', renderHome);

/**
 * gets oauth url for dropbox and redirect user to there
 */
app.get('/dbauth', function(req, res) {
    var baseUrl = 'https://www.dropbox.com/oauth2/authorize';
    baseUrl += '?response_type=code&client_id='+dbconf.key+'&redirect_uri='+dbconf.redirectUrl
    res.redirect(baseUrl);
});

/**
 * gets access token from dropbox and return user to home page
 */
app.get('/dbtoken', getDropboxToken, renderHome);

/**
 * starts the synchronize progress and returns ok/fail response
 */
app.post('/synchronize', function(req, res) {
    var user = req.body.user;
    var password = req.body.password;
    var dbaccesstoken = req.body.dbaccesstoken;

    // synchronize files and return response
    synchronizer(dbaccesstoken, user, password).then(function() {
        console.log('All good!')
        res.send('All files synced successfully!');
    }).catch(function(error) {
        // TODO: parse error message?
        console.log(error);
        res.send(JSON.stringify(error));
    });
});

/**
 * starts the server
 */
app.listen(port, function() {
    console.log('Server running in port '+port+'!');
});