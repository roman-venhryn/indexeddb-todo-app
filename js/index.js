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
    //addForm elements
    addForm: document.getElementById('add-form'),
    addFormInputs: {
      titleInput: document.getElementById('title'),
      descriptionInput: document.getElementById('description'),
      dueDateInput: document.getElementById('dueDate'),
    },

    //tasks list element
    tasksList: document.getElementById('tasks-list'),

    //overlay
    overlay: document.getElementById('overlay'),

    //edit form elements
    editForm: document.getElementById('edit-form'),
    editFormInputs: {
      editTitleInput: document.getElementById('edit-title'),
      editDescriptionInput: document.getElementById('edit-description'),
      editDueDateInput: document.getElementById('edit-dueDate'),
    },
    editFormCancel: document.getElementById('edit-form-cancel'),

    //filter form elements
    filterForm: document.getElementById('filter-form'),
    filterFormFields: {
      queryInput: document.getElementById('filter-query'),
      fieldSelect: document.getElementById('filter-field'),
    }
  }
}

const addEventListeners = () => {

  //add form submit
  selectors.addForm.addEventListener('submit', handleAddFormSubmit);

  //filter form submit
  selectors.filterForm.addEventListener('submit', handleFilterFormSubmit);

  //filter form select change
  selectors.filterFormFields.fieldSelect.addEventListener('change', (e) => {
    filters = { query: '', field: e.target.value };

    //reset query and disable query input if 'All' is selected
    if (filters.field === 'all') {
      selectors.filterFormFields.queryInput.value = selectors.filterFormFields.queryInput.defaultValue;
      selectors.filterFormFields.queryInput.disabled = true;
    } else {
      selectors.filterFormFields.queryInput.disabled = false;
    }
  });

  //filter form query input change
  selectors.filterFormFields.queryInput.addEventListener('input', (e) => {
    filters = { ...filters, query: e.target.value };
  });

  //closing the edit form modal
  selectors.editFormCancel.addEventListener('click', closeEditForm);
  selectors.overlay.addEventListener('click', (e) => {
    if (e.target.id === 'overlay') closeEditForm();
  });
}

// functions for  handling form sumbitting
const handleEditFormSubmit = (e, task) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  //set .error class if the field is empty
  for (const [, value] of Object.entries(e.target)) {
    if (value.tagName === 'INPUT') value.classList.toggle('error', !Boolean(value.value));
  }

  //check if there is enough data to create a task (title and due date)
  //if not enough - return
  //if enough - add task to DB and trigger render
  if (!data['edit-title'] || !data['edit-dueDate']) {
    console.log('not enough data!');
  } else {

    //create new task from input fields
    const newTask = {
      ...task,
      title: data['edit-title'],
      description: data['edit-description'],
      dueDate: data['edit-dueDate']
    }

    //updating task to indexedDB
    api.updateTask(newTask).then(() => {
      selectors.editForm.reset();
      api.getAllTasks(filters).then(tasksFromDB => {
        updateStoredTasks(tasksFromDB);
        closeEditForm();
      });
    });
  }
}

const handleAddFormSubmit = (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(e.target));

  //set .error class if the field is empty
  for (const [, value] of Object.entries(e.target)) {
    if (value.tagName === 'INPUT') value.classList.toggle('error', !Boolean(value.value));
  }

  //check if there is enough data to create a task (title and due date)
  //if not enough - return
  //if enough - add task to DB and trigger render
  if (!data.title || !data.dueDate) {
    console.log('not enough data!');
  } else {

    //create new task from input fields
    const task = {
      id: crypto.randomUUID(), //create unique ID with window.crypto
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      isCompleted: false,
      createdAt: Date.now()
    }

    //adding task to indexedDB
    api.addTask(task).then(() => {
      selectors.addForm.reset();
      fetchAllTasks(filters);
    });
  }
}

const handleFilterFormSubmit = (e) => {
  e.preventDefault();
  fetchAllTasks(filters);
}

const updateTask = task => {
  api.updateTask(task).then(fetchAllTasks(filters));
}

const deleteTask = id => {
  api.deleteTask(id).then(fetchAllTasks(filters));
}

//create DOM node for list
const getTaskListItem = (task) => {
  return utils.newElement(
    'li', { classList: `task-item ${task.isCompleted ? 'completed' : ''}` },
    utils.newElement('label', {},
      utils.newElement('input', {
        type: 'checkbox', name: 'checked', classList: 'sr-only', checked: task.isCompleted, onclick: () => updateTask({ ...task, isCompleted: !task.isCompleted })
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
      utils.newElement('button', { classList: 'button-secondary button-edit', onclick: () => openEditForm(task) },
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

const openEditForm = (task) => {

  //populate edit form fields with tasks values
  selectors.editFormInputs.editTitleInput.value = task.title;
  selectors.editFormInputs.editDueDateInput.value = task.dueDate;
  selectors.editFormInputs.editDescriptionInput.value = task.description;

  //add onsubmit eventlistener
  selectors.editForm.onsubmit = (e) => handleEditFormSubmit(e, task);

  //show form after everything is set up
  selectors.overlay.classList.toggle('hidden', false);
}

const closeEditForm = () => {
  selectors.editForm.reset();
  selectors.overlay.classList.toggle('hidden', true);
}

const updateStoredTasks = tasks => {
  storedTasks = [...tasks];
  renderList();
}

const fetchAllTasks = filters => {
  if (filters.field === 'all') {
    api.getAllTasks().then(tasksFromDB => updateStoredTasks(tasksFromDB));
  } else {
    api.getFilteredTasks(filters).then(tasksFromDB => updateStoredTasks(tasksFromDB));
  }
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
  //append tasks to list
  tasksListItems.forEach(task => selectors.tasksList.append(task));
};


const init = () => {
  findElements();
  addEventListeners();
  fetchAllTasks(filters);
}

//initial connection to database and initialization
api.connectToDB().then(init()).catch(error => {
  console.warn(error);
});
