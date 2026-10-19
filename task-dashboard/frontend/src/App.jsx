
import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/tasks";
const TASKS_PER_PAGE = 5;

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAll, setShowAll] = useState(false);

  const completedCount = tasks.filter(
    (task) => Boolean(task.completed)
  ).length;

  const remainingCount = tasks.length - completedCount;

  const visibleTasks = showAll
    ? tasks
    : tasks.slice(0, TASKS_PER_PAGE);

  // READ: Load all tasks
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(API);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load tasks");
      }

      setTasks(data);
      setError("");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Backend connection failed. Please check the server."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // CREATE: Add a task
  async function addTask(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not add task");
      }

      setTitle("");
      setDescription("");
      setShowAll(false);
      setSuccess("Task added successfully.");
      await fetchTasks();
    } catch (err) {
      setError(err.message || "Task could not be added.");
    } finally {
      setSaving(false);
    }
  }

  // UPDATE: Complete or undo
  async function toggleTask(task) {
    setActiveTaskId(task.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: !Boolean(task.completed),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update task");
      }

      setSuccess(
        data.completed
          ? "Task marked as completed."
          : "Task marked as pending."
      );

      await fetchTasks();
    } catch (err) {
      setError(err.message || "Task could not be updated.");
    } finally {
      setActiveTaskId(null);
    }
  }

  // UPDATE: Edit title and description
  async function editTask(task) {
    const newTitle = window.prompt(
      "Enter updated task title:",
      task.title
    );

    if (newTitle === null) return;

    if (!newTitle.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    const newDescription = window.prompt(
      "Enter updated description:",
      task.description || ""
    );

    if (newDescription === null) return;

    setActiveTaskId(task.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not edit task");
      }

      setSuccess("Task updated successfully.");
      await fetchTasks();
    } catch (err) {
      setError(err.message || "Task could not be edited.");
    } finally {
      setActiveTaskId(null);
    }
  }

  // DELETE: Remove a task
  async function deleteTask(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    setActiveTaskId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete task");
      }

      setSuccess("Task deleted successfully.");

      if (tasks.length <= TASKS_PER_PAGE + 1) {
        setShowAll(false);
      }

      await fetchTasks();
    } catch (err) {
      setError(err.message || "Task could not be deleted.");
    } finally {
      setActiveTaskId(null);
    }
  }

  return (
    <main className="container">
      <header className="page-header">
        <p className="eyebrow">WORKSPACE</p>
        <h1>Task Dashboard</h1>
        <p className="subtitle">
          Plan your work. Track your progress.
        </p>
      </header>

      {/* Dashboard statistics */}
      <section className="stats" aria-label="Task statistics">
        <div className="stat">
          <span>Total Tasks</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="stat">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>

        <div className="stat">
          <span>Remaining</span>
          <strong>{remainingCount}</strong>
        </div>
      </section>

      {/* Add task form */}
      <section className="panel">
        <h2>Add New Task</h2>

        <form onSubmit={addTask}>
          <label htmlFor="task-title">Task title</label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Finish project report"
            maxLength={150}
            required
          />

          <label htmlFor="task-description">
            Description (optional)
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add task details..."
            maxLength={1000}
            rows={3}
          />

          <button type="submit" disabled={saving}>
            {saving ? "Adding..." : "+ Add Task"}
          </button>
        </form>
      </section>

      {/* Task list */}
      <section className="panel">
        <div className="list-heading">
          <h2>Your Tasks</h2>
          <span className="task-count">{tasks.length} total</span>
        </div>

        {error && (
          <p className="message error" role="alert">
            {error}
          </p>
        )}

        {success && (
          <p className="message success" role="status">
            {success}
          </p>
        )}

        {loading && <p className="info-message">Loading tasks...</p>}

        {!loading && !error && tasks.length === 0 && (
          <p className="empty">
            No tasks yet. Add your first task!
          </p>
        )}

        {!loading && (
          <div className="task-list">
            {visibleTasks.map((task) => {
              const isCompleted = Boolean(task.completed);
              const isBusy = activeTaskId === task.id;

              return (
                <article className="task" key={task.id}>
                  <div className="task-info">
                    <h3 className={isCompleted ? "done" : ""}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="task-description">
                        {task.description}
                      </p>
                    )}

                    <span
                      className={
                        isCompleted
                          ? "status complete"
                          : "status"
                      }
                    >
                      {isCompleted ? "Completed" : "Pending"}
                    </span>
                  </div>

                  <div className="actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => toggleTask(task)}
                      disabled={isBusy}
                    >
                      {isCompleted ? "Undo" : "Complete"}
                    </button>

                    <button
                      type="button"
                      className="secondary"
                      onClick={() => editTask(task)}
                      disabled={isBusy}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => deleteTask(task.id)}
                      disabled={isBusy}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && tasks.length > TASKS_PER_PAGE && (
          <button
            type="button"
            className="secondary show-more"
            onClick={() => setShowAll((previous) => !previous)}
          >
            {showAll
              ? "Show Less"
              : `Show All (${tasks.length} tasks)`}
          </button>
        )}
      </section>

      <footer className="page-footer">
        Task Dashboard · Your work, organized.
      </footer>
    </main>
  );
}

export default App;

