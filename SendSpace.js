var request = require('request');
var xml2js = require('xml2js');
var md5 = require('md5');

var SendSpace;

SendSpace = function (options) {
    options = options || {};
    this.user = options.user;
    this.password = options.password;
    this.apiKey = options.apiKey;
    this.sessionKey = options.sessionKey;
}

// private methods
// is this possible to do async? Probably not performance issue anyhow.
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

var xmlToJson = function(xml) {
    return new Promise(function(resolve, reject) {
        var parser = new xml2js.Parser({explicitArray: false});
        parser.parseString(xml, function(error, result) {
            if(error) {
                reject(error);
            }
            resolve(result);
        });
    });
}

var checkSendSpaceResponse = function(body) {
    return new Promise(function(resolve, reject) {
        if (body.result.$.status === 'fail') {
            reject(body);
        }
        resolve(body);
    });
}

var makeRequest = function (url) {
    return new Promise(function(resolve, reject) {
        request(url, function(error, response, body) {
            if(error) {
                reject(error);
            }
            // TODO: is there more elegant way to write this?
            xmlToJson(body).then(checkSendSpaceResponse).then(function(body) {
                resolve(body);
            }).catch(function(body) {
                reject(body);
            });
        });
    });
}

// gets sendspace sessionkey for current session
SendSpace.prototype.getSessionkey = function() {
    var self = this;

    return new Promise(function(resolve, reject) {
        var tokenUrl = 'http://api.sendspace.com/rest/?method=auth.createtoken&api_version=1.2&api_key='+self.apiKey;        
        makeRequest(tokenUrl).then(function(body) {
            var token = body.result.token;
            var email = self.user;
            var pw = self.password;
            var tokenedpw = md5(token + md5(pw).toLowerCase()).toLowerCase();
            var authUrl = 'http://api.sendspace.com/rest/?method=auth.login&token='+token+'&user_name='+email+'&tokened_password='+tokenedpw;

            makeRequest(authUrl).then(function(body) {
                self.sessionKey = body.result.session_key;
                resolve(self.sessionKey);
            }).catch(function(body) {
                reject(body);
            });

        }).catch(function(body) {
            reject(body);
        });
    });
}

SendSpace.prototype.uploadFileToSendSpace = function(fileName, fileStream) {
    var self = this;

    return new Promise(function(resolve, reject) {
        var uploadUrl = 'http://api.sendspace.com/rest/?method=upload.getinfo&session_key='+self.sessionKey;
        makeRequest(uploadUrl).then(function(body) {
            var uploadObj = body.result.upload.$;            
            var formData = {
                MAX_FILE_SIZE: uploadObj.max_file_size,
                UPLOAD_IDENTIFIER: uploadObj.upload_identifier,
                extra_info: uploadObj.extra_info,
                userfile: fileStream
            };

            request.post({url:uploadObj.url, formData: formData}, function(error, response, body) {
                if(error) {
                    reject(error);
                }

                var respJson = sendSpaceUploadResponseToJson(body);
                if(respJson.upload_status === 'ok') {
                    // rename the file since downloadStream gives 'donwload' to file name
                    var renameUrl = 'http://api.sendspace.com/rest/?method=files.setinfo&session_key='+self.sessionKey+'&file_id='+respJson.file_id+'&name='+fileName;
                    makeRequest(renameUrl).then(function(body) {
                        resolve(body);
                    }).catch(function(body) {
                        reject(body);
                    });
                } else {
                    reject(respJson);
                }
            });


        }).catch(function(body) {
            reject(body);
        });        

    });
}

module.exports = SendSpace;
