
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    profilePic:{
        type:String
    },

    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },

    theme:{
        type:String,
        enum:["light","dark"],
        default:"light"
    },

    followers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],

    following:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],

    resetOtp: {
        type: String,
        default: null
    },

    resetOtpExpiry: {
        type: Date,
        default: null
    }
},
{timestamps:true}
);

module.exports = mongoose.model("User",userSchema);