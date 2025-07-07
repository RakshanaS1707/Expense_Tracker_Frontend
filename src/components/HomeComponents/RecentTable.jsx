// import React, { useEffect, useState } from "react";
// import { FaEdit, FaTrash } from "react-icons/fa";
// import {
//   fetchExpenses,
//   fetchOrderItemsByDate,
//   deleteOrdersByDate,
// } from "../../api_service/api";
// import dayjs from "dayjs";
// import { Tooltip } from "react-tooltip";
// import AddItemTable from "./AddItemTable";

// const RecentTable = () => {
//   const [recentData, setRecentData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [editingData, setEditingData] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);

//   const currentUser = JSON.parse(localStorage.getItem("user") || "null");

//   const fetchRecent = async () => {
//     setLoading(true);
//     try {
//       const data = await fetchExpenses();
//       setRecentData(data.slice(0, 10));
//     } catch (error) {
//       console.error("Error fetching recent data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRecent();
//   }, []);

//   const handleEdit = async (item) => {
//     const today = dayjs().format("YYYY-MM-DD");

//     if (item.is_refunded) {
//       alert("Refunded orders cannot be edited.");
//       return;
//     }

//     if (item.date !== today || item.user !== currentUser?.username) {
//       alert("Only today's orders created by you can be edited.");
//       return;
//     }

//     try {
//       const orderItems = await fetchOrderItemsByDate(item.date, item.user);
//       setEditingData({
//         date: item.date,
//         user: item.user,
//         orderItems,
//         orderId: item.order_id,
//       });
//       setIsEditing(true);
//     } catch (error) {
//       console.error("Error fetching order items:", error);
//     }
//   };

//   const handleDelete = async (item) => {
//     const confirmDelete = window.confirm(
//       `Are you sure you want to delete all orders for ${item.user} on ${item.date}?`
//     );
//     if (!confirmDelete) return;

//     try {
//       await deleteOrdersByDate(item.date, item.user);
//       alert("Orders deleted successfully.");
//       fetchRecent();
//     } catch (error) {
//       console.error("Error deleting orders:", error);
//       alert("Failed to delete orders.");
//     }
//   };

//   const handleCancelEdit = () => {
//     setIsEditing(false);
//     setEditingData(null);
//   };

//   const handleUpdateSuccess = () => {
//     setIsEditing(false);
//     setEditingData(null);
//     fetchRecent();
//   };

//   const today = dayjs().format("YYYY-MM-DD");

//   return (
//     <div className="flex flex-col lg:flex-row gap-4 w-full">
//       {/* Recent Entries Table */}
//       <div className="bg-white rounded-xl p-4 md:p-6 flex-1 overflow-x-auto shadow">
//         <h2 className="text-lg md:text-xl font-bold text-[#124451] mb-4">
//           Recently Added
//         </h2>

//         <table className="min-w-full text-sm">
//           <thead>
//             <tr className="text-gray-500 text-left border-b border-gray-200 bg-gray-50">
//               <th className="p-2 md:p-3">Date</th>
//               <th className="p-2 md:p-3">User</th>
//               <th className="p-2 md:p-3 text-center">Count</th>
//               <th className="p-2 md:p-3 text-center">Amount</th>
//               <th className="p-2 md:p-3 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan="5" className="text-center p-4">
//                   Loading...
//                 </td>
//               </tr>
//             ) : recentData.length === 0 ? (
//               <tr>
//                 <td colSpan="5" className="text-center p-4">
//                   No recent entries found
//                 </td>
//               </tr>
//             ) : (
//               recentData.map((data, index) => {
//                 const isToday = data.date === today;
//                 const isRefunded = data.is_refunded;
//                 const isCurrentUser = data.user === currentUser?.username;

//                 const canEdit = isToday && isCurrentUser && !isRefunded;
//                 const canDelete = isToday;

//                 const safeKey =
//                   data.order_id ??
//                   data.id ??
//                   `${data.user || "unknown"}-${data.date || "nodate"}-${index}`;

//                 const editTooltipId = `edit-tooltip-${safeKey}`;
//                 const deleteTooltipId = `delete-tooltip-${safeKey}`;

//                 return (
//                   <tr
//                     key={safeKey}
//                     className="border-b border-gray-100 hover:bg-gray-50"
//                   >
//                     <td className="p-2 md:p-3">
//                       {dayjs(data.date).format("MMM D, YYYY")}
//                     </td>
//                     <td className="p-2 md:p-3">
//                       {data.user?.name || data.user?.username || "Unknown"}
//                     </td>

//                     <td className="p-2 md:p-3 text-center">
//                       {data.total_count || 1}
//                     </td>
//                     <td className="p-2 md:p-3 text-center">
//                       ₹{(data.total_amount ?? data.amount ?? 0).toFixed(2)}
//                     </td>

