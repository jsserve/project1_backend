//var config = require('../config/database');
var S3Code = require('../lib/s3.class');
var awsCredentials = require('../config/aws_credentials');
var bucketName = require('../config/aws_config').bucketName;


function listS3(cb) {
    
    var s3Obj = new S3Code(awsCredentials, bucketName);

    s3Obj.listObjects(function (err, data) {
      
        cb(err, data);

    });
    

}


function deleteS3(key, cb) {

    var s3Obj = new S3Code(awsCredentials, bucketName);

    s3Obj.deleteObject(key, function (err, data) {
      if(err) throw err;
        
      //console.log(err);
      //console.log(data);

      if (cb) {
        cb(err, data);
      }

    });

}


function uploadS3(filename, key, cbDone) {

    //console.log('filename');
    //console.log(filename);
    console.log(key);
    //return;

    var startTime = Date.now();

    var s3Obj = new S3Code(awsCredentials, bucketName);
    
    var options = {        
        //filename: 'new.txt',
        //contentType: 'text/plain',            
        //key: `dir1/new_${timestamp}.txt`,
        
        //filebody: 'hello',
        
        filename: filename,
        key: key,            
        contentType: 'video/mp4',
        
        progress: function (evt) {
            console.log("Uploaded :: " + parseInt((evt.loaded * 100) / evt.total)+'%');
        },
        done: function (err, data) {
            if (err) throw err;
            console.log(data);
            console.log('file uploaded successfully');
            var endTime = Date.now();
            var totalTime = (endTime - startTime) / 1000;
            var min = Math.floor(totalTime / 60);
            var sec = Math.floor(totalTime - (min * 60));

            console.log('File uploaded by ' + min + ' min ' + sec + ' sec');
            cbDone();
        }
    };

    s3Obj.upload(options);
    

}

module.exports.listS3 = listS3;
module.exports.uploadS3 = uploadS3;
module.exports.deleteS3 = deleteS3;