

import React, { useEffect, useState, useRef } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { faBell, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api_service/api";

const Navbar = ({ toggleSidebar, title }) => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [showFullView, setShowFullView] = useState(false);

  const handleAvatarClick = () => navigate("/profile");

  const handleBellClick = async () => {
    const toggled = !showDropdown;
    setShowDropdown(toggled);
    if (toggled && unreadCount > 0) {
      try {
        await axiosInstance.patch("/notifications/mark-all-read/");
        setUnreadCount(0);
      } catch (error) {
        console.error("Failed to mark notifications as read", error);
      }
    }
    if (toggled) {
      fetchNotifications();
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axiosInstance.get("/notifications/");
      setUnreadCount(res.data.unread_count || 0);
      setNotifications(Array.isArray(res.data.notifications) ? res.data.notifications : []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await axiosInstance.delete("/notifications/clear-all/");
      setNotifications([]);
      alert("All notifications cleared.");
    } catch (err) {
      console.error("Error clearing notifications", err);
      alert("Failed to clear notifications.");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axiosInstance.delete(`/notifications/${id}/`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification", err);
      alert("Failed to delete notification.");
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get("/profile/");
      if (res.data.profile_picture) {
        setProfileImage(res.data.profile_picture);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchProfile();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "No date";
    const d = new Date(dateStr);
    return isNaN(d) ? "Invalid Date" : d.toLocaleString();
  };

  const getNotificationDate = (notif) =>
    notif.created_date || notif.created_at || notif.timestamp || null;

  return (
    <>
      <div className="fixed top-0 right-0 left-0 md:left-64 bg-white md:bg-[rgba(244,247,254,1)] z-40 shadow">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl text-[#124451] font-semibold md:block">{title || "Home"}</h1>

          <div className="flex items-center gap-3 md:hidden">
            <button onClick={toggleSidebar}>
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          <div ref={dropdownRef} className="relative flex items-center gap-6">
            <div className="relative">
              <FontAwesomeIcon
                icon={faBell}
                className="text-gray-600 cursor-pointer text-xl"
                onClick={handleBellClick}
                title="Notifications"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto" style={{ top: '100%' }}>
                <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b">
                  <h3 className="font-semibold text-gray-700 text-sm">Notifications</h3>
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">No new notifications</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {notifications.slice(0, 5).map((notif) => (
                      <li key={notif.id} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="text-sm">
                            <p className="text-gray-800 font-medium">{notif.message}</p>
                            <p className="text-xs text-gray-500">{formatDate(getNotificationDate(notif))}</p>
                          </div>
                          <FontAwesomeIcon
                            icon={faXmark}
                            className="text-gray-500 cursor-pointer hover:text-red-500 ml-2"
                            onClick={() => deleteNotification(notif.id)}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {notifications.length > 5 && (
                  <div
                    onClick={() => setShowFullView(true)}
                    className="text-center text-blue-600 text-sm py-2 cursor-pointer hover:underline border-t bg-gray-50"
                  >
                    View all
                  </div>
                )}
              </div>
            )}

            <img
              src={profileImage || "/default_avatar.png"}
              alt="User Avatar"
              className="w-8 h-8 rounded-full cursor-pointer border-2 border-blue-500 bg-gray-100"
              onClick={handleAvatarClick}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default_avatar.png";
              }}
            />
          </div>
        </div>
      </div>

      {showFullView && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-11/12 max-w-2xl max-h-[80vh] overflow-y-auto relative">
            <h2 className="text-xl font-semibold mb-4">All Notifications</h2>
            <button
              onClick={() => setShowFullView(false)}
              className="absolute top-3 right-4 text-gray-600 text-xl"
            >
              ×
            </button>
            {notifications.length === 0 ? (
              <p className="text-center text-gray-500">No notifications found.</p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="bg-gray-100 p-3 rounded flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <p className="text-xs text-gray-500">{formatDate(getNotificationDate(n))}</p>
                    </div>
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="text-gray-500 cursor-pointer hover:text-red-500"
                      onClick={() => deleteNotification(n.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;