import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toWords } from "number-to-words";
import {
  fetchDashboardCounts,
  fetchPaginatedTransactions,
  fetchReminders,
} from "../../redux/actions/authActions";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CustomPieChart from "../../Component/PieChart";
import CustomLineChart from "../../Component/LineChart";
import IncomeExpenseChart from "../../Component/Graph";
import LoaderSpinner from "../../Component/Loader";

const Dashboard = () => {
  const [sortColumn, setSortColumn] = useState("start_date");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data, loading, error } = useSelector(
    (state) => state.auth.dashboardCounts
  );
  const {
    transactions,
    loading: transactionsLoading,
    total_count,
  } = useSelector((state) => state.auth.transactions);
  const {
    data: ReminderData,
    loading: Loader,
    error: remindersError,
  } = useSelector((state) => state.auth.Reminders);

  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const permissions = userData.permissions || {};

  const hasReadPermission = (moduleName) => {
    return permissions[moduleName]?.read || false;
  };

  // Function to handle navigation with permission check
  const handleNavigation = (path, moduleName) => {
    if (!hasReadPermission(moduleName)) {
      Swal.fire({
        icon: "error",
        title: "Unauthorized",
        text: "You are not authorized to access this page.",
        confirmButtonText: "OK",
      });
      return;
    }
    navigate(path);
  };

  useEffect(() => {
    window.scroll(0,0);
    const fetchData = async () => {
      try {
        setIsPageLoading(true);
        await Promise.all([
          dispatch(fetchDashboardCounts()),
          dispatch(fetchPaginatedTransactions(0, 10)),
          dispatch(fetchReminders(0, 10)),
        ]);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

  const formatINR = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
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

  const formatNumber = (num) => {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
  };

  const handleConfirmRenew = (transaction) => {
    console.log("Renew transaction:", transaction);
  };

  const sortData = (data, column, direction) => {
    if (!column || !data) return data;

    return [...data].sort((a, b) => {
      let valueA = a[column] || "";
      let valueB = b[column] || "";

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

  const sortedTransactions = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) return [];
    return sortData(filteredTransactions, sortColumn, sortDirection);
  }, [filteredTransactions, sortColumn, sortDirection]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (column) => {
    if (sortColumn !== column) return <i className="fa fa-sort ms-1" />;
    return sortDirection === "asc" ? (
      <i className="fa fa-sort-up ms-1" />
    ) : (
      <i className="fa fa-sort-down ms-1" />
    );
  };

  return (
    <div>
      <div className="container-fluid">
          {isPageLoading && (
             <LoaderSpinner/>
             )}
        <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
          <h1 className="page-title fw-semibold fs-18 mb-0">Dashboards</h1>
          <div className="ms-md-1 ms-0">
            <nav>
              <ol className="breadcrumb mb-0"></ol>
            </nav>
          </div>
        </div>

        {!loading && !error && (
          <div className="row">
            <div className="col-lg-12">
              <div className="row">
                {/* Total Parties */}
                <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    className="card custom-card"
                    onClick={() =>
                      handleNavigation("/party-master", "party_master")
                    }
                  >
                    <div className="card-body">
                      <div className="d-flex flex-wrap align-items-top gap-2">
                        <div className="me-1">
                          <span className="avatar avatar-lg bg-primary">
                            <img
                              src="./src/assets/images/dashboard_icons/Total_Parties.svg"
                              className="w-100 p-2"
                            />
                          </span>
                        </div>
                        <div className="flex-fill">
                          <h5 className="d-block fw-semibold fs-18 mb-1">
                            {formatNumber(data.totalParties)}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted fs-16">
                              Total Parties
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Parties */}
                <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    className="card custom-card"
                    onClick={() =>
                      handleNavigation("/party-master", "party_master")
                    }
                  >
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2 align-items-top">
                        <div className="me-1">
                          <span className="avatar avatar-lg bg-primary">
                            <img
                              src="./src/assets/images/dashboard_icons/Active_Accounts.svg"
                              className="w-100 p-2"
                            />
                          </span>
                        </div>
                        <div className="flex-fill">
                          <h5 className="d-block fw-semibold fs-18 mb-1">
                            {formatNumber(data.totalActiveParties)}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted fs-16">
                              Active Parties
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inactive Parties */}
                <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    className="card custom-card"
                    onClick={() =>
                      handleNavigation("/party-master", "party_master")
                    }
                  >
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2 align-items-top">
                        <div className="me-1">
                          <span className="avatar avatar-lg bg-primary">
                            <img
                              src="./src/assets/images/dashboard_icons/Inactive_Accounts.svg"
                              className="w-100 p-2"
                            />
                          </span>
                        </div>
                        <div className="flex-fill">
                          <h5 className="d-block fw-semibold fs-18 mb-1">
                            {formatNumber(data.totalInactiveParties)}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted fs-16">
                              Inactive Parties
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's New Parties */}
                <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    className="card custom-card"
                    onClick={() =>
                      handleNavigation(
                        "/party-transaction",
                        "party_transaction"
                      )
                    }
                  >
                    <div className="card-body">
                      <div className="d-flex flex-wrap align-items-top gap-2">
                        <div className="me-1">
                          <span className="avatar avatar-lg bg-primary">
                            <img
                              src="./src/assets/images/dashboard_icons/Today’s_New_Accounts.svg"
                              className="w-100 p-2"
                            />
                          </span>
                        </div>
                        <div className="flex-fill">
                          <h5 className="d-block fw-semibold fs-18 mb-1">
                            {formatNumber(data.totaltodaysparties)}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted fs-16">
                              Today's New Parties
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Renew Parties */}
                <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    className="card custom-card"
                    onClick={() =>
                      handleNavigation(
                        "/party-transaction",
                        "party_transaction"
                      )
                    }
                  >
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2 align-items-top">
                        <div className="me-1">
                          <span className="avatar avatar-lg bg-primary">
                            <img
                              src="./src/assets/images/dashboard_icons/Today’s_Renew_Accounts.svg"
                              className="w-100 p-2"
                            />
                          </span>
                        </div>
                        <div className="flex-fill">
                          <h5 className="d-block fw-semibold fs-18 mb-1">
                            {formatNumber(data.totalTodaysRenewTransactions)}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted fs-16">
                              Today's Renew Parties
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Return Parties */}
                <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    className="card custom-card"
                    onClick={() =>
                      handleNavigation(
                        "/party-transaction",
                        "party_transaction"
                      )
                    }
                  >
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2 align-items-top">
                        <div className="me-1">
                          <span className="avatar avatar-lg bg-primary">
                            <img
                              src="./src/assets/images/dashboard_icons/Today’s_Return_Accounts.svg"
                              className="w-100 p-2"
                            />
                          </span>
                        </div>
                        <div className="flex-fill">
                          <h5 className="d-block fw-semibold fs-18 mb-1">
                            {formatNumber(data.totalTodaysCloseTransactions)}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted fs-16">
                              Today's Return Parties
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Cash Balance */}
                <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    className="card custom-card"
                    onClick={() =>
                      handleNavigation("/rojmel/RojmelReport", "rojmelreport")
                    }
                  >
                    <div className="card-body">
                      <div className="d-flex flex-wrap align-items-top gap-2">
                        <div className="me-1">
                          <span className="avatar avatar-lg bg-primary">
                            <img
                              src="./src/assets/images/dashboard_icons/Today’s_Cash_Balance.svg"
                              className="w-100 p-2"
                            />
                          </span>
                        </div>
                        <div className="flex-fill">
                          <h5 className="d-block fw-semibold fs-18 mb-1">
                            {formatINR(data.totalTodaysTransaction)}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted fs-16">
                              Today's Cash Balance
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Transaction */}
                <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    className="card custom-card"
                    onClick={() =>
                      handleNavigation(
                        "/reports/DailyClosingBalanceReport",
                        "reports"
                      )
                    }
                  >
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2 align-items-top">
                        <div className="me-1">
                          <span className="avatar avatar-lg bg-primary">
                            <img
                              src="./src/assets/images/dashboard_icons/Today’s_Transaction.svg"
                              className="w-100 p-2"
                            />
                          </span>
                        </div>
                        <div className="flex-fill">
                          <h5 className="d-block fw-semibold fs-18 mb-1">
                            {formatINR(data.dailyclosingbalance)}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted fs-16">
                              Today's Transaction
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Cash Balance */}
                <div className="col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    className="card custom-card"
                    onClick={() =>
                      handleNavigation("/rojmel/RojmelReport", "rojmelreport")
                    }
                  >
                    <div className="card-body">
                      <div className="d-flex flex-wrap gap-2 align-items-top">
                        <div className="me-1">
                          <span className="avatar avatar-lg bg-primary">
                            <img
                              src="./src/assets/images/dashboard_icons/Total_Cash_Balance.svg"
                              className="w-100 p-2"
                            />
                          </span>
                        </div>
                        <div className="flex-fill">
                          <h5 className="d-block fw-semibold fs-18 mb-1">
                            {formatINR(data.totalCash)}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-muted fs-16">
                              Total Cash Balance
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xl-12">
                <div className="card custom-card">
                  <div className="card-header justify-content-between">
                    <div className="card-title">Daily Transactions</div>
                  </div>
                  <div className="table-responsive oveflow-x-auto">
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
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTransactions.length > 0 ? (
                          sortedTransactions.slice(0, 10).map((transaction) => (
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
                                  <span style={{ fontSize: "17px" }}>
                                    Closed
                                  </span>
                                ) : (
                                  <div className="hstack gap-2 fs-1">
                                    <button
                                      className={`btn btn-md ${
                                        transaction.available_for_renew ===
                                        "true"
                                          ? "btn-info-light"
                                          : "btn-secondary-light"
                                      } btn-wave waves-effect waves-light`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleConfirmRenew(transaction);
                                      }}
                                      disabled={
                                        transaction.available_for_renew ===
                                        "false"
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
                                    data-bs-toggle="modal"
                                    data-bs-target={`#detailsModal-${transaction.tran_id}`}
                                  >
                                    <i className="ri-eye-line" />
                                  </button>
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
                                                  <span>
                                                    {transaction.party_id}
                                                  </span>
                                                </p>
                                                <p>
                                                  <strong>
                                                    Transaction ID:
                                                  </strong>{" "}
                                                  <span>
                                                    {transaction.tran_id}
                                                  </span>
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
                                                  <strong>
                                                    Amount Received:
                                                  </strong>{" "}
                                                  <span>
                                                    {formatINR(
                                                      transaction.amount
                                                    )}
                                                  </span>
                                                </p>
                                                <p className="mb-0 text-wrap w-100">
                                                  <strong>
                                                    Amount Received in Words:
                                                  </strong>{" "}
                                                  <span className="text-capitalize">
                                                    {toWords(
                                                      transaction.amount
                                                    )}{" "}
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
                                                  <span>
                                                    {transaction.interest}%
                                                  </span>
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
                                                    {formatDate(
                                                      transaction.end_date
                                                    )}
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
                                                    {transaction.duration}{" "}
                                                    Months
                                                  </span>
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="modal-footer border-0 d-flex justify-content-end">
                                          <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            data-bs-dismiss="modal"
                                          >
                                            Close
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                          >
                                            Print Receipt
                                          </button>
                                        </div>
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
                  <div className="text-center">
                    <button
                      className="btn btn-primary w-auto my-3"
                      type="button"
                      onClick={() =>
                        handleNavigation(
                          "/party-transaction",
                          "party_transaction"
                        )
                      }
                    >
                      View All
                    </button>
                  </div>
                </div>
                <CustomPieChart />
                <CustomLineChart />
                <IncomeExpenseChart />
                <div className="col-xl-12">
                  <div className="card custom-card">
                    <div className="card-header justify-content-between">
                      <div className="card-title">Reminders</div>
                    </div>
                    <div className="card-body">
                      {remindersError && (
                        <div className="alert alert-danger">
                          {remindersError}
                        </div>
                      )}

                      { ReminderData && ReminderData.length > 0 ? (
                        <>
                          {ReminderData.map((reminder, index) => (
                            <React.Fragment
                              key={`reminder-${reminder.tran_id || index}`}
                            >
                              <div
                                className="alert alert-primary d-flex justify-content-between align-items-center mb-2"
                                role="alert"
                              >
                                <p className="mb-0">{reminder.reminder}</p>
                                <button
                                  className="btn btn-icon btn-sm btn-primary btn-wave waves-effect waves-light"
                                  data-bs-toggle="modal"
                                  data-bs-target={`#reminderDetailsModal-${
                                    reminder.tran_id || index
                                  }`}
                                >
                                  <i className="ri-eye-line"></i>
                                </button>
                              </div>
                              <div
                                className="modal fade custom-modal"
                                id={`reminderDetailsModal-${
                                  reminder.tran_id || index
                                }`}
                                tabIndex="-1"
                                aria-labelledby={`reminderDetailsModalLabel-${
                                  reminder.tran_id || index
                                }`}
                                aria-hidden="true"
                              >
                                <div className="modal-dialog modal-md modal-dialog-centered">
                                  <div className="modal-content">
                                    <div className="modal-header border-0 p-3">
                                      <h5
                                        className="modal-title text-uppercase fw-bold fs-6"
                                        id={`reminderDetailsModalLabel-${
                                          reminder.tran_id || index
                                        }`}
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
                                    <div className="modal-body p-3">
                                      <div
                                        className="receipt-container"
                                        style={{ fontSize: "0.875rem" }}
                                      >
                                        <h6 className="text-primary mb-3 fs-6">
                                          Party & Transaction Details
                                        </h6>
                                        <div className="row">
                                          <div className="col-md-6">
                                            <p className="mb-1">
                                              <strong>Party ID:</strong>{" "}
                                              <span>
                                                {reminder.party_id || "N/A"}
                                              </span>
                                            </p>
                                            <p className="mb-1">
                                              <strong>Transaction ID:</strong>{" "}
                                              <span>
                                                {reminder.tran_id || "N/A"}
                                              </span>
                                            </p>
                                            <p className="mb-1">
                                              <strong>Party Name:</strong>{" "}
                                              <span>
                                                {reminder.party_name || "N/A"}
                                              </span>
                                            </p>
                                          </div>
                                          <div className="col-md-6">
                                            <p className="mb-1">
                                              <strong>Date:</strong>{" "}
                                              <span>
                                                {formatDate(
                                                  reminder.start_date
                                                )}
                                              </span>
                                            </p>
                                            <p className="mb-1">
                                              <strong>Amount Received:</strong>{" "}
                                              <span>
                                                {formatINR(reminder.amount)}
                                              </span>
                                            </p>
                                            <p className="mb-1 text-wrap w-100">
                                              <strong>
                                                Amount Received in Words:
                                              </strong>{" "}
                                              <span className="text-capitalize">
                                                {reminder.amount
                                                  ? toWords(reminder.amount) +
                                                    " rupees only"
                                                  : "N/A"}
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                        <hr className="my-2" />
                                        <h6 className="text-primary mb-3 fs-6">
                                          Financial Details
                                        </h6>
                                        <div className="row">
                                          <div className="col-md-6">
                                            <p className="mb-1">
                                              <strong>Interest:</strong>{" "}
                                              <span>
                                                {reminder.interest || "N/A"}%
                                              </span>
                                            </p>
                                            <p className="mb-1">
                                              <strong>Brokerage:</strong>{" "}
                                              <span>
                                                {reminder.brokerage || "N/A"}%
                                              </span>
                                            </p>
                                            <p className="mb-1">
                                              <strong>Renew Date:</strong>{" "}
                                              <span>
                                                {formatDate(reminder.end_date)}
                                              </span>
                                            </p>
                                          </div>
                                          <div className="col-md-6">
                                            <p className="mb-1">
                                              <strong>Duration:</strong>{" "}
                                              <span>
                                                {reminder.duration || "N/A"}{" "}
                                                Months
                                              </span>
                                            </p>
                                            <p className="mb-1">
                                              <strong>Total Amount:</strong>{" "}
                                              <span>
                                                {formatINR(
                                                  reminder.total_amount
                                                )}
                                              </span>
                                            </p>
                                            <p className="mb-1">
                                              <strong>
                                                Total Amount in Words:
                                              </strong>{" "}
                                              <span>
                                                {reminder.total_amount
                                                  ? toWords(
                                                      reminder.total_amount
                                                    ) + " rupees only"
                                                  : "N/A"}
                                              </span>
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="modal-footer border-0 d-flex justify-content-end p-3">
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        data-bs-dismiss="modal"
                                      >
                                        Close
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                      >
                                        Print Receipt
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          ))}
                        </>
                      ) : (
                        <div className="text-center">
                          No reminders available
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <button
                        className="btn btn-primary w-auto my-3"
                        type="button"
                        onClick={() =>
                          handleNavigation("/reminders", "reminders")
                        }
                      >
                        View All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
  
