const cloudinary = require("cloudinary").v2;

const { CLOUD_NAME, CLOUD_KEY, CLOUD_SECRET } = process.env;

const isValidCloudinaryValue = (value) => {
  return typeof value === 'string' && value.trim() && !value.trim().startsWith('your_');
};

const isConfigured = isValidCloudinaryValue(CLOUD_NAME) && isValidCloudinaryValue(CLOUD_KEY) && isValidCloudinaryValue(CLOUD_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_KEY,
    api_secret: CLOUD_SECRET,
  });
} else {
  console.warn('Cloudinary is not configured or is using placeholder credentials. Falling back to local uploads for images.');
}

module.exports = { cloudinary, isConfigured };