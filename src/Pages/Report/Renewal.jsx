import React, { useState, useEffect, useMemo } from "react";
import MUIDatePicker from "../../Component/DatePicker";
import { useDispatch, useSelector } from "react-redux";
import { fetchDueRenewal } from "../../redux/actions/authActions";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import LoaderSpinner from "../../Component/Loader";

const Renewal = () => {
  const [period, setPeriod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortColumn, setSortColumn] = useState(""); // State for sort column
  const [sortDirection, setSortDirection] = useState("asc"); // State for sort direction
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [isPageLoad, setIsPageLoad] = useState(true);

  const base_url = "https://api-pragati.nichetechqa.com/api/v1";

  const dispatch = useDispatch();
  const {
    data: transactions,
    loading,
    error,
    total_count,
  } = useSelector((state) => state.auth.Renewal);

  const areDatePickersDisabled = !!period;
  const isPeriodDisabled = !!startDate || !!endDate;

  useEffect(() => {
    window.scroll(0, 0);
    const params = {
      period,
      start_date: startDate
        ? new Date(startDate).toISOString().split("T")[0]
        : "",
      end_date: endDate ? new Date(endDate).toISOString().split("T")[0] : "",
      start: currentPage * pageSize,
      limit: pageSize,
      search: searchTerm,
    };
    const fetchData = async () => {
      setIsPageLoad(true);
      try {
        await dispatch(fetchDueRenewal(params));
      } finally {
        setIsPageLoad(false);
      }
    };
    fetchData();
  }, [period, startDate, endDate, pageSize, currentPage, searchTerm, dispatch]);

  // Sorting function
  const sortData = (data, column, direction) => {
    if (!column || !data) return data;

    return [...data].sort((a, b) => {
      let valueA = a[column] || "";
      let valueB = b[column] || "";

      // Handle specific columns
      if (column === "created_at" || column === "end_date") {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      } else if (column === "amount") {
        valueA = parseFloat(valueA) || 0;
        valueB = parseFloat(valueB) || 0;
      } else if (column === "party_name") {
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
      }

      if (direction === "asc") {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  // Memoize sorted data
  const sortedData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return sortData(transactions, sortColumn, sortDirection);
  }, [transactions, sortColumn, sortDirection]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchTerm || !Array.isArray(sortedData)) return sortedData || [];
    return sortedData.filter(
      (item) =>
        item.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tran_id?.toString().includes(searchTerm) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedData, searchTerm]);

  // Handle sort click
  const handleSort = (column) => {
    if (
      column !== "party_name" &&
      column !== "created_at" &&
      column !== "end_date" &&
      column !== "amount"
    )
      return;
    if (sortColumn === column) {
      // Toggle direction if the same column is clicked
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
    setCurrentPage(0); // Reset to first page on sort
  };

  // Render sort icon
  const renderSortIcon = (column) => {
    if (sortColumn !== column) return <i className="fa fa-sort ms-1" />;
    return sortDirection === "asc" ? (
      <i className="fa fa-sort-up ms-1" />
    ) : (
      <i className="fa fa-sort-down ms-1" />
    );
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem("authorization");
      const params = new URLSearchParams({
        period,
        start_date: startDate
          ? new Date(startDate).toISOString().split("T")[0]
          : "",
        end_date: endDate ? new Date(endDate).toISOString().split("T")[0] : "",
        search: searchTerm,
      });
      const response = await fetch(
        `${base_url}/reports/due-report-excel-download?${params}`,
        {
          method: "GET",
          headers: { Authorization: ` ${token}` },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Due_Renewal.xlsx";
        link.click();
      } else {
        Swal.fire("Error", "Failed to download the Excel file.", "error");
      }
    } catch (error) {
      console.error("Download failed:", error);
      Swal.fire(
        "Error",
        "Something went wrong while downloading the file.",
        "error"
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatINR = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when page size changes
  };

  const handlePeriodChange = (e) => {
    const selectedPeriod = e.target.value;
    setPeriod(selectedPeriod);
    if (selectedPeriod) {
      setStartDate("");
      setEndDate("");
    }
    setCurrentPage(0);
  };

  const handleDateChange = (date, type) => {
    if (type === "start") {
      setStartDate(date);
      if (date) setPeriod("");
    } else {
      setEndDate(date);
      if (date) setPeriod("");
    }
    setCurrentPage(0);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0); // Reset to first page on search
  };

  const totalPages = Math.ceil(total_count / pageSize);

  return (
    <div className="container-fluid">
      {isPageLoad && <LoaderSpinner />}
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h1 className="page-title fw-semibold fs-18 mb-0">
          Due Renewal Report
        </h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li aria-current="page" className="breadcrumb-item active">
                <Link to="/reports">Reports</Link>
              </li>
              <li aria-current="page" className="breadcrumb-item active">
                Due Renewal Report
              </li>
            </ol>
          </nav>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Due Renewal Report</div>
            </div>
            <div className="card-body">
              {/* Top Filters: Period, Start, End */}
              <div className="d-flex mb-3 justify-content-between flex-wrap">
                <div className="d-flex flex-wrap">
                  {/* Period Dropdown */}
                  <div className="me-3 mb-3">
                    <label className="form-label">Period</label>
                    <select
                      className="form-select form-select-lg"
                      value={period}
                      onChange={handlePeriodChange}
                      disabled={isPeriodDisabled}
                    >
                      <option value="">Select</option>
                      <option value="today">Today</option>
                      <option value="last_week">Last Week</option>
                      <option value="this_month">This Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="this_year">This Year</option>
                    </select>
                  </div>

                  {/* Start Date and End Date */}
                  <div className="me-3 mb-3">
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                      }}
                    >
                      <div style={{ width: "200px" }}>
                        <label htmlFor="start-date">Start</label>
                        <MUIDatePicker
                          selectedDate={startDate}
                          onChange={(date) => handleDateChange(date, "start")}
                          disabled={areDatePickersDisabled}
                          maxDate={new Date()}
                        />
                      </div>

                      <div style={{ width: "200px" }}>
                        <label htmlFor="endDate">End</label>
                        <MUIDatePicker
                          selectedDate={endDate}
                          onChange={(date) => handleDateChange(date, "end")}
                          disabled={areDatePickersDisabled || !startDate}
                          minDate={startDate}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Bottom Controls: Search, Show Entries, Download */}
              <div className="d-flex flex-wrap align-items-end justify-content-between mb-3">
                {/* Show Entries Dropdown */}
                <div className="me-3 mb-2">
                  <label className="form-label">Show Entries</label>
                  <select
                    className="form-select"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                {/* Search Input */}
                <div className="mb-2" style={{ marginLeft: "-500px" }}>
                  <label className="form-label">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Here"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>

                <div className="me-3 mb-2">
                  <button
                    className="btn btn-outline-primary w-100"
                    type="button"
                    onClick={handleDownloadExcel}
                  >
                    <i className="fa-solid fa-arrow-down me-2" />
                    Download Excel
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table text-nowrap table-bordered">
                  <thead style={{ backgroundColor: "rgb(209, 212, 221)" }}>
                    <tr>
                      <th
                        scope="col"
                        onClick={() => handleSort("party_name")}
                        style={{ cursor: "pointer" }}
                      >
                        Party Name {renderSortIcon("party_name")}
                      </th>
                      <th scope="col">Transaction ID</th>
                      <th
                        scope="col"
                        onClick={() => handleSort("created_at")}
                        style={{ cursor: "pointer" }}
                      >
                        Date {renderSortIcon("created_at")}
                      </th>
                      <th
                        scope="col"
                        onClick={() => handleSort("end_date")}
                        style={{ cursor: "pointer" }}
                      >
                        Renew Date {renderSortIcon("end_date")}
                      </th>
                      <th
                        scope="col"
                        onClick={() => handleSort("amount")}
                        style={{ cursor: "pointer" }}
                      >
                        Amount Received {renderSortIcon("amount")}
                      </th>
                      <th scope="col">Duration</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredData) && filteredData.length > 0 ? (
                      filteredData.map((item) => (
                        <tr key={item.tran_id || item._id}>
                          <td>{item.party_name || "-"}</td>
                          <td>{item.tran_id || "-"}</td>
                          <td>{formatDate(item.created_at)}</td>
                          <td>{formatDate(item.end_date)}</td>
                          <td>{formatINR(item.amount)}</td>
                          <td>{item.duration || "-"}</td>
                          <td>{item.status || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total_count > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {currentPage * pageSize + 1} to{" "}
                    {Math.min((currentPage + 1) * pageSize, total_count)} of{" "}
                    {total_count} entries
                  </div>
                  <nav>
                    <ul className="pagination">
                      <li
                        className={`page-item ${
                          currentPage === 0 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <li
                          key={i}
                          className={`page-item ${
                            currentPage === i ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            style={{ borderRadius: "50%" }}
                            onClick={() => handlePageChange(i)}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}
                      <li
                        className={`page-item ${
                          currentPage === totalPages - 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages - 1}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Renewal;
