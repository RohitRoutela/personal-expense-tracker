const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const port = process.env.PORT || 3000;

const app = express();
app.use(express.static(path.join(__dirname))); 
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

// MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/student", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mongoose schemas and models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: { type: String },
  tokenExpiration: { type: Date },
});

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const expenseSchema = new mongoose.Schema({
  email: { type: String, required: true }, 
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  date: { type: Date, default: Date.now },
});

const Users = mongoose.model("User", userSchema);
const Contact = mongoose.model("Contact", contactSchema);
const Expenses = mongoose.model("Expense", expenseSchema);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "SignUp", "SignUp.html"));
});

app.get("/contactUs", (req, res) => {
  res.sendFile(path.join(__dirname, "contactUs.html"));
});


// Register new user
app.post("/post", async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required!" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new Users({ username, email, password: hashedPassword });
    await user.save();

    console.log("User saved:", user);

    res.send(`
      <script>
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('email', '${user.email}');
        alert('Signup successful');
        window.location.href = 'index.html';
      </script>
    `);
  } catch (err) {
    console.error("Error saving user:", err);
    if (err.code === 11000) {
      res.status(400).json({ message: "Email is already registered!" });
    } else {
      res.status(500).json({ message: "Error saving user. Please try again." });
    }
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    console.log("User logged in:", user);

    res.send(`
      <script>
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('email', '${user.email}');
        alert('Login successful');
        window.location.href = 'index.html';
      </script>
    `);
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add Expense route
app.post("/addExpense", async (req, res) => {
  const { email, category, amount, description } = req.body;

  if (!email || !category || !amount) {
    return res.status(400).json({ message: "All fields (email, category, amount) are required!" });
  }

  try {
    const expense = new Expenses({ email, category, amount, description });
    await expense.save();
    console.log("Expense added:", expense);
    res.status(201).json({ message: "Expense added successfully" });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ message: "Error adding expense" });
  }
});

// View Expenses route
app.get("/viewExpenses", async (req, res) => {
  const { email } = req.query; 
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const expenses = await Expenses.find({ email }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ message: "Error fetching expenses" });
  }
});

// Contact Us 
app.post("/contactUs", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    const contactMessage = new Contact({ name, email, message });
    await contactMessage.save();
    console.log("Contact message saved:", contactMessage);
    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Error saving contact message:", err);
    res.status(500).json({ message: "Failed to send message. Please try again." });
  }
});


// Forgot Password route
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = Date.now() + 3600000;

    user.resetToken = resetToken;
    user.tokenExpiration = tokenExpiration;
    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset",
      html: `<p>You requested a password reset.</p>
             <p>Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset email sent" });
  } catch (err) {
    console.error("Error sending password reset email:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Reset Password route
app.post("/reset-password", async (req, res) => {
  const { password, confirmPassword, token } = req.body;

  try {
    const user = await Users.findOne({
      resetToken: token,
      tokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.tokenExpiration = undefined;

    await user.save();
    res.json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete an expense
app.delete("/deleteExpense/:id", async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "User email is required" });
  }

  try {
    const deletedExpense = await Expenses.findOneAndDelete({ _id: id, email });
    if (!deletedExpense) {
      return res.status(404).json({ message: "Expense not found or unauthorized" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ message: "Error deleting expense" });
  }
});

// Get total expenses and count
app.get("/dashboardStats", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const totalExpenses = await Expenses.aggregate([
      { $match: { email } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const expenseCount = await Expenses.countDocuments({ email });

    res.json({
      total: totalExpenses.length > 0 ? totalExpenses[0].total : 0,
      count: expenseCount,
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });
  

// Start server
app.listen(port, () => {
  console.log(`Server is running at port no ${port}`);
});
