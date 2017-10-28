var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        unique: false,
        required: false
    },
    password: {
        type: String,
        required: true
    },
    club: {
        //type: String,
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    clubFunction: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    activate: {
        type: Boolean,
        default: false
    },
    role: {
        type: Number
    },
    activate: {
        type: Boolean,
        default: false
    },
    teams: {
        type: Array,
    },
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});

UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};


module.exports = mongoose.model('User', UserSchema);