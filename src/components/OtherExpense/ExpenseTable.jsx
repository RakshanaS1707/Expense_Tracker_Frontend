import React, { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faPlus } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BASE_URL } from "../../api_service/api";
const ExpenseTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [uniqueUsers, setUniqueUsers] = useState([]);
  const [uniqueTypes, setUniqueTypes] = useState([]);
  const [uniqueVerifiedStatuses, setUniqueVerifiedStatuses] = useState([]);
  const [uniqueRefundedStatuses, setUniqueRefundedStatuses] = useState([]);
  const [filters, setFilters] = useState({
    date: "",
    user: "",
    expense_type: "",
    is_verified: "",
    is_refunded: "",
    startDate: "",
    endDate: "",
  });
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [showExpense, setShowExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseData, setExpenseData] = useState({
    date: "",
    description: "",
    type: "Product",
    bill: null,
    amount: "",
    isVerified: false,
    isRefunded: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingMyData, setViewingMyData] = useState(false);
  const itemsPerPage = 10;

  // Mock authentication data (replace with actual auth context or API call)
  const currentUser = "user1"; // Replace with actual username from auth context
  const isAdmin = false; // Replace with actual admin status from auth context

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          console.error("No access token found in localStorage.");
          alert("Please login to continue.");
          return;
        }
        const url = viewingMyData
          ? `${BASE_URL}/expenses/mydata/`
          : `${BASE_URL}/expenses/`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Fetched expenses:", response.data);
        setExpenses(response.data);
        setFilteredExpenses(response.data);

        const datesSet = new Set();
        const usersSet = new Set();
        const typesSet = new Set();
        const verifiedSet = new Set();
        const refundedSet = new Set();

        response.data.forEach((exp) => {
          datesSet.add(dayjs(exp.date).format("YYYY-MM-DD"));
          usersSet.add(exp.user?.name || exp.user?.username || "Unknown");
          typesSet.add(exp.expense_type);
          verifiedSet.add(exp.is_verified ? "true" : "false");
          refundedSet.add(exp.is_refunded ? "true" : "false");
        });

        setUniqueDates([...datesSet]);
        setUniqueUsers([...usersSet]);
        setUniqueTypes([...typesSet]);
        setUniqueVerifiedStatuses([...verifiedSet]);
        setUniqueRefundedStatuses([...refundedSet]);
      } catch (error) {
        console.error("Error fetching expenses:", error.response || error);
        alert("Failed to fetch expenses.");
      }
    };

    fetchExpenses();
  }, [viewingMyData]);

  useEffect(() => {
    let temp = [...expenses];
    if (filters.date) {
      temp = temp.filter(
        (exp) => dayjs(exp.date).format("YYYY-MM-DD") === filters.date
      );
    }
    if (filters.user) {
      temp = temp.filter(
        (exp) =>
          (exp.user?.name || exp.user?.username || "Unknown") === filters.user
      );
    }
    if (filters.expense_type) {
      temp = temp.filter((exp) => exp.expense_type === filters.expense_type);
    }
    if (filters.is_verified !== "") {
      temp = temp.filter(
        (exp) => exp.is_verified === (filters.is_verified === "true")
      );
    }
    if (filters.is_refunded !== "") {
      temp = temp.filter(
        (exp) => exp.is_refunded === (filters.is_refunded === "true")
      );
    }
    if (startDate && endDate) {
      temp = temp.filter((exp) => {
        const date = dayjs(exp.date);
        return (
          date.isAfter(dayjs(startDate).subtract(1, "day")) &&
          date.isBefore(dayjs(endDate).add(1, "day"))
        );
      });
    }
    setFilteredExpenses(temp);
    setCurrentPage(1);
  }, [expenses, filters, startDate, endDate]);

  const resetFilters = () => {
    setFilters({
      date: "",
      user: "",
      expense_type: "",
      is_verified: "",
      is_refunded: "",
      startDate: "",
      endDate: "",
    });
    setDateRange([null, null]);
  };

  const showexpense = () => {
    setShowExpense(!showExpense);
    if (showExpense) {
      setEditingExpense(null);
      setExpenseData({
        date: "",
        description: "",
        type: "Product",
        bill: null,
        amount: "",
        isVerified: false,
        isRefunded: false,
      });
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    console.log("Expense Data on Submit:", expenseData);

    const token = localStorage.getItem("access");
    if (!token) {
      alert("Not authenticated");
      return;
    }
    const formData = new FormData();
    formData.append("date", expenseData.date);
    formData.append("description", expenseData.description);
    formData.append("expense_type", expenseData.type);
    formData.append("amount", expenseData.amount);
    if (expenseData.bill) {
      formData.append("bill", expenseData.bill);
    }

    try {
      const response = await axios({
        method: editingExpense ? "put" : "post",
        url: editingExpense
          ? `${BASE_URL}/expenses/${editingExpense.id}/`
          : `${BASE_URL}/expenses/`,
        data: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (editingExpense) {
        setExpenses((prevExpenses) =>
          prevExpenses.map((exp) =>
            exp.id === editingExpense.id ? response.data : exp
          )
        );
      } else {
        setExpenses((prev) => [...prev, response.data]);
      }
      setShowExpense(false);
      alert("Expense submitted successfully.");
    } catch (error) {
      console.error(
        "Error submitting expense:",
        error.response?.data || error.message
      );
      alert("Failed to submit expense.");
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseData({
      date: expense.date,
      description: expense.description,
      type: expense.expense_type,
      bill: null,
      amount: expense.amount,
      isVerified: expense.is_verified,
      isRefunded: expense.is_refunded,
    });
    setShowExpense(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    const token = localStorage.getItem("access");
    if (!token) {
      alert("Not authenticated");
      return;
    }

    const originalExpenses = [...expenses];
    const originalFilteredExpenses = [...filteredExpenses];

    setExpenses(expenses.filter((exp) => exp.id !== expenseId));
    setFilteredExpenses(filteredExpenses.filter((exp) => exp.id !== expenseId));

    try {
      await axios.delete(`${BASE_URL}/expenses/${expenseId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Expense deleted successfully.");
    } catch (error) {
      console.error("Error deleting expense:", error.response || error);
      alert("Failed to delete expense.");
      setExpenses(originalExpenses);
      setFilteredExpenses(originalFilteredExpenses);
    }
  };

  const canPerformAction = (expUser) => {
    return isAdmin || (expUser?.username || "Unknown") === currentUser;
  };

  const handleBillUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      const fileSize = file.size / 1024 / 1024; // Convert bytes to MB
      if (fileSize > 5) {
        alert("File size exceeds the 5MB limit.");
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF, JPG, or PNG files are allowed!");
        return;
      }
      setExpenseData({ ...expenseData, bill: file });
    }
  };

  const handleViewToggle = async () => {
    setViewingMyData(!viewingMyData);
  };

  const downloadExcel = () => {
    const data = [
      ["Date", "Users", "Description", "Type", "Amount", "Verified", "Refunded"],
      ...filteredExpenses.map((exp) => [
        dayjs(exp.date).format("DD/MM/YYYY"),
        exp.user?.name || exp.user?.username || "Unknown",
        exp.description,
        exp.expense_type,
        exp.amount,
        exp.is_verified ? "Yes" : "No",
        exp.is_refunded ? "Yes" : "No",
      ]),
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Expenses");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buffer]),
      `expenses_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const calculateTotalAmount = () => {
    if (!Array.isArray(filteredExpenses)) return "0.00";
    const total = filteredExpenses.reduce((sum, exp) => {
      const amount = parseFloat(exp?.amount);
      return isNaN(amount) ? sum : sum + amount;
    }, 0);
    return total.toFixed(2);
  };

  const handlePagination = (pageNumber) => setCurrentPage(pageNumber);

  const indexOfLastExpense = currentPage * itemsPerPage;
  const indexOfFirstExpense = indexOfLastExpense - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(
    indexOfFirstExpense,
    indexOfLastExpense
  );

  return (
    <div className="p-6 bg-white rounded-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
        <h2 className="text-xl font-bold text-gray-900">
          Grand Total: ₹ {calculateTotalAmount()}
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              setDateRange(update);
              setFilters((prev) => ({
                ...prev,
                startDate: update[0] ? dayjs(update[0]).format("YYYY-MM-DD") : "",
                endDate: update[1] ? dayjs(update[1]).format("YYYY-MM-DD") : "",
              }));
              setCurrentPage(1);
            }}
            isClearable={true}
            placeholderText="Select Date Range"
            className="border px-3 py-1 rounded text-sm"
          />
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full flex items-center gap-2"
            onClick={showexpense}
          >
            <FontAwesomeIcon icon={faPlus} />
            Add Expense
          </button>
          <button
            className="bg-[#124451] text-white px-3 py-1 rounded-full flex items-center gap-1"
            onClick={downloadExcel}
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
            Download Excel
          </button>
          <button
            className="bg-[#124451] text-white px-4 py-1 rounded-full"
            onClick={resetFilters}
          >
            Reset
          </button>
          
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <button
          className="bg-[#124451] text-white px-4 py-1 rounded-full mb-2"
          onClick={handleViewToggle}
        >
          {viewingMyData ? "View All Data" : "View My Data"}
        </button>
        <table className="w-full">
          <thead className="border-b border-gray-100 text-gray-500 text-[14px] font-medium">
            <tr>
              <th className="p-3 text-left">S.No</th>
              <th className="p-3 text-left">
                <div className="text-[11px] font-semibold mb-1">Date</div>
                <select
                  className="w-full p-1 rounded text-xs"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters({ ...filters, date: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {uniqueDates.map((d, i) => (
                    <option key={i} value={d}>
                      {dayjs(d).format("DD/MM/YYYY")}
                    </option>
                  ))}
                </select>
              </th>
              <th className="p-3 text-left">
                <div className="text-[11px] font-semibold mb-1">Users</div>
                <select
                  className="w-full p-1 rounded text-xs"
                  value={filters.user}
                  onChange={(e) =>
                    setFilters({ ...filters, user: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {uniqueUsers.map((user, i) => (
                    <option key={i} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">
                <div className="text-[11px] font-semibold mb-1">Type</div>
                <select
                  className="w-full p-1 rounded text-xs"
                  value={filters.expense_type}
                  onChange={(e) =>
                    setFilters({ ...filters, expense_type: e.target.value })
                  }
                >
                  <option value="">All</option>
                  {uniqueTypes.map((type, i) => (
                    <option key={i} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </th>
              <th className="p-3 text-left">Bill</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">
                <div className="text-[11px] font-semibold mb-1">Is Verified</div>
                <select
                  className="w-full p-1 rounded text-xs"
                  value={filters.is_verified}
                  onChange={(e) =>
                    setFilters({ ...filters, is_verified: e.target.value })
                  }
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
              </th>
              <th className="p-3 text-left">
                <div className="text-[11px] font-semibold mb-1">Is Refunded</div>
                <select
                  className="w-full p-1 rounded text-xs"
                  value={filters.is_refunded}
                  onChange={(e) =>
                    setFilters({ ...filters, is_refunded: e.target.value })
                  }
                >
                  <option value="">All</option>
                  <option value="true">Refunded</option>
                  <option value="false">Not Refunded</option>
                </select>
              </th>
              <th className="p-3 text-left">{viewingMyData ? "Actions" : ""}</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 text-sm">
            {currentExpenses.map((exp, i) => (
              <tr
                key={exp.id}
                className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
              >
                <td className="p-3">{indexOfFirstExpense + i + 1}</td>
                <td className="p-3">{dayjs(exp.date).format("DD/MM/YYYY")}</td>
                <td className="p-3">
                  {exp.user?.name || exp.user?.username || "Unknown"}
                </td>
                <td className="p-3">{exp.description}</td>
                <td className="p-3">{exp.expense_type}</td>
                <td className="p-3">
                  {exp.bill ? (
                    <a
                      href={exp.bill}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Bill
                    </a>
                  ) : (
                    <span className="text-gray-500">N/A</span>
                  )}
                </td>
                <td className="p-3">₹ {parseFloat(exp.amount).toFixed(2)}</td>
                <td className="p-3">
                  {exp.is_verified ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <FaCheckCircle /> Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <FaTimesCircle /> Not Verified
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {exp.is_refunded ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <FaRedo /> Refunded
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[#264653]">
                      <FaRedo /> Pending
                    </div>
                  )}
                </td>
                <td className="p-3">
                  {viewingMyData && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditExpense(exp)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-4 gap-2">
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => handlePagination(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FaChevronLeft />
        </button>
        {Array.from({
          length: Math.ceil(filteredExpenses.length / itemsPerPage),
        }).map((_, index) => {
          const pageNum = index + 1;
          return (
            <button
              key={pageNum}
              onClick={() => handlePagination(pageNum)}
              className={`px-3 py-1 rounded ${
                pageNum === currentPage
                  ? "bg-[#124451] text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={() => handlePagination(currentPage + 1)}
          disabled={
            currentPage === Math.ceil(filteredExpenses.length / itemsPerPage)
          }
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Add/Edit Expense Modal */}
      {showExpense && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-start pt-10 md:pt-20 z-50">
          <div className="bg-white p-6 rounded-lg w-[400px]">
            <h3 className="text-xl font-semibold mb-4">
              {editingExpense ? "Edit" : "Add"} Expense
            </h3>
            <form onSubmit={handleExpenseSubmit} encType="multipart/form-data">
              <div className="mb-4">
                <label className="block text-gray-700">Date</label>
                <input
                  type="date"
                  value={expenseData.date}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, date: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Description</label>
                <input
                  type="text"
                  value={expenseData.description}
                  onChange={(e) =>
                    setExpenseData({
                      ...expenseData,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Amount</label>
                <input
                  type="number"
                  value={expenseData.amount}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, amount: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Type</label>
                <select
                  value={expenseData.type}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, type: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Product">Product</option>
                  <option value="Food">Food</option>
                  <option value="Service">Service</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">
                  Upload Bill (Optional)
                </label>
                <input
                  type="file"
                  onChange={handleBillUpload}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowExpense(false)}
                  className="text-gray-500 mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#124451] text-white px-4 py-2 rounded"
                >
                  {editingExpense ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseTable;