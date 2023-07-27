// app.js
const express = require("express");
const bodyParser = require("body-parser");
const dbConnection = require("./db");
const User = require("./models/user");
const Task = require("./models/task");

const app = express();

// Middleware
app.use(bodyParser.json());

// Create a new user or add member
app.post("/create_user", async (req, res) => {
  try {
    const { name, email, password, isAdmin, hourlyRate } = req.body;

    const nextId = await User.getNextId();

    const user = new User({
      userId: nextId,
      name,
      email,
      password,
      isAdmin,
      hourlyRate,
    });

    await user.save();

    const userWithoutPassword = { ...user.toObject(), password: undefined };
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ error: "Error creating user" });
  }
});

// Login user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.password !== password) {
      console.log("Coming");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userWithoutPassword = { ...user.toObject(), password: undefined };
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

//get all members
app.get("/members", async (req, res) => {
  try {
    const members = await User.find({ isAdmin: false });

    const membersWithoutPassword = members.map((member) => ({
      ...member.toObject(),
      password: undefined,
    }));

    res.status(200).json(membersWithoutPassword);
  } catch (error) {
    console.error("Error fetching member list:", error.message);
    res
      .status(500)
      .json({ error: "An error occurred while fetching member list" });
  }
});

// Delete member
app.post("/delete_member", async (req, res) => {
  try {
    const memberId = req.body.id;

    console.log(memberId);
    const member = await User.findOne({ userId: memberId });
    console.log(member);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    await User.deleteOne({ userId: memberId });
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error.message);
    res.status(500).json({ error: "Error deleting member" });
  }
});

// Create a new task
app.post("/create_task", async (req, res) => {
  console.log(req.body);
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      isPrerequisite,
      selectedMemberId,
    } = req.body;

    const selectedMember = await User.findOne({ userId: selectedMemberId });
    if (!selectedMember) {
      return res.status(400).json({ error: "Invalid selectedMemberId" });
    }

    const taskId = await Task.getNextId();

    const newTask = new Task({
      taskId: taskId,
      name: name,
      description: description,
      startDate: startDate,
      endDate: endDate,
      isStarted: false,
      isCompleted: false,
      isPrerequisite: isPrerequisite,
      hoursWorked: 0,
      selectedMemberId: selectedMemberId,
    });

    console.log("newTask");
    console.log(newTask);

    const savedTask = await newTask.save();

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error saving task:", error.message);
    res.status(500).json({ error: "Error creating task" });
  }
});

//tasks
app.post("/tasks", async (req, res) => {
  try {
    const userID = req.body.currentUserId;

    const user = await User.findOne({ userId: userID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let tasks;

    if (user.isAdmin) {
      tasks = await Task.find();
    } else {
      tasks = await Task.find({ selectedMemberId: userID });
    }

    const tasksWithSelectedMember = await Promise.all(
      tasks.map(async (task) => {
        const selectedMember = await User.findOne({
          userId: task.selectedMemberId,
        });
        if (!selectedMember) {
          return {
            ...task.toObject(),
            selectedMember: null,
          };
        }
        return {
          ...task.toObject(),
          selectedMember: selectedMember.toObject(),
        };
      })
    );

    console.log(tasksWithSelectedMember);
    res.status(200).json(tasksWithSelectedMember);
  } catch (error) {
    console.error("Error getting tasks:", error.message);
    res.status(500).json({ error: "Error getting tasks" });
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
