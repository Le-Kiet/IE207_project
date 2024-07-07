const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const courseSchema = new Schema({
  title: { type: String, required: true },
  content: [
    {
      word: { type: String, required: true },
      kanji: { type: String, required: true },
      translate: { type: String, required: true },
      important: { type: String, default: false },
    },
  ],
  tags: { type: String, default: "" },
  isPinned: { type: Boolean, default: false },
  userId: { type: String, required: true },
  createOn: { type: Date, default: new Date().getTime() },

  score: { type: Number, default: -1 },
});
module.exports = mongoose.model("Course", courseSchema);
