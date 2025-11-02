// MongoDB initialization script
db = db.getSiblingDB('patterncrafter');

db.createUser({
  user: 'patterncrafter_user',
  pwd: 'patterncrafter_password',
  roles: [
    {
      role: 'readWrite',
      db: 'patterncrafter',
    },
  ],
});

// Create collections with validation (optional)
db.createCollection('users');
db.createCollection('projects');
db.createCollection('tasks');
db.createCollection('invites');
db.createCollection('manager_projects');
db.createCollection('project_working');
db.createCollection('annotator_tasks');

print('Database initialization completed!');
