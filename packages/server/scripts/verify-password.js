const bcrypt = require('bcryptjs');

const storedHash = '$2a$10$zP/AHOLu7a6QuB68qgLIKOBqn.xazC582Voyb30gqZ7vwqssKXiEK';
const password = 'admin123';

bcrypt.compare(password, storedHash).then(result => {
  console.log('Password comparison result:', result);
});
