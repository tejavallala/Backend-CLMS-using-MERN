const express = require("express");
const supportModel = require("../model/supportModel");

const supportRoute = express.Router();

// Create a new support request
supportRoute.post("/create-query", (req, res) => {
  supportModel.create(req.body, (err, data) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    else res.json(data);
  });
});

// Get all support requests
supportRoute.get("/get-requests", (req, res) => {
  supportModel.find((err, data) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    else res.json(data);
  });
});

// Delete a support request by ID
supportRoute.delete("/delete-request/:id", (req, res) => {
  const requestId = req.params.id;

  supportModel.findByIdAndRemove(requestId, (err, data) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    else if (!data) return res.status(404).json({ error: "Request not found" });
    else res.json({ message: "Request deleted successfully" });
  });
});

// Get only the answer field for all support requests
supportRoute.get("/get-answers", (req, res) => {
  supportModel.find({}, { Answer: 1, _id: 0 }, (err, answers) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    else res.json(answers);
  });
});


supportRoute.post("/answer-request/:id", (req, res) => {
  const requestId = req.params.id;
  const { answer } = req.body;

  supportModel.findByIdAndUpdate(
    requestId,
    { $set: { Answer: answer } },
    { new: true },
    (err, updatedRequest) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      else if (!updatedRequest) return res.status(404).json({ error: "Request not found" });
      else res.json(updatedRequest);
    }
  );
});
module.exports = supportRoute;
