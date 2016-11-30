var md5 = require('md5');
var routes = require('./routes');
var fileUtils = require('./files-utils');
var folderUtils = require('./folders-utils');

var SendSpace;

/**
 * Constructor for new SendSpace client
 * @param options
 * @param {String} [options.user] email of the user to sendspace
 * @param {String} [options.password] password of the user
 * @param {String] [options.apiKey] API key to the sendspace application
 * @constructor
 */
SendSpace = function (options) {
    options = options || {};
    this.user = options.user;
    this.password = options.password;
    this.apiKey = options.apiKey;

    // this is populated in startSession method
    this.sessionKey;

    // this is populated in getAllFolders and getSendSpaceFolderContents methods.
    // calling getAllFoldersAndFiles method will populate both
    this.folders = {};
}

// assign methods from modules to object
SendSpace.prototype = Object.assign(SendSpace.prototype, routes);
SendSpace.prototype = Object.assign(SendSpace.prototype, fileUtils);
SendSpace.prototype = Object.assign(SendSpace.prototype, folderUtils);

/**
 * Starts sendspace session
 * @return {Promise<String>} promise to the sessionkey
 */
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

/**
 * Ends sendspace session
 * @return {Promise<Object>} promise to the sendspace API response
 */
SendSpace.prototype.endSession = function() {
    return this.authLogout(this.sessionKey);
}

/**
 * Uploads file to the sendspace
 * @param fileName name of the file
 * @param fileStream filestream of the file to be uploaded
 * @param folderId sendspace folderId where file should be uploaded
 * @return {Promise<Object>} promise to the file info of the uploaded file
 */
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

/**
 * Creates folder to the sendspace
 * @param folderName name of the folder
 * @param parentFolderId folderId where folder should be created
 * @return {Promise<Object>} promise to the sendspace API response
 */
SendSpace.prototype.createFolder = function(folderName, parentFolderId) {
    return this.foldersCreate(this.sessionKey, folderName, parentFolderId);
}

/**
 * Gets all folders from the sendspace. Also populates this.folders.
 * @return {Promise<Object>} Object containing folder names as keys, and objects containing folder id and
 * parent folder id as values
 */
SendSpace.prototype.getAllFolders = function() {
    var self = this;

    return self.foldersGetAll(self.sessionKey).then(function(body) {
        var folders = body.result.folder;
        var jsonFolders = {};
        if(Array.isArray(folders)) {
            folders.forEach(function(item) {
                jsonFolders[item.$.name] = {id: item.$.id, parentId: item.$.parent_folder_id, files: {}};
            });
        } else {
            jsonFolders[folders.$.name] = {id: folders.$.id, parentId: folders.$.parent_folder_id, files: {}};
        }

        self.folders = jsonFolders;
        return jsonFolders;
    });
}

/**
 * Gets contents of the given sendspace folder. Also adds info of the found files to this.files.
 * @param folderId id of the folder
 * @return {Promise<Object>} promise to the array of contents of the folder
 */
SendSpace.prototype.getSendSpaceFolderContents = function(folderId) {    
    var self = this;

    return self.foldersGetContents(self.sessionKey, folderId).then(function(body) {
        var files = body.result.file;
        if (files) {
            var filesJson = {};
            if (Array.isArray(files)) {
                files.forEach(function(item) {
                    filesJson[item.$.name] = {folderId: item.$.folder_id};
                });
            } else {
                filesJson[files.$.name] = {folderId: files.$.folder_id};
            }
            for (var key in self.folders) {
                var folder = self.folders[key];
                if (folder && folder.id == folderId) {
                    folder.files = filesJson;
                    break;
                }
            }
        }
        return body;
    });
}

/**
 * Gets all folders and files from the sendspace. Also invokes methods that populate this.folders and this.files objects.
 * @return {Promise<Array.<Promise>>} promise to the array of promises containing info of files in sendspace
 */
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
