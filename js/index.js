import * as api from './api.js';
import * as utils from './utils.js';

let selectors = {};
let storedTasks = [];
let filters = {
  field: 'all',
  query: ''
};

const findElements = () => {
  selectors = {
    //overlay
    overlay: document.getElementById('overlay'),
    overlayFormHeading: document.getElementById('overlay-form-heading'),

    //task form elements
    taskForm: document.getElementById('task-form'),
    titleInput: document.getElementById('task-title'),
    dueDateInput: document.getElementById('task-dueDate'),
    descriptionInput: document.getElementById('task-description'),
    taskFormCancel: document.getElementById('task-form-cancel'),

    //add task button 
    addTaskButton: document.getElementById('add-task-button'),

    //tasks list element
    tasksList: document.getElementById('tasks-list'),

    //filter form elements
    filterForm: document.getElementById('filter-form'),
    filterFormFields: {
      queryInput: document.getElementById('filter-query'),
      fieldSelect: document.getElementById('filter-field'),
    },

    //toasts container
    toastContainer: document.getElementById('toast-container')
  }
}

const addEventListeners = () => {
  //add task button click
  selectors.addTaskButton.addEventListener('click', (e) => openTaskForm(e));

  //filter form select change
  selectors.filterFormFields.fieldSelect.addEventListener('change', (e) => {

    filters = { query: '', field: e.currentTarget.value };
    selectors.filterFormFields.queryInput.value = filters.query;

    //reset query and disable query input if 'All' is selected
    if (filters.field === 'all') {
      selectors.filterFormFields.queryInput.value = selectors.filterFormFields.queryInput.defaultValue;
      selectors.filterFormFields.queryInput.disabled = true;
    } else {
      selectors.filterFormFields.queryInput.disabled = false;
    }

    fetchAllTasks(filters);
  });

  //filter form query input change
  selectors.filterFormFields.queryInput.addEventListener('input', (e) => {
    filters = { ...filters, query: e.currentTarget.value };
  });

  //filter form submit
  selectors.filterForm.addEventListener('submit', (e) => handleFilterFormSubmit(e));

  //closing the edit form modal
  selectors.taskFormCancel.addEventListener('click', closeTaskForm);
  selectors.overlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeTaskForm();
  });
}

const handleTaskFormSubmit = (e, task) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.currentTarget));

  //set .error class if the field is empty
  for (const [, value] of Object.entries(e.currentTarget)) {
    if (value.tagName === 'INPUT') value.classList.toggle('error', !Boolean(value.value));
  }

  //check if there is enough data to create a task (title and due date)
  //if not enough - return
  //if enough - add task to DB and trigger render
  if (!data['task-title'] || !data['task-dueDate']) {
    console.log('not enough data!');
  } else {

    if (task) {
      //create updated task
      const newTask = {
        ...task,
        title: data['task-title'],
        description: data['task-description'],
        dueDate: utils.formatDateForDB(data['task-dueDate'])
      }

      //updating task to indexedDB
      updateTask(newTask);
    } else {
      //create new task from input fields
      const newTask = {
        id: crypto.randomUUID(), //create unique ID with window.crypto
        title: data['task-title'],
        description: data['task-description'],
        dueDate: utils.formatDateForDB(data['task-dueDate']),
        isCompleted: false,
        createdAt: Date.now()
      }

      //adding task to indexedDB
      addTask(newTask);
    }

    selectors.taskForm.reset();
    closeTaskForm(e);
  }


}

const handleFilterFormSubmit = (e) => {
  e.preventDefault();
  fetchAllTasks(filters);
}

const openTaskForm = (e, task) => {
  selectors.taskForm.reset();

  if (task) {
    selectors.overlayFormHeading.textContent = 'Edit task';

    //populate edit form fields with tasks values
    selectors.titleInput.value = task.title;
    selectors.dueDateInput.value = utils.formatDateForDatepicker(task.dueDate);
    selectors.descriptionInput.value = task.description;

    //add onsubmit eventlistener
    selectors.taskForm.onsubmit = (e) => handleTaskFormSubmit(e, task);
  } else {
    selectors.overlayFormHeading.textContent = 'Add new task';

    //add onsubmit eventlistener
    selectors.taskForm.onsubmit = (e) => handleTaskFormSubmit(e);
  }

  //show form after everything is set up
  selectors.overlay.classList.toggle('hidden', false);
  selectors.titleInput.focus();
}

