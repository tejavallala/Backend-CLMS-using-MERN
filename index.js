const mongoose = require("mongoose");
const express = require("express");
const userController = require("./controller/userController");
const courseController = require("./controller/courseController");
const cartController=require("./controller/cartController");
const paidController=require("./controller/paidController");
const adminController=require("./controller/adminController");
const supportController=require("./controller/supportController");
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 15;

const myEmitter = new EventEmitter();
myEmitter.setMaxListeners(15);

const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
mongoose.set("strictQuery", true);
mongoose.connect("mongodb+srv://user:1234@cluster0.gqdixow.mongodb.net/userdb");
var db = mongoose.connection;
db.on("open", () => console.log("Connected to DB"));
db.on("error", () => console.log("Error occurred"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use("/userRoute", userController);
app.use("/courseRoute", courseController);
app.use("/cartRoute",cartController);
app.use("/paidRoute",paidController);
app.use("/adminRoute",adminController);
app.use("/supportRoute",supportController);

app.listen(4000, () => {
    console.log("Server connected at 4000");
});
