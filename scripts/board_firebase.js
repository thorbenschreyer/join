
/**
 * Updates the task category in Firebase.
 * @param {string} firebaseId - Firebase task ID.
 * @param {string} newCategory - Target category.
 */
async function updateFirebaseCategory(firebaseId, newCategory) {
  const url = `${BASE_URL}tasks/${firebaseId}.json`;

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
    throw new Error(
      `Firebase update failed: ${response.status}`
    );
  }

  return await response.json();
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
