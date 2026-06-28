const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

slug:{
type:String
},

content:{
type:String,
required:true
},

thumbnail:{
type:String
},

author:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

category:{
type:mongoose.Schema.Types.ObjectId,
ref:"Category"
},

tags:[
String
],

likes:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"Like"
}
],

comments:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"Comment"
}
]

},
{timestamps:true}
);

module.exports = mongoose.model("Post",postSchema);