//                     <td className="p-2 md:p-3 text-center">
//                       <div className="flex justify-center gap-3">
//                         <button
//                           onClick={() => handleEdit(data)}
//                           disabled={!canEdit}
//                           data-tooltip-id={editTooltipId}
//                           data-tooltip-content={
//                             !canEdit
//                               ? isRefunded
//                                 ? "Refunded entries cannot be edited"
//                                 : !isToday
//                                 ? "Only today's entries can be edited"
//                                 : "You can only edit your own entries"
//                               : ""
//                           }
//                           className={`transition ${
//                             canEdit
//                               ? "hover:scale-110"
//                               : "cursor-not-allowed opacity-40"
//                           }`}
//                         >
//                           <FaEdit
//                             size={16}
//                             color={canEdit ? "#16A63D" : "gray"}
//                           />
//                           <Tooltip id={editTooltipId} />
//                         </button>

//                         <button
//                           onClick={() => handleDelete(data)}
//                           disabled={!canDelete}
//                           data-tooltip-id={deleteTooltipId}
//                           data-tooltip-content={
//                             canDelete
//                               ? ""
//                               : "Only today's entries can be deleted"
//                           }
//                           className={`transition ${
//                             canDelete
//                               ? "hover:scale-110"
//                               : "cursor-not-allowed opacity-40"
//                           }`}
//                         >
//                           <FaTrash
//                             size={16}
//                             color={canDelete ? "red" : "gray"}
//                           />
//                           <Tooltip id={deleteTooltipId} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Edit/Add Section */}
//       <div className="bg-white rounded-xl p-4 md:p-6 flex-1 shadow">
//         {isEditing ? (
//           <AddItemTable
//             editMode={true}
//             editingData={editingData}
//             onCancel={handleCancelEdit}
//             onUpdateSuccess={handleUpdateSuccess}
//           />
//         ) : (
//           <AddItemTable onUpdateSuccess={fetchRecent} />
//         )}
//       </div>
//     </div>
//   );
// };

// export default RecentTable;










import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { fetchExpenses, fetchOrderItemsByDate, deleteOrdersByDate } from "../../api_service/api";
import dayjs from "dayjs";
import { Tooltip } from "react-tooltip";
import AddItemTable from "./AddItemTable";

