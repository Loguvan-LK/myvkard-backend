require('dotenv').config();
const { sendEmail } = require('./emailService');

sendEmail('your_test_email@example.com', '123456')
  .then(() => console.log('Success!'))
  .catch((err) => console.error('Failed:', err));
