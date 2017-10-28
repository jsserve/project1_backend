var xmlUtils = require('../xml_utils');

function processResult(err, result, callback) {

    // BeginTime->start
    // EndTime->end
    // Text->name
    // Team->team
    // Type->type
    

    if (!err) {
        var idCounter = 0;
        var newArr = result.Telestrator.Event.map(function (elem) {
            var tObj = elem.$; 
            var resObj = {
                id: [++idCounter],
                start: [xmlUtils.parseFromMillisecToSec(tObj.BeginTime)],
                end: [xmlUtils.parseFromMillisecToSec(tObj.EndTime)],
                team: [tObj.Team],
                name: [tObj.Text],
                type: [tObj.Type]
            };
            
            resObj = xmlUtils.validateXmlRecord(resObj);
            
              return resObj;

          }).filter(function (elem) {
              return elem ? true : false;
          });

          callback(err, newArr);
    }
    else {
        callback(err, {});
    }

}

module.exports.processResult = processResult;