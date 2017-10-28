var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VideoSchema = new Schema({
    path: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    screenshot_path: {
        type: String
    },
    original_filename: {
        type: String,
        required: true
    },
    mimetype: {
        type: String
    },
    size: {
        type: Number
    },
    title: {
        type: String,
        // required: true
    },
    type: {
        type: String,
        required: true
    },
    date: {
        required: false,
        type: Date
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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
        lon: {
            type: String
        },
        icon: {
            type: String
        }
    },
    team1: {
        type: String
        // type: mongoose.Schema.Types.ObjectId || String,
        // ref: 'clubs'
    },
    team2: {
        type: String
        // type: mongoose.Schema.Types.ObjectId || String,
        // ref: 'clubs'
    },
    player: {
        type: String
    },
    club: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clubs',
        // required: true
    },
    club2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clubs',
        // required: true
    },
    assignedUsers: [{
        type: String
    }],
    competition: {
        type: String
    },
    description: {
        type: String
    },
    scoreTeam1: {
        type: String
    },
    scoreTeam2: {
        type: String
    },
    season: {
        type: String
    },
    tacticsTeam1: {
        type: String
    },
    tacticsTeam2: {
        type: String
    },
    viewCounter: {
        type: Number,
        default: 0
    },
}, { strict: false, bypassDocumentValidation: true, toObject: { virtuals: true }, toJSON: { virtuals: true }, timestamps: true });

VideoSchema.set('validateBeforeSave', false);
module.exports = mongoose.model('Video', VideoSchema);