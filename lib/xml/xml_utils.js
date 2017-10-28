function getFieldValues(data, field) {
  if (data && Array.isArray(data)) {
      var resultArr = data.map(function (elem) {
          return elem[field][0];
      });
      return resultArr;
  }
  return null;
}

/*function parseFromMillisecToMinSec(inputTime) {
    var resultTime = parseInt(inputTime);
    var resultTime = resultTime / 1000;
    var min = Math.floor(resultTime / 60);
    var sec = Math.round(resultTime - (min * 60));
    min = (min < 10) ? '0' + min : '' + min;
    sec = (sec < 10) ? '0' + sec : '' + sec;
    return min + ':' + sec;
}

function parseFromSecToMinSec(inputTime) {
    var resultTime = parseInt(inputTime);
    var min = Math.floor(resultTime / 60);
    var sec = Math.round(resultTime - (min * 60));
    min = (min < 10) ? '0' + min : '' + min;
    sec = (sec < 10) ? '0' + sec : '' + sec;
    return min + ':' + sec;
}*/

function parseFromMillisecToSec(inputTime) {
    var resultTime = parseInt(inputTime);
    var resultTime = resultTime / 1000;
    resultTime = Math.round(resultTime);
    return resultTime + '';
}

function parseSec(inputTime) {
    var resultTime = parseInt(inputTime);
    resultTime = Math.round(resultTime);
    return resultTime + '';
}

function validateXmlRecord(resObj) {

    if (!Array.isArray(resObj.name)) {
        return false;
    }
    var namesArr = resObj.name.map(function(nameVal) {
        if (typeof nameVal === 'string') {
            nameVal = nameVal.trim();
            return (nameVal.length) ? nameVal : false; 
        }
        return false;        
    }).filter(function(nameVal) {
        return (nameVal) ? nameVal : false; 
    });

    resObj.name = namesArr;
    
    return (resObj.name.length) ? resObj : false;    
}


module.exports.getFieldValues = getFieldValues;
module.exports.parseFromMillisecToSec = parseFromMillisecToSec;
module.exports.parseSec = parseSec;
module.exports.validateXmlRecord = validateXmlRecord;
