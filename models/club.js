var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ClubSchema = new Schema({
    name: {
        unique: true,
        type: String,
        required: true,
        // lowercase: true, 
        trim: true
    },
    activated: {
        type: Boolean, 
        default: true
    },
    logo:{
        type: String
    },
    slug:{
        type: String
    },
    location: {
        formatted_address: {
            type: String
        },
        international_phone_number: {
            type: String
        },
        name: {
            type: String
        },
        photos: [{
            type: String
        }],
        url: {
            type: String
        },
        website: {
            type: String
        },
        lat: {
            type: String
        },
        lon:{
            type: String
        },
        icon:{
            type: String
        }
    },
    teams:{
        type: Array,
    },
});

module.exports = mongoose.model('Club', ClubSchema);