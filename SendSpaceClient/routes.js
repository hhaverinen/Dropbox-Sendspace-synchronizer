var ssrequest = require('./sendspace-request');
var ssuploadrequest = require('./sendspace-upload-request');

var routes = {};
var baseUrl = 'http://api.sendspace.com/rest/';

//TODO: use self.sessionKey intstead of passing it in params?

// Authentication methods
routes.authCreateToken = function(apiKey) {
    return ssrequest(baseUrl + '?method=auth.createtoken&api_version=1.2&api_key=' + apiKey);
}

routes.authLogin = function(user, tokenedPassword, authToken) {
    return ssrequest(baseUrl + '?method=auth.login&token='+authToken+'&user_name='+user+'&tokened_password='+tokenedPassword);
}

routes.authLogout = function(sessionKey) {
    return ssrequest(baseUrl + '?method=auth.logout&session_key='+sessionKey);
}

// Upload methods
routes.uploadGetInfo = function(sessionKey) {
    return ssrequest(baseUrl + '?method=upload.getinfo&session_key='+sessionKey)
}

routes.uploadFile = function(url, formData) {
    return ssuploadrequest(url, formData);
}

// Files methods
// TODO: make this endpoint method more generic (= params as json and parse them to url)
routes.filesSetInfo = function(sessionKey, fileId, fileName) {
    return ssrequest(baseUrl + '?method=files.setinfo&session_key='+sessionKey+'&file_id='+fileId+'&name='+fileName);
}

// Folders methods
routes.foldersGetAll = function(sessionKey) {
    return ssrequest(baseUrl + '?method=folders.getall&session_key='+sessionKey);
}

routes.foldersGetContents = function(sessionKey, folderId) {
    return ssrequest(baseUrl + '?method=folders.getcontents&session_key='+sessionKey+'&folder_id='+folderId);
}

module.exports = routes;