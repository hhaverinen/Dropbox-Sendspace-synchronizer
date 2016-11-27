var md5 = require('md5');
var routes = require('./routes');

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

// TODO: these kinds of custom "extra" methods to some own modules?
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

SendSpace.prototype.fileExists = function(filepath) {
    var pathArray = filepath.substring(1).split('/');
    if (this.files && this.folders && pathArray.length > 0) {
        var parentId = 0; // initialize this with sendspace root folderId
        for(var i = 0; i < pathArray.length; i++) {
            if (i === pathArray.length - 1) {
                var file = this.files[pathArray[i]];
                if (!file) {
                    return false;
                }
                return (file.folderId == parentId);
            } else {
                var folder = this.folders[pathArray[i]];
                if (!folder) {
                    return false;
                }
                if (folder.parentId == parentId) {
                    parentId = this.folders[pathArray[i]].id;
                } else {
                    return false;
                }
            }
        }
    }

    return false;
}

SendSpace.prototype.folderExists = function(folderPath) {
    var pathArray = folderPath.substring(1).split('/');
    if (this.folders && pathArray.length > 0) {
        var parentId = 0; // initialize this with sendspace root folderId
        for(var i = 0; i < pathArray.length; i++) {
            var folder = this.folders[pathArray[i]];
            if (i === pathArray.length - 1) {
                if(!folder) {
                    return false;
                }
                return (folder.parentId == parentId);
            } else {
                if(!folder) {
                    return false;
                }
                if (folder.parentId == parentId) {
                    parentId = folder.id;
                } else {
                    return false;
                }
            }
        }
    }

    return false;
}

SendSpace.prototype.checkAndCreateFolder = function(folderName, parentId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var folder = self.folders[folderName];
        if (folder && folder.parentId == parentId) {
            resolve(folder.id);
        } else {
            self.createFolder(folderName, parentId).then(function(body) {
                var createdFolder = body.result.folder.$;
                self.folders[createdFolder.name] = {id: createdFolder.id, parentId: createdFolder.parent_folder_id};
                resolve(createdFolder.id);
            }).catch(function(body) {
                reject(body);
            });
        }
    });
}

SendSpace.prototype.syncFolderPathArray = function(folderPathArray, parentFolderId) {
    var self = this;
    return new Promise(function(resolve) {
        var parentId = parentFolderId || 0;
        var folder = folderPathArray.shift();

        var responseHandler = function(response) {
            if (folderPathArray.length > 0) {
                self.syncFolderPathArray(folderPathArray, response).then(function() {
                    resolve();
                });
            } else {
                resolve(); // success for creating all the folders
            }
        }

        self.checkAndCreateFolder(folder, parentId).then(responseHandler);

    });
}

SendSpace.prototype.syncFolderPath = function(folderPath) {
    var pathArray = folderPath.substring(1).split('/');
    return this.syncFolderPathArray(pathArray);
}

SendSpace.prototype.syncFolders = function(folderPaths) {
    var self = this;
    return new Promise(function(resolve) {
        var folderPath = folderPaths.shift();

        var responseHandler = function() {
            if (folderPaths.length > 0) {
                self.syncFolders(folderPaths).then(function() {
                    resolve();
                });
            } else {
                resolve(); // all folders synced
            }
        }

        self.syncFolderPath(folderPath).then(responseHandler);
    });
}

module.exports = SendSpace;
