var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlaylistSchema = new Schema({
   
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    playdata:[{
        eventId: {
            type: Number,
        },
        eventStart: {
            type: Number,
        },
        eventEnd:{
            type: Number,
        },
        eventName:{
            type: String,
        },
        eventTeam:{
            type: String,
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Video',
        },
        eventDataId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'eventDatas',
        },
    }],
    
    name:{
        type: String,
        unique: true,
        required: true
    },
    
    assignedUsers: [{
        type: String
    }],
    
    
});


module.exports = mongoose.model('Playlist', PlaylistSchema);