const RecentTable = () => {
  const [recentData, setRecentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingData, setEditingData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Mock authentication data (replace with actual auth context or API call)
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = false; // Replace with actual admin status from auth context

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("jwtToken"); // Fixed token key to match api.js
      if (!token) {
        throw new Error("No access token found. Please login.");
      }
      const data = await fetchExpenses();
      if (!Array.isArray(data)) {
        throw new Error("Unexpected response format: Data is not an array.");
      }
      setRecentData(data.slice(0, 10));
    } catch (error) {
      console.error("Error fetching recent data:", error);
      alert(
        error.message ||
        (error.response?.status === 401
          ? "Unauthorized: Please check your login credentials."
          : error.response?.status === 404
          ? "Expenses endpoint not found. Please check the backend."
          : "Failed to fetch recent entries. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleEdit = async (item) => {
    const today = dayjs().format("YYYY-MM-DD");
    const username = typeof item.user === "string" ? item.user : item.user?.username || "Unknown";

    // Authorization checks
    if (item.is_refunded) {
      alert("Refunded orders cannot be edited.");
      return;
    }
    if (!isAdmin && (item.date !== today || username !== currentUser?.username)) {
      alert("Only today's orders created by you can be edited.");
      return;
    }

    try {
      const orderItems = await fetchOrderItemsByDate(item.date, username);
      setEditingData({
        date: item.date || "",
        user: username,
        orderItems: orderItems || [],
        orderId: item.order_id || item.id,
      });
      setIsEditing(true);
    } catch (error) {
      console.error("Error fetching order items:", error);
      alert(
        error.response?.status === 401
          ? "Unauthorized: You cannot fetch these order items."
          : error.response?.status === 404
          ? "Order items not found for this date and user."
          : "Failed to load order items. Please try again."
      );
    }
  };

  const handleDelete = async (item) => {
    const username = typeof item.user === "string" ? item.user : item.user?.username || "Unknown";
    const today = dayjs().format("YYYY-MM-DD");

    // Authorization check
    if (!isAdmin && (item.date !== today || username !== currentUser?.username)) {
      alert("Only today's orders created by you can be deleted.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete all orders for ${username} on ${dayjs(item.date).format("MMM D, YYYY")}?`
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("jwtToken"); // Fixed token key
    if (!token) {
      alert("Not authenticated. Please login.");
      return;
    }

    // Optimistic update
    const originalData = [...recentData];
    setRecentData(recentData.filter((data) => data.id !== item.id));

    try {
      await deleteOrdersByDate(item.date, username);
      alert("Orders deleted successfully.");
      fetchRecent(); // Refresh data
    } catch (error) {
      console.error("Error deleting orders:", error);
      alert(
        error.response?.status === 401
          ? "Unauthorized: You cannot delete these orders."
          : error.response?.status === 404
          ? "Orders not found for this date and user."
          : "Failed to delete orders. Please try again."
      );
      // Rollback on failure
      setRecentData(originalData);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingData(null);
  };

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    setEditingData(null);
    fetchRecent();
  };

  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* Recent Entries Table */}
      <div className="bg-white rounded-xl p-4 md:p-6 flex-1 overflow-x-auto shadow">
        <h2 className="text-lg md:text-xl font-bold text-[#124451] mb-4">
          Recently Added
        </h2>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-left border-b border-gray-200 bg-gray-50">
              <th className="p-2 md:p-3">Date</th>
              <th className="p-2 md:p-3">User</th>
              <th className="p-2 md:p-3 text-center">Count</th>
              <th className="p-2 md:p-3 text-center">Amount</th>
              <th className="p-2 md:p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : recentData.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center p-4">
                  No recent entries found
                </td>
              </tr>
            ) : (
              recentData.map((data, index) => {
                const username =
                  typeof data.user === "string" ? data.user : data.user?.username || "Unknown";
                const isToday = data.date === today;
                const isRefunded = data.is_refunded;
                const isCurrentUser = username === currentUser?.username;

                const canEdit = isAdmin || (isToday && isCurrentUser && !isRefunded);
                const canDelete = isAdmin || (isToday && isCurrentUser);

                const safeKey =
                  data.order_id ?? data.id ?? `${username}-${data.date || "nodate"}-${index}`;

                const editTooltipId = `edit-tooltip-${safeKey}`;
                const deleteTooltipId = `delete-tooltip-${safeKey}`;

                return (
                  <tr
                    key={safeKey}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-2 md:p-3">
                      {dayjs(data.date).format("MMM D, YYYY")}
                    </td>
                    <td className="p-2 md:p-3">
                      {data.user?.name || username || "Unknown"}
                    </td>
                    <td className="p-2 md:p-3 text-center">
                      {data.total_count || 1}
                    </td>
                    <td className="p-2 md:p-3 text-center">
                      ₹{(data.total_amount ?? data.amount ?? 0).toFixed(2)}
                    </td>
                    <td className="p-2 md:p-3 text-center">
                      <div className="flex justify-center gap-3">
                        {canEdit ? (
                          <button
                            onClick={() => handleEdit(data)}
                            data-tooltip-id={editTooltipId}
                            data-tooltip-content="Edit order"
                            className="transition hover:scale-110"
                          >
                            <FaEdit size={16} color="#16A63D" />
                            <Tooltip id={editTooltipId} />
                          </button>
                        ) : (
                          <span
                            data-tooltip-id={editTooltipId}
                            data-tooltip-content={
                              isRefunded
                                ? "Refunded entries cannot be edited"
                                : !isToday
                                ? "Only today's entries can be edited"
                                : "You can only edit your own entries"
                            }
                            className="text-gray-400 cursor-not-allowed"
                          >
                            <FaEdit size={16} color="gray" />
                            <Tooltip id={editTooltipId} />
                          </span>
                        )}
                        {canDelete ? (
                          <button
                            onClick={() => handleDelete(data)}
                            data-tooltip-id={deleteTooltipId}
                            data-tooltip-content="Delete order"
                            className="transition hover:scale-110"
                          >
                            <FaTrash size={16} color="red" />
                            <Tooltip id={deleteTooltipId} />
                          </button>
                        ) : (
                          <span
                            data-tooltip-id={deleteTooltipId}
                            data-tooltip-content={
                              !isToday
                                ? "Only today's entries can be deleted"
                                : "You can only delete your own entries"
                            }
                            className="text-gray-400 cursor-not-allowed"
                          >
                            <FaTrash size={16} color="gray" />
                            <Tooltip id={deleteTooltipId} />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Section */}
      <div className="bg-white rounded-xl p-4 md:p-6 flex-1 shadow">
        {isEditing ? (
          <AddItemTable
            editMode={true}
            editingData={editingData}
            onCancel={handleCancelEdit}
            onUpdateSuccess={handleUpdateSuccess}
          />
        ) : (
          <AddItemTable onUpdateSuccess={fetchRecent} />
        )}
      </div>
    </div>
  );
};

export default RecentTable;