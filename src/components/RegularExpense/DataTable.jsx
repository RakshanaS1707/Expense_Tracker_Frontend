// import React, { useState, useEffect, useCallback } from "react";
// import { faFileExcel, faFilter } from "@fortawesome/free-solid-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { getGroupedOrders, getAvailableDates } from "../../api_service/api";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
 
// const DataTable = () => {
// const [groupedItems, setGroupedItems] = useState({});
// const [loading, setLoading] = useState(true);
// const [showFilter, setShowFilter] = useState(false);
// const [currentPage, setCurrentPage] = useState(1);
// const [totalPages, setTotalPages] = useState(1);
// const [availableDates, setAvailableDates] = useState([]);
// const [totalPrice, setTotalPrice] = useState(0);
// const [filters, setFilters] = useState({
// start_date: null,
// end_date: null,
// specific_date: null,
// month: null,
// });
 
// const PAGE_SIZE = 10;
 
// const fetchData = useCallback(
// async (page = 1) => {
// setLoading(true);
// try {
// const apiFilters = {};
// if (filters.start_date)
// apiFilters.start_date = filters.start_date
// .toISOString()
// .split("T")[0];
// if (filters.end_date)
// apiFilters.end_date = filters.end_date.toISOString().split("T")[0];
// if (filters.specific_date)
// apiFilters.specific_date = filters.specific_date
// .toISOString()
// .split("T")[0];
// if (filters.month) apiFilters.month = filters.month;
 
// const data = await getGroupedOrders(page, PAGE_SIZE, apiFilters);
// setGroupedItems(data.results);
// setTotalPrice(data.total_price);
// setTotalPages(data.total_pages);
// setCurrentPage(page);
 
// if (availableDates.length === 0) {
// const dates = await getAvailableDates();
// setAvailableDates(dates);
// }
// } catch (error) {
// console.error("Error fetching data:", error);
// alert("Failed to fetch grouped orders. Please try again.");
// } finally {
// setLoading(false);
// }
// },
// [filters, availableDates.length]
// );
 
// useEffect(() => {
// fetchData();
// }, [fetchData]);
 
// const handleFilterSubmit = (newFilters) => {
// setFilters(newFilters);
// setShowFilter(false);
// setCurrentPage(1);
// };
 
// const handlePageChange = (page) => {
// if (page >= 1 && page <= totalPages) {
// fetchData(page);
// }
// };
 
// // Updated formatDate to return a safe sheet name for Excel (YYYY-MM-DD)
// const formatDate = (dateString) => {
// const d = new Date(dateString);
// const year = d.getFullYear();
// const month = String(d.getMonth() + 1).padStart(2, "0");
// const day = String(d.getDate()).padStart(2, "0");
// return `${year}-${month}-${day}`;
// };
 
// const downloadExcel = () => {
// const workbook = XLSX.utils.book_new();
 
// const allRows = [
// ["Date", "Item Name", "Count", "Price per Item", "Total Price"],
// ];
 
// let grandTotal = 0;
 
// Object.keys(groupedItems).forEach((date) => {
// const items = groupedItems[date];
 
// items.forEach((item) => {
// const itemTotal = item.count * item.price;
// grandTotal += itemTotal;
 
// allRows.push([
// formatDate(date),
// item.item_name,
// item.count,
// item.price,
// itemTotal.toFixed(2),
// ]);
// });
 
// // Add empty row after each date group
// allRows.push([]);
// });
 
// // Add Grand Total row
// allRows.push([]);
// allRows.push(["", "", "", "Grand Total", grandTotal.toFixed(2)]);
 
// const worksheet = XLSX.utils.aoa_to_sheet(allRows);
 
// // Auto column width
// const colWidths = allRows[0].map((_, colIndex) => {
// return Math.max(
// ...allRows.map((row) => {
// const cell = row[colIndex];
// if (cell == null) return 10;
// return cell.toString().length + 2;
// })
// );
// });
// worksheet["!cols"] = colWidths.map((w) => ({ wch: w }));
 
// // Bold header row
// const range = XLSX.utils.decode_range(worksheet["!ref"]);
// for (let C = range.s.c; C <= range.e.c; ++C) {
// const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
// if (worksheet[cellAddress]) {
// worksheet[cellAddress].s = {
// font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
// fill: { fgColor: { rgb: "305496" } },
// alignment: { horizontal: "center", vertical: "center" },
// };
// }
// }
 
// XLSX.utils.book_append_sheet(workbook, worksheet, "All Orders");
 
