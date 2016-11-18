var request = require('request');
var xml2js = require('xml2js');
var md5 = require('md5');

var SendSpace;

SendSpace = function (options) {
    options = options || {};
    //TODO: getters and setters
    this.user = options.user;
    this.password = options.password;
    this.apiKey = options.apiKey;
    this.sessionKey = options.sessionKey;
    
    // this should be private method?
    this.sendSpaceUploadResponseToJson = function(response) {
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
}

// gets sendspace sessionkey for current session
SendSpace.prototype.getSessionkey = function() {
    // TODO: refactor
    
    return new Promise(function(resolve, reject) {
        request('http://api.sendspace.com/rest/?method=auth.createtoken&api_version=1.2&api_key='+this.apiKey, function(error, response, body) {
            resolve(body);
            if (error) {
                reject(error);
            }
            
            var parser = new xml2js.Parser({explicitArray: false});
            parser.parseString(body, function(err, result) {
                var token = result.result.token;

                if (token) {
                    var email = this.user;
                    var pw = this.password;
                    var tokenedpw = md5(token + md5(pw).toLowerCase()).toLowerCase();
                    
                    request('http://api.sendspace.com/rest/?method=auth.login&token='+token+'&user_name='+email+'&tokened_password='+tokenedpw, function(error, response, body) {
                        parser.parseString(body, function(err, result) {
                            this.sessionKey = result.result.session_key;
                            resolve(this.sessionKey);
                        });
                    });
                }
            });
        });
    });
}

SendSpace.prototype.uploadFileToSendSpace = function(fileName, fileStream) {
    // change to promise and refactor
    request('http://api.sendspace.com/rest/?method=upload.getinfo&session_key='+this.sessionKey, function(error, response, body) {
        var parser = new xml2js.Parser({explicitArray: false});
        parser.parseString(body, function(err, result) {
            var uploadObj = result.result.upload.$;           
            
            var formData = {
                MAX_FILE_SIZE: uploadObj.max_file_size,
                UPLOAD_IDENTIFIER: uploadObj.upload_identifier,
                extra_info: uploadObj.extra_info,
                userfile: fileStream
            };
            
            request.post({url:uploadObj.url, formData: formData}, function(error, response, body) {
                if(error) {
                    console.log(error);
                }

                var respJson = this.sendSpaceUploadResponseToJson(body);
                if(respJson.upload_status === 'ok') {
                    // rename the file since downloadStream gives 'donwload' to file name
                    request('http://api.sendspace.com/rest/?method=files.setinfo&session_key='+sessionKey+'&file_id='+respJson.file_id+'&name='+fileName, function(error, response, body) {
                        console.log(body);
                    });
                }
            });
            
        });
    });
}

module.exports = SendSpace;