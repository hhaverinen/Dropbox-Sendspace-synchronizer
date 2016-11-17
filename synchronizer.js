var Dropbox = require('dropbox');
var request = require('request');
var xml2js = require('xml2js');
var md5 = require('md5');
var fs = require('fs');

var db_key = '3a30dgfp45ufpmh';
var db_secret = '2hy2qujs4vdnxr4';
var db_accesstoken = '8bL7cF9QDZAAAAAAAAAACchf4Ih1b_lcB_dVSnSUpcsZLmao1IU-FCXSjbK8bvi0'; //TODO: get this with OAUTH
var ss_key = 'LN5IKXSIF8';

var dbx = new Dropbox({ accessToken: db_accesstoken });


// gets all the files from dropbox recursively
var listDropBoxFiles = function(dbx, cursor) {
    if (!cursor) {
        dbx.filesListFolder({ path: '', recursive: true })
            .then(function(response) {
                response.entries.forEach(function(item) {
                    console.log(item);                    
                });
                if (response.has_more) {
                    listFiles(dbx, response.cursor);
            }})
            .catch(function(error) {
                console.log(error);
            });
    } else {
        dbx.filesListFolderContinue({ cursor: cursor })
            .then(function(response) {
                response.entries.forEach(function(item) {
                    console.log(item);                    
                });
                if (response.has_more) {
                    listFiles(dbx, response.cursor);
            }})
            .catch(function(error) {
                console.log(error);
            });
    }
}

var listSendSpaceFiles = function(session_key) {
    request('http://api.sendspace.com/rest/?method=folders.getcontents&session_key='+session_key+'&folder_id=0', function(error, response, body) {
        console.log(body);
    });
}

var getDropBoxDownloadParams = function(filepath, authToken) {
    return {
        url: 'https://content.dropboxapi.com/2/files/download',
        headers: {
            'Dropbox-API-Arg': '{"path": "'+filepath+'"}',
            'Authorization': 'Bearer '+authToken
        }
    }
}

var sendSpaceUploadResponseToJson = function(response) {
    var responseObj = {};
    var responseLines = response.split('\n');
    responseLines.forEach(function(line) {
        if(line) {
            var splittedLine = line.split('=');
            responseObj[splittedLine[0]] = splittedLine[1];
        }
    });
    return responseObj;
}

// gets sendspace sessionkey for current session
var getSendspaceSessionkey = function(handler) {
    var token;
    request('http://api.sendspace.com/rest/?method=auth.createtoken&api_key=LN5IKXSIF8&api_version=1.2', function(error, response, body) {
        var parser = new xml2js.Parser({explicitArray: false});
        parser.parseString(body, function(err, result) {
            token = result.result.token;

            if (token) {
                var email = 'henrin.testailu@gmail.com';
                var pw = 'passwordHere';
                var tokened_pw = md5(token + md5(pw).toLowerCase()).toLowerCase();
                
                request('http://api.sendspace.com/rest/?method=auth.login&token='+token+'&user_name='+email+'&tokened_password='+tokened_pw, function(error, response, body) {
                    parser.parseString(body, function(err, result) {
                        handler(result.result.session_key);
                    });
                });
            }
        });
    });
}

var uploadFileToSendSpace = function(session_key) {
    request('http://api.sendspace.com/rest/?method=upload.getinfo&session_key='+session_key, function(error, response, body) {
        var parser = new xml2js.Parser({explicitArray: false});
        parser.parseString(body, function(err, result) {
            var uploadObj = result.result.upload.$;
            
            var options = {
                url: 'https://content.dropboxapi.com/2/files/download',
                headers: {
                    'Dropbox-API-Arg': '{"path": "/testi1.txt"}',
                    'Authorization': 'Bearer 8bL7cF9QDZAAAAAAAAAACchf4Ih1b_lcB_dVSnSUpcsZLmao1IU-FCXSjbK8bvi0'
                }
            };
            
            
            var formData = {
                MAX_FILE_SIZE: uploadObj.max_file_size,
                UPLOAD_IDENTIFIER: uploadObj.upload_identifier,
                extra_info: uploadObj.extra_info,
                userfile: request.get(getDropBoxDownloadParams("/testi1.txt", db_accesstoken))
            };

            
            request.post({url:uploadObj.url, formData: formData}, function(error, response, body) {
                if(error) {
                    console.log(error);
                }

                var respJson = sendSpaceUploadResponseToJson(body);
                if(respJson.upload_status === 'ok') {
                    // rename the file since downloadStream gives 'donwload' to file name
                    request('http://api.sendspace.com/rest/?method=files.setinfo&session_key='+session_key+'&file_id='+respJson.file_id+'&name=kissakala.txt', function(error, response, body) {
                        console.log(body);
                    });
                }
            });
            
        });
    });
}

module.exports = function() {
    //listDropBoxFiles(dbx);
    //getSendspaceSessionkey(uploadFileToSendSpace);
    
    return "Terve mualima!";
}