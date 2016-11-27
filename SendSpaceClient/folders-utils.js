var foldersUtils = {};

foldersUtils.folderExists = function(folderPath) {
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

foldersUtils.checkAndCreateFolder = function(folderName, parentId) {
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

foldersUtils.syncFolderPathArray = function(folderPathArray, parentFolderId) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var parentId = parentFolderId || 0;
        var folder = folderPathArray.shift();

        var responseHandler = function(response) {
            if (folderPathArray.length > 0) {
                self.syncFolderPathArray(folderPathArray, response).then(function() {
                    resolve();
                }).catch(function(body) {
                    reject(body);
                });
            } else {
                resolve(); // success for creating all the folders
            }
        }

        self.checkAndCreateFolder(folder, parentId).then(responseHandler).catch(function(error) {
            reject(error);
        });

    });
}

foldersUtils.syncFolderPath = function(folderPath) {
    var pathArray = folderPath.substring(1).split('/');
    return this.syncFolderPathArray(pathArray);
}

foldersUtils.syncFolders = function(folderPaths) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var folderPath = folderPaths.shift();

        var responseHandler = function() {
            if (folderPaths.length > 0) {
                self.syncFolders(folderPaths).then(function() {
                    resolve();
                }).catch(function(body) {
                    reject(body);
                });
            } else {
                resolve(); // all folders synced
            }
        }

        self.syncFolderPath(folderPath).then(responseHandler).catch(function(error) {
            reject(error);
        });
    });
}

module.exports = foldersUtils;