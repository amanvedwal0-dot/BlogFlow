import { useEffect, useState } from "react";
import API from "./api";

function BlogList() {
  const [blogs, setBlogs] = useState([]);

  const fetchBlogs = async () => {
    const res = await API.get("/getAllBlogs");
    setBlogs(res.data.data);
  };

  const deleteBlog = async (id) => {
    await API.delete(`/deleteBlog/${id}`);
    fetchBlogs();
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <div>
      <h2>All Blogs</h2>

      {blogs.map((blog) => (
        <div key={blog._id}>
          <h3>{blog.title}</h3>
          <p>{blog.description}</p>

          <button onClick={() => deleteBlog(blog._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default BlogList;