// backend/hash-password.js
const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('\n=================================');
  console.log('Hashed Password:');
  console.log(hashedPassword);
  console.log('=================================\n');
  console.log('Copy the above hash and use it in the SQL command below:\n');
  console.log(`UPDATE users SET password = '${hashedPassword}' WHERE email = 'admin@thesugarstudio.com';`);
  console.log('\n');
}

hashPassword();