var xmlUtils = require('./xml_utils');
var tagapp = require('./xml_processing_funcs/tagapp');
var telestrator = require('./xml_processing_funcs/telestrator');
var sportscode = require('./xml_processing_funcs/sportscode');
var ortec = require('./xml_processing_funcs/ortec');
var instat_deep = require('./xml_processing_funcs/instat_deep');
var instat_simple = require('./xml_processing_funcs/instat_simple');
var easytag = require('./xml_processing_funcs/easytag');

var parseXmlFile = function(data, xmlDataAppType, callback) {
  xmlDataAppType = xmlDataAppType || 'tagapp';

  // for easytag we do CSV processing
  if (xmlDataAppType === 'easytag') {
    
      easytag.processResult(data, callback);
      return;
      
  }

  const Parser = require('xml2js-parser');
  
  var parser = new Parser({trim: true});
  parser.parseString(data, (err, result) => {

      if (xmlDataAppType === 'tagapp') {

          tagapp.processResult(err, result, callback);
      
      }
      else if (xmlDataAppType === 'telestrator') {
          
          telestrator.processResult(err, result, callback);
      
      }

      else if (xmlDataAppType === 'sportscode') {
        
          sportscode.processResult(err, result, callback);

      }

      else if (xmlDataAppType === 'ortec') {
        
          ortec.processResult(err, result, callback);
      }
      
      else if (xmlDataAppType === 'instat_deep') {
        
          instat_deep.processResult(err, result, callback);

      }

      else if (xmlDataAppType === 'instat_simple') {
        
          instat_simple.processResult(err, result, callback);
          
      }    

      else {
          
          console.log('other app type');
      
      }

  });
};


module.exports.parseXmlFile = parseXmlFile;