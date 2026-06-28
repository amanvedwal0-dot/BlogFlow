import { useEffect, useRef, useState } from "react";
import "./App.css";
import API from "./api";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import ForgotPasswordPage from "./ForgotPasswordPage";

const defaultCategories = [
  { _id: "tech", name: "Technology", slug: "technology" },
  { _id: "news", name: "News", slug: "news" },
  { _id: "lifestyle", name: "Lifestyle", slug: "lifestyle" },
  { _id: "travel", name: "Travel", slug: "travel" },
  { _id: "tutorial", name: "Tutorial", slug: "tutorial" },
];

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
  const [authPage, setAuthPage] = useState(null); // null | "login" | "register" | "forgot-password"
  const [postForm, setPostForm] = useState({ title: "", category: "", tags: "", image: null });
  const [editingPostId, setEditingPostId] = useState(null);
  const [commentDraft, setCommentDraft] = useState({});
  const [theme, setTheme] = useState(initialTheme);
  const [flash, setFlash] = useState(null);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [helpMessages, setHelpMessages] = useState([]);
  const [helpForm, setHelpForm] = useState({ subject: "", message: "" });
  const [submittingHelp, setSubmittingHelp] = useState(false);
  const editorRef = useRef(null);
  const categoryOptions = categories.length ? categories : defaultCategories;
  const categorySelectionOptions = categories;

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
    } finally {
      setLoadingCategories(false);
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
      fetchHelpMessages();

      // Poll notifications every 30 seconds so admin sees new help requests in real-time
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchHelpMessages = async () => {
    if (!user || user.role !== "admin") return;
    try {
      const res = await API.get("/help/messages");
      setHelpMessages(res.data.helpMessages || []);
    } catch (error) {
      showFlash(error.response?.data?.message || "Unable to load help messages", "error");
    }
  };

  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    if (!helpForm.subject.trim() || !helpForm.message.trim()) {
      showFlash("Subject and message are required", "error");
      return;
    }
    setSubmittingHelp(true);
    try {
      const res = await API.post("/help/messages", helpForm);
      showFlash(res.data.message || "Support ticket submitted!");
      setHelpForm({ subject: "", message: "" });
      fetchNotifications(); // Refresh so admin notification center stays in sync
    } catch (error) {
      showFlash(error.response?.data?.message || "Unable to submit help request", "error");
    } finally {
      setSubmittingHelp(false);
    }
  };

  const handleHelpResolve = async (msgId) => {
    try {
      const res = await API.patch(`/help/messages/${msgId}/resolve`);
      showFlash(res.data.message || "Resolved!");
      fetchHelpMessages();
    } catch (error) {
      showFlash(error.response?.data?.message || "Unable to resolve request", "error");
    }
  };

  const handleLogin = async (formData) => {
    try {
      const res = await API.post("/auth/login", formData);
      persistSession(res.data.user, res.data.token);
      showFlash(`Welcome back, ${res.data.user.name}`);
      return true;
    } catch (error) {
      showFlash(error.response?.data?.message || error.message || "Login failed", "error");
      return false;
    }
  };

  const handleRegister = async (formData) => {
    try {
      const res = await API.post("/auth/register", formData);
      persistSession(res.data.user, res.data.token);
      showFlash("Registration successful! Welcome aboard 🎉");
      return true;
    } catch (error) {
      showFlash(error.response?.data?.message || error.message || "Registration failed", "error");
      return false;
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
      setAuthPage("login");
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

      if (editingPostId) {
        await API.put(`/posts/${editingPostId}`, formData);
        showFlash("Post updated successfully");
      } else {
        await API.post("/posts/create", formData);
        showFlash("Post published successfully");
      }

      setEditingPostId(null);
      setPostForm({ title: "", category: "", tags: "", image: null });
      if (editorRef.current) editorRef.current.innerHTML = "";
      fetchPosts();
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Unable to publish post";
      showFlash(message, "error");
    }
  };

  const handleEditPost = (post) => {
    setEditingPostId(post._id);
    setPostForm({
      title: post.title,
      category: post.category?._id || post.category,
      tags: post.tags?.join(", ") || "",
      image: null,
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = post.content || "";
    }
    setView("write");
    showFlash("Editing post. Make changes and publish.");
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setPostForm({ title: "", category: "", tags: "", image: null });
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const handleDeletePost = async (postId) => {
    if (!user) {
      setAuthPage("login");
      return;
    }

    try {
      await API.delete(`/posts/${postId}`);
      showFlash("Post deleted successfully");
      fetchPosts();
    } catch (error) {
      showFlash(error.message || "Unable to delete post", "error");
    }
  };

  const handleReadPost = async (postId) => {
    try {
      const res = await API.get(`/posts/${postId}`);
      setSelectedPost(res.data.post);
      setView("post-detail");
      window.scrollTo(0, 0);
    } catch (error) {
      showFlash(error.message || "Failed to load post details", "error");
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!user) return;
    try {
      await API.patch("/notifications/mark-all-read");
      fetchNotifications();
      showFlash("All notifications marked as read");
    } catch (error) {
      showFlash(error.message || "Failed to mark notifications as read", "error");
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    if (!user) return;
    try {
      await API.patch(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      showFlash(error.message || "Failed to update notification", "error");
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
      setAuthPage("login");
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
      setAuthPage("login");
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
      setAuthPage("login");
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
      if (selectedPost && selectedPost._id === postId) {
        const res = await API.get(`/posts/${postId}`);
        setSelectedPost(res.data.post);
      }
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
        {post.thumbnail && (
          <div className="post-image-container">
            <img className="post-image" src={post.thumbnail} alt={post.title} />
          </div>
        )}
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
            <button onClick={() => handleReadPost(post._id)} className="button-read-story">📖 Read Story</button>
            <button onClick={() => handleLike(post._id)}>👍 Like</button>
            <button onClick={() => handleBookmark(post._id)}>🔖 Bookmark</button>
            <button onClick={() => handleCommentToggle(post._id)}>💬 Comment</button>
            {user && post.author?._id === user.id && (
              <>
                <button onClick={() => handleEditPost(post)}>✏️ Edit</button>
                <button onClick={() => handleDeletePost(post._id)}>🗑️ Delete</button>
              </>
            )}
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

  const displayedNotifications = notifications.filter((item) => {
    if (!item.read) return true;
    const diff = new Date() - new Date(item.createdAt);
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return diff < threeDays;
  });

  // ── Auth overlay: show login / register / forgot-password as overlay when triggered ──
  const renderAuthOverlay = () => {
    if (!authPage) return null;
    return (
      <div className="auth-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAuthPage(null); }}>
        <div className="auth-overlay-inner">
          {authPage === "register" && (
            <RegisterPage
              onRegister={async (data) => { const ok = await handleRegister(data); if (ok) setAuthPage(null); }}
              onSwitchToLogin={() => setAuthPage("login")}
              onContinueAsVisitor={() => setAuthPage(null)}
              flash={flash}
            />
          )}
          {authPage === "forgot-password" && (
            <ForgotPasswordPage
              onBackToLogin={(msg) => {
                setAuthPage("login");
                if (msg) showFlash(msg, "success");
              }}
            />
          )}
          {authPage === "login" && (
            <LoginPage
              onLogin={async (data) => { const ok = await handleLogin(data); if (ok) setAuthPage(null); }}
              onSwitchToRegister={() => setAuthPage("register")}
              onForgotPassword={() => setAuthPage("forgot-password")}
              onContinueAsVisitor={() => setAuthPage(null)}
              flash={flash}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`app-shell theme-${theme}`}>
      {renderAuthOverlay()}
      {flash && (
        <div className={`flash-toast flash-toast-${flash.type}`}>
          <span className="flash-toast-icon">{flash.type === "error" ? "⚠️" : "✅"}</span>
          <span>{flash.message}</span>
        </div>
      )}
      <header className="topbar">
        <div className="brand">BlogFlow</div>
        <nav className="nav-links">
          {[
            { label: "Home", value: "feed" },
            { label: "Write", value: "write" },
            { label: "Categories", value: "categories" },
            ...(user ? [{ label: user?.role === "admin" ? "Help Desk" : "Help", value: "help" }] : []),
          ].map((item) => (
            <button
              key={item.value}
              className={view === item.value ? "nav-button active" : "nav-button"}
              onClick={() => {
                if ((item.value === "write") && !user) {
                  setAuthPage("login");
                  return;
                }
                setView(item.value);
                if (item.value === "feed") {
                  fetchPosts();
                  setSearchTerm("");
                } else if (item.value === "help" && user?.role === "admin") {
                  fetchHelpMessages();
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <button className="icon-button" title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☀️" : "🌙"}</button>
          {user ? (
            <button className="main-button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <div className="guest-auth-buttons">
              <button className="main-button button-outline" onClick={() => setAuthPage("login")}>
                Login
              </button>
              <button className="main-button" onClick={() => setAuthPage("register")}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="layout-grid">
        <section className="panel main-panel">
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
                    <select
                      name="category"
                      value={postForm.category}
                      onChange={handlePostInput}
                      required
                    >
                      <option value="">
                        {loadingCategories ? "Loading categories..." : "Select a category"}
                      </option>
                      {categoryOptions.map((category) => (
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
                  <button className="button button-primary" type="submit">
                    {editingPostId ? "Update post" : "Publish post"}
                  </button>
                  {editingPostId && (
                    <button className="button button-secondary" type="button" onClick={handleCancelEdit}>
                      Cancel edit
                    </button>
                  )}
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
                {categoryOptions.map((category) => (
                  <button key={category._id} className="category-card" onClick={() => handleCategorySelect(category._id)}>
                    <span>{category.name}</span>
                    <small>{category.slug}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === "help" && (
            <div className="panel-card help-panel">
              {user.role === "admin" ? (
                <>
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">Admin Help Desk</p>
                      <h2>User Reports & Support Tickets</h2>
                      <p className="section-subtitle">Manage support requests and application issues reported by registered users.</p>
                    </div>
                  </div>

                  <div className="help-messages-list">
                    {helpMessages.length === 0 ? (
                      <p className="muted empty-state-text">No support requests have been submitted yet.</p>
                    ) : (
                      helpMessages.map((msg) => (
                        <div className={`help-msg-card ${msg.status}`} key={msg._id}>
                          <div className="help-msg-header">
                            <div className="help-user-info">
                              {msg.user?.profilePic ? (
                                <img src={msg.user.profilePic} alt={msg.user.name} className="help-avatar" />
                              ) : (
                                <div className="help-avatar-placeholder">
                                  {msg.user?.name ? msg.user.name[0].toUpperCase() : "U"}
                                </div>
                              )}
                              <div>
                                <strong>{msg.user?.name || "Unknown User"}</strong>
                                <span className="help-email">{msg.user?.email || "No email"}</span>
                              </div>
                            </div>
                            <div className="help-meta-info">
                              <span className={`status-badge ${msg.status}`}>{msg.status}</span>
                              <span className="help-date">{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="help-msg-body">
                            <h3>{msg.subject}</h3>
                            <p>{msg.message}</p>
                          </div>
                          {msg.status === "open" && (
                            <div className="help-msg-actions">
                              <button
                                className="button button-primary resolve-btn"
                                onClick={() => handleHelpResolve(msg._id)}
                              >
                                ✓ Mark as Resolved
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">Help & Support</p>
                      <h2>Report a Problem</h2>
                      <p className="section-subtitle">Encountered an issue or bug? Detail the problem below and our admin team will check it.</p>
                    </div>
                  </div>

                  <form className="help-form" onSubmit={handleHelpSubmit}>
                    <label>
                      Subject / Heading
                      <input
                        type="text"
                        value={helpForm.subject}
                        onChange={(e) => setHelpForm({ ...helpForm, subject: e.target.value })}
                        placeholder="e.g., Image upload is failing, cannot comment on posts"
                        required
                      />
                    </label>
                    <label>
                      Explain the issue in detail
                      <textarea
                        value={helpForm.message}
                        onChange={(e) => setHelpForm({ ...helpForm, message: e.target.value })}
                        placeholder="Please describe exactly what is happening, including any error messages you see."
                        rows={6}
                        required
                      />
                    </label>
                    <div className="button-row">
                      <button className="button button-primary" type="submit" disabled={submittingHelp}>
                        {submittingHelp ? <span className="auth-spinner" /> : "Submit Support Request"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {view === "post-detail" && selectedPost && (
            <div className="panel-card post-detail-panel">
              <button className="button button-secondary back-button" onClick={() => { setView("feed"); setSelectedPost(null); }}>
                ← Back to Feed
              </button>
              
              <div className="post-detail-header">
                <div className="post-labels">
                  <span>{selectedPost.category?.name || "Uncategorized"}</span>
                  <span>{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                </div>
                <h2>{selectedPost.title}</h2>
                <div className="post-meta">
                  <span>by {selectedPost.author?.name || "Guest"}</span>
                  <span>{selectedPost.likes?.length || 0} likes</span>
                  <span>{selectedPost.comments?.length || 0} comments</span>
                </div>
              </div>

              {selectedPost.thumbnail && (
                <div className="post-detail-image-container">
                  <img src={selectedPost.thumbnail} alt={selectedPost.title} className="post-detail-image" />
                </div>
              )}

              <div 
                className="post-detail-body" 
                dangerouslySetInnerHTML={{ __html: selectedPost.content }} 
              />

              <div className="post-detail-actions">
                <button className="detail-action-btn" onClick={() => handleLike(selectedPost._id)}>👍 Like</button>
                <button className="detail-action-btn" onClick={() => handleBookmark(selectedPost._id)}>🔖 Bookmark</button>
              </div>

              <div className="post-detail-comments-section">
                <h3>Comments ({selectedPost.comments?.length || 0})</h3>
                
                <div className="detail-comments-list">
                  {!selectedPost.comments || selectedPost.comments.length === 0 ? (
                    <p className="muted">No comments yet. Be the first to share your thoughts!</p>
                  ) : (
                    selectedPost.comments.map((comment) => (
                      <div className="detail-comment-item" key={comment._id}>
                        <div className="comment-meta">
                          <strong>{comment.user?.name || "Anonymous"}</strong>
                          <small>{new Date(comment.createdAt).toLocaleDateString()}</small>
                        </div>
                        <p className="comment-body">{comment.body}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="detail-comment-form">
                  {user ? (
                    <div className="comment-box-inline">
                      <h4>Leave a comment</h4>
                      <textarea
                        value={commentDraft[selectedPost._id] || ""}
                        onChange={(e) => setCommentDraft((current) => ({ ...current, [selectedPost._id]: e.target.value }))}
                        placeholder="Write a comment..."
                      />
                      <button className="button button-primary" onClick={() => handleCommentSubmit(selectedPost._id)}>
                        Submit comment
                      </button>
                    </div>
                  ) : (
                    <div className="login-prompt-card">
                      <p>Want to join the conversation? <button className="text-link-btn" onClick={() => setAuthPage("login")}>Log in</button> or <button className="text-link-btn" onClick={() => setAuthPage("register")}>Sign up</button> to post a comment.</p>
                    </div>
                  )}
                </div>
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
              <div className="guest-account-card">
                <p className="muted">You're browsing as a visitor.</p>
                <div className="guest-auth-cta">
                  <button className="button button-primary" onClick={() => setAuthPage("register")}>Create Account</button>
                  <button className="button button-secondary" onClick={() => setAuthPage("login")}>Login</button>
                </div>
              </div>
            )}
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <h3>Notifications</h3>
              <div className="notification-header-actions">
                <span className="unread-count">{notifications.filter((item) => !item.read).length}</span>
                {user && notifications.some((item) => !item.read) && (
                  <button className="text-action-button" onClick={handleMarkAllNotificationsRead} title="Mark all read">✓ Mark all read</button>
                )}
              </div>
            </div>
            <div className="notification-list">
              {displayedNotifications.length === 0 ? (
                <p className="muted">No notifications yet.</p>
              ) : (
                displayedNotifications.slice(0, 5).map((notification) => (
                  <div className={`notification-item ${notification.read ? "read" : "unread"}`} key={notification._id}>
                    <div className="notification-item-content">
                      <p>{notification.message}</p>
                      <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                    </div>
                    {!notification.read && (
                      <button className="mark-single-read" onClick={() => handleMarkNotificationRead(notification._id)} title="Mark as read">✓</button>
                    )}
                  </div>
                ))
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
              <p className="muted">{user ? "Analytics are only available to admin accounts." : "Login to view analytics."}</p>
            )}
          </div>
        </aside>
      </main>

    </div>
  );
}

export default App;
