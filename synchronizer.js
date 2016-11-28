var Dropbox = require('dropbox');
var SendSpace = require('./SendSpaceClient/SendSpace');
var dropboxUtils = require('./utils/dropbox-utils');

var dbConf = require('./config/dropboxConfig');
var ssConf = require('./config/sendspaceConfig');

module.exports = function(dropboxAccessToken, sendspaceUser, sendspacePassword) {

    return new Promise(function(resolve, reject) {
        // initialize client objects
        var dbx = new Dropbox({accessToken: dropboxAccessToken});
        var ss = new SendSpace({ apiKey: ssConf.apiKey, user: sendspaceUser, password: sendspacePassword});

        // starts new sendspace session
        ss.startSession().then(function() {
            console.log('=== Login to sendspace successful!');

            // populates sendspace object with information of all existing files and folders
            return ss.getAllFoldersAndFiles().then(function() {
                console.log('=== Got all existing files and folders from sendspace!');

                // gets array of the files and folders from the dropbox
                return dropboxUtils.getAllDropBoxFilesAndFolders(dbx).then(function(entries) {
                    console.log('=== Got all files and folders from dropbox');
                    var folders = [], files = [];

                    // seperate folders and files to own arrays
                    entries.forEach(function(item) {
                        if (item['.tag'] == 'folder') {
                            folders.push(item.path_display); // only paths are needed
                        } else {
                            files.push(item);
                        }
                    });

                    // synchronize folders from dropbox to sendspace
                    return ss.syncFolders(folders).then(function() {
                        console.log('=== Synced all folders from dropbox to sendspace!');

                        // synchronize files from dropbox to sendspace
                        return Promise.all(files.map(function(item) {
                            // synchronize file only if it doesn't exist in sendspace yet
                            if(!ss.fileExists(item.path_display)){
                                console.log("=== Started syncing file from dropbox to sendspace: " + JSON.stringify(item));
                                // just for making reading params easier
                                var name = item.name;
                                var path = item.path_display;
                                var folder = ss.getParentFolder(path);
                                var dropBoxDownloadStream = dropboxUtils.getDropBoxFileDownloadStream(path, dropboxAccessToken);
                                // do the actual uploading of the file to sendspace
                                return ss.uploadFileToSendSpace(name, dropBoxDownloadStream, folder);
                            }
                        })).then(function() {
                            console.log('=== Synced all files from dropbox to sendspace!');
                        });

                    });
                });
            });

        }).catch(function(error){
            console.log('=== Error happened!');
            //console.log(error);
            reject(error);
        }).then(function() {
            // end sendspace session
            ss.endSession().then(function() {
                console.log('=== Successfully logout from sendspace!');
            }).catch(function(error) {
                // no need to reject if logout fails, because session will expire anyways
                console.log('=== Failed to logout from sendspace!');
                //console.log(error);
            });
        }).then(function() {
            resolve(); // all good
        });
    });
}
