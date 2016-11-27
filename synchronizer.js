var Dropbox = require('dropbox');
var SendSpace = require('./SendSpaceClient/SendSpace');
var request = require('request');
var extend = require('extend');

var dbConf = require('./config/dropboxConfig');
var ssConf = require('./config/sendspaceConfig');

// gets all the files from dropbox recursively
var getAllDropBoxFilesAndFolders = function(dbx, cursor, contents) {
    return new Promise(function(resolve, reject) {
        var contents = contents || [];

        var responseHandler = function(response) {
            contents = contents.concat(response.entries);
            console.log(response.has_more);

            if (response.has_more) {
                getAllDropBoxFilesAndFolders(dbx, response.cursor, contents).then(function(contents) {
                    resolve(contents);
                }).catch(function(error) {
                    reject(error);
                });
            } else {
                resolve(contents);
            }
        }

        if(!cursor) {
            console.log("call files list folder");
            dbx.filesListFolder({ path: '', recursive: true }).then(responseHandler).catch(function(error) {
                reject(error);
            });
        } else {
            console.log("call files list folder continue");
            dbx.filesListFolderContinue({ cursor: cursor }).then(responseHandler).catch(function(error) {
                reject(error);
            });
        }
    });
}

var getDropBoxDownloadParams = function(filepath, authToken) {
    return {
        url: 'https://content.dropboxapi.com/2/files/download',
        headers: {
            'Dropbox-API-Arg': JSON.stringify({path: filepath}),
            'Authorization': 'Bearer '+authToken
        }
    }
}

module.exports = function() {
    var dbx = new Dropbox(dbConf);
    var ss = new SendSpace(ssConf);

    ss.startSession().then(function(response) {
	    console.log('=== Login to sendspace successful!');

        return ss.getAllFoldersAndFiles().then(function(response) {
            console.log('=== Got all existing files and folders from sendspace!');

            return getAllDropBoxFilesAndFolders(dbx).then(function(entries) {
                console.log('=== Got all files and folders from dropbox');
                var folders = [], files = [];

                entries.forEach(function(item) {
                    if (item['.tag'] == 'folder') {
                        folders.push(item.path_display); // only paths are needed
                    } else {
                        files.push(item);
                    }
                });

                //sync folders
                return ss.syncFolders(folders).then(function(response) {
                    console.log('=== Synced all folders from dropbox to sendspace!');

                    //sync files
                    return Promise.all(files.map(function(item) {
                        if(!ss.fileExists(item.path_display)){
                            console.log("=== Started syncing file from dropbox to sendspace: " + JSON.stringify(item));
                            var name = item.name;
                            var path = item.path_display;
                            var folder = ss.getParentFolder(path);
                            var dropboxDownloadParams = getDropBoxDownloadParams(path, dbConf.accessToken);
                            return ss.uploadFileToSendSpace(name, request.get(dropboxDownloadParams), folder);
                        }
                    })).then(function(response) {
                        console.log('=== Synced all files from dropbox to sendspace!');
                    });

                });
            });
        });

    }).catch(function(error){
	    console.log('=== Error happened!');
        console.log(error);
    }).then(function() {
        ss.endSession().then(function() {
            console.log('=== Successfully logout from sendspace!');
        }).catch(function(error) {
            console.log('=== Failed to logout from sendspace!');
            console.log(error);
        });
    });

    return "Terve mualima!";
}
