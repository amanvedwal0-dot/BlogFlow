import { useState } from "react";
import API from "./api";

function CreateBlog() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      await API.post("/createBlog", { title, description });
      alert("Blog Created ✅");
      setTitle("");
      setDescription("");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <form onSubmit={submitHandler}>
      <h2>Create Blog</h2>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <br />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <br />

      <button type="submit">Create</button>
    </form>
  );
}

export default CreateBlog;