var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventDataSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: true
    },
    eventData:{
        type: Array,
    },
   
    default: {
        type: Boolean,
        default: false
    }
});


module.exports = mongoose.model('EventData', EventDataSchema);