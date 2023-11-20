const mongoose=require("mongoose");
const admin=require("../model/adminModel");

const adminSchema=new mongoose.Schema({
    email:{type:String},
    password:{type:String}
},{
    collection:"admin"
});
const Admin=mongoose.model("Admin",adminSchema);
module.exports=Admin;