// const excelBuffer = XLSX.write(workbook, {
// bookType: "xlsx",
// type: "array",
// });
 
// const blob = new Blob([excelBuffer], {
// type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
// });
 
// const fileName = `all_orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
// saveAs(blob, fileName);
// };
 
// return (
// <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen relative">
// <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
// <h2 className="text-lg md:text-xl font-bold text-[#124451]">
// {loading
// ? "Loading..."
// : `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
// </h2>
// <div className="flex gap-2 w-full md:w-auto">
// <button
// className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
// onClick={downloadExcel}
// >
// <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
// <span className="hidden sm:inline">Download Excel</span>
// </button>
 
// <button
// className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
// onClick={() => setShowFilter(true)}
// >
// <FontAwesomeIcon icon={faFilter} />
// <span className="hidden sm:inline">Filter</span>
// </button>
 
// <button
// className="bg-gray-300 text-[#124451] px-3 py-1 text-sm md:text-base md:px-4 rounded-full"
// onClick={() =>
// handleFilterSubmit({
// start_date: null,
// end_date: null,
// specific_date: null,
// month: null,
// })
// }
// >
// Clear Filters
// </button>
// </div>
// </div>
 
// {loading && (
// <div className="flex justify-center items-center h-64">
// <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#124451]"></div>
// </div>
// )}
 
// {!loading && Object.keys(groupedItems).length > 0 && (
// <>
// <div className="hidden md:block">
// <div className="grid grid-cols-6 font-semibold text-gray-500 text-[14px] border-b pb-2 mb-2 border-gray-100 p-4">
// <div>Date</div>
// <div>Items</div>
// <div className="text-center">Count</div>
// <div className="text-center">Price / item</div>
// <div className="text-center">Total price / item</div>
// <div className="text-center">Total price</div>
// </div>
 
// {Object.keys(groupedItems).map((date, idx) => {
// const items = groupedItems[date];
// const totalPerRow = items.reduce(
// (sum, item) => sum + item.count * item.price,
// 0
// );
 
// return (
// <div
// key={date}
// className={`${
// idx % 2 === 0 ? "bg-gray-100" : "bg-white"
// } p-4 grid grid-cols-6`}
// >
// <div className="row-span-full flex items-center font-semibold">
// {formatDate(date)}
// </div>
// <div className="col-span-4">
// {items.map((item, index) => (
// <div
// key={index}
// className="grid grid-cols-4 text-sm text-gray-800 py-1"
// >
// <div>{item.item_name}</div>
// <div className="text-center">{item.count}</div>
// <div className="text-center">
// ₹{item.price.toFixed(2)}
// </div>
// <div className="text-center">
// ₹{(item.count * item.price).toFixed(2)}
// </div>
// </div>
// ))}
// </div>
// <div className="flex items-center justify-center font-semibold">
// ₹ {totalPerRow.toFixed(2)}
// </div>
// </div>
// );
// })}
// </div>
 
// <div className="md:hidden space-y-4">
// {Object.keys(groupedItems).map((date, idx) => {
// const items = groupedItems[date];
// const totalPerRow = items.reduce(
// (sum, item) => sum + item.count * item.price,
// 0
// );
 
// return (
// <div
// key={date}
// className={`${
// idx % 2 === 0 ? "bg-gray-100" : "bg-white"
// } p-4 rounded-lg shadow-sm`}
// >
// <div className="font-semibold text-[#124451] mb-3">
// {formatDate(date)}
// </div>
// {items.map((item, index) => (
// <div
// key={index}
// className="flex justify-between mb-2 text-sm"
// >
// <span>{item.item_name}</span>
// <span>Count: {item.count}</span>
// <span>₹{item.price.toFixed(2)}</span>
// <span>
// Total: ₹{(item.count * item.price).toFixed(2)}
// </span>
// </div>
// ))}
// <div className="font-semibold text-center mt-2 border-t pt-2">
// Total Price: ₹ {totalPerRow.toFixed(2)}
// </div>
// </div>
// );
// })}
// </div>
// </>
// )}
 
// {showFilter && (
// <FilterModal
// onClose={() => setShowFilter(false)}
// onSubmit={handleFilterSubmit}
// availableDates={availableDates}
// filters={filters}
// />
// )}
 
// {!loading && Object.keys(groupedItems).length === 0 && (
// <div className="text-center text-gray-500 mt-12">
// No grouped orders found.
// </div>
// )}
 
