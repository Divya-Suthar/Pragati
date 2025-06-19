import React, { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MUIDatePicker from "../../Component/DatePicker";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllReportRojmel,
  fetchTodayReportRojmel,
} from "../../redux/actions/authActions";
import { Link } from "react-router-dom";
import LoaderSpinner from "../../Component/Loader";

const RojmelReport = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allPageSize, setAllPageSize] = useState(10);
  const [allCurrentPage, setAllCurrentPage] = useState(0);
  const [isPageLoad, setIsPageLoad] = useState(true);
  const [todayPageSize, setTodayPageSize] = useState(10);
  const [todayCurrentPage, setTodayCurrentPage] = useState(0);
  const [allSortColumn, setAllSortColumn] = useState("");
  const [allSortDirection, setAllSortDirection] = useState("asc");
  const [todaySortColumn, setTodaySortColumn] = useState("");
  const [todaySortDirection, setTodaySortDirection] = useState("asc");
  const [permissions, setPermissions] = useState({
    add: false,
    edit: false,
    delete: false,
  });

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        const partyPermissions = parsedData.permissions?.configuration || {};
        setPermissions({
          add: partyPermissions.add || false,
          edit: partyPermissions.edit || false,
          delete: partyPermissions.delete || false,
        });
      } catch (error) {
        console.error("Error parsing userData:", error);
      }
    }
  }, []);

  const dispatch = useDispatch();

  const {
    data: todayDataRaw,
    loading: todayLoading,
    error: todayError,
    count: todayCount,
    total_cash,
    today_cash,
  } = useSelector((state) => state.auth.todayRojmelReport);
  const {
    data: allDataRaw,
    loading,
    error,
    count,
    total_cash: allTotalCash,
    today_cash: allTodayCash,
  } = useSelector((state) => state.auth.rojmelReport);

  // Sorted data states
  const [sortedTodayData, setSortedTodayData] = useState([]);
  const [sortedAllData, setSortedAllData] = useState([]);

  const formatDate = (dateString, returnFormat = "display") => {
    if (!dateString) return returnFormat === "display" ? "-" : "";

    try {
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return returnFormat === "display"
          ? dateString
          : dateString.split("/").reverse().join("-");
      }

      const date = new Date(dateString);
      if (isNaN(date.getTime()))
        return returnFormat === "display" ? dateString : "";

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return returnFormat === "display"
        ? `${day}/${month}/${year}`
        : `${year}-${month}-${day}`;
    } catch (e) {
      console.error("Date formatting error:", e);
      return returnFormat === "display" ? dateString : "";
    }
  };

  const formatDateForInput = (dateString) => {
    return formatDate(dateString, "form");
  };

  const formatINR = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    setAllCurrentPage(0);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    setAllCurrentPage(0);
  };

  const handleAllPageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setAllPageSize(newSize);
    setAllCurrentPage(0);
  };

  const sortData = (data, sortColumn, sortDirection) => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let valueA = a[sortColumn] || "";
      let valueB = b[sortColumn] || "";

      if (sortColumn === "start_date") {
        valueA = new Date(formatDateForInput(valueA));
        valueB = new Date(formatDateForInput(valueB));
      } else if (sortColumn === "amount") {
        valueA = parseFloat(valueA) || 0;
        valueB = parseFloat(valueB) || 0;
      } else {
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
      }

      if (sortDirection === "asc") {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });
  };

  const handleAllSort = (column) => {
    if (allSortColumn === column) {
      setAllSortDirection(allSortDirection === "asc" ? "desc" : "asc");
    } else {
      setAllSortColumn(column);
      setAllSortDirection("asc");
    }
    setAllCurrentPage(0);
  };

  const handleTodaySort = (column) => {
    if (todaySortColumn === column) {
      setTodaySortDirection(todaySortDirection === "asc" ? "desc" : "asc");
    } else {
      setTodaySortColumn(column);
      setTodaySortDirection("asc");
    }
    setTodayCurrentPage(0);
  };

  useEffect(() => {
       window.scroll(0,0);
    const params = {
      start_date: startDate ? formatDateForInput(startDate) : "",
      end_date: endDate ? formatDateForInput(endDate) : "",
      start: allCurrentPage * allPageSize,
      limit: allPageSize,
    };
    const fetchData = async () => {
      setIsPageLoad(true);
      try {
        await dispatch(fetchAllReportRojmel(params));
      } finally {
        setIsPageLoad(false);
      }
    };
    fetchData();
  }, [startDate, endDate, allPageSize, allCurrentPage, dispatch]);

  useEffect(() => {
       window.scroll(0,0);
    const params = {
      start: todayCurrentPage * todayPageSize,
      limit: todayPageSize,
    };
    const fetchData = async () => {
      setIsPageLoad(true);
      try {
        await dispatch(fetchTodayReportRojmel(params));
      } finally {
        setIsPageLoad(false);
      }
    };
    fetchData();
  }, [todayPageSize, todayCurrentPage, dispatch]);

  useEffect(() => {
    if (allDataRaw && allDataRaw.length > 0) {
      const sorted = sortData(allDataRaw, allSortColumn, allSortDirection);
      setSortedAllData(sorted);
    } else {
      setSortedAllData([]);
    }
  }, [allDataRaw, allSortColumn, allSortDirection]);

  useEffect(() => {
    if (todayDataRaw && todayDataRaw.length > 0) {
      const sorted = sortData(
        todayDataRaw,
        todaySortColumn,
        todaySortDirection
      );
      setSortedTodayData(sorted);
    } else {
      setSortedTodayData([]);
    }
  }, [todayDataRaw, todaySortColumn, todaySortDirection]);

  const allTotalPages = Math.ceil(count / allPageSize);
  const todayTotalPages = Math.ceil(todayCount / todayPageSize);

  const handleAllPageChange = (newPage) => {
    setAllCurrentPage(newPage);
  };

  const handleTodayPageChange = (newPage) => {
    setTodayCurrentPage(newPage);
  };

  const renderSortIcon = (column, sortColumn, sortDirection) => {
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
      const response = await fetch(
        `https://uatapi-pragati.nichetechqa.com/api/v1/expenses/get-expense-excel-download`,
        {
          method: "GET",
          headers: {
            Authorization: `${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "RojmelReport-transaction_list.xlsx";
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

  return (
    <div className="container-fluid">
     {isPageLoad && (
       <LoaderSpinner/>
      )}
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h1 className="page-title fw-semibold fs-18 mb-0">Rojmel Report</h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Rojmel Report
              </li>
            </ol>
          </nav>
        </div>
      </div>


      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Rojmel Report</div>
            </div>

            <div className="card-body">
              <div className="d-flex mb-3 justify-content-between flex-wrap">
                <div className="d-flex flex-wrap">
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
                          onChange={handleStartDateChange}
                          maxDate={new Date()}
                        />
                      </div>
                      <div style={{ width: "200px" }}>
                        <label htmlFor="endDate">End</label>
                        <MUIDatePicker
                          selectedDate={endDate}
                          onChange={handleEndDateChange}
                          minDate={startDate}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap align-items-end justify-content-between mb-3">
                <div className="me-3 mb-2">
                  <label className="form-label">Show Entries</label>
                  <select
                    className="form-select"
                    value={allPageSize}
                    onChange={handleAllPageSizeChange}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <div className="mb-2" style={{ marginLeft: "-500px" }}>
                  <label className="form-label">Search</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Here"
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

              <div className="card-body">
                <div className="d-flex justify-content-end">
                  <p className="fs-18">
                    <b>Total Cash Balance:</b> {formatINR(total_cash)}
                  </p>
                  <p className="fs-18 mx-2">|</p>
                  <p className="fs-18">
                    <b>Today's Transaction:</b> {formatINR(today_cash)}
                  </p>
                </div>

                <ul
                  className="nav nav-tabs tab-style-1 d-sm-flex d-flex d-block"
                  role="tablist"
                >
                  <li className="nav-item">
                    <a
                      className="nav-link text-center active"
                      data-bs-toggle="tab"
                      data-bs-target="#today"
                      href="#today"
                    >
                      Today's Transactions
                    </a>
                  </li>
                  <li className="nav-item">
                    <a
                      className="nav-link text-center"
                      data-bs-toggle="tab"
                      data-bs-target="#all"
                      href="#all"
                    >
                      All Transactions
                    </a>
                  </li>
                </ul>

                <div className="tab-content mt-3">
          
                  <div
                    className="tab-pane fade show active"
                    id="today"
                    role="tabpanel"
                  >
                    <table className="table table-bordered table-striped">
                      <thead style={{ backgroundColor: "rgb(209, 212, 221)" }}>
                        <tr>
                          <th
                            onClick={() => handleTodaySort("start_date")}
                            style={{ cursor: "pointer" }}
                          >
                            Date{" "}
                            {renderSortIcon(
                              "start_date",
                              todaySortColumn,
                              todaySortDirection
                            )}
                          </th>
                          <th
                            onClick={() => handleTodaySort("amount")}
                            style={{ cursor: "pointer" }}
                          >
                            Amount{" "}
                            {renderSortIcon(
                              "amount",
                              todaySortColumn,
                              todaySortDirection
                            )}
                          </th>
                          <th
                            onClick={() => handleTodaySort("name")}
                            style={{ cursor: "pointer" }}
                          >
                            Expense Title{" "}
                            {renderSortIcon(
                              "name",
                              todaySortColumn,
                              todaySortDirection
                            )}
                          </th>
                          <th
                            onClick={() => handleTodaySort("comments")}
                            style={{ cursor: "pointer" }}
                          >
                            Description{" "}
                            {renderSortIcon(
                              "comments",
                              todaySortColumn,
                              todaySortDirection
                            )}
                          </th>
                          <th
                            onClick={() =>
                              handleTodaySort("expense_category_name")
                            }
                            style={{ cursor: "pointer" }}
                          >
                            Category{" "}
                            {renderSortIcon(
                              "expense_category_name",
                              todaySortColumn,
                              todaySortDirection
                            )}
                          </th>
                          <th
                            onClick={() =>
                              handleTodaySort("transaction_type_name")
                            }
                            style={{ cursor: "pointer" }}
                          >
                            Transaction Type{" "}
                            {renderSortIcon(
                              "transaction_type_name",
                              todaySortColumn,
                              todaySortDirection
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTodayData.length > 0 ? (
                          sortedTodayData.map((item) => (
                            <tr key={item.tran_id}>
                              <td>{formatDate(item.start_date)}</td>
                              <td>{formatINR(item.amount)}</td>
                              <td>{item.name || "-"}</td>
                              <td>{item.comments || "-"}</td>
                              <td>{item.expense_category_name}</td>
                              <td>{item.transaction_type_name || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                
                    {todayCount > 0 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          Showing {todayCurrentPage * todayPageSize + 1} to{" "}
                          {Math.min(
                            (todayCurrentPage + 1) * todayPageSize,
                            todayCount
                          )}{" "}
                          of {todayCount} entries
                        </div>
                        <nav>
                          <ul className="pagination">
                            <li
                              className={`page-item ${
                                todayCurrentPage === 0 ? "disabled" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() =>
                                  handleTodayPageChange(todayCurrentPage - 1)
                                }
                                disabled={todayCurrentPage === 0}
                              >
                                Previous
                              </button>
                            </li>
                            {Array.from({ length: todayTotalPages }, (_, i) => (
                              <li
                                key={i}
                                className={`page-item ${
                                  todayCurrentPage === i ? "active" : ""
                                }`}
                              >
                                <button
                                  className="page-link"
                                  style={{ borderRadius: "50%" }}
                                  onClick={() => handleTodayPageChange(i)}
                                >
                                  {i + 1}
                                </button>
                              </li>
                            ))}
                            <li
                              className={`page-item ${
                                todayCurrentPage === todayTotalPages - 1
                                  ? "disabled"
                                  : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() =>
                                  handleTodayPageChange(todayCurrentPage + 1)
                                }
                                disabled={
                                  todayCurrentPage === todayTotalPages - 1
                                }
                              >
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </div>

                
                  <div className="tab-pane fade" id="all" role="tabpanel">
                    <table className="table table-bordered table-striped">
                      <thead style={{ backgroundColor: "rgb(209, 212, 221)" }}>
                        <tr>
                          <th
                            onClick={() => handleAllSort("start_date")}
                            style={{ cursor: "pointer" }}
                          >
                            Date{" "}
                            {renderSortIcon(
                              "start_date",
                              allSortColumn,
                              allSortDirection
                            )}
                          </th>
                          <th
                            onClick={() => handleAllSort("amount")}
                            style={{ cursor: "pointer" }}
                          >
                            Amount{" "}
                            {renderSortIcon(
                              "amount",
                              allSortColumn,
                              allSortDirection
                            )}
                          </th>
                          <th
                            onClick={() => handleAllSort("name")}
                            style={{ cursor: "pointer" }}
                          >
                            Expense Title{" "}
                            {renderSortIcon(
                              "name",
                              allSortColumn,
                              allSortDirection
                            )}
                          </th>
                          <th
                            onClick={() => handleAllSort("comments")}
                            style={{ cursor: "pointer" }}
                          >
                            Description{" "}
                            {renderSortIcon(
                              "comments",
                              allSortColumn,
                              allSortDirection
                            )}
                          </th>
                          <th
                            onClick={() =>
                              handleAllSort("expense_category_name")
                            }
                            style={{ cursor: "pointer" }}
                          >
                            Category{" "}
                            {renderSortIcon(
                              "expense_category_name",
                              allSortColumn,
                              allSortDirection
                            )}
                          </th>
                          <th
                            onClick={() =>
                              handleAllSort("transaction_type_name")
                            }
                            style={{ cursor: "pointer" }}
                          >
                            Transaction Type{" "}
                            {renderSortIcon(
                              "transaction_type_name",
                              allSortColumn,
                              allSortDirection
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAllData.length > 0 ? (
                          sortedAllData.map((item) => (
                            <tr key={item.tran_id}>
                              <td>{formatDate(item.start_date)}</td>
                              <td>{formatINR(item.amount)}</td>
                              <td>{item.name || "-"}</td>
                              <td>{item.comments || "-"}</td>
                              <td>{item.expense_category_name}</td>
                              <td>{item.transaction_type_name || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">
                              No data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Pagination for All Transactions */}
                    {count > 0 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          Showing {allCurrentPage * allPageSize + 1} to{" "}
                          {Math.min((allCurrentPage + 1) * allPageSize, count)}{" "}
                          of {count} entries
                        </div>
                        <nav>
                          <ul className="pagination">
                            <li
                              className={`page-item ${
                                allCurrentPage === 0 ? "disabled" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() =>
                                  handleAllPageChange(allCurrentPage - 1)
                                }
                                disabled={allCurrentPage === 0}
                              >
                                Previous
                              </button>
                            </li>
                            {Array.from({ length: allTotalPages }, (_, i) => (
                              <li
                                key={i}
                                className={`page-item ${
                                  allCurrentPage === i ? "active" : ""
                                }`}
                              >
                                <button
                                  className="page-link"
                                  style={{ borderRadius: "50%" }}
                                  onClick={() => handleAllPageChange(i)}
                                >
                                  {i + 1}
                                </button>
                              </li>
                            ))}
                            <li
                              className={`page-item ${
                                allCurrentPage === allTotalPages - 1
                                  ? "disabled"
                                  : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() =>
                                  handleAllPageChange(allCurrentPage + 1)
                                }
                                disabled={allCurrentPage === allTotalPages - 1}
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
        </div>
      </div>
    </div>
  );
};

export default RojmelReport;
