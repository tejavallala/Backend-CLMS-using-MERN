const express = require("express");
const Cart = require("../model/cartModel");
const cartRoute = express.Router();


cartRoute.post("/add-to-cart", (req, res) => {
    const { CourseName, CourseDescription, Price,imageUrl } = req.body;
    const cartItem = new Cart({
        CourseName,
        CourseDescription,
        Price,
        imageUrl
    });
    cartItem.save()
        .then(() => {
            res.status(200).json({ message: "Cart item added successfully!" });
        })
        .catch((error) => {
            res.status(500).json({ error: "Error adding cart item to the database." });
        });
});

cartRoute.get("/",async(req,res)=>{
    try{
        const cart=await Cart.find();
        res.status(200).json(cart);
    }catch (error){
        console.log(error);
        res.status(500).json({message:"Internal error"});
    }
});

cartRoute.delete("/delete-course/:id", (req, res) => {
    Cart.findByIdAndRemove(req.params.id, (err, data) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      } else {
        res.json(data);
      }
    });
  });
  
module.exports = cartRoute;