const closeTaskForm = () => {
  selectors.taskForm.reset();
  selectors.overlay.classList.toggle('hidden', true);
}

const addTask = task => {
  api.addTask(task).then(() => {
    fetchAllTasks(filters);
    sendToast('Task was added successfully!', 'success');
  }).catch(() => {
    sendToast('Failed to add task! Try again.', 'error');
  });
}

const updateTask = task => {
  api.updateTask(task).then(() => {
    fetchAllTasks(filters);
    sendToast('Task was updated successfully!', 'success');
  }).catch(() => {
    sendToast('Failed to update task! Try again.', 'error');
  });
}

const deleteTask = id => {
  api.deleteTask(id).then(() => {
    fetchAllTasks(filters);
    sendToast('Task was deleted successfully!', 'success');
  }).catch(() => {
    sendToast('Failed to delete task! Try again.', 'error');
  });
}

const updateStoredTasks = tasks => {
  storedTasks = [...tasks];
  renderList();
}

const fetchAllTasks = filters => {
  if (filters.field === 'all') {
    api.getAllTasks().then(tasksFromDB => updateStoredTasks(tasksFromDB)).catch((error) => { sendToast('Failed to fetch tasks from DB!', 'error'); console.warn(error) });
  } else {
    api.getFilteredTasks(filters).then(tasksFromDB => updateStoredTasks(tasksFromDB)).catch((error) => { sendToast('Failed to fetch tasks from DB!', 'error'); console.warn(error) });
  }
}

const sendToast = (message, type = "success", delay = 3000) => {
  const toastElement = utils.newElement(
    'p', { classList: `toast-message toast-${type}` },
    message
  );

  selectors.toastContainer.append(toastElement);

  setTimeout(() => { toastElement.remove() }, delay);
}

//create DOM node for list
const getTaskListItem = (task) => {
  return utils.newElement(
    'li', { classList: `task-item ${task.isCompleted ? 'completed' : ''}` },
    utils.newElement('label', {},
      utils.newElement('input', {
        type: 'checkbox', name: 'checked', hidden: true, checked: task.isCompleted, onclick: () => updateTask({ ...task, isCompleted: !task.isCompleted })
      }),
    ),
    //li children
    utils.newElement('div', { classList: 'task-item__details' },
      utils.newElement('h3', { classList: 'task-item_title' }, task.title),
      utils.newElement('p', { classList: 'task-item_description' }, task.description),
      // utils.newElement('hr', {}),
      utils.newElement('p', { classList: 'task-item_due' }, `Due to: ${task.dueDate}`),
    ),
    utils.newElement('div', { classList: 'task-item__controls' },
      //controls children
      utils.newElement('button', { classList: 'button-secondary button-edit', onclick: (e) => openTaskForm(e, task) },
        ''
      ),
      utils.newElement('button', {
        classList: 'button-destructive button-delete',
        onclick: () => deleteTask(task.id)
      },
        ''
      ),
    )
  );
}

//rendering list of tasks based off storedTasks
const renderList = () => {
  utils.removeChildrenFromElement(selectors.tasksList);

  if (!storedTasks.length) {
    selectors.tasksList.append(
      utils.newElement(
        'li', {},
        utils.newElement('p', { classList: 'text-center' }, 'No tasks found!')
      )
    );
    return;
  }

  //transform tasks to list items
  const tasksListItems = storedTasks.map(task => getTaskListItem(task));

  const fragment = document.createDocumentFragment();
  //append tasks to fragment
  fragment.append(...tasksListItems);

  //append fragment to list
  selectors.tasksList.append(fragment);
};


const init = () => {
  findElements();
  addEventListeners();
  fetchAllTasks(filters);
}

//initial connection to database and initialization
api.connectToDB().then(init()).catch(error => {
  console.warn(error);
  sendToast('Failed to connect to IndexedDB!', error)
});
