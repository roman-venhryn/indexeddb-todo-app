# VanillaJS/IndexedDB To-Do app

This tool allows you to perform basic CRUD operations with tasks and store them inside IndexedDB browser storage;

Built using:

- Vanilla JS
- IndexedDB

## Features

- create tasks with title, description and due date
- mark tasks as completed
- delete tasks
- edit tasks
- filter tasks by their title or due date
- navigate with keyboard (move focus with "Tab", submit with "Enter", toggle with "Space")

## Installation

No servers nor bundlers are required. The application can be served with LiveServer VSCode extention.

To run the application locally, follow these steps:

1. Clone the repository: `git clone https://github.com/roman-venhryn/indexeddb-todo-app.git`
2. Navigate to the project directory: `cd github-users-search-tool`
3. Run LiveServer or just open index.html file

## Usage

To use this application, click "Add Task" button, enter title and due date for your task (these are required) and press "Save" button. This will add the task to the list and store it in the database.

You can add as many tasks as you need.

To mark task as completed - click on the circle on the left side of the task.
To edit task - click "Edit" button. Popup with form will open where you can edit and save changes.
To delete task - click on "Delete" button.

To filter tasks select field to filter (title or due date), type the query and submit form.
Note that the query input will be disabled if "All" field is selected.
