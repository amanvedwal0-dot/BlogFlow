require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

console.log('\n🔍 Testing Cloudinary credentials...');
console.log('   Cloud Name :', process.env.CLOUD_NAME);
console.log('   API Key    :', process.env.CLOUD_KEY);
console.log('   API Secret :', process.env.CLOUD_SECRET ? '***' + process.env.CLOUD_SECRET.slice(-4) : 'NOT SET');

cloudinary.api.ping()
  .then((result) => {
    console.log('\n✅ Cloudinary connection SUCCESSFUL!');
    console.log('   Status:', result.status);
  })
  .catch((err) => {
    console.error('\n❌ Cloudinary connection FAILED!');
    console.error('   Error:', err.message || err);
  });
