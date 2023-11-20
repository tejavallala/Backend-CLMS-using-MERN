const mongoose=require("mongoose");
const paid=require("../model/paidModel");

const paidSchema=new mongoose.Schema({
    CourseName: { type: String},
    CourseDescription: { type: String },
    imageUrl:{type:String}
},{
    collection:"paidCourse"
});
const Paid=mongoose.model("Paid",paidSchema);
module.exports=Paid;