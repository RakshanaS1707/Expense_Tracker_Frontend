import React, { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BASE_URL } from "../api_service/api";
const COLORS = ["#1c455e", "#1d5b79", "#195f76"];
const PAGE_SIZE = 10;

const AdminDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [cardData, setCardData] = useState({
    regularExpense: "0.00",
    otherExpense: "0.00",
    totalExpense: "0.00",
  });
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const datePickerRef = useRef(null);
  const navigate = useNavigate();

  
  const getGroupedOrders = async (page, pageSize, filters = {}) => {
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        throw new Error("No access token found. Please log in.");
      }

      const params = new URLSearchParams({
        page,
        page_size: pageSize,
        ...filters,
      });

      const response = await axios.get(`${BASE_URL}/orders/grouped-by-date/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error('Get grouped orders error:', error);
      throw error.response ? error.response.data : 'Failed to fetch grouped orders.';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access");
      if (!token) {
        setError("No access token found. Please log in.");
        return;
      }

      try {
      
        const expenseResponse = await axios.get(`${BASE_URL}/expenses/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const expenseData = expenseResponse.data;
        console.log("Sample expense:", expenseData[0]);

       
        const groupedOrderData = await getGroupedOrders(1, PAGE_SIZE, {});
        console.log("Grouped order data:", groupedOrderData);
        const regularExpenseTotal = groupedOrderData.total_price || 0;

        setExpenses(expenseData);
        setFilteredExpenses(expenseData);
        updateDashboardData(expenseData, regularExpenseTotal);
        setError(null);
      } catch (error) {
        setError("Failed to fetch data: " + (error.message || "Unknown error"));
        console.error("Error:", error);
      }
    };

    fetchData();
  }, []);

  const updateDashboardData = (expenseData, regularExpenseTotal) => {
    let otherExpense = 0;

    
    expenseData.forEach((exp) => {
      const expenseType = exp.expense_type
        ? exp.expense_type.toLowerCase().trim()
        : "";
      const amount = parseFloat(exp.total_amount) || parseFloat(exp.amount) || 0;

      if (["product", "service"].includes(expenseType)) {
        otherExpense += amount;
      }
    });

   
    const totalExpense = regularExpenseTotal + otherExpense;

    setCardData({
      regularExpense: regularExpenseTotal.toFixed(2),
      otherExpense: otherExpense.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
    });

    setChartData([
      {
        name: "Regular Expense",
        value: regularExpenseTotal > 0 ? parseFloat(regularExpenseTotal.toFixed(2)) : 0,
      },
      {
        name: "Other Expense",
        value: otherExpense > 0 ? parseFloat(otherExpense.toFixed(2)) : 0,
      },
    ]);
  };

  useEffect(() => {
    if (startDate && endDate) {
      const filtered = expenses.filter((exp) => {
        const expDate = dayjs(exp.date);
        return (
          expDate.isAfter(dayjs(startDate).subtract(1, "day")) &&
          expDate.isBefore(dayjs(endDate).add(1, "day"))
        );
      });
      setFilteredExpenses(filtered);
     
      fetchRegularExpenseTotal(filtered);
    } else {
      setFilteredExpenses(expenses);
      fetchRegularExpenseTotal(expenses);
    }
  }, [startDate, endDate, expenses]);

  const fetchRegularExpenseTotal = async (filteredData) => {
    try {
     
      const filters = {};
      if (startDate && endDate) {
        filters.start_date = dayjs(startDate).format("YYYY-MM-DD");
        filters.end_date = dayjs(endDate).format("YYYY-MM-DD");
      }
      const groupedOrderData = await getGroupedOrders(1, PAGE_SIZE, filters);
      console.log("Filtered grouped order data:", groupedOrderData);
      const regularExpenseTotal = groupedOrderData.total_price || 0;
      updateDashboardData(filteredData, regularExpenseTotal);
    } catch (error) {
      console.error("Error fetching regular expense total:", error);
      setError("Failed to fetch regular expense total: " + (error.message || "Unknown error"));
    }
  };

  const resetDateFilter = () => {
    setDateRange([null, null]);
    setFilteredExpenses(expenses);
    fetchRegularExpenseTotal(expenses);
    if (datePickerRef.current) {
      datePickerRef.current.setOpen(false);
    }
  };

  const handleCheckboxChange = async (expenseId, field, checked) => {
    const originalExpenses = [...expenses];
    const updatedExpenses = expenses.map((exp) =>
      exp.id === expenseId ? { ...exp, [field]: checked } : exp
    );
    setExpenses(updatedExpenses);

    const updatedFilteredExpenses = filteredExpenses.map((exp) =>
      exp.id === expenseId ? { ...exp, [field]: checked } : exp
    );
    setFilteredExpenses(updatedFilteredExpenses);

    const token = localStorage.getItem("access");
    if (!token) {
      setError("No access token found. Please log in.");
      setExpenses(originalExpenses);
      setFilteredExpenses(originalExpenses);
      return;
    }

    try {
      const updatedExpense = updatedExpenses.find(
        (exp) => exp.id === expenseId
      );
      await axios.put(
        `${BASE_URL}/expenses/${expenseId}/`,
        {
          date: updatedExpense.date,
          user: updatedExpense.user.id,
          description: updatedExpense.description,
          expense_type: updatedExpense.expense_type,
          amount: updatedExpense.amount,
          bill: updatedExpense.bill || null,
          is_verified: updatedExpense.is_verified,
          is_refunded: updatedExpense.is_refunded,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setError(null);
    } catch (error) {
      setError(
        error.response
          ? error.response.data.message || `Failed to update ${field}.`
          : `Failed to update ${field}.`
      );
      setExpenses(originalExpenses);
      setFilteredExpenses(originalExpenses);
    }
  };

  const handleViewDetails = (title) => {
    switch (title) {
      case "Regular Expense":
        navigate("/admin/regular-expense");
        break;
      case "Other Expense":
        navigate("/admin/other-expense");
        break;
      case "Total Expense":
        navigate("/admin/expense-history");
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex h-screen bg-[#f1f4fb] overflow-hidden">
      <div className="flex-1 p-5 flex flex-col justify-between">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="flex justify-between items-center" />
        <div className="flex justify-between gap-5 flex-1 overflow-hidden">
          <div className="grid grid-cols-3 gap-5 flex-1">
            {[
              {
                title: "Regular Expense",
                amount: `₹ ${cardData.regularExpense}`,
              },
              { title: "Other Expense", amount: `₹ ${cardData.otherExpense}` },
              { title: "Total Expense", amount: `₹ ${cardData.totalExpense}` },
            ].map((card, idx) => (
              <div
                key={idx}
                className="bg-[#0f4c5c] text-white h-[200px] rounded-xl p-5 flex flex-col justify-between"
              >
                <div className="text-lg font-bold">{card.title}</div>
                <div className="text-xl font-extrabold">{card.amount}</div>
                <button
                  onClick={() => handleViewDetails(card.title)}
                  className="bg-white text-[#0f4c5c] rounded-full px-4 py-2 text-sm font-semibold mt-2"
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-4 w-[400px] h-[200px] flex justify-between items-center shadow">
            <PieChart width={200} height={200}>
              <Pie
                data={chartData}
                cx="60%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex flex-col">
              {chartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl h-[60vh] overflow-auto">
          <div className="font-bold text-[#1e2a52] text-lg mb-3">
            Recent Entries
          </div>
          <div className="flex justify-end mb-2 relative">
            <div className="relative">
              <DatePicker
                ref={datePickerRef}
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                placeholderText="Select Date Range"
                className="bg-white text-[#0f4c5c] rounded-full px-4 py-2 text-sm font-semibold border border-[#0f4c5c] pr-8"
              />
              {(startDate || endDate) && (
                <button
                  onClick={resetDateFilter}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#0f4c5c] text-lg"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-[#7b89b1]">
                <th className="py-2 text-center">S.No</th>
                <th className="py-2 text-center">Date</th>
                <th className="py-2 text-center">Name</th>
                <th className="py-2 text-center">Title</th>
                <th className="py-2 text-right">Amount</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp, index) => (
                <tr
                  key={exp.id}
                  className="text-[#1e2a52] border-t border-gray-200"
                >
                  <td className="py-3 text-center">{index + 1}</td>
                  <td className="py-3 text-center">
                    {dayjs(exp.date).format("DD/MM/YYYY")}
                  </td>
                  <td className="py-3 text-center">
                    {exp.user?.name || exp.user?.username || "Unknown"}
                  </td>
                  <td className="py-3 text-center">
                    {exp.description || "N/A"}
                  </td>
                  <td className="py-3 text-right">
                    ₹ {parseFloat(exp.total_amount || exp.amount).toFixed(2)}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() =>
                        handleCheckboxChange(
                          exp.id,
                          "is_verified",
                          !exp.is_verified
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        exp.is_verified
                          ? "bg-green-200 text-green-700"
                          : "bg-[#d4f2e6] text-[#25996b]"
                      }`}
                    >
                      {exp.is_verified ? "Verified" : "Verify"}
                    </button>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() =>
                        handleCheckboxChange(
                          exp.id,
                          "is_refunded",
                          !exp.is_refunded
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        exp.is_refunded
                          ? "bg-blue-200 text-blue-700"
                          : "bg-[#dce8f8] text-[#23499b]"
                      }`}
                    >
                      {exp.is_refunded ? "Refunded" : "Reimburse"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;