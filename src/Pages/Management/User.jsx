import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUser,
  fetchRole,
  createUser,
  deleteUser,
  updateUser,
} from "../../redux/actions/authActions";
import Swal from "sweetalert2";
import LoaderSpinner from "../../Component/Loader";

const User = () => {
  const dispatch = useDispatch();
  const { data } = useSelector((state) => state.auth.user);
  const { data: RoleData } = useSelector((state) => state.auth.role);
  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [errors, setErrors] = useState({
    fullName: "",
    userName: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [permissions, setPermissions] = useState({
    add: false,
    edit: false,
    delete: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [ConpasswordVisible, setConPasswordVisible] = useState(false);
  const [mode, setMode] = useState("add");
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPageLoad, setIsPageLoad] = useState(true);

  useEffect(() => {
       window.scroll(0,0);
    const fetchData = async () => {
      try {
        await dispatch(fetchUser());
        await dispatch(fetchRole());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsPageLoad(false);
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        const partyPermissions = parsedData.permissions?.users || {};
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const validateName = (name) => {
    if (!name || name.trim() === "") return "Full Name cannot be blank.";
    if (name.length < 2 || name.length > 50)
      return "Full Name must be between 2 and 50 characters.";
    if (!/^[A-Za-z][A-Za-z\s]*$/.test(name.trim()))
      return "Full Name should contain only letters and spaces. Numbers and special characters are not allowed.";
    return "";
  };

  const validateUsername = (username) => {
    if (!username || username.trim() === "") return "Username cannot be blank.";
    if (username.length < 5 || username.length > 20)
      // Fixed: Adjusted length check as per error message
      return "Username must be between 5 and 20 characters.";
    if (!/^[a-zA-Z0-9]+$/.test(username.trim()))
      // Simplified: Removed \s since underscores are allowed
      return "Username should contain only letters and numbers. Special characters are not allowed.";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password cannot be blank.";
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    if (password.length > 16)
      return "Password cannot be more than 16 characters.";
    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[@$!%*?&]/.test(password)
    )
      return "Invalid Password. Your password must include uppercase and lowercase letters, a number, and a special character.";
    return "";
  };

  const validateRole = (role) => {
    if (!role) return "Please select a role";
    return "";
  };

  const validateConformPassword = (cpassword, password) => {
    if (!cpassword) return "Confirm password cannot be blank.";
    if (cpassword !== password)
      return "Password and confirm password do not match.";
    return "";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (value.length === 1 && value[0] === " ") return;
    let error = "";

    if (name === "fullName") {
      error = validateName(value);
    } else if (name === "userName") {
      error = validateUsername(value);
    } else if (name === "password") {
      error = validatePassword(value);
    } else if (name === "role") {
      error = validateRole(value);
    } else if (name === "confirmPassword") {
      error = validateConformPassword(value, formData.password);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      userName: "",
      password: "",
      confirmPassword: "",
      role: "",
    });
    setErrors({
      fullName: "",
      userName: "",
      password: "",
      confirmPassword: "",
      role: "",
    });
    setMode("add");
    setCurrentRoleId(null);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const nameError = validateName(formData.fullName);
    const usernameError = validateUsername(formData.userName);
    const roleError = validateRole(formData.role);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConformPassword(
      formData.confirmPassword,
      formData.password
    );

    setErrors({
      fullName: nameError,
      userName: usernameError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      role: roleError,
    });

    if (
      nameError ||
      usernameError ||
      roleError ||
      passwordError ||
      confirmPasswordError
    ) {
      setIsSubmitting(false);
      return;
    }

    try {
      const userData = {
        full_name: formData.fullName.trim(),
        password: formData.password,
        username: formData.userName.trim(),
        role_id: formData.role, // Ensure role_id is a number
      };
      if (isEditMode) userData.id = currentRoleId;
      if (isEditMode) userData.status = "active";

      const result = await dispatch(
        isEditMode ? updateUser(userData) : createUser(userData)
      );

      if (result?.errorcode === 0) {
        Swal.fire({
          icon: "success",
          text: isEditMode ? "User updated successfully" : result.message,
        });

        resetForm();

        const offcanvas = bootstrap.Offcanvas.getInstance(
          document.getElementById("offcanvasRight")
        );
        if (offcanvas) offcanvas.hide();
        dispatch(fetchUser());
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            result?.message ||
            `Failed to ${isEditMode ? "update" : "create"} user`,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConPasswordVisibility = () => {
    setConPasswordVisible(!ConpasswordVisible);
  };

  const handleDeleteUser = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this user!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const result = await dispatch(deleteUser(id));

        if (result?.errorcode === 0) {
          Swal.fire("Deleted!", result.message, "success");
          dispatch(fetchUser());
          const offcanvas = bootstrap.Offcanvas.getInstance(
            document.getElementById("offcanvasRight")
          );
          if (offcanvas) offcanvas.hide();
        }
      } catch (error) {
        Swal.fire("Error", "Something went wrong!", "error");
      }
    }
  };

  const handleViewUser = (user) => {
    setMode("view");
    setSelectedUser(user);
    setFormData({
      fullName: user.full_name,
      userName: user.username,
      password: user.password,
      confirmPassword: user.password,
      role: user.role_id,
    });
    setCurrentRoleId(user.id);

    const offcanvas = new bootstrap.Offcanvas(
      document.getElementById("offcanvasRight")
    );
    offcanvas.show();
  };

  const handleEditUser = (user) => {
    setMode("edit");
    setSelectedUser(user);
    setFormData({
      fullName: user.full_name,
      userName: user.username,
      password: user.password,
      confirmPassword: user.password,
      role: user.role_id,
    });
    setCurrentRoleId(user.id);
  };

  const isViewMode = mode === "view";
  const isAddMode = mode === "add";
  const isEditMode = mode === "edit";

  return (
    <div className="container-fluid">
       {isPageLoad && (
            <LoaderSpinner/>
           )}

      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h1 className="page-title fw-semibold fs-18 mb-0">User List</h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                User List
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">User List</div>
              <div>
                {permissions.add && (
                  <button
                    className="btn btn-primary"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#offcanvasRight"
                    aria-controls="offcanvasRight"
                    onClick={() => setMode("add")}
                  >
                    <i className="fa-solid fa-plus me-2"></i>Add User
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              <div
                className="offcanvas main-sidebar-new offcanvas-end"
                tabIndex="-1"
                id="offcanvasRight"
                aria-labelledby="offcanvasRightLabel1"
                data-bs-backdrop="static"
              >
                <div className="offcanvas-header border-bottom border-block-end-dashed">
                  <h5 className="offcanvas-title" id="offcanvasRightLabel1">
                    {!isAddMode ? "User Details" : "Add New User"}
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
                  <form>
                    <div className="row">
                      {!isAddMode && (
                        <div className="col-12 mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label mb-0">
                              <b>User ID: {currentRoleId}</b>
                            </label>
                            <div className="d-flex gap-2">
                              {!isAddMode &&
                                !isEditMode &&
                                permissions.edit && (
                                  <button
                                    type="button"
                                    className="btn btn-icon btn-sm btn-info-light btn-wave waves-effect waves-light"
                                    onClick={() => handleEditUser(selectedUser)}
                                  >
                                    <i className="fa-regular fa-pen-to-square"></i>
                                  </button>
                                )}
                              {permissions.delete && (
                                <button
                                  type="button"
                                  className="btn btn-icon btn-sm btn-danger-light btn-wave waves-effect waves-light"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteUser(currentRoleId);
                                  }}
                                >
                                  <i className="fa-regular fa-trash-can"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="col-12 mb-3">
                        <label htmlFor="fullName" className="form-label">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="fullName"
                          name="fullName"
                          placeholder="Enter Full Name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          maxLength={50}
                          required
                          disabled={isViewMode}
                        />
                        {errors.fullName && (
                          <div style={{ color: "red" }}>{errors.fullName}</div>
                        )}
                      </div>

                      <div className="col-12 mb-3">
                        <label htmlFor="userName" className="form-label">
                          User Name *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="userName"
                          name="userName"
                          placeholder="Enter User Name"
                          value={formData.userName}
                          onChange={handleInputChange}
                          required
                          disabled={isViewMode}
                        />
                        {errors.userName && (
                          <div style={{ color: "red" }}>{errors.userName}</div>
                        )}
                      </div>

                      <div className="col-12 mb-3">
                        <label htmlFor="password" className="form-label">
                          Password *
                        </label>
                        <div className="position-relative">
                          <input
                            type={passwordVisible ? "text" : "password"}
                            className="form-control"
                            id="password"
                            name="password"
                            placeholder="Enter Password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            disabled={isViewMode}
                          />
                          <button
                            type="button"
                            className="btn position-absolute end-0 top-50 translate-middle-y me-2 p-0 border-0 bg-transparent"
                            onClick={togglePasswordVisibility}
                          >
                            <i
                              className={
                                passwordVisible
                                  ? "ri-eye-line"
                                  : "ri-eye-off-line"
                              }
                            ></i>
                          </button>
                        </div>
                        {errors.password && (
                          <div style={{ color: "red" }}>{errors.password}</div>
                        )}
                      </div>

                      <div className="col-12 mb-3">
                        <label htmlFor="confirmPassword" className="form-label">
                          Confirm Password *
                        </label>
                        <div className="position-relative">
                          <input
                            type={ConpasswordVisible ? "text" : "password"}
                            className="form-control"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            disabled={isViewMode}
                          />
                          <button
                            type="button"
                            className="btn position-absolute end-0 top-50 translate-middle-y me-2 p-0 border-0 bg-transparent"
                            onClick={toggleConPasswordVisibility}
                          >
                            <i
                              className={
                                ConpasswordVisible
                                  ? "ri-eye-line"
                                  : "ri-eye-off-line"
                              }
                            ></i>
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <div style={{ color: "red" }}>
                            {errors.confirmPassword}
                          </div>
                        )}
                      </div>

                      <div className="col-12 mb-3">
                        <label htmlFor="role" className="form-label">
                          Role *
                        </label>
                        <select
                          className="form-select"
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          required
                          disabled={isViewMode}
                        >
                          <option value="" disabled>
                            Select Role
                          </option>
                          {RoleData.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.role_name}
                            </option>
                          ))}
                        </select>
                        {errors.role && (
                          <div style={{ color: "red" }}>{errors.role}</div>
                        )}
                      </div>

                      <div className="col-12 mt-3">
                        <button
                          className="btn btn-primary w-100"
                          onClick={handleAddUser}
                          disabled={isViewMode}
                        >
                          {isEditMode || isViewMode ? "Save Role" : "Add Role"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table text-nowrap table-bordered">
                  <thead style={{ backgroundColor: "rgb(209, 212, 221)" }}>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Name</th>
                      <th scope="col">Role</th>
                      <th scope="col">Date</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data && data.length > 0 ? (
                      data.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td>{user.full_name}</td>
                          <td>{user.role_name}</td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>
                            <div className="hstack gap-2 fs-1">
                              {user.status !== "closed" &&
                                user.role_name !== "Admin" && (
                                  <>
                                    <button
                                      className="btn btn-icon btn-sm btn-info-light btn-wave waves-effect waves-light"
                                      onClick={() => handleViewUser(user)}
                                    >
                                      <i className="ri-eye-line" />
                                    </button>
                                    {permissions.delete && (
                                      <button
                                        className="btn btn-icon btn-sm btn-danger-light btn-wave waves-effect waves-light"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleDeleteUser(user.id);
                                        }}
                                      >
                                        <i className="fa-regular fa-trash-can"></i>
                                      </button>
                                    )}
                                  </>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default User;
