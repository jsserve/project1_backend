var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TeamSchema = new Schema({
    name: {
        unique: true,
        type: String,
        required: true
    },
});


module.exports = mongoose.model('Team', TeamSchema);