import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faPlus, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getGroupedOrders } from "../../api_service/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import AddItem from "../UpdateItem/Additem";
import axios from "axios";
import { BASE_URL } from "../../api_service/api";
const PAGE_SIZE = 6;

const RegularExpense = () => {
  const [groupedItems, setGroupedItems] = useState({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [error, setError] = useState(null);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    item: "",
    count: "",
    date: "",
  });

  const [uniqueDates, setUniqueDates] = useState([]);
  const [uniqueItems, setUniqueItems] = useState([]);
  const [uniqueUsers, setUniqueUsers] = useState([]);

  const [filters, setFilters] = useState({
    date: "",
    item_name: "",
    user: "",
  });

  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const currentUser = localStorage.getItem("username");
  const userRole = (localStorage.getItem("role") || "").toLowerCase();

  // Debug user info
  console.log("currentUser:", currentUser, "userRole:", userRole);

  const fetchData = useCallback(
    async (page = 1, overrideFilters = filters) => {
      setLoading(true);
      setError(null);
      try {
        const queryFilters = { ...overrideFilters };
        if (startDate && endDate) {
          queryFilters.start_date = dayjs(startDate).format("YYYY-MM-DD");
          queryFilters.end_date = dayjs(endDate).format("YYYY-MM-DD");
        }

        const data = await getGroupedOrders(page, PAGE_SIZE, queryFilters);
        console.log("API Response:", data);
        setGroupedItems(data.results || {});
        setTotalPrice(data.total_price || 0);
        setTotalPages(data.total_pages || 1);
        setCurrentPage(page);

        const datesSet = new Set();
        const itemsSet = new Set();
        const usersSet = new Set();

        Object.entries(data.results || {}).forEach(([date, items]) => {
          datesSet.add(date);
          items.forEach((item) => {
            console.log("Item:", item);
            itemsSet.add(JSON.stringify({ id: item.item_id, name: item.item_name }));
            usersSet.add(item.user);
          });
        });

        setUniqueDates([...datesSet]);
        setUniqueItems([...itemsSet].map((s) => JSON.parse(s)));
        setUniqueUsers([...usersSet]);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [filters, startDate, endDate]
  );

  useEffect(() => {
    const updatedFilters = { ...filters };
    if (startDate && endDate) {
      updatedFilters.start_date = dayjs(startDate).format("YYYY-MM-DD");
      updatedFilters.end_date = dayjs(endDate).format("YYYY-MM-DD");
    }
    fetchData(currentPage, updatedFilters);
  }, [fetchData, currentPage, filters, startDate, endDate]);

  const showAddItemModal = () => {
    setShowAddItem(!showAddItem);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = [["Date", "Item Name", "User", "Count", "Price/item", "Total/item"]];
    let grandTotal = 0;

    Object.entries(groupedItems).forEach(([date, items]) => {
      items.forEach((item) => {
        const total = item.count * item.price;
        rows.push([
          formatDate(date),
          item.item_name,
          item.user,
          item.count,
          `₹${item.price.toFixed(2)}`,
          `₹${total.toFixed(2)}`,
        ]);
        grandTotal += total;
      });
      rows.push([]);
    });

    rows.push(["", "", "", "", "Grand Total", `₹${grandTotal.toFixed(2)}`]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleDelete = async (itemId) => {
    const confirm = window.confirm("Are you sure you want to delete this item?");
    if (!confirm) return;
    try {
      console.log("Deleting item with ID:", itemId);
      await axios.delete(`${BASE_URL}/order-items/${itemId}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      fetchData(currentPage);
      alert("✅ Item deleted successfully");
    } catch (error) {
      console.error("Delete failed:", error.response?.data || error);
      alert("❌ Failed to delete item.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedDate = new Date(editFormData.date).toISOString().split("T")[0];
      const payload = {
        item: editFormData.item,
        count: Number(editFormData.count.toString().trim()),
        added_date: formattedDate,
      };

      console.log("Updating item with payload:", payload);
      await axios.put(
        `${BASE_URL}/order-items/${editFormData.id}/`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
        }
      );

      alert("✅ Item updated successfully");
      setShowEditItem(false);
      fetchData(currentPage);
    } catch (error) {
      console.error("Edit failed:", error.response?.data || error);
      alert("❌ Failed to update item.");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen">
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-lg md:text-xl font-bold text-[#124451]">
          {loading ? "Loading..." : `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <DatePicker selectsRange startDate={startDate} endDate={endDate} onChange={(update) => {
              setDateRange(update);
              setCurrentPage(1);
            }}
            isClearable={true}
            placeholderText="Select Date Range"
            className="border px-3 py-1 rounded text-sm"
          />
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-1"
            onClick={showAddItemModal}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span className="hidden sm:inline">Add Item</span>
          </button>
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-1"
            onClick={downloadExcel}
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
            <span className="hidden sm:inline">Download Excel</span>
          </button>
        </div>
      </div>

      {/* Column Headers with Dropdown Filters */}
      {!loading && (
        <div className="grid grid-cols-8 gap-2 mb-2 p-2 bg-gray-50 text-xs font-medium text-gray-600">
          <div>
            <div className="text-[11px] font-semibold mb-1">Date</div>
            <select
              className="w-full p-1 rounded text-xs"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            >
              <option value="">All</option>
              {uniqueDates.map((d, i) => (
                <option key={i} value={d}>{formatDate(d)}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold mb-1">Item</div>
            <select
              className="w-full p-1 rounded text-xs"
              value={filters.item_name}
              onChange={(e) => setFilters({ ...filters, item_name: e.target.value })}
            >
              <option value="">All</option>
              {uniqueItems.map((item, i) => (
                <option key={i} value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold mb-1">User</div>
            <select
              className="w-full p-1 rounded text-xs"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            >
              <option value="">All</option>
              {uniqueUsers.map((user, i) => (
                <option key={i} value={user}>{user}</option>
              ))}
            </select>
          </div>
          <div className="text-center flex items-end justify-center pb-1 font-semibold">Count</div>
          <div className="text-center flex items-end justify-center pb-1 font-semibold">Price/item</div>
          <div className="text-center flex items-end justify-center pb-1 font-semibold">Total/item</div>
          <div className="text-center flex items-end justify-center pb-1 font-semibold">Total/date</div>
          <div className="text-center flex items-end justify-center pb-1 font-semibold">Action</div>
        </div>
      )}

      {/* Data Rows */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#124451]" />
        </div>
      ) : Object.keys(groupedItems).length === 0 ? (
        <div className="text-center text-gray-500 mt-12">No data found.</div>
      ) : (
        Object.entries(groupedItems).map(([date, items], idx) => {
          const rowTotal = items.reduce((sum, item) => sum + item.count * item.price, 0);
          return (
            <div key={date} className={`${idx % 2 === 0 ? "bg-gray-100" : "bg-white"} p-4 grid grid-cols-8`}>
              <div className="flex items-center">{formatDate(date)}</div>
              <div>{items.map((item, i) => <div key={i} className="py-1">{item.item_name}</div>)}</div>
              <div>{items.map((item, i) => (
                  <div key={i} className="text-center py-1">
                    {console.log("item.user:", item.user, "currentUser:", currentUser)}
                    {item.user}
                  </div>
                ))}
              </div>
              <div>{items.map((item, i) => <div key={i} className="text-center py-1">{item.count}</div>)}</div>
              <div>{items.map((item, i) => <div key={i} className="text-center py-1">₹{item.price.toFixed(2)}</div>)}</div>
              <div>{items.map((item, i) => <div key={i} className="text-center py-1">₹{(item.count * item.price).toFixed(2)}</div>)}</div>
              <div className="flex items-center justify-center font-semibold">₹{rowTotal.toFixed(2)}</div>
              <div>
                {items.map((item, i) => (
                  <div key={i} className="text-center py-1">
                    {(userRole === "Admin" || item.user?.trim().toLowerCase() === currentUser?.trim().toLowerCase()) && (
                      <div className="flex gap-2 justify-center items-center">
                        <button
                          onClick={() => {
                            console.log("Edit button clicked for item:", item.id);
                            setEditFormData({
                              id: item.id,
                              item: item.item_id,
                              count: item.count,
                              date: date,
                            });
                            setShowEditItem(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm debug-button"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => {
                            console.log("Delete button clicked for item:", item.id);
                            handleDelete(item.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm debug-button"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-8">
          <button
            className="px-3 py-1 bg-[#124451] text-white rounded"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="flex items-center justify-center font-semibold px-3 py-1 border rounded">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 bg-[#124451] text-white rounded"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditItem && (
        <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.7)] flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowEditItem(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-center">Edit Item</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, date: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Item</label>
                <select
                  value={editFormData.item}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, item: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Item</option>
                  {uniqueItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Count</label>
                <input
                  type="number"
                  value={editFormData.count}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, count: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Count"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#124451] text-white rounded w-full"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.7)] flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
            <button
              onClick={() => setShowAddItem(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl"
            >
              ×
            </button>
            <AddItem
              onClose={() => {
                setShowAddItem(false);
                fetchData(currentPage);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RegularExpense;