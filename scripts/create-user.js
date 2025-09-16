// Simple script to create a test user
// This will be replaced by the registration API in the actual app

const users = [
  {
    id: '1',
    email: 'admin@admin.com',
    name: 'Admin User',
    password: 'admin',
    googleDriveConnected: false,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    email: 'dimitris@tombros.gr',
    name: 'Dimitris Tombros',
    password: '6944442333',
    googleDriveConnected: false,
    createdAt: new Date().toISOString()
  }
];

console.log('Test users created:');
users.forEach(user => {
  console.log(`- ${user.name} (${user.email})`);
});

console.log('\nYou can now login with:');
console.log('Email: dimitris@tombros.gr');
console.log('Password: 6944442333');
