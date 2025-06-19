import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchIncomeCategories,
createIncomeCategory,deleteIncomeCategory,updateIncomeCategory,toggleIncomeStatus
  
} from "../../redux/actions/authActions";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import LoaderSpinner from "../../Component/Loader";

const ConfigIncome = () => {
  const dispatch = useDispatch();

  const [partyName, setPartyName] = useState("");
  const [partyDate, setPartyDate] = useState("");
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
   const [isPageLoading, setIsPageLoading] = useState(true);

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


  // Updated selector to include pagination data
  const {
    data: IncomeCat = [],
    total_count = 0,
    loading = false,
  } = useSelector((state) => state.auth.IncomeCat || {});

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setPartyDate(today);
    const loadData = async () => {
      setIsPageLoading(true);
      try {
        await dispatch(loadIncome( 1, pageSize ));
      } finally {
        setIsPageLoading(false);
      }
    };
    loadData();
  }, [dispatch, pageSize]);


  const loadIncome = (page, size) => {
    dispatch(
      fetchIncomeCategories({
        page,
        limit: size,
      })
    );
    setCurrentPage(page);
    setPageSize(size);
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    loadIncome(newPage, pageSize);
  };

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    loadIncome(1, newSize); // Reset to first page when changing page size
  };

  const totalPages = Math.ceil(total_count / pageSize);

  const validatePartyName = (name) => {
    let error = "";
    if (!name) {
      error =
        "Income Category cannot be blank, please enter a valid expense name.";
    }
    return error;
  };

  const handleNameChange = (e) => {
    const value = e.target.value.replace(/^\s+/, "");
    if (value.length <= 50) {
      setPartyName(value);
      const error = validatePartyName(value);
      setErrors((prev) => ({ ...prev, partyName: error }));
    }
  };

 

  const handleSubmit = async (e) => {
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
    if (isEditMode && editCategoryId) {
      payload.id = editCategoryId;
    }

    try {
      const result = isEditMode
        ? await dispatch(updateIncomeCategory(payload))
        : await dispatch(createIncomeCategory(payload));

      if (result?.errorcode === 0) {
        await Swal.fire({
          icon: "success",
          title: result.message,
          showConfirmButton: true,
        });

        resetForm();
        loadIncome(currentPage, pageSize); // Reload current page

        const offcanvas = bootstrap.Offcanvas.getInstance(
          document.getElementById("offcanvasRight")
        );
        offcanvas?.hide();
      } else {
        Swal.fire({
          icon: "warning",
          title: result.message,
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
  const resetForm = () => {
    setPartyName("");
    setPartyDate(new Date().toISOString().split("T")[0]);
    setErrors({});
    setEditCategoryId(null);
    setIsEditMode(false);
  };

  const handleDeleteCategory = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Once deleted,you will not be able to recover this expense category!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const result = await dispatch(deleteIncomeCategory(id));

        if (result?.errorcode === 0) {
          Swal.fire("Deleted!", result.message, "success");
          dispatch(fetchIncomeCategories()); // Refresh list
        } else {
          Swal.fire("Error", result.message || "Failed to delete", "error");
        }
      } catch (error) {
        Swal.fire("Error", "Something went wrong!", "error");
      }
    }
  };

    const handleToggleStatus = async (cat) => {
      const newStatus = cat.status === 1 ? 0 : 1;
      
      try {
        const result = await dispatch(toggleIncomeStatus(cat.id, newStatus));
    
        if (result?.errorcode === 0) {
          await Swal.fire({
            icon: "success",
            title: result.message || "Status updated",
            timer: 1500
          });
          
          // Always refresh unless editing this category
          if (!(isEditMode && editCategoryId === cat.id)) {
            await dispatch(fetchIncomeCategories());
          }
        } else {
          throw new Error(result?.message || "Update failed");
        }
      } catch (error) {
        console.error("Status toggle failed:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message.includes('<!DOCTYPE') 
            ? "Server error" 
            : error.message,
        });
      }
    };


  return (
    <div className="container-fluid">
         {isPageLoading && (
       <LoaderSpinner/>
      )}
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h1 className="page-title fw-semibold fs-18 mb-0">
          Configuration Income
        </h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Configuration Income
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Configuration Income</div>
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
                  <i className="fa-solid fa-plus me-2"></i>Add Income category
                </button>
                 )}
              </div>
            </div>

            <div className="card-body">
              <div className="d-flex mb-3 justify-content-between flex-wrap">
                <div className="d-flex">
                  <div className="me-3">
                    <label className="form-label">Show entries</label>
                    <select
                      className="form-select form-select-lg"
                      value={pageSize}
                      onChange={handlePageSizeChange}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
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
                    {isEditMode
                      ? "Edit Income Category"
                      : "Add New Income Category"}
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="offcanvas"
                    aria-label="Close"
                  ></button>
                </div>

                <div className="offcanvas-body">
                  <div className="row">
                    <div className="col-12 mb-3">
                      <label htmlFor="input-party-name" className="form-label">
                        Income Category
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="input-party-name"
                        placeholder="Enter Income Category"
                        value={partyName}
                        maxLength={50}
                        onChange={handleNameChange}
                      />
                      {errors.partyName && (
                        <div style={{ color: "red", fontSize: "14px" }}>
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
                        onClick={handleSubmit}
                      >
                        {isEditMode
                          ? "Update Income Category"
                          : "Add Income Category"}
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
                      <th>Category Name</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Status</th>
                         {(permissions.edit || permissions.delete) && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    { IncomeCat.length > 0 ? (
                      IncomeCat.map((cat, index) => (
                        <tr key={cat.id || index}>
                          <td>{cat.id}</td>
                          <td>{cat.name}</td>
                          <td> {formatDate(cat.created_at)}</td>
                          <td>{cat.is_income == 0 ? "Expense" : "Income"}</td>
                          <td>
                            <div className="form-check form-check-lg form-switch">
                              <input
                                className="form-check-input cursor-pointer"
                                type="checkbox"
                                checked={cat.status === 1}
                                onChange={() => handleToggleStatus(cat)}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="hstack gap-2 fs-1">
                               {permissions.add && (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setIsEditMode(true);
                                  setEditCategoryId(cat.id);
                                  setPartyName(cat.name);
                                  setPartyDate(
                                    cat.created_at
                                      ? cat.created_at.split("T")[0]
                                      : ""
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
                                {permissions.add && (
                              <a
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteCategory(cat.id);
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
                        <td colSpan="6" className="text-center">
                          No categories found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card-footer">
              <div className="d-flex flex-wrap align-items-center justify-content-between w-100">
                <div>
                  Showing {IncomeCat.length} of {total_count} entries
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
                        Previous
                      </button>
                    </li>

                    {currentPage > 2 && (
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(1)}
                        >
                          1
                        </button>
                      </li>
                    )}

                    {currentPage > 3 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}

                    {currentPage > 1 && (
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                          {currentPage - 1}
                        </button>
                      </li>
                    )}

                    <li className="page-item active">
                      <span className="page-link"
                       style={{borderRadius:"50%"}}>{currentPage}</span>
                    </li>

                    {currentPage < totalPages && (
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                          {currentPage + 1}
                        </button>
                      </li>
                    )}

                    {currentPage < totalPages - 2 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}

                    {currentPage < totalPages - 1 && (
                      <li className="page-item">
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(totalPages)}
                        >
                          {totalPages}
                        </button>
                      </li>
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
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top */}
      <div className="scrollToTop">
        <span className="arrow">
          <i className="ri-arrow-up-s-fill fs-20"></i>
        </span>
      </div>

      <div id="responsive-overlay"></div>
    </div>
  );
};

export default ConfigIncome;
