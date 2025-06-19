import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchRole,
  fetchModule,
  createRole,
  deleteRole,
  updateRole,
} from "../../redux/actions/authActions";
import Swal from "sweetalert2";
import LoaderSpinner from "../../Component/Loader";

const Role = () => {
  const [permissions, setpermissions] = useState({});
  const [roleName, setRoleName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [mode, setMode] = useState("add");
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [isPageLoad, setIsPageLoad] = useState(true);

  const [permission, setPermission] = useState({
    add: false,
    edit: false,
    delete: false,
  });

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        const partyPermissions = parsedData.permissions?.roles || {};
        setPermission({
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

  const { data, loading, error } = useSelector((state) => state.auth.role);
  const {
    data: ModuleData,
    loading: ModuleLoading,
    error: ModuleErr,
  } = useSelector((state) => state.auth.module);

  // Module name mapping to correct inconsistent names
  const moduleNameMapping = {
    rojmel: "rojmel_report",
    rojmelreport: "rojmel_report",
    roles: "role_management",
    users: "user_management",
  };

  const reverseModuleNameMapping = {
    rojmel_report: "rojmel",
    role_management: "roles",
    user_management: "users",
  };

  useEffect(() => {
       window.scroll(0,0);
    const fetchData = async () => {
      try {
        await dispatch(fetchRole());
        await dispatch(fetchModule());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsPageLoad(false);
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (ModuleData && ModuleData.length > 0 && mode === "add") {
      const initialpermissions = {};
      ModuleData.forEach((module) => {
        let moduleKey = module.name.toLowerCase().replace(/\s+/g, "_");
        moduleKey = moduleNameMapping[moduleKey] || moduleKey;
        initialpermissions[moduleKey] = {
          all: false,
          read: false,
          add: false,
          edit: false,
          delete: false,
        };
      });
      setpermissions(initialpermissions);
    }
  }, [ModuleData, mode]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const validateRoleName = (name) => {
    let error = "";
    const nameRegex = /^[A-Za-z][A-Za-z\s]{1,48}[A-Za-z]$/;

    if (!name) {
      error = "Role name cannot be blank.";
    } else if (name.length < 2) {
      error = "Party name must be between 3 and 50 character.";
    } else if (!nameRegex.test(name)) {
      error = "Invalid Role Name. Only letters are allowed.";
    }

    return error;
  };

  const validatepermissions = (permissions) => {
    return Object.values(permissions).some((modulepermissions) =>
      Object.entries(modulepermissions).some(
        ([key, value]) => key !== "all" && value
      )
    );
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length === 1 && value[0] === " ") return;
    if (value.length <= 50) {
      setRoleName(value);
      const error = validateRoleName(value);
      setErrors((prev) => ({ ...prev, roleName: error }));
    }
  };

  const handlePermissionChange = (module, permission) => {
    setpermissions((prev) => {
      const modulepermissions = prev[module] || {};

      if (permission === "all") {
        const newValue = !modulepermissions.all;
        return {
          ...prev,
          [module]: {
            all: newValue,
            read: newValue,
            add: newValue,
            edit: newValue,
            delete: newValue,
          },
        };
      }

      const apiPermission = permission === "view" ? "read" : permission;

      const updatedpermissions = {
        ...prev,
        [module]: {
          ...modulepermissions,
          [apiPermission]: !modulepermissions[apiPermission],
          all: false,
        },
      };

      return updatedpermissions;
    });

    setErrors((prev) => ({ ...prev, permissions: "" }));
  };

  const handleSaveRole = async () => {
    setIsSubmitting(true);

    const nameError = validateRoleName(roleName);
    const hasPermission = validatepermissions(permissions);

    const newErrors = {
      roleName: nameError,
      permissions: hasPermission
        ? ""
        : "Please select at least one permission for any module",
    };

    setErrors(newErrors);

    if (nameError || !hasPermission) {
      setIsSubmitting(false);
      return;
    }

    try {
      const cleanedpermissions = {};
      Object.keys(permissions).forEach((moduleKey) => {
        const modulePerms = permissions[moduleKey];
        // Map to backend-expected keys (e.g., rojmel_report -> rojmel)
        const backendKey = reverseModuleNameMapping[moduleKey] || moduleKey;
        cleanedpermissions[backendKey] = {
          read: modulePerms.read || false,
          add: modulePerms.add || false,
          edit: modulePerms.edit || false,
          delete: modulePerms.delete || false,
        };
      });

      const roleData = {
        role_name: roleName,
        description: cleanedpermissions,
      };

      if (mode === "edit" && currentRoleId) {
        roleData.id = currentRoleId;
      }

      console.log("Sending roleData:", roleData); // Debugging

      const result =
        mode === "edit"
          ? await dispatch(updateRole(roleData))
          : await dispatch(createRole(roleData));

      if (result?.errorcode === 0) {
        Swal.fire({
          icon: "success",
          text: result.message,
        });

        resetForm();
        dispatch(fetchRole());

        const offcanvas = bootstrap.Offcanvas.getInstance(
          document.getElementById("roleOffcanvas")
        );
        if (offcanvas) offcanvas.hide();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result?.message || "Failed to save role",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this Role!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const result = await dispatch(deleteRole(id));

        if (result?.errorcode === 0) {
          Swal.fire("Deleted!", result.message, "success");
          dispatch(fetchRole());

          const offcanvas = bootstrap.Offcanvas.getInstance(
            document.getElementById("roleOffcanvas")
          );
          if (offcanvas) offcanvas.hide();
        }
      } catch (error) {
        Swal.fire("Error", "Something went wrong!", "error");
      }
    }
  };

  const resetForm = () => {
    setRoleName("");
    setpermissions({});
    setErrors({});
    setMode("add");
    setCurrentRoleId(null);
  };

  const handleViewRole = (role) => {
    setRoleName(role.role_name);
    setCurrentRoleId(role.id);
    setMode("view");

    if (!ModuleData || ModuleData.length === 0) {
      setpermissions({});
      return;
    }

    // Initialize base permissions for all modules
    const basepermissions = {};
    ModuleData.forEach((module) => {
      let moduleKey = module.name.toLowerCase().replace(/\s+/g, "_");
      moduleKey = moduleNameMapping[moduleKey] || moduleKey;
      basepermissions[moduleKey] = {
        all: false,
        read: false,
        add: false,
        edit: false,
        delete: false,
      };
    });

    let rolepermissions = {};
    if (role.permissions) {
      try {
        if (typeof role.permissions === "object" && role.permissions !== null) {
          rolepermissions = role.permissions;
        } else if (
          typeof role.permissions === "string" &&
          role.permissions.trim() !== ""
        ) {
          rolepermissions = JSON.parse(role.permissions);
        } else {
          setpermissions({ ...basepermissions });
          return;
        }

        console.log("Raw role.permissions:", rolepermissions); // Debugging

        const normalizedpermissions = {};
        Object.keys(rolepermissions).forEach((key) => {
          // Map incoming keys (e.g., rojmel -> rojmel_report)
          let normalizedKey = key.toLowerCase().replace(/\s+/g, "_");
          normalizedKey = moduleNameMapping[normalizedKey] || normalizedKey;
          if (
            rolepermissions[key] &&
            typeof rolepermissions[key] === "object"
          ) {
            const readValue =
              rolepermissions[key].read ?? rolepermissions[key].view ?? false;

            normalizedpermissions[normalizedKey] = {
              all: false,
              read: readValue,
              add: rolepermissions[key].add ?? false,
              edit: rolepermissions[key].edit ?? false,
              delete: rolepermissions[key].delete ?? false,
            };

            normalizedpermissions[normalizedKey].all =
              normalizedpermissions[normalizedKey].read &&
              normalizedpermissions[normalizedKey].add &&
              normalizedpermissions[normalizedKey].edit &&
              normalizedpermissions[normalizedKey].delete;
          }
        });

        const finalpermissions = {};
        ModuleData.forEach((module) => {
          let moduleKey = module.name.toLowerCase().replace(/\s+/g, "_");
          moduleKey = moduleNameMapping[moduleKey] || moduleKey;
          finalpermissions[moduleKey] =
            normalizedpermissions[moduleKey] || basepermissions[moduleKey];
        });

        setpermissions(finalpermissions);
        console.log("Loaded permissions:", finalpermissions); // Debugging
      } catch (e) {
        setpermissions({ ...basepermissions });
        console.error("Error parsing permissions:", e); // Debugging
      }
    } else {
      setpermissions({ ...basepermissions });
    }

    const offcanvas = new bootstrap.Offcanvas(
      document.getElementById("roleOffcanvas")
    );
    offcanvas.show();
  };

  const handleEditRole = () => {
    setMode("edit");
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
        <h1 className="page-title fw-semibold fs-18 mb-0">Role List</h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Dashboards</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Role List
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Role List</div>
              <div>
                {permission.add && (
                  <button
                    className="btn btn-primary"
                    type="button"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#roleOffcanvas"
                    aria-controls="roleOffcanvas"
                    onClick={resetForm}
                  >
                    <i className="fa-solid fa-plus me-2"></i>Add Role
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              <div
                className="offcanvas main-sidebar-new offcanvas-end"
                tabIndex="-1"
                id="roleOffcanvas"
                aria-labelledby="roleOffcanvasLabel"
                data-bs-backdrop="static"
              >
                <div className="offcanvas-header border-bottom border-block-end-dashed">
                  <h5 className="offcanvas-title" id="roleOffcanvasLabel">
                    {!isAddMode ? "Role Details" : "Add New Role"}
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
                    {!isAddMode && (
                      <div className="col-12 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label mb-0">
                            <b>Role ID: {currentRoleId}</b>
                          </label>
                          <div className="d-flex gap-2">
                            {permission.edit && (
                              <button
                                className="btn btn-icon btn-sm btn-info-light"
                                onClick={handleEditRole}
                              >
                                <i className="fa-regular fa-pen-to-square"></i>
                              </button>
                            )}
                            {permission.delete && (
                              <button
                                className="btn btn-icon btn-sm btn-danger-light"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleDeleteRole(currentRoleId);
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
                      <label htmlFor="input-role-name" className="form-label">
                        Role Name{!isViewMode ? "*" : ""}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="input-role-name"
                        placeholder="Enter Role Name"
                        maxLength={50}
                        value={roleName}
                        onChange={handleNameChange}
                        disabled={isViewMode}
                      />
                      {errors.roleName && (
                        <div style={{ color: "red", fontSize: "13px" }}>
                          {errors.roleName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">
                      Module permissions{!isViewMode ? "*" : ""}
                    </label>
                    {ModuleData && ModuleData.length > 0 ? (
                      ModuleData.map((module) => {
                        let moduleKey = module.name
                          .toLowerCase()
                          .replace(/\s+/g, "_");
                        moduleKey = moduleNameMapping[moduleKey] || moduleKey;
                        return (
                          <div
                            className="border border-light rounded-3 p-3 mb-2"
                            key={module.id}
                          >
                            <h6 className="mb-2">{module.name}</h6>
                            <div className="d-flex gap-3 flex-wrap">
                              {["all", "view", "add", "edit", "delete"].map(
                                (perm) => {
                                  const displayPerm =
                                    perm === "read" ? "view" : perm;
                                  const statePerm =
                                    perm === "view" ? "read" : perm;

                                  return (
                                    <div
                                      key={`${moduleKey}-${perm}`}
                                      className="form-check"
                                    >
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`${moduleKey}-${perm}`}
                                        checked={
                                          permissions[moduleKey]?.[statePerm] ||
                                          false
                                        }
                                        onChange={() =>
                                          handlePermissionChange(
                                            moduleKey,
                                            perm
                                          )
                                        }
                                        disabled={
                                          isViewMode ||
                                          (perm !== "all" &&
                                            perm !== "view" &&
                                            !permissions[moduleKey]?.read)
                                        }
                                      />
                                      <label
                                        className="form-check-label"
                                        htmlFor={`${moduleKey}-${perm}`}
                                      >
                                        {displayPerm.charAt(0).toUpperCase() +
                                          displayPerm.slice(1)}
                                      </label>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-3">No modules found</div>
                    )}
                  </div>
                  {errors.permissions && (
                    <div style={{ color: "red", fontSize: "13px" }}>
                      {errors.permissions}
                    </div>
                  )}

                  <div className="col-12 mt-3">
                    <button
                      className="btn btn-primary w-100"
                      onClick={handleSaveRole}
                      disabled={isViewMode}
                    >
                      {isEditMode || isViewMode ? "Save Role" : "Add Role"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-body">
              <div className="table-responsive">
                <table className="table text-nowrap table-bordered">
                  <thead style={{ backgroundColor: "rgb(209, 212, 221)" }}>
                    <tr>
                      <th scope="col">ID</th>
                      <th scope="col">Role</th>
                      <th scope="col">Date</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data && data.length > 0 ? (
                      data.map((role) => (
                        <tr key={role.id}>
                          <td>{role.id}</td>
                          <td>{role.role_name}</td>
                          <td>{formatDate(role.created_at)}</td>
                          <td>
                            {!(role.role_name === "Admin") && (
                              <div className="hstack gap-2 fs-1">
                                <button
                                  className="btn btn-icon btn-sm btn-info-light btn-wave waves-effect waves-light"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleViewRole(role);
                                  }}
                                >
                                  <i className="ri-eye-line" />
                                </button>
                                {permission.delete && (
                                  <button
                                    className="btn btn-icon btn-sm btn-danger-light"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleDeleteRole(role.id);
                                    }}
                                  >
                                    <i className="fa-regular fa-trash-can"></i>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          No roles found
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

export default Role;
