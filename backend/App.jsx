import { useEffect, useRef, useState } from "react";
import "./App.css";
import API from "./api";

const initialUser = JSON.parse(localStorage.getItem("blogUser")) || null;
const initialTheme = localStorage.getItem("blogTheme") || "light";

function App() {
  const [user, setUser] = useState(initialUser);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [view, setView] = useState("feed");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [postForm, setPostForm] = useState({ title: "", category: "", tags: "", image: null });
  const [commentDraft, setCommentDraft] = useState({});
  const [theme, setTheme] = useState(initialTheme);
  const [flash, setFlash] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const editorRef = useRef(null);

  const showFlash = (message, type = "success") => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 3800);
  };

  const persistSession = (userData, token) => {
    localStorage.setItem("blogUser", JSON.stringify(userData));
    localStorage.setItem("blogToken", token);
    setUser(userData);
  };

  const applyTheme = (nextTheme) => {
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("blogTheme", nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const fetchPosts = async (query = {}) => {
    try {
      const params = new URLSearchParams(query).toString();
      const res = await API.get(`/posts${params ? `?${params}` : ""}`);
      setPosts(res.data.posts || []);
    } catch (error) {
      showFlash(error.message || "Unable to load posts", "error");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(res.data.categories || []);
    } catch (error) {
      showFlash(error.message || "Unable to load categories", "error");
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch (error) {
      showFlash(error.message || "Unable to load notifications", "error");
    }
  };

  const fetchAnalytics = async () => {
    if (!user || user.role !== "admin") return;
    try {
      const res = await API.get("/admin/analytics");
      setAnalytics(res.data.analytics || null);
    } catch (error) {
      showFlash(error.message || "Unable to load analytics", "error");
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchAnalytics();
    }
  }, [user]);

  const handleAuthInput = (event, type) => {
    const { name, value } = event.target;
    if (type === "login") {
      setLoginForm((current) => ({ ...current, [name]: value }));
    } else {
      setRegisterForm((current) => ({ ...current, [name]: value }));
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const res = await API.post("/auth/login", loginForm);
      persistSession(res.data.user, res.data.token);
      setModalOpen(false);
      showFlash(`Welcome back, ${res.data.user.name}`);
    } catch (error) {
      showFlash(error.message || "Login failed", "error");
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const res = await API.post("/auth/register", registerForm);
      persistSession(res.data.user, res.data.token);
      setModalOpen(false);
      showFlash("Registration successful ??");
    } catch (error) {
      showFlash(error.message || "Registration failed", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("blogUser");
    localStorage.removeItem("blogToken");
    setUser(null);
    showFlash("Logged out successfully");
  };

  const handleSearch = () => {
    fetchPosts({ keyword: searchTerm });
  };

  const handleCategorySelect = async (categoryId) => {
    setView("feed");
    fetchPosts({ category: categoryId });
  };

  const handlePostInput = (event) => {
    const { name, value, files } = event.target;
    setPostForm((current) => ({
      ...current,
      [name]: files ? files[0] : value,
    }));
  };

  const handlePostSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setAuthMode("login");
      setModalOpen(true);
      return;
    }

    try {
      const postContent = editorRef.current?.innerHTML || "";
      if (!postForm.title || !postForm.category || !postContent.trim()) {
        showFlash("Title, category, and content are required", "error");
        return;
      }

      const formData = new FormData();
      formData.append("title", postForm.title);
      formData.append("category", postForm.category);
      formData.append("tags", postForm.tags);
      formData.append("content", postContent);
      if (postForm.image) formData.append("image", postForm.image);

      await API.post("/posts/create", formData);
      setPostForm({ title: "", category: "", tags: "", image: null });
      if (editorRef.current) editorRef.current.innerHTML = "";
      showFlash("Post published successfully");
      fetchPosts();
    } catch (error) {
      showFlash(error.message || "Unable to publish post", "error");
    }
  };

  const handleEditorCommand = (command) => {
    if (command === "createLink") {
      const url = prompt("Enter a URL");
      if (url) document.execCommand(command, false, url);
      return;
    }
    document.execCommand(command, false, "");
    editorRef.current?.focus();
  };

  const handleLike = async (postId) => {
    if (!user) {
      setAuthMode("login");
      setModalOpen(true);
      return;
    }
    try {
      await API.post(`/posts/${postId}/likes`);
      fetchPosts();
      fetchNotifications();
    } catch (error) {
      showFlash(error.message || "Unable to like", "error");
    }
  };

  const handleBookmark = async (postId) => {
    if (!user) {
      setAuthMode("login");
      setModalOpen(true);
      return;
    }
    try {
      await API.post("/bookmarks", { post: postId });
      showFlash("Saved to bookmarks");
    } catch (error) {
      showFlash(error.message || "Unable to bookmark", "error");
    }
  };

  const handleCommentToggle = (postId) => {
    setActiveCommentPost((current) => (current === postId ? null : postId));
  };

  const handleCommentSubmit = async (postId) => {
    if (!user) {
      setAuthMode("login");
      setModalOpen(true);
      return;
    }
    if (!commentDraft[postId]?.trim()) {
      showFlash("Enter a comment before submitting", "error");
      return;
    }
    try {
      await API.post(`/posts/${postId}/comments`, {
        body: commentDraft[postId],
      });
      setCommentDraft((current) => ({ ...current, [postId]: "" }));
      setActiveCommentPost(null);
      showFlash("Comment posted");
      fetchPosts();
      fetchNotifications();
    } catch (error) {
      showFlash(error.message || "Unable to post comment", "error");
    }
  };

  const renderPosts = () => {
    if (!posts.length) {
      return <div className="empty-state">No posts found. Create the first story.</div>;
    }

    return posts.map((post) => (
      <article className="post-card" key={post._id}>
        {post.thumbnail && <img className="post-image" src={post.thumbnail} alt={post.title} />}
        <div className="post-content">
          <div className="post-labels">
            <span>{post.category?.name || "Uncategorized"}</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
          <h3>{post.title}</h3>
          <div className="post-meta">
            <span>by {post.author?.name || "Guest"}</span>
            <span>{post.likes?.length || 0} likes</span>
            <span>{post.comments?.length || 0} comments</span>
          </div>
          <p className="post-preview">{post.content.replace(/<[^>]+>/g, "").slice(0, 170)}...</p>
          <div className="action-row">
            <button onClick={() => handleLike(post._id)}>?? Like</button>
            <button onClick={() => handleBookmark(post._id)}>?? Bookmark</button>
            <button onClick={() => handleCommentToggle(post._id)}>?? Comment</button>
          </div>
          {activeCommentPost === post._id && (
            <div className="comment-box">
              <textarea
                value={commentDraft[post._id] || ""}
                onChange={(e) => setCommentDraft((current) => ({ ...current, [post._id]: e.target.value }))}
                placeholder="Write a comment..."
              />
              <button className="button button-primary" onClick={() => handleCommentSubmit(post._id)}>
                Submit comment
              </button>
            </div>
          )}
        </div>
      </article>
    ));
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      <header className="topbar">
        <div className="brand">BlogFlow</div>
        <nav className="nav-links">
          {[
            { label: "Home", value: "feed" },
            { label: "Write", value: "write" },
            { label: "Categories", value: "categories" },
          ].map((item) => (
            <button
              key={item.value}
              className={view === item.value ? "nav-button active" : "nav-button"}
              onClick={() => setView(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button className="icon-button" onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}>??</button>
          <button className="main-button" onClick={user ? handleLogout : () => setModalOpen(true)}>
            {user ? "Logout" : "Login"}
          </button>
        </div>
      </header>

      <main className="layout-grid">
        <section className="panel main-panel">
          {flash && <div className={`flash ${flash.type}`}>{flash.message}</div>}
          {view === "feed" && (
            <>
              <div className="hero-card">
                <div>
                  <p className="eyebrow">Full-stack blog</p>
                  <h1>Modern, responsive blog frontend for your Express backend.</h1>
                  <p>Browse posts, like content, leave comments, and publish stories with a rich editor.</p>
                </div>
                <div className="hero-actions">
                  <button className="button button-primary" onClick={() => setView("write")}>Write a story</button>
                  <button className="button button-secondary" onClick={() => setView("categories")}>Browse topics</button>
                </div>
              </div>

              <div className="search-row">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts, tags or authors..."
                />
                <button className="button button-primary" onClick={handleSearch}>Search</button>
              </div>

              <div className="posts-grid">{renderPosts()}</div>
            </>
          )}

          {view === "write" && (
            <div className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Write post</p>
                  <h2>Publish your next story</h2>
                </div>
              </div>
              <form className="post-form" onSubmit={handlePostSubmit}>
                <div className="form-grid">
                  <label>
                    Title
                    <input
                      name="title"
                      type="text"
                      value={postForm.title}
                      onChange={handlePostInput}
                      placeholder="Write a headline that draws readers in"
                      required
                    />
                  </label>
                  <label>
                    Category
                    <select name="category" value={postForm.category} onChange={handlePostInput} required>
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option value={category._id} key={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tags
                    <input
                      name="tags"
                      type="text"
                      value={postForm.tags}
                      onChange={handlePostInput}
                      placeholder="news, tutorial, tips"
                    />
                  </label>
                  <label>
                    Feature image
                    <input name="image" type="file" accept="image/*" onChange={handlePostInput} />
                  </label>
                </div>
                <div className="editor-area">
                  <div className="editor-toolbar">
                    {[
                      { label: "B", command: "bold" },
                      { label: "I", command: "italic" },
                      { label: "U", command: "underline" },
                      { label: "List", command: "insertUnorderedList" },
                      { label: "Link", command: "createLink" },
                    ].map((button) => (
                      <button type="button" key={button.command} onClick={() => handleEditorCommand(button.command)}>
                        {button.label}
                      </button>
                    ))}
                  </div>
                  <div ref={editorRef} className="editor" contentEditable="true" data-placeholder="Write your post content here..."></div>
                </div>
                <div className="button-row">
                  <button className="button button-primary" type="submit">Publish post</button>
                </div>
              </form>
            </div>
          )}

          {view === "categories" && (
            <div className="panel-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Categories</p>
                  <h2>Browse topics</h2>
                </div>
              </div>
              <div className="categories-grid">
                {categories.map((category) => (
                  <button key={category._id} className="category-card" onClick={() => handleCategorySelect(category._id)}>
                    <span>{category.name}</span>
                    <small>{category.slug}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="sidebar-panel">
          <div className="widget-card">
            <h3>Account</h3>
            {user ? (
              <div className="account-card">
                <strong>{user.name}</strong>
                <p>{user.email}</p>
                <p className="role-badge">{user.role}</p>
                <button className="button button-secondary" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <p className="muted">Login to publish posts, like content, and get notifications.</p>
            )}
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <h3>Notifications</h3>
              <span>{notifications.filter((item) => !item.read).length}</span>
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <p className="muted">No notifications yet.</p>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div className="notification-item" key={notification._id}>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                  </div>
                ))}
              )}
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <h3>Analytics</h3>
            </div>
            {analytics ? (
              <div className="analytics-grid">
                {Object.entries(analytics).map(([key, value]) => (
                  <div className="analytics-card" key={key}>
                    <span>{key.replace(/([A-Z])/g, " $1")}</span>
                    <strong>{Array.isArray(value) ? value.length : value}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Admin analytics show here after login.</p>
            )}
          </div>
        </aside>
      </main>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <button className={authMode === "login" ? "tab-button active" : "tab-button"} onClick={() => setAuthMode("login")}>Login</button>
              <button className={authMode === "register" ? "tab-button active" : "tab-button"} onClick={() => setAuthMode("register")}>Register</button>
            </div>
            {authMode === "login" ? (
              <form className="auth-form" onSubmit={handleLogin}>
                <label>Email</label>
                <input name="email" type="email" value={loginForm.email} onChange={(event) => handleAuthInput(event, "login")} required />
                <label>Password</label>
                <input name="password" type="password" value={loginForm.password} onChange={(event) => handleAuthInput(event, "login")} required />
                <button className="button button-primary" type="submit">Login</button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleRegister}>
                <label>Name</label>
                <input name="name" type="text" value={registerForm.name} onChange={(event) => handleAuthInput(event, "register")} required />
                <label>Email</label>
                <input name="email" type="email" value={registerForm.email} onChange={(event) => handleAuthInput(event, "register")} required />
                <label>Password</label>
                <input name="password" type="password" value={registerForm.password} onChange={(event) => handleAuthInput(event, "register")} required />
                <button className="button button-primary" type="submit">Register</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
