import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPen } from "react-icons/fa"; // Pencil icon

const PersonalInfo = () => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    profilePic: null,
    previewPic: "",
  });
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    axios
      .get("/api/profile/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      })
      .then((res) => {
        const { name, email, profile_picture } = res.data;
        const newData = {
          name,
          email,
          password: "",
          profilePic: null,
          previewPic: profile_picture || "/Avatar.png", 
        };
        setFormData(newData);
        setInitialData(newData);
      })
      .catch(() => {
        // Handle error fetching profile if needed
        alert("Failed to load profile data.");
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        profilePic: file,
        previewPic: URL.createObjectURL(file),
      }));
    }
  };

  const handleSave = async () => {
    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    if (formData.password) data.append("password", formData.password);
    if (formData.profilePic) data.append("profile_picture", formData.profilePic);

    try {
      await axios.put("/api/profile/", data, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Profile updated successfully");
      setEditMode(false);
      setInitialData({
        ...formData,
        password: "",
        profilePic: null,
      }); // update initial data with saved info (reset password & profilePic)
      setFormData((prev) => ({
        ...prev,
        password: "", // clear password after save
        profilePic: null,
      }));
    } catch {
      alert("Error updating profile");
    }
  };

  const handleCancel = () => {
    if (initialData) {
      setFormData(initialData);
    }
    setEditMode(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-center">Personal Info</h2>

      <div className="relative flex flex-col items-center mb-4">
        <img
          src={formData.previewPic || "/default-avatar.png"}
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border"
        />
        {editMode && (
          <>
            <label
              htmlFor="profile-upload"
              className="absolute bottom-0 right-[38%] bg-white border p-1 rounded-full cursor-pointer shadow hover:bg-gray-100"
              title="Change profile picture"
            >
              <FaPen className="text-gray-700 text-sm" />
            </label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={!editMode}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          disabled={!editMode}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">New Password</label>
        <input
          name="password"
          type="password"
          onChange={handleChange}
          disabled={!editMode}
          placeholder="Enter new password"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          value={formData.password}
        />
      </div>

      <div className="flex justify-center gap-4 mt-6">
        {editMode ? (
          <>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
          >
            Edit Info
          </button>
        )}
      </div>
    </div>
  );
};

export default PersonalInfo;
