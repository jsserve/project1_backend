var xmlUtils = require('../xml_utils');
var csvParse = require('csv-parse');

function processResult(data, callback) {

    // start->position/1000
    // end->start + duree/1000
    // name->action
    // colortag->colortag


    parseCSV(data, function(err, arr) {
        
        if (!err) {
            var newArr = arr.filter(function (elem) {
                return elem ? true : false;
            });

            callback(err, newArr);
        }
        else {
            callback(err, {});
        }

    });    

}

function parseCSV(csvStr, cb) {
    
    csvParse(csvStr, {
        //comment: '#',
        delimiter: ';'
    }, function(err, output){
      //console.log(output);
        
        var names = output.shift();
        names.forEach(function (elem, i) {
            names[i] = elem.replace(/[\u00E9\u00C9]/g, 'e').toLowerCase();
        });
        
        var idCounter = 0;
        var resultArr = output.map(function(elem) {
            var tmpObj = {};
            tmpObj[names[0]] = elem[0];
            tmpObj[names[1]] = elem[1];
            tmpObj[names[2]] = elem[2];
            tmpObj[names[3]] = elem[3];
            tmpObj[names[4]] = elem[4];
            tmpObj[names[5]] = elem[5];
            
            
            var start = Math.floor(tmpObj.position / 1000);
            var end = Math.round(start + Math.round(tmpObj.duree / 1000));
            var resObj = {
                id: [++idCounter],
                start: [start],
                end: [end],
                name: [tmpObj.action],
                colortag: [tmpObj.colortag],
            };

            resObj = xmlUtils.validateXmlRecord(resObj);
        
            return resObj;
        });
        
        //console.log(resultArr);

        cb(null, resultArr);
        
    });
    
}

module.exports.processResult = processResult;