export function connectToDB() {
  return new Promise((resolve, reject) => {
    let connectionRequest = indexedDB.open('TasksDB', 1);

    connectionRequest.onerror = error => {
      reject(`Connection to database failed: ${error}`);
    };

    connectionRequest.onsuccess = event => {
      let db = connectionRequest.result;
      resolve(db);
    };

    connectionRequest.onupgradeneeded = event => {
      let db = event.target.result;
      if (!db.objectStoreNames.contains('tasksStore')) {
        let store = db.createObjectStore('tasksStore', { keyPath: "id" });

        store.createIndex('createdIndex', 'createdAt', { unique: false });
      }
    };
  });
}


export function getAllTasks() {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      let transaction = db.transaction(['tasksStore'], 'readonly');
      let tasks = transaction.objectStore('tasksStore');

      let index = tasks.index('createdIndex');

      let request = index.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      }

      request.onerror = (error) => {
        reject(`Failed to get all tasks from database: ${error}`);
      }
    })
  });
}

export function getFilteredTasks(filters) {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      let transaction = db.transaction(['tasksStore'], 'readonly');
      let tasks = transaction.objectStore('tasksStore');

      let index = tasks.index('createdIndex');

      let rows = [];

      index.openCursor().onsuccess = (event) => {
        let cursor = event.target.result;

        if (cursor) {
          rows = (new RegExp(filters.query, 'i').test(cursor.value[filters.field])) ? [...rows, cursor.value] : rows;
          cursor.continue();
        } else {
          resolve(rows);
        }
      }

      index.openCursor().onerror = error => reject(error);
    })
  });
}

export function addTask(data) {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      let transaction = db.transaction(['tasksStore'], 'readwrite');
      let tasks = transaction.objectStore('tasksStore');
      let request = tasks.add(data);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      }

      request.onerror = (error) => {
        reject(`Failed to add task to database: ${error}`);
      }
    });
  });
}

export function deleteTask(id) {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      let transaction = db.transaction(['tasksStore'], 'readwrite');
      let tasks = transaction.objectStore('tasksStore');
      let request = tasks.delete(id);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      }

      request.onerror = (error) => {
        reject(`Failed to add task to database: ${error}`);
      }
    });
  });
}

export function updateTask(data) {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      let transaction = db.transaction(['tasksStore'], 'readwrite');
      let tasks = transaction.objectStore('tasksStore');
      let request = tasks.put(data);

      request.onsuccess = (event) => {
        resolve(event.target.result);
      }

      request.onerror = (error) => {
        reject(`Failed to update task in database: ${error}`);
      }
    });
  });
}


