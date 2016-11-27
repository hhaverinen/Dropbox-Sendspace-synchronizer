var md5 = require('md5');
var routes = require('./routes');
var fileUtils = require('./files-utils');
var folderUtils = require('./folders-utils');

var SendSpace;

SendSpace = function (options) {
    options = options || {};
    this.user = options.user;
    this.password = options.password;
    this.apiKey = options.apiKey;
    this.sessionKey = options.sessionKey;

    this.folders = {};
    this.files = {};
}

SendSpace.prototype = Object.assign(SendSpace.prototype, routes);
SendSpace.prototype = Object.assign(SendSpace.prototype, fileUtils);
SendSpace.prototype = Object.assign(SendSpace.prototype, folderUtils);

SendSpace.prototype.startSession = function() {
    var self = this;

    return self.authCreateToken(this.apiKey).then(function(body) {
        var token = body.result.token;
        var email = self.user;
        var pw = self.password;
        var tokenedpw = md5(token + md5(pw).toLowerCase()).toLowerCase();

        return self.authLogin(email, tokenedpw, token).then(function(body) {
            self.sessionKey = body.result.session_key;
            return self.sessionKey;
        });
    });
}

SendSpace.prototype.endSession = function() {
    return this.authLogout(this.sessionKey);
}

SendSpace.prototype.uploadFileToSendSpace = function(fileName, fileStream, folderId) {
    var self = this;

    return self.uploadGetInfo(self.sessionKey).then(function(body) {
        var uploadObj = body.result.upload.$;
        var formData = {
            MAX_FILE_SIZE: uploadObj.max_file_size,
            UPLOAD_IDENTIFIER: uploadObj.upload_identifier,
            extra_info: uploadObj.extra_info,
            userfile: fileStream,
            folder_id: folderId || 0
        };

        return self.uploadFile(uploadObj.url, formData).then(function(resp) {
            return self.filesSetInfo(self.sessionKey, resp.file_id, fileName);
        });
    });
}

SendSpace.prototype.createFolder = function(folderName, parentFolderId) {
    return this.foldersCreate(this.sessionKey, folderName, parentFolderId);
}

SendSpace.prototype.getAllFolders = function() {
    var self = this;

    return self.foldersGetAll(self.sessionKey).then(function(body) {
        var folders = body.result.folder;
        var jsonFolders = {};
        if(Array.isArray(folders)) {
            folders.forEach(function(item) {
                jsonFolders[item.$.name] = {id: item.$.id, parentId: item.$.parent_folder_id};
            });
        } else {
            jsonFolders[folders.$.name] = {id: folders.$.id, parentId: folders.$.parent_folder_id};
        }

        self.folders = jsonFolders;
        return jsonFolders;
    });
}

SendSpace.prototype.getSendSpaceFolderContents = function(folderId) {    
    var self = this;

    return self.foldersGetContents(self.sessionKey, folderId).then(function(body) {
        var files = body.result.file;
        if (files) {
            if (Array.isArray(files)) {
                files.forEach(function(item) {
                    self.files[item.$.name] = {folderId: item.$.folder_id};
                });
            } else {
                self.files[files.$.name] = {folderId: files.$.folder_id};
            }
        }
        return body;
    });
}

SendSpace.prototype.getAllFoldersAndFiles = function() {
    var self = this;

    return new Promise(function(resolve, reject) {
        self.getAllFolders().then(function (folders) {
            var folderArray = [];
            for (var k in folders) {
                folderArray.push(folders[k].id);
            }

            Promise.all(
                folderArray.map(self.getSendSpaceFolderContents, self)
            ).then(function (body) {
                resolve(body);
            }).catch(function (body) {
                reject(body);
            })
        });
    });
}

module.exports = SendSpace;
