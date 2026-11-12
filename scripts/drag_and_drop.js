
let currentDraggedElement;
let taskMoveInProgress = false;

const BOARD_CATEGORIES = [
  "triage",
  "to-do",
  "in-progress",
  "await-feedback",
  "done"
];

/**
 * Initializes touch drag and drop.
 */
function initTouchPolyfill() {
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  if (!isTouch || initTouchPolyfill.initialized) return;
  if (typeof MobileDragDrop === "undefined") return;

  MobileDragDrop.polyfill({
    forceApply: true,
    holdToDrag: 250,
    dragImageTranslateOverride:
      MobileDragDrop.scrollBehaviourDragImageTranslateOverride,
  });

  initTouchPolyfill.initialized = true;
  setupPolyfillTouchmove();
}

/**
 * Installs the touchmove listener only once.
 */
function setupPolyfillTouchmove() {
  if (setupPolyfillTouchmove.initialized) return;

  window.addEventListener(
    "touchmove",
    () => {},
    { passive: false }
  );

  setupPolyfillTouchmove.initialized = true;
}

/**
 * Highlights all available drop zones.
 */
function setDropHighlights(enabled) {
  BOARD_CATEGORIES.forEach(category => {
    document
      .getElementById(`${category}-tasks`)
      ?.classList.toggle(
        "drag-area-highlight",
        enabled
      );
  });
}

/**
 * Starts dragging a task.
 */
function startDragging(event, id) {
  if (
    window.innerWidth < 1420 ||
    taskMoveInProgress
  ) {
    event.preventDefault();
    return;
  }

  currentDraggedElement = String(id);

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "text/plain",
    String(id)
  );

  applyDragStyles(event.currentTarget);
  setDropHighlights(true);
}

/**
 * Allows dropping into a task container.
 */
function allowDrop(event) {
  if (
    window.innerWidth >= 1420 &&
    !taskMoveInProgress
  ) {
    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
  }
}

/**
 * Returns the currently dragged task.
 */
function getDraggedTask(event) {
  const id =
    currentDraggedElement ??
    event?.dataTransfer?.getData("text/plain");

  return tasks.find(
    task => String(task.id) === String(id)
  );
}

/**
 * Moves a task into a column.
 */
async function movingTo(event, category) {
  event.preventDefault();

  if (
    taskMoveInProgress ||
    !BOARD_CATEGORIES.includes(category)
  ) {
    return;
  }

  const task = getDraggedTask(event);

  if (!task || task.currentTask === category) {
    return;
  }

  await reorderAndSaveCategory(task, category);
}

/**
 * Moves a task to another category and
 * updates the ordering in Firebase.
 */
async function reorderAndSaveCategory(
  task,
  category,
  targetTask = null
) {
  if (
    taskMoveInProgress ||
    !BOARD_CATEGORIES.includes(category)
  ) {
    return;
  }

  taskMoveInProgress = true;

  const originalCategory = task.currentTask;

  const originalIndexes = new Map(
    tasks.map(t => [t, t.sortIndex])
  );

  try {
    const column = tasks
      .filter(
        t =>
          t !== task &&
          t.currentTask === category
      )
      .sort(
        (a, b) =>
          (a.sortIndex ?? 0) -
          (b.sortIndex ?? 0)
      );

    const targetIndex = targetTask
      ? column.indexOf(targetTask)
      : -1;

    column.splice(
      targetIndex >= 0 ? targetIndex : 0,
      0,
      task
    );

    task.currentTask = category;

    column.forEach((t, i) => {
      t.sortIndex = i;
    });

    // Save category first.
    await updateFirebaseCategory(
      task.firebaseId,
      category
    );

    // Save the new task order.
    await updateCategoryOrder(column);

    // Update the board.
    renderAllTasks();

  } catch (error) {
    console.error(
      "Could not move task:",
      error
    );

    task.currentTask = originalCategory;

    originalIndexes.forEach((index, t) => {
      t.sortIndex = index;
    });

    // Reload from Firebase if available.
    try {
      if (typeof loadTasks === "function") {
        await loadTasks();
      }
    } catch (reloadError) {
      console.error(
        "Could not reload tasks:",
        reloadError
      );
    }

    renderAllTasks();

  } finally {
    taskMoveInProgress = false;
    currentDraggedElement = undefined;
    setDropHighlights(false);
  }
}

/**
 * Handles dropping a task onto another task.
 */
async function dropOnTask(event, targetId) {
  event.preventDefault();
  event.stopPropagation();

  if (taskMoveInProgress) return;

  const drag = getDraggedTask(event);

  const target = tasks.find(
    t => String(t.id) === String(targetId)
  );

  if (
    !drag ||
    !target ||
    drag === target
  ) {
    return;
  }

  await updateDroppedTaskOrder(
    drag,
    target
  );
}

/**
 * Moves a dragged task before the target task.
 */
async function updateDroppedTaskOrder(
  drag,
  target
) {
  await reorderAndSaveCategory(
    drag,
    target.currentTask,
    target
  );
}

/**
 * Saves the ordering of tasks in Firebase.
 */
async function updateCategoryOrder(column) {
  const responses = await Promise.all(
    column.map((task, index) =>
      fetch(
        `${BASE_URL}tasks/${task.firebaseId}/sortIndex.json`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(index)
        }
      )
    )
  );

  if (
    responses.some(response => !response.ok)
  ) {
    throw new Error(
      "Firebase rejected a task ordering update"
    );
  }
}

/**
 * Updates the ordering of all tasks.
 * Kept for compatibility.
 */
async function updateTasksOrder() {
  tasks.forEach((task, index) => {
    task.sortIndex = index;
  });

  await updateCategoryOrder(tasks);
}

/**
 * Stops dragging a task.
 */
function stopDragging(event) {
  event.currentTarget.classList.remove(
    "rotate-on-drag"
  );

  setDropHighlights(false);

  if (!taskMoveInProgress) {
    currentDraggedElement = undefined;
  }
}

/**
 * Applies visual drag styles.
 */
function applyDragStyles(element) {
  setTimeout(() => {
    if (element.isConnected) {
      element.classList.add(
        "rotate-on-drag"
      );
    }
  }, 0);
}

/**
 * Moves a task using the Move To dropdown.
 */
async function moveTaskToCategory(
  id,
  category
) {
  const task = tasks.find(
    t => String(t.id) === String(id)
  );

  if (
    !task ||
    task.currentTask === category ||
    taskMoveInProgress
  ) {
    return;
  }

  if (
    typeof closeMoveToDropdown === "function"
  ) {
    closeMoveToDropdown(id);
  }

  await reorderAndSaveCategory(
    task,
    category
  );
}
