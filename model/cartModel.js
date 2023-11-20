const mongoose=require("mongoose");
const cart=require("../model/cartModel");

const cartSchema=new mongoose.Schema({
    CourseName: { type: String, required:true},
    CourseDescription: { type: String },
    Price: { type: String },
    imageUrl:{type:String}
    
},{
    collection:"myCart"
});
const Cart=mongoose.model("Cart",cartSchema);
module.exports=Cart;