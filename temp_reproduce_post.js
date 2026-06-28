const fetch = globalThis.fetch;
(async () => {
  try {
    const registerRes = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'testuser' + Date.now(), email: `testuser${Date.now()}@example.com`, password: 'Password1!' })
    });
    const reg = await registerRes.json();
    console.log('register status', registerRes.status, reg);
    if (!reg.token) {
      throw new Error('Registration failed, no token returned');
    }

    const token = reg.token;

    const catRes = await fetch('http://localhost:3000/api/v1/categories');
    const cats = await catRes.json();
    console.log('categories status', catRes.status, cats);
    const categoryId = cats.categories?.[0]?._id || '';
    if (!categoryId) {
      throw new Error('No category id available');
    }

    const formData = new FormData();
    formData.append('title', 'Test Post');
    formData.append('content', 'This is a test post created by reproduction script.');
    formData.append('category', categoryId);
    formData.append('tags', 'test,api');

    const res = await fetch('http://localhost:3000/api/v1/posts/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await res.text();
    console.log('post status', res.status, data);
  } catch (error) {
    console.error('error', error);
    process.exit(1);
  }
})();
