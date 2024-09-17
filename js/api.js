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


export function getAllTasks(filters) {
  return new Promise((resolve, reject) => {
    connectToDB().then(db => {
      let transaction = db.transaction(['tasksStore'], 'readonly');
      let tasks = transaction.objectStore('tasksStore');

      let index = tasks.index('createdIndex');

      if (filters.field === 'all') {
        let request = index.getAll();

        request.onsuccess = (event) => {
          resolve(event.target.result);
        }

        request.onerror = (error) => {
          reject(`Failed to get all tasks from database: ${error}`);
        }
      } else {

        let rows = [];

        index.openCursor().onsuccess = (event) => {
          let cursor = event.target.result;

          if (cursor) {
            rows = cursor.value[filters.field].includes(filters.query) ? [...rows, cursor.value] : rows;
            cursor.continue();
          } else {
            resolve(rows);
          }
        }
      }
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
        console.log('Task was successfully added!', event.target.result);
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
        console.log('Task was successfully deleted!');
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
        console.log('Task was successfully updated!', event.target.result);
        resolve(event.target.result);
      }

      request.onerror = (error) => {
        reject(`Failed to update task in database: ${error}`);
      }
    });
  });
}


