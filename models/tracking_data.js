var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TrackingDataSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    original_filename: {
        type: String,
        required: true
    },
    size: {
        type: String
    },
    path: {
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
    default: {
        type: Boolean,
        default: false
    }
});


module.exports = mongoose.model('TrackingData', TrackingDataSchema);