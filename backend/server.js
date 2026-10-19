
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const helmet = require("helmet");
const path = require("path");

const app = express();
const PORT = 5000;

// Security and middleware
app.use(helmet());

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json({ limit: "10kb" }));

// Database: always use the backend folder
const db = new Database(path.join(__dirname, "tasks.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 0
  )
`);

// API health check
app.get("/", (req, res) => {
  res.json({ message: "Task Dashboard API is running!" });
});

// READ: Get all tasks
app.get("/api/tasks", (req, res) => {
  try {
    const tasks = db
      .prepare("SELECT * FROM tasks ORDER BY id DESC")
      .all();

    res.json(tasks);
  } catch (error) {
    console.error("Read error:", error.message);
    res.status(500).json({ error: "Could not load tasks" });
  }
});

// CREATE: Add a task
app.post("/api/tasks", (req, res) => {
  try {
    const { title, description = "" } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        error: "Title is required",
      });
    }

    if (title.trim().length > 150) {
      return res.status(400).json({
        error: "Title must be 150 characters or less",
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({
        error: "Description must be text",
      });
    }

    if (description.trim().length > 1000) {
      return res.status(400).json({
        error: "Description must be 1000 characters or less",
      });
    }

    const result = db.prepare(
      "INSERT INTO tasks (title, description) VALUES (?, ?)"
    ).run(title.trim(), description.trim());

    const task = db.prepare(
      "SELECT * FROM tasks WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(task);
  } catch (error) {
    console.error("Create error:", error.message);
    res.status(500).json({ error: "Could not create task" });
  }
});

// UPDATE: Edit a task or change completion status
app.put("/api/tasks/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const existing = db.prepare(
      "SELECT * FROM tasks WHERE id = ?"
    ).get(id);

    if (!existing) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { title, description, completed } = req.body;

    if (
      title !== undefined &&
      (typeof title !== "string" || !title.trim())
    ) {
      return res.status(400).json({
        error: "Title must be non-empty text",
      });
    }

    if (title !== undefined && title.trim().length > 150) {
      return res.status(400).json({
        error: "Title must be 150 characters or less",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        error: "Description must be text",
      });
    }

    if (
      description !== undefined &&
      description.trim().length > 1000
    ) {
      return res.status(400).json({
        error: "Description must be 1000 characters or less",
      });
    }

    if (
      completed !== undefined &&
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        error: "Completed must be true or false",
      });
    }

    db.prepare(`
      UPDATE tasks
      SET title = ?, description = ?, completed = ?
      WHERE id = ?
    `).run(
      title === undefined ? existing.title : title.trim(),
      description === undefined
        ? existing.description
        : description.trim(),
      completed === undefined
        ? existing.completed
        : Number(completed),
      id
    );

    const updated = db.prepare(
      "SELECT * FROM tasks WHERE id = ?"
    ).get(id);

    res.json(updated);
  } catch (error) {
    console.error("Update error:", error.message);
    res.status(500).json({ error: "Could not update task" });
  }
});

// DELETE: Remove a task
app.delete("/api/tasks/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const result = db.prepare(
      "DELETE FROM tasks WHERE id = ?"
    ).run(id);

    if (!result.changes) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error.message);
    res.status(500).json({ error: "Could not delete task" });
  }
});

// Handle invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  console.error("Server error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Close database cleanly when server stops
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
