var AWS = require('aws-sdk');

var S3Code = (function () {
    
    
    class S3Code {
        //AWS;
        //bucketName; // sportsanalysis
        
        constructor(credentials, bucketName) {
            this.AWS = AWS;
            this.bucketName = bucketName;
            
            // load config
            if (typeof credentials === 'string') {
                this.AWS.config.loadFromPath(credentials);
            }
            else if (credentials) {
                this.AWS.config.update(credentials);
            }
        }
        
        _getNewS3() {
            return new this.AWS.S3({params: {Bucket: this.bucketName}});
        }
        
        listObjects(cb) {
            var s3 = this._getNewS3();
            s3.listObjects({}, function (err, data) {
                
                cb(err, data);
                
            });
        }
        
        deleteObject(key, cb) {
            var s3 = this._getNewS3();
            s3.deleteObject({Key: key}, function (err, data) {
                
                cb(err, data);
                
            });
        }
        
        upload(options) {
            var fs = require('fs');
            
            var body = null;
            
            if (options.filename) {
                // check file exists
                /*if (!fs.existsSync(options.filename)) {
                    console.log('Filename' + options.filename + ' doesn\'t exist');
                }*/
                body = fs.createReadStream(options.filename);
            }
            else if (options.filebody) {
                body = options.filebody;
            }
            else {
                console.log('filename or filebody is not provided');
                return false;
            }
            
            //var body = fs.createReadStream(localFilename);
            //var s3obj = new AWS.S3({params: {Bucket: bucketName, Key: remoteFilename}});
            var s3 = this._getNewS3();
            var params = {Body: body, Key: options.key};
            if (options.contentType) {
                params.ContentType = options.contentType;
            }
            
            s3.upload(params).
              on('httpUploadProgress', function progress(evt) {
                  if (options.progress) {
                      options.progress(evt);
                  }
              }).
              send(function success(err, data) {
                 if (options.done) {
                      options.done(err, data);
                 }
              });
        }
        
    }
    
    return S3Code;
    
}());    

module.exports = S3Code;