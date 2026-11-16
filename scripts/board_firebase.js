/**
 * Updates the task status in Firebase and notifies n8n.
 * @param {string} firebaseId - Firebase task ID.
 * @param {string} newCategory - New Kanban status.
 */
async function updateFirebaseCategory(firebaseId, newCategory) {
  const url = `${BASE_URL}tasks/${firebaseId}.json`;

  // 1. Load current ticket
  const taskResponse = await fetch(url);

  if (!taskResponse.ok) {
    throw new Error(`Firebase read failed: ${taskResponse.status}`);
  }

  const task = await taskResponse.json();

  if (!task) {
    throw new Error("Ticket not found");
  }

  const oldCategory = task.currentTask;

  // 2. No notification if status is unchanged
  if (oldCategory === newCategory) {
    return task;
  }

  // 3. Save new status in Firebase
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentTask: newCategory,
    }),
  });

  if (!response.ok) {
    throw new Error(`Firebase update failed: ${response.status}`);
  }

  const result = await response.json();

  // 4. Notify n8n after successful update
  const webhookUrl = "http://localhost:5678/webhook/join-ticket-status";

  const payload = {
    firebaseId: firebaseId,
    ticketId: task.id,
    title: task.title,
    createdBy: task.createdBy,
    createdByEmail: task.createdByEmail,
    oldStatus: oldCategory,
    newStatus: newCategory,
  };

  try {
    const notificationResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!notificationResponse.ok) {
      throw new Error(
        `n8n notification failed: ${notificationResponse.status}`,
      );
    }
  } catch (error) {
    console.error("Ticket updated, but n8n notification failed:", error);
  }

  return result;
}

/**
 * Updates the subtask state in Firebase.
 * @param {string} firebaseId - The Firebase ID of the task.
 * @param {number} index - The subtask index.
 * @param {string} state - The new state.
 */
async function updateSubtaskInFirebase(firebaseId, index, state) {
  const url = `${BASE_URL}tasks/${firebaseId}/subtasks/${index}.json`;
  const payload = JSON.stringify({ current_state: state });
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-HTTP-Method-Override": "PATCH",
    },
    body: payload,
  });
}

/**
 * Deletes a task from Firebase and updates the UI.
 * @param {string} taskId - The task ID.
 */
async function deleteTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;
  const url = `${BASE_URL}tasks/${task.firebaseId}.json`;
  await fetch(url, {
    method: "DELETE",
  });
  await loadTasks();
  renderAllTasks();
  closeOverlay("task");
}

/**
 * Saves the edited task to Firebase.
 * @param {string} taskId - The task ID.
 */
async function saveEditedTask(taskId) {
  const task = getTaskFromGlobalArray(taskId);
  updateTaskObjectWithNewValues(task);
  await updateTaskWithPost(task.firebaseId, task);
  refreshTaskDialog(task);
}

/**
 * Sends a PUT request to update the task in Firebase.
 * @param {string} taskId - The Firebase task ID.
 * @param {Object} taskData - The task data.
 * @returns {Promise<Object>} The fetch response json.
 */
async function updateTaskWithPost(taskId, taskData) {
  const response = await fetch(BASE_URL + `tasks/${taskId}.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-HTTP-Method-Override": "PUT",
    },
    body: JSON.stringify(taskData),
  });
  return await response.json();
}
