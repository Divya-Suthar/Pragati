import React, { useState, useEffect, useRef, useMemo } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MUIDatePicker from "../../Component/DatePicker";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRojmelExpense,
  fetchExpenseCategoriesBySearch,
  createExpenseTransaction,
  deleteExpenseTransaction,
  editExpenseTransaction,
} from "../../redux/actions/authActions";
import Swal from "sweetalert2";
import LoaderSpinner from "../../Component/Loader";
const Expense = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    expenseTitle: "",
    expenseDate: new Date().toISOString().split("T")[0],
    expenseCategory: "",
    expenseAmount: "",
    expenseImage: null,
    description: "",
  });
  const [errors, setErrors] = useState({
    expenseTitle: "",
    expenseDate: "",
    expenseCategory: "",
    expenseAmount: "",
    expenseImage: "",
    description: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTransactionId, setEditTransactionId] = useState(null);
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [isPageLoad, setIsPageLoad] = useState(true);
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
  const fileInputRef = useRef(null);

  const { data, loading, error, allCount } = useSelector(
    (state) => state.auth.rojmelExpense
  );

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categories = await dispatch(fetchExpenseCategoriesBySearch(""));
        setCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load expense categories",
        });
      }
    };

    fetchCategories();
  }, [dispatch]);

  useEffect(() => {
       window.scroll(0,0);
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
        await dispatch(fetchRojmelExpense(params));
      } finally {
        setIsPageLoad(false);
      }
    };
    fetchData();
  }, [ startDate, endDate, pageSize, currentPage, dispatch]);

  // Sorting function
  const sortData = (data, column, direction) => {
    if (!column || !data) return data;

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
      } else if (column === "name") {
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
      } else if (column === "comments") {
        valueA = valueA.toString().toLowerCase();
        valueB = valueB.toString().toLowerCase();
      } else if (column === "expense_category_name") {
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

  // Memoize sorted data to avoid unnecessary re-computations
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return sortData(data, sortColumn, sortDirection);
  }, [data, sortColumn, sortDirection]);

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

  const formatDate = (dateString, returnFormat = "display") => {
    if (!dateString) return returnFormat === "display" ? "-" : "";

    try {
      // If already in DD/MM/YYYY format
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return returnFormat === "display"
          ? dateString
          : dateString.split("/").reverse().join("-");
      }

      // Handle ISO format or other date strings
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setErrors({
          ...errors,
          expenseImage: "Please upload a valid image (JPG, PNG, JPEG)",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors({
          ...errors,
          expenseImage: "File size should be less than 5MB",
        });
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setSelectedImage({
        file,
        preview: imageUrl,
        name: file.name,
      });
      setErrors({ ...errors, expenseImage: "" });
    }
  };

  useEffect(() => {
    return () => {
      if (selectedImage?.preview) {
        URL.revokeObjectURL(selectedImage.preview);
      }
    };
  }, [selectedImage]);

  const handleRemoveImage = () => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
    fileInputRef.current.value = "";
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(allCount / pageSize);

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

  const validateTitle = (title) => {
    if (!title)
      return "Expense Title cannot be blank. Please enter a title for the expense.";
    if (title.length < 2)
      return "Expense Title must be at least 2 characters long.";
    if (!/^[a-zA-Z0-9\s]+$/.test(title))
      return "Invalid Expense Title. Please ensure the title contains only letters, numbers.";
    return "";
  };

  const validateCategory = (category) => {
    if (!category) return "Please select an expense category";
    return "";
  };

  const validateAmount = (amount) => {
    if (!amount)
      return "Amount cannot be blank. Please enter the expense amount.";
    const num = parseFloat(amount.replace(/[^0-9.]/g, ""));
    if (isNaN(num) || num <= 0) return "Enter a valid amount";
    return "";
  };

  const validateImage = (file) => {
    if (!file) return "";
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) return "Only JPG, PNG, JPEG allowed";
    if (file.size > 5 * 1024 * 1024) return "File size must be less than 5MB";
    return "";
  };

  const validateDescription = (desc) => {
    if (desc && desc.length < 2)
      return "Description must be at least 2 characters long.";
    return "";
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

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    let newValue = value;
    let error = "";

    if (name === "expenseImage") {
      newValue = files[0] || null;
      error = validateImage(newValue);
    } else if (name === "expenseTitle") {
      error = validateTitle(value);
    } else if (name === "expenseCategory") {
      error = validateCategory(value);
    } else if (name === "expenseAmount") {
      newValue = value.replace(/[^0-9.]/g, "");
      error = validateAmount(newValue);
    } else if (name === "description") {
      error = validateDescription(value);
    } else if (name === "expenseDate") {
      error = value ? "" : "Date is required";
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const resetForm = () => {
    setFormData({
      expenseTitle: "",
      expenseDate: new Date().toISOString().split("T")[0],
      expenseCategory: "",
      expenseAmount: "",
      expenseImage: null,
      description: "",
    });

    setErrors({
      expenseTitle: "",
      expenseDate: "",
      expenseCategory: "",
      expenseAmount: "",
      expenseImage: "",
      description: "",
    });

    handleRemoveImage();
    setIsEditMode(false);
    setEditTransactionId(null);
  };

  const handleDeleteTransaction = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this expense transaction!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const result = await dispatch(deleteExpenseTransaction(id));

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
          dispatch(fetchRojmelExpense(params));
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

  const handleEditTransaction = (transaction) => {
    setIsEditMode(true);
    setEditTransactionId(transaction.tran_id);

    // Handle date
    const transactionDate = transaction.start_date || transaction.created_at;
    const formattedDate = formatDateForInput(transactionDate);

    // Set form data
    const newFormData = {
      expenseTitle: transaction.name || "",
      expenseDate: formattedDate,
      expenseCategory: transaction.expense_category_id?.toString() || "",
      expenseAmount: transaction.amount?.toString() || "",
      description: transaction.comments || "",
    };
    setFormData(newFormData);

    // Handle image preview
    if (transaction.image_url) {
      // For existing images, we'll just show the URL without fetching
      setSelectedImage({
        preview: transaction.image_url,
        name: transaction.image_name || "Existing Image",
        file: null,
        isExisting: true, // Add flag to indicate this is an existing image
      });
    } else {
      setSelectedImage(null);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Open offcanvas
    const offcanvasElement = document.getElementById("offcanvasRight");
    if (offcanvasElement) {
      const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
      offcanvas.show();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const titleError = validateTitle(formData.expenseTitle);
    const categoryError = validateCategory(formData.expenseCategory);
    const amountError = validateAmount(formData.expenseAmount);
    const dateError = formData.expenseDate ? "" : "Date is required";

    setErrors({
      expenseTitle: titleError,
      expenseDate: dateError,
      expenseCategory: categoryError,
      expenseAmount: amountError,
      expenseImage: "",
      description: "",
    });

    if (titleError || categoryError || amountError || dateError) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill all required fields correctly",
      });
      return;
    }

    try {
      const transactionData = new FormData();
      transactionData.append("name", formData.expenseTitle);
      transactionData.append("expense_category_id", formData.expenseCategory);
      transactionData.append(
        "amount",
        formData.expenseAmount.replace(/[^0-9.]/g, "")
      );
      transactionData.append("comments", formData.description || "");
      transactionData.append("start_date", formData.expenseDate);

      if (selectedImage?.file) {
        transactionData.append("image", selectedImage.file);
      }

      let result;
      if (isEditMode && editTransactionId) {
        transactionData.append("tran_id", editTransactionId);
        result = await dispatch(editExpenseTransaction(transactionData));
      } else {
        result = await dispatch(createExpenseTransaction(transactionData));
      }

      if (result?.errorcode === 0) {
        Swal.fire({
          icon: "success",
          title: isEditMode ? "Transaction Updated" : "Success!",
          text: isEditMode
            ? "Expense transaction updated successfully"
            : "Expense transaction created successfully",
        });

        resetForm();

        const offcanvas = bootstrap.Offcanvas.getInstance(
          document.getElementById("offcanvasRight")
        );
        if (offcanvas) offcanvas.hide();

        // Refresh the data
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
        dispatch(fetchRojmelExpense(params));
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.message || "Failed to process transaction",
        });
      }
    } catch (error) {
      console.error("Error creating/updating expense:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to add/update expense",
      });
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(
        `https://uatapi-pragati.nichetechqa.com/api/v1/expenses/download-expense-list`,
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
        link.download = "expense-transaction_list.xlsx";
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
        <h1 className="page-title fw-semibold fs-18 mb-0">Rojmel Expense</h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Rojmel Expense
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Rojmel Expense</div>
              <div>
                {permissions.add && (
                  <button
                    className="btn btn-primary"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#offcanvasRight"
                    aria-controls="offcanvasRight"
                  >
                    <i className="fa-solid fa-plus me-2"></i>Add Expense
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
                  data-bs-backdrop="static"
                  aria-labelledby="offcanvasRightLabel1"
                >
                  <div className="offcanvas-header border-bottom border-block-end-dashed">
                    <h5 className="offcanvas-title" id="offcanvasRightLabel1">
                      {isEditMode ? "Edit Expense" : "Add Expense"}
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
                    <form onSubmit={handleSubmit}>
                      <div className="row">
                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mb-3">
                          <label
                            htmlFor="expenseTitle"
                            className="form-label fw-bold"
                          >
                            Expense Title*
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="expenseTitle"
                            name="expenseTitle"
                            value={formData.expenseTitle}
                            onChange={handleInputChange}
                            placeholder="Enter Expense Title"
                          />
                          {errors.expenseTitle && (
                            <div style={{ color: "red" }}>
                              {errors.expenseTitle}
                            </div>
                          )}
                        </div>
                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-1 mb-3">
                          <label
                            htmlFor="expenseDate"
                            className="form-label fw-bold"
                          >
                            Date*
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            id="expenseDate"
                            name="expenseDate"
                            value={formData.expenseDate}
                            onChange={handleInputChange}
                          />
                          {errors.expenseDate && (
                            <div style={{ color: "red" }}>
                              {errors.expenseDate}
                            </div>
                          )}
                        </div>
                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-1 mb-3">
                          <label
                            htmlFor="expenseCategory"
                            className="form-label fw-bold"
                          >
                            Expense Category*
                          </label>
                          <select
                            id="expenseCategory"
                            name="expenseCategory"
                            className="form-select form-select-lg"
                            value={formData.expenseCategory}
                            onChange={handleInputChange}
                          >
                            <option value="" disabled>
                              Select Expense Category
                            </option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          {errors.expenseCategory && (
                            <div style={{ color: "red" }}>
                              {errors.expenseCategory}
                            </div>
                          )}
                        </div>
                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-1 mb-3">
                          <label
                            htmlFor="expenseAmount"
                            className="form-label fw-bold"
                          >
                            Expense Amount*
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="expenseAmount"
                            name="expenseAmount"
                            value={formatAmount(formData.expenseAmount)}
                            onChange={handleInputChange}
                            placeholder="Enter Amount"
                          />
                          {errors.expenseAmount && (
                            <div style={{ color: "red" }}>
                              {errors.expenseAmount}
                            </div>
                          )}
                        </div>
                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-1 mb-3">
                          <label
                            htmlFor="expenseImage"
                            className="form-label fw-bold"
                          >
                            Upload Image (JPG, PNG, JPEG - Max 5MB)
                          </label>
                          <input
                            type="file"
                            id="expenseImage"
                            name="expenseImage"
                            className="form-control d-none"
                            accept=".jpg,.jpeg,.png"
                            onChange={handleImageChange}
                            ref={fileInputRef}
                          />
                          <button
                            type="button"
                            className="btn btn-outline-primary mb-3 d-flex align-items-center"
                            style={{ marginLeft: "425px" }}
                            onClick={() => fileInputRef.current.click()}
                          >
                            <i className="fa-solid fa-upload me-2"></i>
                            Choose File
                          </button>
                          {selectedImage && (
                            <div className="d-flex align-items-center mt-2">
                              <div className="position-relative me-3">
                                <img
                                  src={selectedImage.preview}
                                  alt="Preview"
                                  className="img-thumbnail rounded-2"
                                  style={{
                                    width: "250px",
                                    height: "150px",
                                    objectFit: "cover",
                                  }}
                                />
                                {!selectedImage.isExisting && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm position-absolute top-0 end-0 translate-middle rounded-circle d-flex align-items-center justify-content-center"
                                    onClick={handleRemoveImage}
                                    style={{
                                      width: "25px",
                                      height: "25px",
                                      padding: "0",
                                      fontSize: "14px",
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                              <span className="text-muted">
                                {selectedImage.name}
                              </span>
                            </div>
                          )}
                          {errors.expenseImage && (
                            <div
                              className="text-danger mt-2"
                              style={{ fontSize: "0.875rem" }}
                            >
                              {errors.expenseImage}
                            </div>
                          )}
                        </div>
                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mb-3">
                          <label
                            htmlFor="description"
                            className="form-label fw-bold"
                          >
                            Description
                          </label>
                          <textarea
                            className="form-control"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter Description"
                            rows="1"
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
                          >
                            {isEditMode ? "Update Expense" : "Add Expense"}
                          </button>
                        </div>
                      </div>
                    </form>
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
                        Amount {renderSortIcon("amount")}
                      </th>
                      <th
                        onClick={() => handleSort("name")}
                        style={{ cursor: "pointer" }}
                      >
                        Expense Title {renderSortIcon("name")}
                      </th>
                      <th
                        onClick={() => handleSort("comments")}
                        style={{ cursor: "pointer" }}
                      >
                        Description {renderSortIcon("comments")}
                      </th>
                      <th
                        onClick={() => handleSort("expense_category_name")}
                        style={{ cursor: "pointer" }}
                      >
                        Category {renderSortIcon("expense_category_name")}
                      </th>
                      <th>Transaction Type</th>
                      {(permissions.edit || permissions.delete) && (
                        <th>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    { sortedData.length > 0 ? (
                      sortedData.map((item) => (
                        <tr key={item.tran_id}>
                          <td>{formatDate(item.start_date)}</td>
                          <td>{formatINR(item.amount)}</td>
                          <td>{item.name || "-"}</td>
                          <td>{item.comments || "-"}</td>
                          <td>{item.expense_category_name || "-"}</td>
                          <td>{item.transaction_type_name || "-"}</td>
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
                        <td colSpan="7" className="text-center">
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {allCount > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    Showing {currentPage * pageSize + 1} to{" "}
                    {Math.min((currentPage + 1) * pageSize, allCount)} of{" "}
                    {allCount} entries
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

export default Expense;