// {!loading && totalPages > 1 && (
// <div className="flex justify-center gap-4 mt-8">
// <button
// className="px-3 py-1 bg-[#124451] text-white rounded"
// onClick={() => handlePageChange(currentPage - 1)}
// disabled={currentPage === 1}
// >
// Prev
// </button>
// <span className="flex items-center justify-center font-semibold px-3 py-1 border rounded">
// Page {currentPage} of {totalPages}
// </span>
// <button
// className="px-3 py-1 bg-[#124451] text-white rounded"
// onClick={() => handlePageChange(currentPage + 1)}
// disabled={currentPage === totalPages}
// >
// Next
// </button>
// </div>
// )}
// </div>
// );
// };
 
// const FilterModal = ({ onClose, onSubmit, availableDates, filters }) => {
// const [startDate, setStartDate] = useState(filters.start_date);
// const [endDate, setEndDate] = useState(filters.end_date);
// const [month, setMonth] = useState(filters.month);
 
// const uniqueMonths = Array.from(
// new Set(
// availableDates.map((dateStr) => {
// const date = new Date(dateStr);
// return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
// 2,
// "0"
// )}`;
// })
// )
// );
 
// const handleSubmit = () => {
// onSubmit({
// start_date: startDate,
// end_date: endDate,
// month,
// });
// };
 
// return (
// <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50">
// <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
// <h2 className="text-xl font-bold text-[#124451] mb-4">Filter Orders</h2>
 
// <div className="mb-4">
// <label className="block mb-1 text-sm font-semibold">Start Date</label>
// <DatePicker
// selected={startDate}
// onChange={(date) => setStartDate(date)}
// className="w-full p-2 border rounded"
// placeholderText="Select start date"
// dateFormat="yyyy-MM-dd"
// isClearable
// />
// </div>
 
// <div className="mb-4">
// <label className="block mb-1 text-sm font-semibold">End Date</label>
// <DatePicker
// selected={endDate}
// onChange={(date) => setEndDate(date)}
// className="w-full p-2 border rounded"
// placeholderText="Select end date"
// dateFormat="yyyy-MM-dd"
// isClearable
// />
// </div>
 
// <div className="mb-4">
// <label className="block mb-1 text-sm font-semibold">Month</label>
// <select
// className="w-full p-2 border rounded"
// value={month || ""}
// onChange={(e) => setMonth(e.target.value || null)}
// >
// <option value="">Select Month</option>
// {uniqueMonths.map((m) => (
// <option key={m} value={m}>
// {new Date(`${m}-01`).toLocaleString("default", {
// month: "long",
// year: "numeric",
// })}
// </option>
// ))}
// </select>
// </div>
 
// <div className="flex justify-end gap-3 mt-6">
// <button
// className="bg-gray-300 text-[#124451] px-4 py-2 rounded"
// onClick={onClose}
// >
// Cancel
// </button>
// <button
// className="bg-[#124451] text-white px-4 py-2 rounded"
// onClick={handleSubmit}
// >
// Apply Filter
// </button>
// </div>
// </div>
// </div>
// );
// };
 
// export default DataTable;


// import React, { useState, useEffect } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faFileExcel, faPlus, faFilter } from "@fortawesome/free-solid-svg-icons";
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";
// import AddItem from "../UpdateItem/Additem";
// import { getGroupedOrders } from "../../api_service/api";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// const PAGE_SIZE = 7;

// const DataTable = () => {
//   const [groupedItems, setGroupedItems] = useState({});
//   const [totalPrice, setTotalPrice] = useState(0);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [showAddItem, setShowAddItem] = useState(false);
//   const [showFilter, setShowFilter] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);
//   const [itemName, setItemName] = useState("");

//   useEffect(() => {
//     fetchGroupedData(currentPage);
//   }, [currentPage]);

//   const fetchGroupedData = async (page) => {
//     setLoading(true);
//     try {
//       const filters = {};
//       if (startDate) filters.start_date = startDate.toISOString().slice(0, 10);
//       if (endDate) filters.end_date = endDate.toISOString().slice(0, 10);
//       if (itemName) filters.item_name = itemName;

//       const data = await getGroupedOrders(page, PAGE_SIZE, filters);
//       setGroupedItems(data.results);
//       setTotalPrice(data.total_price);
//       setTotalPages(data.total_pages);
//     } catch (err) {
//       console.error("Error fetching data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (dateString) => {
//     const d = new Date(dateString);
//     return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
//   };

