require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require("./models/user.model");
const Note = require("./models/note.model");
const Course = require("./models/course.model");
const Blog = require("./models/blog.model");

const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities");

app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

app.get("/", (req, res) => {
  res.json({ data: "hello" });
});

//Create Acc API
app.post("/create-account", async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName) {
    return res
      .status(400)
      .json({ error: true, message: "Full Name is require" });
  }
  if (!email) {
    return res.status(400).json({ error: true, message: "Email is require" });
  }
  if (!password) {
    return res
      .status(400)
      .json({ error: true, message: "Password is require" });
  }
  const isUser = await User.findOne({ email: email });
  if (isUser) {
    return res.json({
      error: true,
      message: "User alr exist",
    });
  }
  const user = new User({
    fullName,
    email,
    password,
  });
  await user.save();
  const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "360000m,",
  });
  return res.json({
    error: false,
    user,
    accessToken,
    message: "Register successfully",
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is require" });
  }
  if (!password) {
    return res.status(400).json({ message: "Password is require" });
  }
  const userInfo = await User.findOne({ email: email });
  if (!userInfo) {
    return res.status(400).json({ message: "User is not found" });
  }
  if (userInfo.email == email && userInfo.password == password) {
    const user = { user: userInfo };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "36000m",
    });
    return res.json({
      error: false,
      message: "Login successfully",
      email,
      accessToken,
    });
  } else {
    return res.status(400).json({
      error: true,
      message: "Invalid Credentials",
    });
  }
});

app.get("/get-user", authenticateToken, async (req, res) => {
  const { user } = req.user;
  const isUser = await User.findOne({ _id: user._id });
  if (!isUser) {
    return res.sendStatus(401);
  }
  return res.json({
    user: isUser,
    message: "",
  });
});

