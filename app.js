// app.js
const express = require("express");
const bodyParser = require("body-parser");
const dbConnection = require("./db");
const User = require("./models/user");
const Task = require("./models/task");
const router = express.Router();

const app = express();

// Middleware
app.use(bodyParser.json());

// Create a new user or add member
app.post("/create_user", async (req, res) => {
  try {
    const { email, password, isAdmin, hourlyRate } = req.body;

    // Get the next ID for the new user
    const nextId = await User.getNextId();

    // Create a new user with the generated ID
    const user = new User({
      _id: nextId,
      email,
      password,
      isAdmin,
      hourlyRate,
    });

    // Save the user to the database
    await user.save();

    // Return the newly created user object (excluding the password field)
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
    // Find all users except the admin user (assuming isAdmin is a boolean field)
    const members = await User.find({ isAdmin: false });

    // Return the member list (excluding the password field)
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

    // Check if the member with the given ID exists
    const member = await User.findOne({ _id: memberId }); // Change id to _id
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Delete the member from the database
    await User.deleteOne({ _id: memberId });
    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Error deleting member:", error.message);
    res.status(500).json({ error: "Error deleting member" });
  }
});

// Create a new task
app.post("/create_task", async (req, res) => {
  try {
    const {
      taskName,
      taskDescription,
      taskStartDate,
      taskEndDate,
      isPrerequisite,
      selectedMemberId,
    } = req.body;

    // Check if the selectedMemberId exists in the database
    const selectedMember = await User.findById(selectedMemberId);
    if (!selectedMember) {
      return res.status(400).json({ error: "Invalid selectedMemberId" });
    }

    const taskId = await Task.getNextId();

    // Create a new task object
    const newTask = new Task({
      taskId,
      taskName,
      taskDescription,
      taskStartDate,
      taskEndDate,
      isPrerequisite,
      selectedMemberId: selectedMemberId, // Store the selectedMemberId as a string
    });

    // Save the task to the database
    const savedTask = await newTask.save();

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error saving task:", error.message);
    res.status(500).json({ error: "Error creating task" });
  }
});

//tasks
app.get("/tasks", async (req, res) => {
  try {
    // Fetch all tasks from the database
    const tasks = await Task.find();

    // Map through the tasks and populate the selectedMember field with user data
    const tasksWithSelectedMember = await Promise.all(
      tasks.map(async (task) => {
        const selectedMemberId = task.selectedMemberId;
        const selectedMember = await User.findById(selectedMemberId);
        if (!selectedMember) {
          // Handle if selectedMemberId does not exist in the User collection
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

//All updated