//   const downloadExcel = () => {
//     const wb = XLSX.utils.book_new();
//     const rows = [["Date", "Item", "Count", "Price/item", "Total/item"]];
//     let grandTotal = 0;

//     Object.entries(groupedItems).forEach(([date, items]) => {
//       items.forEach((item) => {
//         const total = item.count * item.price;
//         rows.push([
//           formatDate(date),
//           item.item_name,
//           item.count,
//           `₹${item.price.toFixed(2)}`,
//           `₹${total.toFixed(2)}`,
//         ]);
//         grandTotal += total;
//       });
//       rows.push([]);
//     });
//     rows.push(["", "", "", "Grand Total", `₹${grandTotal.toFixed(2)}`]);

//     const ws = XLSX.utils.aoa_to_sheet(rows);
//     XLSX.utils.book_append_sheet(wb, ws, "Expenses");
//     const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     saveAs(new Blob([buffer]), `expenses_${new Date().toISOString().slice(0, 10)}.xlsx`);
//   };

//   const handleFilterApply = () => {
//     setShowFilter(false);
//     setCurrentPage(1);
//     fetchGroupedData(1);
//   };

//   const handleClearFilters = () => {
//     setStartDate(null);
//     setEndDate(null);
//     setItemName("");
//     setCurrentPage(1);
//     fetchGroupedData(1);
//     setShowFilter(false);
//   };

//   const handlePageChange = (page) => {
//     if (page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//     }
//   };

//   return (
//     <div className="p-4 md:p-6 bg-white rounded-lg min-h-screen">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
//         <h2 className="text-lg md:text-xl font-bold text-[#124451]">
//           {loading ? "Loading..." : `Total Price: ₹ ${Number(totalPrice || 0).toFixed(2)}`}
//         </h2>
//         <div className="flex gap-2 w-full md:w-auto">
//           <button
//             className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
//             onClick={() => setShowFilter(true)}
//           >
//             <FontAwesomeIcon icon={faFilter} />
//             <span className="hidden sm:inline">Filter</span>
//           </button>
//           <button
//             className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
//             onClick={() => setShowAddItem(true)}
//           >
//             <FontAwesomeIcon icon={faPlus} />
//             <span className="hidden sm:inline">Add Item</span>
//           </button>
//           <button
//             className="bg-[#124451] text-white px-3 py-1 text-sm md:text-base md:px-4 rounded-full flex items-center gap-1"
//             onClick={downloadExcel}
//           >
//             <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
//             <span className="hidden sm:inline">Download Excel</span>
//           </button>
//           <button
//             className="bg-gray-300 text-[#124451] px-3 py-1 text-sm md:text-base md:px-4 rounded-full"
//             onClick={handleClearFilters}
//           >
//             Clear Filters
//           </button>
//         </div>
//       </div>

