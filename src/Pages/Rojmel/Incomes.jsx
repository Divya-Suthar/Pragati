import React, { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MUIDatePicker from "../../Component/DatePicker";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRojmelIncome,
  fetchIncomeCategoriesBySearch,
  createIncomeTransaction,
  deleteIncomeTransaction,
  editIncomeTransaction,
} from "../../redux/actions/authActions";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import LoaderSpinner from "../../Component/Loader";

const Incomes = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
    const [isPageLoad, setIsPageLoad] = useState(true);
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category_id: "",
    description_abi: "",
    description: "",
  });
  const [errors, setErrors] = useState({
    amount: "",
    category_id: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTransactionId, setEditTransactionId] = useState(null);

  // Sorting states
  const [sortColumn, setSortColumn] = useState(""); 
  const [sortDirection, setSortDirection] = useState("asc"); 
  const [sortedData, setSortedData] = useState([]); 
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
  const { data: rawData, loading, error, count } = useSelector(
    (state) => state.auth.rojmelIncome
  );

  useEffect(() => {
       window.scroll(0,0);
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const categories = await dispatch(fetchIncomeCategoriesBySearch());
        setIncomeCategories(categories || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
        Swal.fire("Error", "Failed to load income categories", "error");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [dispatch]);

   useEffect(() => {
     const params = {
       start_date: startDate
         ? new Date(startDate).toISOString().split("T")[0]
         : "",
       end_date: endDate ? new Date(endDate).toISOString().split("T")[0] : "",
       start: currentPage * pageSize,
       limit: pageSize,
     };
     const fetchData = async () => {
       setIsPageLoad(true);
       try {
         await dispatch(fetchRojmelIncome(params));
       } finally {
         setIsPageLoad(false);
       }
     };
     fetchData();
   }, [ startDate, endDate, pageSize, currentPage, dispatch]);

  // Sort data whenever rawData, sortColumn, or sortDirection changes
  useEffect(() => {
    if (rawData && rawData.length > 0) {
      const sorted = sortData(rawData, sortColumn, sortDirection);
      setSortedData(sorted);
    } else {
      setSortedData([]);
    }
  }, [rawData, sortColumn, sortDirection]);

  // Sorting function
  const sortData = (data, column, direction) => {
    if (!column) return data;

    return [...data].sort((a, b) => {
      let valueA = a[column] || "";
      let valueB = b[column] || "";

      // Handle special cases for specific columns
      if (column === "start_date") {
        valueA = new Date(valueA);
        valueB = new Date(valueB);
      } else if (column === "amount") {
        valueA = parseFloat(valueA) || 0;
        valueB = parseFloat(valueB) || 0;
      } else if (column === "name") { // Category
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
      } else { // Description (comments)
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

  // Sorting handler
  const handleSort = (column) => {
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

  // Render sort icon based on column and direction
  const renderSortIcon = (column) => {
    if (sortColumn !== column) return <i className="fa fa-sort ms-1" />;
    return sortDirection === "asc" ? (
      <i className="fa fa-sort-up ms-1" />
    ) : (
      <i className="fa fa-sort-down ms-1" />
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "amount") {
      const cleanedValue = value.replace(/[^0-9]/g, "");
      setFormData({
        ...formData,
        [name]: cleanedValue,
      });

      if (!cleanedValue || isNaN(cleanedValue) || parseInt(cleanedValue) <= 0) {
        setErrors({
          ...errors,
          amount: "Please enter a valid positive amount.",
        });
      } else {
        setErrors({
          ...errors,
          amount: "",
        });
      }
    } else if (name === "description") {
      setFormData({
        ...formData,
        [name]: value,
      });

      if (value && value.length < 2) {
        setErrors({
          ...errors,
          description: "Description must be at least 2 characters",
        });
      } else {
        setErrors({
          ...errors,
          description: "",
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });

      if (name === "category_id" && !value) {
        setErrors({
          ...errors,
          category_id: "Please select a category",
        });
      } else if (name === "category_id") {
        setErrors({
          ...errors,
          category_id: "",
        });
      }
    }
  };

  const handleEditTransaction = (transaction) => {
    setIsEditMode(true);
    setEditTransactionId(transaction.tran_id);

    // Get the exact same date shown in the table, but in YYYY-MM-DD format
    const tableDisplayDate = formatDate(transaction.start_date);
    const formDate = formatDate(tableDisplayDate, "form");

    setFormData({
      amount: transaction.amount.toString(),
      date: formDate,
      category_id: transaction.id?.toString() || "",
      description: transaction.comments || "",
    });

    // Open the edit form
    const offcanvasElement = document.getElementById("offcanvasRight");
    const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
    offcanvas.show();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      amount:
        !formData.amount ||
        isNaN(formData.amount) ||
        parseInt(formData.amount) <= 0
          ? "Please enter a valid positive amount."
          : "",
      category_id: !formData.category_id ? "Please select a category" : "",
      description:
        formData.description && formData.description.length < 2
          ? "Description must be at least 2 characters"
          : "",
    };

    setErrors(newErrors);

    const hasErrors = Object.values(newErrors).some((error) => error !== "");

    if (!hasErrors) {
      setIsSubmitting(true);
      try {
        const formattedDate = formData.date.includes("T")
          ? formData.date.split("T")[0]
          : formData.date;

        const payload = {
          amount: parseInt(formData.amount),
          start_date: formattedDate,
          income_category_id: formData.category_id,
          comments: formData.description,
        };

        let result;
        if (isEditMode && editTransactionId) {
          payload.tran_id = editTransactionId;
          result = await dispatch(editIncomeTransaction(payload));
        } else {
          result = await dispatch(createIncomeTransaction(payload));
        }

        if (result?.errorcode === 0) {
          Swal.fire({
            icon: "success",
            title: isEditMode ? "Transaction Updated" : "Success!",
            text: isEditMode
              ? "Income transaction updated successfully"
              : "Income transaction created successfully",
          });

          resetForm();

          const offcanvas = bootstrap.Offcanvas.getInstance(
            document.getElementById("offcanvasRight")
          );
          if (offcanvas) offcanvas.hide();

          const params = {
            start_date: startDate
              ? new Date(startDate).toISOString().split("T")[0]
              : "",
            end_date: endDate
              ? new Date(endDate).toISOString().split("T")[0]
              : "",
            start: currentPage * pageSize,
            limit: pageSize,
          };
          dispatch(fetchRojmelIncome(params));
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: result?.message || "Failed to process transaction",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Failed to process transaction",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return "";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/^(\D+)/, "₹ ");
  };

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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(count / pageSize);

  const handleDateChange = (date, type) => {
    if (type === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setCurrentPage(0);
  };

  const formatINR = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category_id: "",
      description_abi: "",
      description: "",
    });
    setErrors({
      amount: "",
      category_id: "",
      description: "",
    });
    setIsEditMode(false);
    setEditTransactionId(null);
  };

  const handleDeleteTransaction = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this income transaction!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const result = await dispatch(deleteIncomeTransaction(id));

        if (result?.errorcode === 0) {
          Swal.fire("Deleted!", result.message, "success");
          const params = {
            start_date: startDate
              ? new Date(startDate).toISOString().split("T")[0]
              : "",
            end_date: endDate
              ? new Date(endDate).toISOString().split("T")[0]
              : "",
            start: currentPage * pageSize,
            limit: pageSize,
          };
          dispatch(fetchRojmelIncome(params));
        } else {
          Swal.fire(
            "Error",
            result?.message || "Failed to delete transaction",
            "error"
          );
        }
      } catch (error) {
        Swal.fire("Error", "Something went wrong!", "error");
      }
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `https://uatapi-pragati.nichetechqa.com/api/v1/income/download-income-transaction`,
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
        link.download = "income-transaction_list.xlsx";
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
        <h1 className="page-title fw-semibold fs-18 mb-0">Rojmel Income</h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Rojmel Income
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Rojmel Income</div>
              <div className="">
                  {permissions.add && (
                <button
                  className="btn btn-primary"
                  type="button"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#offcanvasRight"
                  aria-controls="offcanvasRight"
                  onClick={resetForm}
                >
                  <i className="fa-solid fa-plus me-2"></i>Add Income
                </button>
                  )}
              </div>
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
                          onChange={(date) => handleDateChange(date, "start")}
                           maxDate={new Date()}
                        />
                      </div>

                      <div style={{ width: "200px" }}>
                        <label htmlFor="endDate">End</label>
                        <MUIDatePicker
                          selectedDate={endDate}
                          onChange={(date) => handleDateChange(date, "end")}
                          minDate={startDate}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex flex-wrap align-items-end justify-content-between mb-3">
                <div
                  className="offcanvas main-sidebar-new offcanvas-end"
                  tabIndex="-1"
                  id="offcanvasRight"
                  aria-labelledby="offcanvasRightLabel1"
                  data-bs-backdrop="static"
                >
                  <div className="offcanvas-header border-bottom border-block-end-dashed">
                    <h5 className="offcanvas-title" id="offcanvasRightLabel1">
                      {isEditMode ? "Edit Income" : "Add Income"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      data-bs-dismiss="offcanvas"
                      aria-label="Close"
                      onClick={resetForm}
                    ></button>
                  </div>
                  <div className="offcanvas-body">
                    <div className="row">
                      <form onSubmit={handleSubmit}>
                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-1 mb-3">
                          <label
                            htmlFor="amount"
                            className="form-label fw-bold"
                          >
                            Inward Amount*
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="amount"
                            name="amount"
                            placeholder="Enter amount"
                            value={formatAmount(formData.amount)}
                            onChange={handleInputChange}
                          />
                          {errors.amount && (
                            <div style={{ color: "red" }}>{errors.amount}</div>
                          )}
                        </div>

                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-1 mb-3">
                          <label htmlFor="date" className="form-label fw-bold">
                            Date*
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-1 mb-3">
                          <label
                            htmlFor="category_id"
                            className="form-label fw-bold"
                          >
                            Category*
                          </label>
                          <select
                            id="category_id"
                            className={`form-select form-select-lg ${
                              errors.category_id ? "is-invalid" : ""
                            }`}
                            name="category_id"
                            value={formData.category_id}
                            onChange={handleInputChange}
                            disabled={loadingCategories}
                          >
                            <option value="" disabled>
                              Select Income Category
                            </option>
                            {incomeCategories.map((category) => (
                              <option
                                key={category.id}
                                value={category.id.toString()}
                              >
                                {" "}
                                {/* Ensure value is string */}
                                {category.name}
                              </option>
                            ))}
                          </select>
                          {errors.category_id && (
                            <div style={{ color: "red" }}>
                              {errors.category_id}
                            </div>
                          )}
                          {loadingCategories && (
                            <div className="mt-2 text-muted">
                              Loading categories...
                            </div>
                          )}
                        </div>

                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-1 mb-3">
                          <label
                            htmlFor="description"
                            className="form-label fw-bold"
                          >
                            Description
                          </label>
                          <textarea
                            className="form-control"
                            placeholder="Enter Description"
                            id="description"
                            name="description"
                            rows="1"
                            value={formData.description}
                            onChange={handleInputChange}
                          ></textarea>
                          {errors.description && (
                            <div style={{ color: "red" }}>
                              {errors.description}
                            </div>
                          )}
                        </div>

                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-3">
                          <button
                            className="btn btn-primary w-100"
                            type="submit"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                Processing...
                              </>
                            ) : isEditMode ? (
                              "Update Income"
                            ) : (
                              "Add Income"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

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
                <table className="table table-bordered table-striped">
                  <thead style={{ backgroundColor: "rgb(209, 212, 221)" }}>
                    <tr>
                      <th
                        onClick={() => handleSort("start_date")}
                        style={{ cursor: "pointer" }}
                      >
                        Date {renderSortIcon("start_date")}
                      </th>
                      <th
                        onClick={() => handleSort("amount")}
                        style={{ cursor: "pointer" }}
                      >
                        Inward Amount {renderSortIcon("amount")}
                      </th>
                      <th
                        onClick={() => handleSort("comments")}
                        style={{ cursor: "pointer" }}
                      >
                        Description {renderSortIcon("comments")}
                      </th>
                      <th
                        onClick={() => handleSort("name")}
                        style={{ cursor: "pointer" }}
                      >
                        Category {renderSortIcon("name")}
                      </th>
                      <th>Transaction Type</th>
                        {(permissions.edit || permissions.delete) && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.length > 0 ? (
                      sortedData.map((item) => (
                        <tr key={item.tran_id}>
                          <td>{formatDate(item.start_date)}</td>
                          <td>{formatINR(item.amount)}</td>
                          <td>{item.comments || "-"}</td>
                          <td>{item.name}</td>
                          <td>{item.transaction_type_name}</td>
                          <td>
                            <div className="hstack gap-2 fs-1">
                                {permissions.edit && (
                              <a
                                href="#"
                                className="btn btn-icon btn-sm btn-info-light"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleEditTransaction(item);
                                }}
                              >
                                <i className="fa-regular fa-pen-to-square"></i>
                              </a>
                                )}
                                  {permissions.delete && (
                              <a
                                href="#"
                                className="btn btn-icon btn-sm btn-danger-light"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteTransaction(item.tran_id);
                                }}
                              >
                                <i className="fa-regular fa-trash-can"></i>
                              </a>
                                  )}
                            </div>
                          </td>
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
              </div>

              {count > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {currentPage * pageSize + 1} to{" "}
                    {Math.min((currentPage + 1) * pageSize, count)} of {count}{" "}
                    entries
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

export default Incomes;