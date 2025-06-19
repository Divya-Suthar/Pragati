import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchParty,
  createParty,
  deleteParty,
  updateParty,
} from "../../redux/actions/authActions";
import MUIDatePicker from "../../Component/DatePicker";
import Swal from "sweetalert2";
import LoaderSpinner from "../../Component/Loader";

const PartyMaster = () => {
  const base_url = "https://uatapi-pragati.nichetechqa.com/api/v1";

  const dispatch = useDispatch();
  const { parties, total_count, currentPage, limit, loading } = useSelector(
    (state) => state.auth.parties || {}
  );

  // State for permissions
  const [permissions, setPermissions] = useState({
    add: false,
    edit: false,
    delete: false,
  });

  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [partyName, setPartyName] = useState("");
  const [partyDate, setPartyDate] = useState("");
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editPartyId, setEditPartyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPageLoad, setIsPageLoad] = useState(true);

  // Load permissions from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        const partyPermissions = parsedData.permissions?.party_master || {};
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

  const loadParties = (start, limit) => {
    dispatch(
      fetchParty(
        statusFilter.toLowerCase(),
        periodFilter.toLowerCase(),
        startDate,
        endDate,
        start,
        limit
      )
    );
  };

  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    const startIndex = (newPage - 1) * pageSize;
    loadParties(startIndex, pageSize);
  };

  const handlePageSizeChange = (e) => {
    const newPageSize = parseInt(e.target.value);
    setPageSize(newPageSize);
    loadParties(0, newPageSize);
  };

  const totalPages = Math.ceil(total_count / pageSize) || 1;

  useEffect(() => {
    loadParties(0, pageSize);
  }, [statusFilter, periodFilter, startDate, endDate, pageSize]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setPartyDate(today);
  }, []);

  const filteredParties =
    parties && Array.isArray(parties)
      ? searchTerm
        ? parties.filter(
            (party) =>
              party.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              party.id?.toString().includes(searchTerm)
          )
        : parties
      : [];

  useEffect(() => {
       window.scroll(0,0);
    const loadData = async () => {
      setIsPageLoad(true);
      try {
        await fetchParty();
      } finally {
        setIsPageLoad(false);
      }
    };
    loadData();
  }, []);

  // Validation for party name
  const validatePartyName = (name) => {
    let error = "";
    const nameRegex = /^[A-Za-z][A-Za-z\s]{1,48}[A-Za-z]$/;

    if (!name) {
      error = "Party name cannot be blank, Please enter the valid name.";
    } else if (name.length < 2) {
      error = "Party name must be at least 2 characters long.";
    } else if (!nameRegex.test(name)) {
      error =
        "Invalid Party name, only letters are allowed, numbers and special characters are not permitted.";
    }

    return error;
  };

  // Handle name input change
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length === 1 && value[0] === " ") return;
    if (value.length <= 50) {
      setPartyName(value);
      const error = validatePartyName(value);
      setErrors((prev) => ({ ...prev, partyName: error }));
    }
  };

  // Submit handler
  const handleSubmitParty = async (e) => {
    e.preventDefault();

    const nameError = validatePartyName(partyName);
    if (nameError) {
      setErrors({ partyName: nameError });
      return;
    }

    const payload = {
      name: partyName,
      date: partyDate,
      status: 1,
    };

    if (isEditMode && editPartyId) {
      payload.id = editPartyId;
    }

    try {
      const response = isEditMode
        ? await dispatch(updateParty(payload))
        : await dispatch(createParty(payload));

      if (response?.errorcode === 0) {
        await Swal.fire({
          icon: "success",
          text: response.message,
        });

        dispatch(fetchParty());

        // Reset form and mode
        resetForm();

        const offcanvas = bootstrap.Offcanvas.getInstance(
          document.getElementById("offcanvasRight")
        );
        if (offcanvas) offcanvas.hide();
      } else {
        Swal.fire({
          icon: "warning",
          title: response.message,
          showConfirmButton: true,
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Something went wrong!",
        text: "Please try again later.",
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const resetForm = () => {
    setPartyName("");
    setPartyDate(new Date().toISOString().split("T")[0]);
    setErrors({});
    setEditPartyId(null);
    setIsEditMode(false);
  };

  const handleDeleteParty = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this Party!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const result = await dispatch(deleteParty(id));

        if (result?.errorcode === 0) {
          Swal.fire("Deleted!", result.message, "success");
          dispatch(fetchParty());
        }
      } catch (error) {
        Swal.fire("Error", "Something went wrong!", "error");
      }
    }
  };

  const handleToggleStatus = async (party) => {
    const newStatus = party.status === "active" ? "inactive" : "active";

    const payload = {
      id: party.id,
      name: party.name,
      date:
        party.created_at?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      status: newStatus,
    };

    try {
      const response = await dispatch(updateParty(payload));

      if (response?.errorcode === 0) {
        Swal.fire("Success", response.message, "success");
        dispatch(fetchParty());
      } else {
        Swal.fire("Warning", response.message, "warning");
      }
    } catch (err) {
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const token = localStorage.getItem("authorization");
      const response = await fetch(`${base_url}/parties/download-excel`, {
        method: "GET",
        headers: {
          Authorization: ` ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "parties_list.xlsx";
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
        <h1 className="page-title fw-semibold fs-18 mb-0">Party Master</h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Party Master
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Party Master</div>
              <div>
                {permissions.add && (
                  <button
                    className="btn btn-primary"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#offcanvasRight"
                    aria-controls="offcanvasRight"
                    onClick={() => {
                      resetForm();
                    }}
                  >
                    <i className="fa-solid fa-plus me-2"></i>Add Party
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              <div className="d-flex mb-3 justify-content-between flex-wrap">
                <div className="d-flex">
                  <div className="me-3">
                    <label className="form-label">Period</label>
                    <select
                      className="form-select form-select-lg"
                      value={periodFilter}
                      disabled={statusFilter !== ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPeriodFilter(value);
                        dispatch(
                          fetchParty(
                            statusFilter.toLowerCase(),
                            value.toLowerCase(),
                            startDate,
                            endDate
                          )
                        );
                      }}
                    >
                      <option value="">Select</option>
                      <option value="today">Today</option>
                      <option value="last_week">Last 7 Days</option>
                      <option value="this_month">This Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="this_year">This Year</option>
                    </select>
                  </div>

                  <div className="me-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select form-select-lg"
                      value={statusFilter}
                      disabled={periodFilter !== ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setStatusFilter(value);
                        dispatch(
                          fetchParty(
                            value.toLowerCase(),
                            periodFilter.toLowerCase(),
                            startDate,
                            endDate
                          )
                        );
                      }}
                    >
                      <option value="">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="me-3">
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
                            if (
                              endDate &&
                              new Date(formattedDate) > new Date(endDate)
                            ) {
                              setEndDate("");
                            }
                          }}
                          maxDate={new Date()}
                        />
                      </div>

                      <div style={{ width: "200px" }}>
                        <label htmlFor="end-date">End</label>
                        <MUIDatePicker
                          selectedDate={endDate}
                          onChange={(date) => {
                            const formattedDate = date
                              ? new Date(date).toISOString().split("T")[0]
                              : "";
                            setEndDate(formattedDate);
                          }}
                          minDate={startDate ? new Date(startDate) : null}
                          disabled={!startDate}
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label mb-1"> </label>
                  <button
                    className="btn btn-outline-primary mt-1 w-100"
                    type="button"
                    onClick={handleDownloadExcel}
                  >
                    <i className="fa-solid fa-arrow-down me-2"></i>
                    Download Excel
                  </button>
                </div>
              </div>

              {/* Offcanvas Form */}
              <div
                className="offcanvas main-sidebar-new offcanvas-end"
                tabIndex="-1"
                id="offcanvasRight"
                aria-labelledby="offcanvasRightLabel1"
                data-bs-backdrop="static"
              >
                <div className="offcanvas-header border-bottom border-block-end-dashed">
                  <h5 className="offcanvas-title" id="offcanvasRightLabel1">
                    {isEditMode ? "Edit Party" : "Add Party"}
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
                    <div className="col-12 mb-3">
                      <label htmlFor="input-party-name" className="form-label">
                        Party Name*
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="input-party-name"
                        placeholder="Enter Party Name"
                        value={partyName}
                        maxLength={50}
                        onChange={handleNameChange}
                      />
                      {errors.partyName && (
                        <div style={{ color: "red", fontSize: "13px" }}>
                          {errors.partyName}
                        </div>
                      )}
                    </div>

                    <div className="col-12 mb-3">
                      <label htmlFor="input-date" className="form-label">
                        Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="input-date"
                        value={partyDate}
                        onChange={(e) => setPartyDate(e.target.value)}
                      />
                    </div>

                    <div className="col-12 mt-3">
                      <button
                        className="btn btn-primary w-100"
                        type="button"
                        onClick={handleSubmitParty}
                        disabled={isEditMode && !permissions.edit}
                      >
                        {isEditMode ? "Update Party" : "Add Party"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Party Table */}
              <div className="table-responsive">
                <table className="table text-nowrap table-bordered">
                  <thead style={{ backgroundColor: "rgb(209, 212, 221)" }}>
                    <tr>
                      <th>Party ID</th>
                      <th>Party Name</th>
                      <th>Date </th>
                      <th>Status</th>
                      {(permissions.edit || permissions.delete) && (
                        <th>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {parties && parties.length > 0 ? (
                      parties.map((party) => (
                        <tr key={party.id}>
                          <td>{party.id}</td>
                          <td>{party.name}</td>
                          <td>{formatDate(party.created_at)}</td>
                          <td>
                            <div className="form-check form-check-lg form-switch">
                              <input
                                className="form-check-input cursor-pointer"
                                type="checkbox"
                                checked={party.status === "active"}
                                onChange={() => handleToggleStatus(party)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="hstack gap-2 fs-1">
                              {permissions.edit && (
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setIsEditMode(true);
                                    setEditPartyId(party.id);
                                    setPartyName(party.name);
                                    setPartyDate(
                                      party.created_at?.split("T")[0] || ""
                                    );
                                    const offcanvasEl =
                                      document.getElementById("offcanvasRight");
                                    const offcanvas = new bootstrap.Offcanvas(
                                      offcanvasEl
                                    );
                                    offcanvas.show();
                                  }}
                                  className="btn btn-icon btn-sm btn-info-light"
                                >
                                  <i className="fa-regular fa-pen-to-square"></i>
                                </a>
                              )}
                              {permissions.delete && (
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteParty(party.id);
                                  }}
                                  className="btn btn-icon btn-sm btn-danger-light"
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
                        <td colSpan="5" className="text-center">
                          No party records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && filteredParties.length > 0 && (
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

              {!loading && filteredParties.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted">No parties available</p>
                </div>
              )}
            </div>

            <div className="card-footer">
              <div className="d-flex flex-wrap align-items-center">
                {/* Pagination can be added here */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scrollToTop">
        <span className="arrow">
          <i className="ri-arrow-up-s-fill fs-20"></i>
        </span>
      </div>

      <div id="responsive-overlay"></div>
    </div>
  );
};

export default PartyMaster;
