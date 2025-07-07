import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilter, faFileExcel, faIndianRupeeSign } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import dayjs from "dayjs";

ChartJS.register(ArcElement, Tooltip, Legend);

const sanitizeText = (text) => text.replace(/</g, "<").replace(/>/g, ">");

const History = () => {
  const [monthlySummary, setMonthlySummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(dayjs().year().toString());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [todayTotal, setTodayTotal] = useState("0.00");
  const [monthlyRegular, setMonthlyRegular] = useState("0.00");
  const [monthlyOther, setMonthlyOther] = useState("0.00");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    year: dayjs().year().toString(),
    startMonth: "",
    endMonth: "",
  });

  const fetchData = useCallback(async (year = selectedYear) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access");
      if (!token) {
        console.error("No authentication token found in localStorage.");
        alert("Please log in to view expense history.");
        return;
      }

      console.log("Fetching data for year:", year);
      const todayDate = dayjs().format("YYYY-MM-DD");
      let todayExpense = 0;
      let otherTotal = 0;
      let regTotal = 0;
      const summary = {};

     
      console.log("Fetching regular expenses...");
      const regularResponse = await axios.get("http://localhost:8000/api/orders/grouped-by-date/", {
        headers: { Authorization: `Bearer ${token}` },
        params: { year },
      });
      console.log("Regular expenses response:", regularResponse.data);
      const regularData = regularResponse.data.results || regularResponse.data || {};
      const regularExpenses = Object.keys(regularData).map((date) => {
        const items = regularData[date] || [];
        const amount = items.reduce((sum, item) => sum + (item.count || 0) * (item.price || 0), 0);
        const expense_type = items[0]?.type || "Food";
        const is_verified = items[0]?.is_verified || false;
        const is_refunded = items[0]?.is_refunded || false;
        const month = dayjs(date).format("MMMM");

        if (date === todayDate && (!selectedMonth || month === selectedMonth)) todayExpense += amount;
        if (dayjs(date).format("YYYY-MM").startsWith(year) && (!selectedMonth || month === selectedMonth)) {
          regTotal += amount;
        }

        return {
          month,
          amount,
          expense_category: "Regular",
          expense_type,
          is_verified,
          is_refunded,
        };
      });

      
      console.log("Fetching other expenses...");
      const otherResponse = await axios.get("http://localhost:8000/api/expenses/", {
        headers: { Authorization: `Bearer ${token}` },
        params: { year },
      });
      console.log("Other expenses response:", otherResponse.data);
      const otherExpenses = (otherResponse.data.results || otherResponse.data || []).map((exp) => {
        const month = dayjs(exp.date).format("MMMM");
        const expDate = dayjs(exp.date).format("YYYY-MM-DD");
        const amt = parseFloat(exp.amount) || 0;

        if (expDate === todayDate && (!selectedMonth || month === selectedMonth)) todayExpense += amt;
        if (dayjs(exp.date).format("YYYY-MM").startsWith(year) && (!selectedMonth || month === selectedMonth)) {
          otherTotal += amt;
        }

        return {
          month,
          amount: amt,
          expense_category: "Other",
          expense_type: exp.expense_type,
          is_verified: exp.is_verified || false,
          is_refunded: exp.is_refunded || false,
        };
      });

    
      const allExpenses = [...regularExpenses, ...otherExpenses];
      allExpenses.forEach((exp) => {
        const month = exp.month;
        if (!summary[month]) {
          summary[month] = {
            regularTotal: 0,
            otherTotal: 0,
            verifiedCount: 0,
            refundedCount: 0,
            pendingCount: 0,
          };
        }
        if (exp.expense_category === "Regular") {
          summary[month].regularTotal += exp.amount;
        } else {
          summary[month].otherTotal += exp.amount;
        }
        if (exp.is_verified) summary[month].verifiedCount += 1;
        else if (exp.is_refunded) summary[month].refundedCount += 1;
        else summary[month].pendingCount += 1;
      });

      setMonthlySummary(summary);
      setMonthlyRegular(regTotal.toFixed(2));
      setMonthlyOther(otherTotal.toFixed(2));
      setTodayTotal(todayExpense.toFixed(2));
    } catch (error) {
      console.error("Fetch error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      alert(error.response?.data?.error || "Failed to fetch the data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData, selectedYear, selectedMonth]);

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setSelectedMonth(null);
  };

  const handleMonthClick = (month) => {
    setSelectedMonth(month === selectedMonth ? null : month);
  };

  const downloadExcel = () => {
    if (Object.keys(monthlySummary).length === 0) {
      alert("No data to export.");
      return;
    }

    const data = [
      ["Month", "Regular Total", "Other Total", "Verified Count", "Refunded Count", "Pending Count", "Total"],
      ...Object.entries(monthlySummary)
        .filter(([month]) => !selectedMonth || month === selectedMonth)
        .map(([month, data]) => [
          month,
          `₹${data.regularTotal.toFixed(2)}`,
          `₹${data.otherTotal.toFixed(2)}`,
          data.verifiedCount,
          data.refundedCount,
          data.pendingCount,
          `₹${(data.regularTotal + data.otherTotal).toFixed(2)}`,
        ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet["!cols"] = data[0].map((_, colIndex) => ({
      wch: Math.max(...data.map((row) => (row[colIndex] != null ? row[colIndex].toString().length + 2 : 10))),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly History");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `monthly_history_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const FilterModal = ({ onClose, onSubmit, filters }) => {
    const [year, setYear] = useState(filters.year || dayjs().year().toString());
    const [startMonth, setStartMonth] = useState(filters.startMonth || "");
    const [endMonth, setEndMonth] = useState(filters.endMonth || "");

    const handleSubmit = () => {
      onSubmit({ year, startMonth, endMonth });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          {/* <h2 className="text-lg font-bold text-[#124451] mb-4">Filter History</h2> */}
          <div className="space-y-3">
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Year (e.g., 2025)"
            />
            <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)} className="w-full p-2 border rounded">
              <option value="">Start Month</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)} className="w-full p-2 border rounded">
              <option value="">End Month</option>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cancel</button>
            <button className="px-4 py-2 bg-[#124451] text-white rounded" onClick={handleSubmit}>Apply</button>
          </div>
        </div>
      </div>
    );
  };

  const totalExpense = (parseFloat(monthlyRegular || 0) + parseFloat(monthlyOther || 0)).toFixed(2);

  
  const expensePieData = {
    labels: ["Regular Expenses", "Other Expenses", "Total Expenses"],
    datasets: [
      {
        data: [
          parseFloat(monthlySummary[selectedMonth]?.regularTotal || 0),
          parseFloat(monthlySummary[selectedMonth]?.otherTotal || 0),
          parseFloat(monthlySummary[selectedMonth]?.regularTotal || 0) + parseFloat(monthlySummary[selectedMonth]?.otherTotal || 0),
        ],
        backgroundColor: ["#008080", "#808080", "#F000F"],
        hoverOffset: 4,
      },
    ],
  };

  const statusPieData = {
    labels: ["Verified", "Refunded", "Pending"],
    datasets: [
      {
        data: [
          monthlySummary[selectedMonth]?.verifiedCount || 0,
          monthlySummary[selectedMonth]?.refundedCount || 0,
          monthlySummary[selectedMonth]?.pendingCount || 0,
        ],
        backgroundColor: ["#008080", "#FF4500", "#808080"],
        hoverOffset: 4,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw.toFixed(2)}`,
        },
      },
    },
  };

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen">
      {/* Year Filter */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="p-2 border rounded text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => dayjs().year() - i).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <div className="flex gap-2">
          {/* <button className="bg-[#124451] text-white px-3 py-1 rounded-full flex items-center gap-1" onClick={() => setIsFilterOpen(true)}>
            <FontAwesomeIcon icon={faFilter} />
            <span>Filter</span>
          </button> */}
          <button className="bg-[#124451] text-white px-3 py-1 rounded-full flex items-center gap-1" onClick={downloadExcel}>
            <FontAwesomeIcon icon={faFileExcel} className="text-green-300" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {/* Month List */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 mb-6">
        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => {
          const monthData = monthlySummary[month] || { regularTotal: 0, otherTotal: 0 };
          const isSelected = selectedMonth === month;
          return (
            <div
              key={month}
              onClick={() => handleMonthClick(month)}
              className={`p-3 rounded-lg cursor-pointer text-center ${isSelected ? "bg-[#124451] text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            >
              <h3 className="font-semibold">{month}</h3>
              <p className="text-xs">Total: ₹{(monthData.regularTotal + monthData.otherTotal).toFixed(2)}</p>
            </div>
          );
        })}
      </div>

      {/* Expense Details for Selected Month */}
      {!loading && selectedMonth && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-bold text-[#124451] mb-2">{selectedMonth} Expenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-white rounded-lg shadow">
              <h4 className="font-semibold">Regular Expense</h4>
              <p className="text-lg">₹{monthlySummary[selectedMonth]?.regularTotal.toFixed(2) || "0.00"}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow">
              <h4 className="font-semibold">Other Expense</h4>
              <p className="text-lg">₹{monthlySummary[selectedMonth]?.otherTotal.toFixed(2) || "0.00"}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow">
              <h4 className="font-semibold">Total Expense</h4>
              <p className="text-lg">₹{(monthlySummary[selectedMonth]?.regularTotal + monthlySummary[selectedMonth]?.otherTotal || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard with Pie Charts */}
      {!loading && selectedMonth && (
        <div className="bg-white rounded-lg p-4 md:p-6 flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2">
            <h3 className="text-lg font-bold text-[#124451] mb-2">Expense Distribution</h3>
            <div className="h-64">
              <Pie data={expensePieData} options={pieOptions} />
            </div>
          </div>
          <div className="w-full lg:w-1/2">
            <h3 className="text-lg font-bold text-[#124451] mb-2">Expense Status</h3>
            <div className="h-64">
              <Pie data={statusPieData} options={pieOptions} />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-12 w-12 border-4 border-t-[#124451] border-gray-200 rounded-full" />
        </div>
      ) : !selectedMonth && (
        <div className="text-center text-gray-500 mt-12">Select a month to view details.</div>
      )}
    </div>
  );
};

export default History;