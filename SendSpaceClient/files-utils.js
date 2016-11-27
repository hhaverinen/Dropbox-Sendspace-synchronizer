var filesUtils = {};

/**
 * Check whether file exists already in sendspace. This method uses saved JSON of files and folders and does not
 * make any requests straight to the sendspace API
 * @param filepath whole filepath of the file
 * @return {boolean} true if file already exists, false otherwise.
 */
filesUtils.fileExists = function(filepath) {
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
                    parentId = folder.id;
                } else {
                    return false;
                }
            }
        }
    }

    return false;
}

/**
 * Returns folder id of the file, whether the file exists in sendspace or not. This method uses saved JSON of files
 * and folders and does not make any requests straight to the sendspace API
 * @param filePath whole filepath of the file
 * @return {*} return ID of the folder. If folder is not found, method return id of the root folder (= 0)
 */
filesUtils.getParentFolder = function(filePath) {
    var pathArray = filePath.substring(1).split('/');

    if (this.folders && pathArray.length > 0) {
        var parentId = 0;
        for(var i = 0; i < pathArray.length - 1; i++) {
            var folder = this.folders[pathArray[i]];
            if (i === pathArray.length - 2) {
                if (folder) {
                    return folder.id;
                } else {
                    return 0; // if folder was not found, return root folder id
                }
            } else {
                if (!folder) {
                    return 0;
                }
                if (folder.parentId == parentId) {
                    parentId = folder.id;
                } else {
                    return 0;
                }
            }
        }
    }

    return 0;
}

module.exports = filesUtils;