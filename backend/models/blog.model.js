const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const blogSchema = new Schema({
  title: { type: String, required: true },
  image: { url: { type: String, required: true } },
  content: [
    {
      header: { type: String, required: true },
      contentHeader: { type: String, required: true },
    },
  ],
  tag: { type: [String], default: [] },
  userName: { type: String, required: true },
  // userId: { type: String, required: true },
  createOn: { type: Date, default: new Date().getTime() },
});
module.exports = mongoose.model("Blog", blogSchema);
