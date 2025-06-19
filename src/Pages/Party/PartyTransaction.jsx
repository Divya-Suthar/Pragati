import MUIDatePicker from "../../Component/DatePicker";
import React, { useState, useEffect, useMemo } from "react";
import { toWords } from "number-to-words";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPartySuggestions,
  clearPartySuggestions,
  fetchTransactions,
  createTransaction,
  fetchPaginatedTransactions,
  deleteTransaction,
  editTransaction,
  returnTransaction,
  renewTransaction,
} from "../../redux/actions/authActions";
import Swal from "sweetalert2";
import LoaderSpinner from "../../Component/Loader";


const PartyTransactions = () => {
  const base_url = "https://uatapi-pragati.nichetechqa.com/api/v1";

  const dispatch = useDispatch();
  const partySuggestions = useSelector((state) => state.auth.partySuggestions);
  const { transactions, total_count, currentPage, limit, loading } =
    useSelector((state) => state.auth.transactions);

  // Pagination and sorting state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRenewMode, setIsRenewMode] = useState(false);
  const [editTranId, setEditTranId] = useState(null);
  const [period, setPeriod] = useState("");
  const [status, setStatus] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [partyName, setPartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [partyDate, setPartyDate] = useState("");
  const [renewDate, setRenewDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(3);
  const [interest, setInterest] = useState(0.5);
  const [brokerage, setBrokerage] = useState(0.2);
  const [comments, setComments] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [modalTrigger, setModalTrigger] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [partySelectedFromSuggestion, setPartySelectedFromSuggestion] =
    useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState("asc"); 
   const [isPageLoad, setIsPageLoad] = useState(true);

  const [errors, setErrors] = useState({
    partyName: "",
    amount: "",
    comments: "",
    renewDate: "",
  });

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
        const partyPermissions =
          parsedData.permissions?.party_transaction || {};
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

  useEffect(() => {
       window.scroll(0,0);
    const loadData = async () => {
      setIsPageLoad(true);
      try {
        await loadTransactions(0, pageSize);
      } finally {
        setIsPageLoad(false);
      }
    };
    loadData();
  }, [period, status, startDate, endDate]);

  const loadTransactions = (start, limit) => {
    dispatch(
      fetchPaginatedTransactions(
        start,
        limit,
        period,
        startDate,
        endDate,
        status
      )
    );
  };

  // Add this useEffect to fetch receipt data when modal opens
  useEffect(() => {
    const handleModalShow = async (e) => {
      if (e.relatedTarget && e.relatedTarget.dataset.bsTarget) {
        const modalId = e.relatedTarget.dataset.bsTarget;
        const transactionId = modalId.replace("#detailsModal-", "");
        await fetchReceiptData(transactionId);
      }
    };

    document.addEventListener("show.bs.modal", handleModalShow);
    return () => {
      document.removeEventListener("show.bs.modal", handleModalShow);
    };
  }, []);

  // Handle page change
  const handlePageChange = async (newPage) => {
    if (newPage === currentPage) return;

    setIsPageLoad(true);
    try {
      const startIndex = (newPage - 1) * pageSize;
      await loadTransactions(startIndex, pageSize);
    } finally {
      setIsPageLoad(false);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value);
    setPageSize(newPageSize);
    loadTransactions(0, newPageSize);
  };

  // Calculate total pages
  const totalPages = Math.ceil(total_count / pageSize);

  // Set initial party date
  useEffect(() => {
    setPartyDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Search handling
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Apply search filter
  const filteredTransactions = useMemo(() => {
    if (!searchTerm || !Array.isArray(transactions)) return transactions || [];
    return transactions.filter(
      (transaction) =>
        transaction.party_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.tran_id?.toString().includes(searchTerm)
    );
  }, [transactions, searchTerm]);

  // Sorting function
  const sortData = (data, column, direction) => {
    if (!column || !data) return data;

    return [...data].sort((a, b) => {
      let valueA = a[column] || "";
      let valueB = b[column] || "";

      // Handle special cases for specific columns
      if (column === "start_date" || column === "end_date") {
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
  const sortedTransactions = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) return [];
    return sortData(filteredTransactions, sortColumn, sortDirection);
  }, [filteredTransactions, sortColumn, sortDirection]);

  // Sorting handler
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
    handlePageChange(1);
  };

  const renderSortIcon = (column) => {
    if (sortColumn !== column) return <i className="fa fa-sort ms-1" />;
    return sortDirection === "asc" ? (
      <i className="fa fa-sort-up ms-1" />
    ) : (
      <i className="fa fa-sort-down ms-1" />
    );
  };

  // Show warning if suggestions are empty
  useEffect(() => {
    const nameError = validatePartyName(partyName);

    if (
      !nameError &&
      partyName &&
      !partySelectedFromSuggestion &&
      partySuggestions.length === 0
    ) {
      setShowWarning(true);
      const timer = setTimeout(() => setShowWarning(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowWarning(false);
    }
  }, [partySuggestions, partyName, partySelectedFromSuggestion]);

  const validatePartyName = (name) => {
    const regex = /^[A-Za-z][A-Za-z\s]*$/;
    if (!name) return "Party name cannot be blank,Please enter the party Name.";
    if (name.length < 2) return "Party name must be at least 2 characters.";
    if (!regex.test(name))
      return "Invalid Party name,Only Letters are allowed;number and special character are not Permitted";
    return "";
  };

  const validateRenewDate = (date) => {
    if (isRenewMode && !date) return "Renew date is required.";
    if (isRenewMode && date && partyDate) {
      const renew = new Date(date);
      const start = new Date(partyDate);
      if (renew <= start) return "Renew date must be after the start date.";
    }
    return "";
  };

  const handleNameChange = (e) => {
    let value = e.target.value;

    // Prevent space at the beginning
    if (value.length === 1 && value[0] === " ") {
      return;
    }

    setPartyName(value);
    setPartySelectedFromSuggestion(false);

    const errorMsg = validatePartyName(value);

    if (!errorMsg) {
      setErrors({ ...errors, partyName: "" });
      dispatch(fetchPartySuggestions(value));
    } else {
      setErrors({ ...errors, partyName: errorMsg });
      dispatch(clearPartySuggestions());
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setPartyName(suggestion.name);
    setSelectedParty(suggestion);
    setPartySelectedFromSuggestion(true);
    dispatch(clearPartySuggestions());
    setShowWarning(false);
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

  const validateAmount = (val) => {
    return val.replace(/[^0-9]/g, "")
      ? ""
      : "Amount cannot be blank. Please enter the amount.";
  };

  const formatIndianRupee = (val) => {
    const num = parseInt(val, 10);
    return isNaN(num)
      ? ""
      : num.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        });
  };

  const formatINR = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setErrors((prev) => ({ ...prev, amount: validateAmount(raw) }));
    setAmount(raw ? formatIndianRupee(raw) : "");
  };

  const handleBrokerageChange = (e) => {
    setBrokerage(parseFloat(e.target.value));
  };

  const validateComments = (text) => {
    if (!text.trim()) return "Comments cannot be blank.";
    if (text.trim().length < 2)
      return "Comments must be at least 2 characters long.";
    return "";
  };

  const handleCommentsChange = (e) => {
    let value = e.target.value;
    if (value.length === 1 && value[0] === " ") {
      return;
    }
    setComments(value);
    setErrors((prev) => ({ ...prev, comments: validateComments(value) }));
  };

  const handleInterestChange = (value) => {
    let numericValue = parseFloat(value);
    if (numericValue < 0.5) numericValue = 0.5;
    else if (numericValue > 2) numericValue = 2;
    setInterest(parseFloat(numericValue.toFixed(2)));
  };

  const handleSliderChange = (value) => {
    let numericValue = parseInt(value);
    setDuration(Math.min(Math.max(numericValue, 1), 36));
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();

    // Validate inputs
    const nameError = validatePartyName(partyName);
    const amountError = validateAmount(amount);
    const commentsError = validateComments(comments);
    const renewDateError = validateRenewDate(renewDate);

    if (nameError || amountError || (isRenewMode && renewDateError)) {
      setErrors({
        partyName: nameError,
        amount: amountError,
        comments: commentsError,
        renewDate: renewDateError,
      });
      return;
    }

    // Prepare payload
    const cleanAmount = parseFloat(amount.replace(/[^0-9.]/g, ""));
    const formattedDate = new Date(partyDate).toISOString().split("T")[0];

    const payload = {
      party_id: selectedParty?.id || null,
      party_name: partyName,
      amount: cleanAmount,
      interest: parseFloat(interest),
      brokerage: parseFloat(brokerage),
      duration: parseInt(duration),
      start_date: formattedDate,
      comments: comments.trim(),
      transaction_type: 1,
      status: isRenewMode ? "closed" : "new",
    };

    if (isRenewMode && renewDate) {
      payload.end_date = new Date(renewDate).toISOString().split("T")[0];
    }

    if (isEditMode || isRenewMode) {
      payload.tran_id = editTranId;
    }

    try {
      if (!payload.party_id) {
        await Swal.fire({ icon: "error", text: "Please select a valid party" });
        return;
      }

      let result;
      if (isEditMode) {
        result = await dispatch(editTransaction(payload));
      } else if (isRenewMode) {
        result = await dispatch(renewTransaction(payload));
      } else {
        result = await dispatch(createTransaction(payload));
      }

      // Check for successful response
      if (result?.errorcode === 0) {
        await Swal.fire({
          icon: "success",
          text: isEditMode
            ? "Transaction updated successfully"
            : isRenewMode
            ? "Transaction renewed successfully"
            : "Transaction created successfully",
        });

        // Refresh transactions
        loadTransactions((currentPage - 1) * pageSize, pageSize);
        resetForm();

        // Close the offcanvas
        const offcanvas = bootstrap.Offcanvas.getInstance(
          document.getElementById("offcanvasRight")
        );
        if (offcanvas) offcanvas.hide();
      } else {
        throw new Error(
          result?.payload?.message ||
            result?.error?.message ||
            "Operation failed. Please try again."
        );
      }
    } catch (error) {
      console.error("Transaction error:", error);
      await Swal.fire({
        icon: "error",
        title: isEditMode
          ? "Update failed"
          : isRenewMode
          ? "Renew failed"
          : "Creation failed",
        text: error.message || "Something went wrong",
      });
    }
  };

  const isFilterByDisabled = period || startDate;
  const isPeriodDisabled = status || startDate;
  const isStartDateDisabled = status || period;
  const isEndDateDisabled = !startDate || period || status;

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleDeleteParty = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this Transaction!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const result = await dispatch(deleteTransaction(id));

        if (result?.errorcode === 0) {
          Swal.fire("Deleted!", result.message, "success");
          loadTransactions((currentPage - 1) * pageSize, pageSize);
        }
      } catch (error) {
        Swal.fire("Error", "Something went wrong!", "error");
      }
    }
  };

  const resetForm = () => {
    setPartyName("");
    setAmount("");
    setDuration(3);
    setInterest(0.5);
    setBrokerage(0.2);
    setPartyDate(new Date().toISOString().split("T")[0]);
    setRenewDate("");
    setComments("");
    setErrors({});
    setSelectedParty(null);
    setPartySelectedFromSuggestion(false);
    setShowWarning(false);
    setIsEditMode(false);
    setIsRenewMode(false);
    setEditTranId(null);
    dispatch(clearPartySuggestions());
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(`${base_url}/transactions/download-excel`, {
        method: "GET",
        headers: {
          Authorization: ` ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Transactions_list.xlsx";
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

  const handleEditClick = (transaction) => {
    setIsEditMode(true);
    setIsRenewMode(false);
    setEditTranId(transaction.tran_id);
    setPartyName(transaction.party_name);
    setAmount(formatIndianRupee(transaction.amount.toString()));
    setInterest(transaction.interest.toString());
    setBrokerage(transaction.brokerage.toString());
    setDuration(transaction.duration.toString());
    setPartyDate(formatDateForInput(transaction.start_date));
    setComments(transaction.comments || "");
    setSelectedParty({
      id: transaction.party_id,
      name: transaction.party_name,
    });
    setPartySelectedFromSuggestion(true);

    // Open the edit form
    const offcanvas = new bootstrap.Offcanvas(
      document.getElementById("offcanvasRight")
    );
    offcanvas.show();
  };

  const handleConfirmRenew = (transaction) => {
    console.log("Renew transaction data:", transaction); // Debug log
    setIsRenewMode(true);
    setIsEditMode(false);
    setEditTranId(transaction.tran_id);
    setPartyName(transaction.party_name);
    setAmount(formatIndianRupee(transaction.amount.toString()));
    setInterest(transaction.interest.toString());
    setBrokerage(transaction.brokerage.toString());
    setDuration(transaction.duration.toString());
    setPartyDate(formatDateForInput(transaction.start_date));
    setRenewDate(formatDateForInput(transaction.end_date));
    setComments(transaction.comments || "");
    setSelectedParty({
      id: transaction.party_id,
      name: transaction.party_name,
    });
    setPartySelectedFromSuggestion(true);

    // Close the modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById(`detailsModal-${transaction.tran_id}`)
    );
    if (modal) modal.hide();

    // Open the offcanvas form
    const offcanvas = new bootstrap.Offcanvas(
      document.getElementById("offcanvasRight")
    );
    offcanvas.show();
  };

  const handleRenewClick = async (transaction) => {
    if (!transaction.available_for_renew) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to renew this transaction (ID: ${transaction.tran_id}).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, proceed!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setModalTrigger("renew"); // Set trigger to 'renew'
      // Open the transaction receipt modal
      const modal = new bootstrap.Modal(
        document.getElementById(`detailsModal-${transaction.tran_id}`)
      );
      modal.show();
    }
  };

  // New handler for eye icon click
  const handleEyeClick = (transaction) => {
    setModalTrigger("eye"); // Set trigger to 'eye'
    // Open the transaction receipt modal
    const modal = new bootstrap.Modal(
      document.getElementById(`detailsModal-${transaction.tran_id}`)
    );
    modal.show();
  };

  const handleReturn = async (transaction) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to return this transaction (ID: ${transaction.tran_id}).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, return it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const response = await dispatch(returnTransaction(transaction.tran_id));

        if (response?.errorcode === 0) {
          await Swal.fire({
            icon: "success",
            title: "Transaction Returned",
            text: "The transaction has been successfully returned and closed.",
          });

          // Refresh transactions
          loadTransactions((currentPage - 1) * pageSize, pageSize);
        } else {
          throw new Error(response?.message || "Failed to return transaction");
        }
      } catch (error) {
        console.error("Return error:", error);
        await Swal.fire({
          icon: "error",
          title: "Return Failed",
          text:
            error.message ||
            "Something went wrong while returning the transaction",
        });
      }
    }
  };

  const handlePrintReceipt = async (tran_id, partyName) => {
    try {
      if (!tran_id) throw new Error("Transaction ID is missing");

      const token = localStorage.getItem("authorization");
      if (!token)
        throw new Error("Authorization token is missing. Please log in again.");

      const response = await fetch(
        `https://uatapi-pragati.nichetechqa.com/api/v1/transactions/get-transaction/${tran_id}`,
        { headers: { Authorization: token } }
      );

      if (!response.ok)
        throw new Error(
          `Failed to fetch receipt: ${
            response.status
          } - ${await response.text()}`
        );

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);

      // Open a new tab and write a simple HTML page with the party name as the title
      const receiptWindow = window.open("", "_blank");
      if (!receiptWindow)
        throw new Error("Failed to open new window. Please allow pop-ups.");

      // Write HTML to set the title and embed the PDF
      receiptWindow.document.write(`
      <html>
        <head>
          <title>${partyName}</title>
          <style>
            body { margin: 0; }
            iframe { width: 100%; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${pdfUrl}" title="Receipt PDF"></iframe>
        </body>
      </html>
    `);
      receiptWindow.document.close();

      // Clean up the blob URL when the tab is closed
      receiptWindow.addEventListener("unload", () =>
        URL.revokeObjectURL(pdfUrl)
      );
    } catch (error) {
      alert(`Failed to load receipt: ${error.message}`);
    }
  };

  return (
    <div className="container-fluid">
      {isPageLoad && (
        <LoaderSpinner/>
      )}
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h1 className="page-title fw-semibold fs-18 mb-0">
          Party Transactions
        </h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li aria-current="page" className="breadcrumb-item active">
                Party Transactions
              </li>
            </ol>
          </nav>
        </div>
      </div>
      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Party Transactions</div>
              <div className="">
                {permissions.add && (
                  <button
                    aria-controls="offcanvasRight"
                    className="btn btn-primary"
                    data-bs-target="#offcanvasRight"
                    data-bs-toggle="offcanvas"
                    type="button"
                  >
                    <i className="fa-solid fa-plus me-2" />
                    Add Transaction
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="d-flex mb-3 justify-content-between flex-wrap">
                <div className="d-flex flex-wrap">
                  <div className="me-3 mb-3">
                    <label className="form-label">Filter By</label>
                    <select
                      className="form-select form-select-lg"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={isFilterByDisabled}
                    >
                      <option value="">Select</option>
                      <option value="New">New</option>
                      <option value="Renew">Renew</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div className="me-3 mb-3">
                    <label className="form-label">Period</label>
                    <select
                      className="form-select form-select-lg"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
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
                          onChange={(date) => {
                            const formattedDate = date
                              ? new Date(date).toISOString().split("T")[0]
                              : "";
                            setStartDate(formattedDate);
                          }}
                          disabled={isStartDateDisabled}
                          maxDate={new Date()} // Disable dates after today
                        />
                      </div>

                      <div style={{ width: "200px" }}>
                        <label htmlFor="endDate">End</label>
                        <MUIDatePicker
                          selectedDate={endDate}
                          onChange={(date) => {
                            const formattedDate = date
                              ? new Date(date).toISOString().split("T")[0]
                              : "";
                            setEndDate(formattedDate);
                          }}
                          disabled={isEndDateDisabled}
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
              <div
                aria-labelledby="offcanvasRightLabel1"
                className="offcanvas main-sidebar-new offcanvas-end"
                id="offcanvasRight"
                data-bs-backdrop="static"
                tabIndex="-1"
              >
                <div className="offcanvas-header border-bottom border-block-end-dashed">
                  <h5 className="offcanvas-title" id="offcanvasRightLabel1">
                    {isEditMode
                      ? "Update Transaction"
                      : isRenewMode
                      ? "Renew Transaction"
                      : "Add Transaction"}
                  </h5>
                  <button
                    className="btn-close"
                    data-bs-dismiss="offcanvas"
                    type="button"
                    onClick={resetForm}
                  />
                </div>
                <div className="offcanvas-body position-relative">
                  {showWarning && (
                    <button
                      className="btn btn-warning position-absolute"
                      style={{
                        top: 10,
                        right: 20,
                        zIndex: 9999,
                        width: "auto",
                        padding: "8px 20px",
                        color: "black",
                        boxShadow: "2px 2px 2px 2px white",
                      }}
                    >
                      First, add the party name, then select it
                    </button>
                  )}
                  <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mb-3">
                      <label className="form-label" htmlFor="input-placeholder">
                        Party Name*
                      </label>
                      <input
                        className="form-control"
                        id="input-placeholder"
                        placeholder="Enter Party Name"
                        type="text"
                        value={partyName}
                        maxLength={50}
                        onChange={handleNameChange}
                        disabled={isRenewMode || isEditMode}
                      />
                      {errors.partyName && (
                        <div style={{ color: "red", fontSize: "14px" }}>
                          {errors.partyName}
                        </div>
                      )}
                      {partySuggestions.length > 0 && (
                        <ul
                          className="suggestions-list"
                          style={{ listStyleType: "none", paddingLeft: 0 }}
                        >
                          {partySuggestions.map((suggestion, index) => (
                            <li
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              style={{
                                padding: "5px",
                                cursor: "pointer",
                                backgroundColor: "#f4f4f4",
                                borderBottom: "1px solid #ddd",
                              }}
                            >
                              {suggestion.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mb-3">
                      <label className="form-label" htmlFor="input-placeholder">
                        Amount Received*
                      </label>
                      <input
                        className="form-control"
                        id="input-placeholder"
                        placeholder="Enter Amount"
                        type="text"
                        value={amount}
                        onChange={handleAmountChange}
                        disabled={isRenewMode}
                      />
                      {errors.amount && (
                        <div style={{ color: "red", fontSize: "14px" }}>
                          {errors.amount}
                        </div>
                      )}
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mb-3">
                      <label className="form-label" htmlFor="percentage-slider">
                        Interest*
                      </label>
                      <div className="percentage-slider-container">
                        <div className="manual-input">
                          <input
                            value={interest}
                            id="percentage-input"
                            max="2"
                            min="0.5"
                            step="0.05"
                            type="number"
                            onChange={(e) =>
                              handleInterestChange(e.target.value)
                            }
                          />
                          <span className="ms-2">%</span>
                        </div>
                        <input
                          value={interest}
                          id="percentage-slider"
                          max="2"
                          min="0.5"
                          step="0.05"
                          type="range"
                          onChange={(e) => handleInterestChange(e.target.value)}
                          className="form-range"
                        />
                      </div>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mb-3">
                      <label className="form-label" htmlFor="brokerage-select">
                        Brokerage*
                      </label>
                      <select
                        className="form-select"
                        id="brokerage-select"
                        value={brokerage}
                        onChange={handleBrokerageChange}
                      >
                        <option value="0.1">0.1%</option>
                        <option value="0.2">0.2%</option>
                        <option value="0.3">0.3%</option>
                        <option value="0.4">0.4%</option>
                        <option value="0.5">0.5%</option>
                        <option value="0.6">0.6%</option>
                        <option value="0.7">0.7%</option>
                        <option value="0.8">0.8%</option>
                        <option value="0.9">0.9%</option>
                      </select>
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mb-3">
                      <label className="form-label" htmlFor="percentage-slider">
                        Duration (Months)*
                      </label>
                      <div className="percentage-slider-container">
                        <div className="manual-input">
                          <input
                            value={duration}
                            id="percentage-input"
                            max="36"
                            min="1"
                            step="1"
                            type="number"
                            onChange={(e) => handleSliderChange(e.target.value)}
                          />
                          <span className="ms-2">Months</span>
                        </div>
                        <input
                          value={duration}
                          id="percentage-slider"
                          max="36"
                          min="1"
                          step="1"
                          type="range"
                          onChange={(e) => handleSliderChange(e.target.value)}
                          className="form-range"
                        />
                      </div>
                    </div>
                    <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                      <label htmlFor="input-date" className="form-label">
                        Date
                      </label>
                      <MUIDatePicker
                        selectedDate={partyDate}
                        onChange={(date) => {
                          if (date) {
                            setPartyDate(date);
                          }
                        }}
                        disabled={isRenewMode}
                      />
                    </div>
                    {isRenewMode && (
                      <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                        <label htmlFor="renew-date" className="form-label">
                          Renew Date*
                        </label>
                        <MUIDatePicker
                          selectedDate={renewDate}
                          onChange={(date) => {
                            setRenewDate(date);
                            setErrors((prev) => ({
                              ...prev,
                              renewDate: validateRenewDate(date),
                            }));
                          }}
                          // minDate={new Date()}
                        />
                        {errors.renewDate && (
                          <div style={{ color: "red", fontSize: "14px" }}>
                            {errors.renewDate}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-3">
                      <label className="form-label" htmlFor="text-area">
                        Comments
                      </label>
                      <textarea
                        className="form-control"
                        id="text-area"
                        placeholder="Enter Your Comments here"
                        rows="1"
                        value={comments}
                        onChange={handleCommentsChange}
                        disabled={isRenewMode}
                      />
                      {errors.comments && (
                        <div style={{ color: "red", fontSize: "13px" }}>
                          {errors.comments}
                        </div>
                      )}
                    </div>
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mt-3">
                      <button
                        className="btn btn-primary w-100"
                        type="button"
                        onClick={handleSubmitTransaction}
                      >
                        {isEditMode
                          ? "Update Transaction"
                          : isRenewMode
                          ? "Confirm Renew"
                          : "Add Transaction"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="table text-nowrap table-bordered">
                  <thead style={{ backgroundColor: "rgb(209, 212, 221)" }}>
                    <tr>
                      <th scope="col">Transaction ID</th>
                      <th
                        scope="col"
                        onClick={() => handleSort("start_date")}
                        style={{ cursor: "pointer" }}
                      >
                        Date {renderSortIcon("start_date")}
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
                        onClick={() => handleSort("party_name")}
                        style={{ cursor: "pointer" }}
                      >
                        Party Name {renderSortIcon("party_name")}
                      </th>
                      <th
                        scope="col"
                        onClick={() => handleSort("amount")}
                        style={{ cursor: "pointer" }}
                      >
                        Amount {renderSortIcon("amount")}
                      </th>
                      <th scope="col">Interest</th>
                      <th scope="col">Interest Amount</th>
                      <th scope="col">Brokerage</th>
                      <th scope="col">Brokerage Amount</th>
                      <th scope="col">Duration</th>
                      <th scope="col">Total Amount</th>
                      <th scope="col">Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.length > 0 ? (
                      sortedTransactions.map((transaction) => (
                        <tr key={transaction.tran_id}>
                          <td>{transaction.tran_id || "-"}</td>
                          <td>{formatDate(transaction.start_date)}</td>
                          <td>{formatDate(transaction.end_date)}</td>
                          <td>{transaction.party_name || "-"}</td>
                          <td>{formatINR(transaction.amount)}</td>
                          <td>
                            {transaction.interest
                              ? `${transaction.interest}%`
                              : "-"}
                          </td>
                          <td>{formatINR(transaction.interest_amount)}</td>
                          <td>
                            {transaction.brokerage
                              ? `${transaction.brokerage}%`
                              : "-"}
                          </td>
                          <td>{formatINR(transaction.brokerage_amount)}</td>
                          <td>
                            {transaction.duration
                              ? `${transaction.duration} months`
                              : "-"}
                          </td>
                          <td>{formatINR(transaction.calculated_total)}</td>
                          <td>
                            {transaction.status === "closed" ? (
                              <span style={{ fontSize: "17px" }}>Closed</span>
                            ) : (
                              <div className="hstack gap-2 fs-1">
                                <button
                                  className={`btn btn-md ${
                                    transaction.available_for_renew === "true"
                                      ? "btn-info-light"
                                      : "btn-secondary-light"
                                  } btn-wave waves-effect waves-light`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleRenewClick(transaction);
                                  }}
                                  disabled={
                                    transaction.available_for_renew === "false"
                                  }
                                  title={
                                    !transaction.available_for_renew
                                      ? "Transaction not available for renewal"
                                      : ""
                                  }
                                >
                                  Renew
                                </button>
                                <button
                                  className="btn btn-md btn-danger-light btn-wave waves-effect waves-light"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleReturn(transaction);
                                  }}
                                >
                                  Return
                                </button>
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="hstack gap-2 fs-1">
                              <button
                                aria-label="anchor"
                                className="btn btn-icon btn-sm btn-info-light btn-wave waves-effect waves-light"
                                onClick={() => handleEyeClick(transaction)}
                              >
                                <i className="ri-eye-line" />
                              </button>
                              {/* Conditionally render Edit and Delete buttons */}
                              {transaction.status !== "closed" && (
                                <>
                                  {permissions.edit && (
                                    <a
                                      href="#"
                                      className="btn btn-icon btn-sm btn-info-light"
                                      onClick={() =>
                                        handleEditClick(transaction)
                                      }
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
                                        handleDeleteParty(transaction.tran_id);
                                      }}
                                    >
                                      <i className="fa-regular fa-trash-can"></i>
                                    </a>
                                  )}
                                </>
                              )}
                            </div>
                            <div
                              className="modal fade custom-modal"
                              id={`detailsModal-${transaction.tran_id}`}
                              tabIndex="-1"
                              aria-labelledby={`detailsModalLabel-${transaction.tran_id}`}
                              aria-hidden="true"
                            >
                              <div className="modal-dialog modal-lg modal-dialog-centered">
                                <div className="modal-content">
                                  <div className="modal-header border-0">
                                    <h5
                                      className="modal-title text-uppercase fw-bold"
                                      id={`detailsModalLabel-${transaction.tran_id}`}
                                    >
                                      Transaction Receipt
                                    </h5>
                                    <button
                                      type="button"
                                      className="btn-close"
                                      data-bs-dismiss="modal"
                                      aria-label="Close"
                                    />
                                  </div>
                                  <div className="modal-body p-4">
                                    <div className="receipt-container">
                                      <h6 className="text-primary mb-4">
                                        Party & Transaction Details
                                      </h6>
                                      <div className="row">
                                        <div className="col-md-6">
                                          <p>
                                            <strong>Party ID:</strong>{" "}
                                            <span>{transaction.party_id}</span>
                                          </p>
                                          <p>
                                            <strong>Transaction ID:</strong>{" "}
                                            <span>{transaction.tran_id}</span>
                                          </p>
                                          <p>
                                            <strong>Party Name:</strong>{" "}
                                            <span>
                                              {transaction.party_name}
                                            </span>
                                          </p>
                                        </div>
                                        <div className="col-md-6">
                                          <p>
                                            <strong>Date:</strong>{" "}
                                            <span>
                                              {formatDate(
                                                transaction.start_date
                                              )}
                                            </span>
                                          </p>
                                          <p>
                                            <strong>Amount Received:</strong>{" "}
                                            <span>
                                              {formatINR(transaction.amount)}
                                            </span>
                                          </p>
                                          <p className="mb-0 text-wrap w-100">
                                            <strong>
                                              Amount Received in Words:
                                            </strong>{" "}
                                            <span className="text-capitalize">
                                              {toWords(transaction.amount)}{" "}
                                              rupees only
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                      <hr />
                                      <h6 className="text-primary mb-4">
                                        Financial Details
                                      </h6>
                                      <div className="row">
                                        <div className="col-md-6">
                                          <p>
                                            <strong>Interest:</strong>{" "}
                                            <span>{transaction.interest}%</span>
                                          </p>
                                          <p>
                                            <strong>Brokerage:</strong>{" "}
                                            <span>
                                              {transaction.brokerage}%
                                            </span>
                                          </p>
                                          <p>
                                            <strong>Renew Date:</strong>{" "}
                                            <span>
                                              {formatDate(transaction.end_date)}
                                            </span>
                                          </p>
                                        </div>
                                        <div className="col-md-6">
                                          <p>
                                            <strong>Total Amount:</strong>{" "}
                                            <span>
                                              {formatINR(
                                                transaction.calculated_total
                                              )}
                                            </span>
                                          </p>
                                          <p>
                                            <strong>
                                              Total Amount in Words:
                                            </strong>{" "}
                                            <span>
                                              {toWords(
                                                transaction.calculated_total
                                              )}{" "}
                                              rupees only
                                            </span>
                                          </p>
                                          <p>
                                            <strong>Duration:</strong>{" "}
                                            <span>
                                              {transaction.duration} Months
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="modal-footer border-0 d-flex justify-content-end">
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={() =>
                                        handlePrintReceipt(
                                          transaction.tran_id,
                                          transaction.party_name
                                        )
                                      }
                                    >
                                      Print Receipt
                                    </button>
                                    {modalTrigger === "eye" ? (
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        data-bs-dismiss="modal"
                                      >
                                        Close
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() =>
                                          handleConfirmRenew(transaction)
                                        }
                                      >
                                        Confirm
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="13" className="text-center">
                          No transactions available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && sortedTransactions.length > 0 && (
                <div className="card-footer d-flex flex-wrap align-items-center justify-content-between">
                  <div className="text-muted small">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, total_count)} of{" "}
                    {total_count} entries
                  </div>
                  <nav aria-label="Page navigation">
                    <ul className="pagination mb-0">
                      <li
                        className={`page-item ${
                          currentPage === 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Prev
                        </button>
                      </li>
                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1
                      ).map((page) => (
                        <li
                          key={page}
                          className={`page-item ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            style={{ borderRadius: "50%" }}
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      <li
                        className={`page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
              {!loading && sortedTransactions.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted">No transactions available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartyTransactions;
