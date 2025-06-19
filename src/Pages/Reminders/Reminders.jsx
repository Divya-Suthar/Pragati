import React, { useState } from "react";
import { useEffect, useRef } from "react";
import MUIDatePicker from "../../Component/DatePicker";
import { useDispatch, useSelector } from "react-redux";
import { toWords } from "number-to-words";
import { Link } from "react-router-dom";
import { fetchReminders } from "../../redux/actions/authActions";
import LoaderSpinner from "../../Component/Loader";

const Reminders = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState("");
  const [appliedDates, setAppliedDates] = useState({
    start: null,
    end: null,
    displayStart: null,
    displayEnd: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDatePickerActive, setIsDatePickerActive] = useState(false);

  const dispatch = useDispatch();
  const {
    data,
    total_count,
    loading,
    error: remindersError,
  } = useSelector((state) => state.auth.Reminders);

  const totalPages = Math.ceil(total_count / itemsPerPage);

  useEffect(() => {
    window.scroll(0, 0);
    const fetchData = async () => {
      try {
        await dispatch(
          fetchReminders({
            start: (currentPage - 1) * itemsPerPage,
            limit: itemsPerPage,
            start_date: appliedDates.start,
            end_date: appliedDates.end,
          })
        );
      } catch (error) {
        console.error("fetchReminders error:", error);
      }
    };

    fetchData();
  }, [dispatch, currentPage, itemsPerPage, appliedDates]);

  const handleApply = () => {
    if (!startDate || !endDate) {
      setError(
        "Please select both start and end dates before applying the filter."
      );
    } else {
      setError("");

      // Format dates as YYYY-MM-DD for API
      const apiStartDate = new Date(startDate).toISOString().split("T")[0];
      const apiEndDate = new Date(endDate).toISOString().split("T")[0];

      // Format dates as DD-MM-YYYY for display
      const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };

      setAppliedDates({
        start: apiStartDate,
        end: apiEndDate,
        displayStart: formatDate(startDate),
        displayEnd: formatDate(endDate),
      });

      setCurrentPage(1); // Reset to first page when applying new filters
      setIsDatePickerActive(false);
    }
  };

  // Function to clear date filters
  const clearDateFilters = () => {
    setAppliedDates({
      start: null,
      end: null,
      displayStart: null,
      displayEnd: null,
    });
    setCurrentPage(1);
    setIsDatePickerActive(false);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e) => {
    const newSize = Number(e.target.value);
    setItemsPerPage(newSize);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate the range of items being displayed
  const startItem = total_count > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, total_count);

  // Event handlers for date picker changes
  const handleStartDateChange = (date) => {
    setStartDate(date);
    setError("");
    setIsDatePickerActive(true);

    // If user clears both dates, clear the applied filters
    if (!date && !endDate && appliedDates.start && appliedDates.end) {
      clearDateFilters();
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    setError("");
    setIsDatePickerActive(true);

    // If user clears both dates, clear the applied filters
    if (!date && !startDate && appliedDates.start && appliedDates.end) {
      clearDateFilters();
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
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
    }).format(value);
  };

  const handlePrintReceipt = async (tran_id, partyName) => {
    try {
      const token = localStorage.getItem("authorization");

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

      const receiptWindow = window.open("", "_blank");

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

      receiptWindow.addEventListener("unload", () =>
        URL.revokeObjectURL(pdfUrl)
      );
    } catch (error) {
      alert(`Failed to load receipt: ${error.message}`);
    }
  };

  return (
    <div className="container-fluid">
      {loading && <LoaderSpinner />}

      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h1 className="page-title fw-semibold fs-18 mb-0">Reminders</h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Reminders
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Reminders</div>

              <div className="d-flex flex-wrap justify-content-between">
                <div className="d-flex align-items-center ms-auto">
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
                        <label htmlFor="end-date">End</label>
                        <MUIDatePicker
                          selectedDate={endDate}
                          onChange={handleEndDateChange}
                          minDate={startDate}
                          disabled={!startDate}
                        />
                      </div>

                      <button
                        className="btn btn-primary"
                        onClick={handleApply}
                        style={{ height: "38px", margin: "7px", width: "70px" }}
                        disabled={!startDate || !endDate}
                      >
                        Apply
                      </button>
                    </div>
                    {error && (
                      <div className="mt-2">
                        <div style={{ color: "red" }}>{error}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="card-body">
              {remindersError && (
                <div className="alert alert-danger">{remindersError}</div>
              )}

              {appliedDates.start && appliedDates.end && (
                <div className="mb-3 fw-semibold">
                  Reminders From {appliedDates.displayStart} To{" "}
                  {appliedDates.displayEnd}
                </div>
              )}

              {data && data.length > 0 ? (
                <>
                  {data.map((reminder, index) => (
                    <React.Fragment key={reminder.tran_id || index}>
                      <div
                        className="alert alert-primary d-flex justify-content-between align-items-center mb-2"
                        role="alert"
                      >
                        <p className="mb-0">{reminder.reminder}</p>
                        <button
                          className="btn btn-icon btn-sm btn-primary btn-wave waves-effect waves-light"
                          data-bs-toggle="modal"
                          data-bs-target={`#detailsModal-${reminder.tran_id}`}
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                      </div>

                      {/* Modal for each reminder */}
                      <div
                        className="modal fade custom-modal"
                        id={`detailsModal-${reminder.tran_id}`}
                        tabIndex="-1"
                        aria-labelledby={`detailsModalLabel-${reminder.tran_id}`}
                        aria-hidden="true"
                      >
                        <div className="modal-dialog modal-lg modal-dialog-centered">
                          <div className="modal-content">
                            <div className="modal-header border-0">
                              <h5
                                className="modal-title text-uppercase fw-bold"
                                id={`detailsModalLabel-${reminder.tran_id}`}
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
                                  <div className="col-md-5">
                                    <p>
                                      <strong>Party ID:</strong>{" "}
                                      <span>{reminder.party_id || "N/A"}</span>
                                    </p>
                                    <p>
                                      <strong>Transaction ID:</strong>{" "}
                                      <span>{reminder.tran_id || "N/A"}</span>
                                    </p>
                                    <p>
                                      <strong>Party Name:</strong>{" "}
                                      <span>
                                        {reminder.party_name || "N/A"}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="col-md-5">
                                    <p>
                                      <strong>Date:</strong>{" "}
                                      <span>
                                        {formatDate(reminder.start_date)}
                                      </span>
                                    </p>
                                    <p>
                                      <strong>Amount Received:</strong>{" "}
                                      <span>{formatINR(reminder.amount)}</span>
                                    </p>
                                    <p className="mb-0 text-wrap w-100">
                                      <strong>Amount Received in Words:</strong>{" "}
                                      <span className="text-capitalize">
                                        {reminder.amount
                                          ? toWords(reminder.amount) +
                                            " rupees only"
                                          : "N/A"}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <hr />
                                <h6 className="text-primary mb-4">
                                  Financial Details
                                </h6>
                                <div className="row">
                                  <div className="col-md-5">
                                    <p>
                                      <strong>Interest:</strong>{" "}
                                      <span>{reminder.interest || "N/A"}%</span>
                                    </p>
                                    <p>
                                      <strong>Brokerage:</strong>{" "}
                                      <span>
                                        {reminder.brokerage || "N/A"}%
                                      </span>
                                    </p>
                                    <p>
                                      <strong>Renew Date:</strong>{" "}
                                      <span>
                                        {formatDate(reminder.end_date)}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="col-md-5">
                                    <p>
                                      <strong>Duration:</strong>{" "}
                                      <span>
                                        {reminder.duration || "N/A"} Months
                                      </span>
                                    </p>
                                    <p>
                                      <strong>Total Amount:</strong>{" "}
                                      <span>
                                        {formatINR(reminder.total_amount)}
                                      </span>
                                    </p>
                                    <p>
                                      <strong>Total Amount in Words:</strong>{" "}
                                      <span>
                                        {reminder.total_amount
                                          ? toWords(reminder.total_amount) +
                                            " rupees only"
                                          : "N/A"}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="modal-footer border-0 d-flex justify-content-end">
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                data-bs-dismiss="modal"
                              >
                                Close
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() =>
                                  handlePrintReceipt(
                                    reminder.tran_id,
                                    reminder.party_name
                                  )
                                }
                              >
                                Print Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}

                  {total_count > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div className="d-flex align-items-center">
                        <span className="ms-2">
                          Showing {startItem} to {endItem} of {total_count}{" "}
                          entries
                        </span>
                      </div>
                      <nav>
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
                              Previous
                            </button>
                          </li>

                          {/* Show page numbers - limited to 3 visible pages */}
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <li
                                  key={pageNum}
                                  className={`page-item ${
                                    currentPage === pageNum ? "active" : ""
                                  }`}
                                >
                                  <button
                                    className="page-link"
                                    style={{ borderRadius: "50%" }}
                                    onClick={() => handlePageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </button>
                                </li>
                              );
                            }
                          )}

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
                </>
              ) : (
                <div className="text-center">No reminders available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reminders;