//Add Note
app.post("/add-note", authenticateToken, async (req, res) => {
  const { title, content, tags } = req.body;
  const { user } = req.user;

  if (!title) {
    return res.status(400).json({ error: true, message: "Title is required" });
  }
  if (!content) {
    return res
      .status(400)
      .json({ error: true, message: "content is required" });
  }
  try {
    const note = new Note({
      title,
      content,
      tags: tags || [],
      userId: user._id,
    });
    await note.save();
    return res.json({
      error: false,
      note,
      message: "Note added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});
//Edit
app.post("/edit-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { title, content, tags, isPinned } = req.body;
  const { user } = req.user;
  if (!title && !content && !tags) {
    return res
      .status(400)
      .json({ error: true, message: "No changes provided" });
  }
  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });
    if (!note) {
      return res.status(404).json({ error: true, message: "Note not found" });
    }

    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    if (isPinned) note.isPinned = isPinned;
    await note.save();
    return res.json({
      error: false,
      note,
      message: "Note updated successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
});

//Get all note
app.get("/get-all-notes/", authenticateToken, async (req, res) => {
  const { user } = req.user;
  try {
    const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });
    return res.json({
      error: false,
      notes,
      message: "All notes retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

//Delete Note
app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });
    if (!note) {
      return res.status(404).json({ error: true, message: "Note not found" });
    }
    await Note.deleteOne({ _id: noteId, userId: user._id });
    return res.json({
      error: false,
      message: "Note deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

//Update isPinned
app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { isPinned } = req.body;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });
    if (!note) {
      return res.status(404).json({ error: true, message: "Note not found" });
    }

    if (isPinned) note.isPinned = isPinned || false;
    await note.save();
    return res.json({
      error: false,
      note,
      message: "Note updated successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
});

//Get user
app.listen(8000);
module.exports = app;

//Add Course
app.post("/create", authenticateToken, async (req, res) => {
  const { title, content, tags } = req.body;
  const { user } = req.user;

  if (!title) {
    return res.status(400).json({ error: true, message: "Title is required" });
  }
  if (!content) {
    return res
      .status(400)
      .json({ error: true, message: "Add some word to proceed" });
  }
  try {
    const course = new Course({
      title,
      content,
      tags,
      userId: user._id,
    });
    await course.save();
    return res.json({
      error: false,
      course,
      message: "Course added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

//Edit Course
app.post("/edit-course/:courseId", authenticateToken, async (req, res) => {
  const courseId = req.params.courseId;
  const { title, content, tag, isPinned } = req.body;

  const { user } = req.user;
  if (!title && !content && !tag) {
    return res
      .status(400)
      .json({ error: true, message: "No changes provided" });
  }
  try {
    const course = await Course.findOne({ _id: courseId, userId: user._id });

    if (!course) {
      return res.status(404).json({ error: true, message: "Note not found" });
    }

    if (title) course.title = title;
    if (content) course.content = content;
    if (tag) course.tag = tag;
    if (isPinned) course.isPinned = isPinned;
    await course.save();
    return res.json({
      error: false,
      course,
      message: "course updated successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: true, message: "Internal server error" });
  }
});

//Delete Note
app.delete("/delete-course/:courseId", authenticateToken, async (req, res) => {
  const courseId = req.params.courseId;
  const { user } = req.user;

  try {
    const course = await Course.findOne({ _id: courseId, userId: user._id });
    if (!course) {
      return res.status(404).json({ error: true, message: "Course not found" });
    }
    await Course.deleteOne({ _id: courseId, userId: user._id });
    return res.json({
      error: false,
      message: "Course deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

//Get All Courses
app.get("/get-all-courses/", authenticateToken, async (req, res) => {
  const { user } = req.user;
  try {
    const course = await Course.find({ userId: user._id }).sort({
      isPinned: -1,
    });
    return res.json({
      error: false,
      course,
      message: "All course retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});
//Add Blog
app.post("/create-blog", authenticateToken, async (req, res) => {
  const { title, content, tag, image } = req.body;
  const { user } = req.user;

  if (!title) {
    return res.status(400).json({ error: true, message: "Title is required" });
  }
  if (!image) {
    return res.status(400).json({ error: true, message: "Image is required" });
  }
  if (!tag) {
    return res.status(400).json({ error: true, message: "tag is required" });
  }
  if (!content) {
    return res
      .status(400)
      .json({ error: true, message: "Add some word to proceed" });
  }
  try {
    const blog = new Blog({
      title,
      content,
      tag,
      image,
      userName: user.fullName,
    });
    await blog.save();
    return res.json({
      error: false,
      blog,
      message: "Course added successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

//Get All Blog
app.get("/get-all-blog", authenticateToken, async (req, res) => {
  const { user } = req.user;
  try {
    const blog = await Blog.find();
    return res.json({
      error: false,
      blog,
      message: "All course retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});

//Edit Course
app.get(
  "/get-details-course/:courseId",
  authenticateToken,
  async (req, res) => {
    const courseId = req.params.courseId;
    const { title, content, tag, isPinned } = req.body;

    const { user } = req.user;

    // if (!title && !content && !tag) {
    //   return res
    //     .status(400)
    //     .json({ error: true, message: "No changes provided" });
    // }
    try {
      const course = await Course.findOne({ _id: courseId, userId: user._id });
      return res.json({
        error: false,
        course,
        message: "All course retrieved successfully",
      });
      if (!course) {
        return res.status(404).json({ error: true, message: "Note not found" });
      }

      if (title) course.title = title;
      if (content) course.content = content;
      if (tag) course.tag = tag;
      if (isPinned) course.isPinned = isPinned;
      await course.save();
      return res.json({
        error: false,
        course,
        message: "course updated successfully",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ error: true, message: "Internal server error" });
    }
  }
);

//Search blog
app.get("/search-blogs/", authenticateToken, async (req, res) => {
  const { user } = req.user;
  const { query } = req.query;
  if (!query) {
    return res
      .status(400)
      .json({ error: true, message: "Search query is required" });
  }
  try {
    const matchingBlogs = await Blog.find({
      title: { $regex: new RegExp(query, "i") },
    });
    return res.json({
      error: false,
      blogs: matchingBlogs,
      message: "Notes matching the search query retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

app.get("/sort-blogs/", authenticateToken, async (req, res) => {
  const { user } = req.user;
  const { query } = req.query;
  // if (!query) {
  //   return res
  //     .status(400)
  //     .json({ error: true, message: "Search query is required" });
  // }
  try {
    const matchingBlogs = await Blog.find({
      tag: query,
    });
    return res.json({
      error: false,
      blogs: matchingBlogs,
      message: "Notes matching the search query retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

// Get all blog by user
app.get("/get-all-blog-by-user/", authenticateToken, async (req, res) => {
  const { user } = req.user;
  try {
    const blog = await Blog.find({ userId: user.fullName }).sort({
      isPinned: -1,
    });
    return res.json({
      error: false,
      blog,
      message: "All blog retrieved successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: "Internal Server Error",
    });
  }
});
// app.get("/get-all-notes/", authenticateToken, async (req, res) => {
//   const { user } = req.user;
//   try {
//     const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });
//     return res.json({
//       error: false,
//       notes,
//       message: "All notes retrieved successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       error: true,
//       message: "Internal Server Error",
//     });
//   }
// });