//       {/* FILTER MODAL */}
//       {showFilter && (
//         <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50">
//           <div className="bg-white p-6 rounded-lg w-full max-w-md relative">
//             <button className="absolute top-3 right-4 text-xl" onClick={() => setShowFilter(false)}>
//               ×
//             </button>
//             <h3 className="text-lg font-semibold mb-4">Filter Expenses</h3>
//             <div className="mb-4">
//               <label className="block mb-1 font-medium">Start Date</label>
//               <DatePicker
//                 selected={startDate}
//                 onChange={(date) => setStartDate(date)}
//                 className="w-full p-2 border rounded"
//                 placeholderText="Select start date"
//                 dateFormat="yyyy-MM-dd"
//                 isClearable
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block mb-1 font-medium">End Date</label>
//               <DatePicker
//                 selected={endDate}
//                 onChange={(date) => setEndDate(date)}
//                 className="w-full p-2 border rounded"
//                 placeholderText="Select end date"
//                 dateFormat="yyyy-MM-dd"
//                 isClearable
//               />
//             </div>
//             <div className="mb-4">
//               <label className="block mb-1 font-medium">Item Name</label>
//               <input
//                 type="text"
//                 className="w-full p-2 border rounded"
//                 value={itemName}
//                 onChange={(e) => setItemName(e.target.value)}
//                 placeholder="Enter item name"
//               />
//             </div>
//             <div className="flex justify-end gap-2">
//               <button className="px-4 py-2 bg-gray-300 rounded" onClick={handleClearFilters}>
//                 Cancel
//               </button>
//               <button className="px-4 py-2 bg-[#124451] text-white rounded" onClick={handleFilterApply}>
//                 Apply Filter
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* TABLE DISPLAY */}
//       {loading ? (
//         <div className="flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#124451]"></div>
//         </div>
//       ) : Object.keys(groupedItems).length === 0 ? (
//         <div className="text-center text-gray-500 mt-12">No expense records available.</div>
//       ) : (
//         <>
//           {/* Desktop View */}
//           <div className="hidden md:block">
//             <div className="grid grid-cols-6 font-semibold text-gray-500 text-[14px] border-b pb-2 mb-2 border-gray-100 p-4">
//               <div>Date</div>
//               <div>Items</div>
//               <div className="text-center">Count</div>
//               <div className="text-center">Price / item</div>
//               <div className="text-center">Total price / item</div>
//               <div className="text-center">Total price</div>
//             </div>
//             {Object.keys(groupedItems).map((date, idx) => {
//               const items = groupedItems[date];
//               const totalPerRow = items.reduce((sum, item) => sum + item.count * item.price, 0);
//               return (
//                 <div
//                   key={date}
//                   className={`${idx % 2 === 0 ? "bg-gray-100" : "bg-white"} p-4 grid grid-cols-6`}
//                 >
//                   <div className="row-span-full flex items-center font-semibold">
//                     {formatDate(date)}
//                   </div>
//                   <div className="col-span-4">
//                     {items.map((item, index) => (
//                       <div key={index} className="grid grid-cols-4 text-sm text-gray-800 py-1">
//                         <div>{item.item_name}</div>
//                         <div className="text-center">{item.count}</div>
//                         <div className="text-center">₹{item.price.toFixed(2)}</div>
//                         <div className="text-center">₹{(item.count * item.price).toFixed(2)}</div>
//                       </div>
//                     ))}
//                   </div>
//                   <div className="flex items-center justify-center font-semibold">
//                     ₹ {totalPerRow.toFixed(2)}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Mobile View */}
//           <div className="md:hidden space-y-4">
//             {Object.keys(groupedItems).map((date, idx) => {
//               const items = groupedItems[date];
//               const totalPerRow = items.reduce((sum, item) => sum + item.count * item.price, 0);
//               return (
//                 <div
//                   key={date}
//                   className={`${idx % 2 === 0 ? "bg-gray-100" : "bg-white"} p-4 rounded-lg shadow-sm`}
//                 >
//                   <div className="font-semibold text-[#124451] mb-3">{formatDate(date)}</div>
//                   {items.map((item, index) => (
//                     <div key={index} className="flex justify-between mb-2 text-sm">
//                       <span>{item.item_name}</span>
//                       <span>Count: {item.count}</span>
//                       <span>₹{item.price.toFixed(2)}</span>
//                       <span>Total: ₹{(item.count * item.price).toFixed(2)}</span>
//                     </div>
//                   ))}
//                   <div className="font-semibold text-center mt-2 border-t pt-2">
//                     Total Price: ₹ {totalPerRow.toFixed(2)}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Pagination */}
//           {totalPages > 1 && (
//             <div className="flex justify-center gap-4 mt-8">
//               <button
//                 className="px-3 py-1 bg-[#124451] text-white rounded"
//                 onClick={() => handlePageChange(currentPage - 1)}
//                 disabled={currentPage === 1}
//               >
//                 Prev
//               </button>
//               <span className="flex items-center justify-center font-semibold px-3 py-1 border rounded">
//                 Page {currentPage} of {totalPages}
//               </span>
//               <button
//                 className="px-3 py-1 bg-[#124451] text-white rounded"
//                 onClick={() => handlePageChange(currentPage + 1)}
//                 disabled={currentPage === totalPages}
//               >
//                 Next
//               </button>
//             </div>
//           )}
//         </>
//       )}

//       {/* Add Item Modal */}
//       {showAddItem && (
//         <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.7)] flex justify-center items-center">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
//             <button
//               onClick={() => setShowAddItem(false)}
//               className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl"
//             >
//               ×
//             </button>
//             <AddItem
//               onClose={() => {
//                 setShowAddItem(false);
//                 fetchGroupedData(currentPage);
//               }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DataTable;







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

const PAGE_SIZE = 6;

const DataTable = () => {
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
      await axios.delete(`http://localhost:8000/api/order-items/${itemId}/`, {
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
        `http://localhost:8000/api/order-items/${editFormData.id}/`,
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
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
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
              <div>
                {items.map((item, i) => (
                  <div key={i} className="text-center py-1">
                    {console.log("item.user:", item.user, "currentUser:", currentUser, "item.id:", item.id)}
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

export default DataTable;