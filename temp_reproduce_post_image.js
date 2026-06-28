const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const registerRes = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'testuser' + Date.now(), email: `testuser${Date.now()}@example.com`, password: 'Password1!' })
    });
    const reg = await registerRes.json();
    console.log('register status', registerRes.status, reg);
    const token = reg.token;
    if (!token) {
      throw new Error('No token from registration');
    }
    const catRes = await fetch('http://localhost:3000/api/v1/categories');
    const cats = await catRes.json();
    console.log('categories status', catRes.status, cats);
    const categoryId = cats.categories?.[0]?._id;
    if (!categoryId) {
      throw new Error('No category ID');
    }
    const filePath = path.join(__dirname, 'test-image.txt');
    fs.writeFileSync(filePath, 'test content');
    const formData = new FormData();
    formData.append('title', 'Image Test Post');
    formData.append('category', categoryId);
    formData.append('content', 'This is a test post with an image file.');
    formData.append('tags', 'test,image');
    formData.append('image', fs.createReadStream(filePath));
    const res = await fetch('http://localhost:3000/api/v1/posts/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const text = await res.text();
    console.log('post status', res.status, text);
  } catch (error) {
    console.error(error);
  }
})();