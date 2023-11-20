const mongoose=require("mongoose");
const Support=require("../model/supportModel");

const supportSchema=new mongoose.Schema({
    Name: { type: String, required: true },
    Email: { type: String, required: true },
    Subject:{type:String},
    Message:{type:String},
    Answer:{type:String}

},{
    collection:"support"
});
module.exports=mongoose.model("supportSchema",supportSchema);