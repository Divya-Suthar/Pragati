import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isRojmelOpen, setIsRojmelOpen] = useState(false);

  // Get user permissions from localStorage
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const userPermissions = userData.permissions || {};

  // Helper function to check permissions
  const hasPermission = (module, action = "read") => {
    if (!userPermissions[module]) {
      return false;
    }
    return userPermissions[module][action] || false;
  };

  return (
    <aside
      className="position-fixed top-0 start-0 text-white overflow-hidden border-end d-flex flex-column"
      style={{
        width: isOpen ? "240px" : "75px",
        transition: "width 0.3s ease",
        backgroundColor: "#002366",
        height: "100vh",
        zIndex: 9999,
      }}
    >
      {/* Top Logo Text - Fixed at top */}
      <div
        className="text-white text-center fs-4 border-bottom border-light d-flex align-items-center justify-content-center"
        style={{ height: "60px", flexShrink: 0 }}
      >
        {isOpen ? "Pragati" : "P"}
      </div>

      {/* Scrollable Menu Area */}
      <div
        className="flex-grow-1 overflow-y-auto"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.3) transparent",
        }}
      >
        <nav className="nav flex-column px-2 mt-3 gap-2 d-flex">
          {/* Dashboard */}
          {hasPermission("dashboard") && (
            <Link
              to="/dashboard"
              className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                location.pathname === "/dashboard"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{ fontSize: "14px" }}
            >
              <i
                className={`fa-solid fa-house me-2`}
                style={{
                  fontSize: "16px",
                  color:
                    location.pathname === "/dashboard" ? "#002366" : "#fff",
                }}
              ></i>
              {isOpen && <span>Dashboard</span>}
            </Link>
          )}

          {/* Party Transactions */}
          {hasPermission("party_transaction") && (
            <Link
              to="/party-transaction"
              className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                location.pathname === "/party-transaction"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{ fontSize: "14px" }}
            >
              <i
                className={`fa-solid fa-users me-2`}
                style={{
                  fontSize: "16px",
                  color:
                    location.pathname === "/party-transaction"
                      ? "#002366"
                      : "#fff",
                }}
              ></i>
              {isOpen && <span>Party Transactions</span>}
            </Link>
          )}

          {/* Party Master */}
          {hasPermission("party_master") && (
            <Link
              to="/party-master"
              className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                location.pathname === "/party-master"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{ fontSize: "14px" }}
            >
              <i
                className={`fa-solid fa-user-tie me-2`}
                style={{
                  fontSize: "16px",
                  color:
                    location.pathname === "/party-master" ? "#002366" : "#fff",
                }}
              ></i>
              {isOpen && <span>Party Master</span>}
            </Link>
          )}

          {/* Rojmel Dropdown */}
          {(hasPermission("rojmel") ||
            hasPermission("income") ||
            hasPermission("expense") ||
            hasPermission("rojmelreport")) && (
            <>
              <div
                className={`d-flex align-items-center justify-content-between py-2 px-3 rounded text-decoration-none ${
                  isRojmelOpen ? "bg-white text-primary" : "text-white"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setIsRojmelOpen(!isRojmelOpen)}
              >
                <div className="d-flex align-items-center">
                  <i
                    className="fa-solid fa-indian-rupee-sign me-2"
                    style={{
                      fontSize: "16px",
                      color: isRojmelOpen ? "#002366" : "#fff",
                    }}
                  ></i>
                  {isOpen && <span>Rojmel</span>}
                </div>
                {isOpen && (
                  <i
                    className={`fa-solid fa-chevron-${
                      isRojmelOpen ? "up" : "down"
                    }`}
                    style={{ fontSize: "12px" }}
                  ></i>
                )}
              </div>

              {/* Rojmel Dropdown Links */}
              {isRojmelOpen && (
                <div
                  className={`${isOpen ? "ps-4" : "ps-3"}`}
                  style={{ marginTop: "4px" }}
                >
                  {hasPermission("income") && (
                    <Link
                      to="/rojmel/Income"
                      className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                        location.pathname === "/rojmel/Income"
                          ? "bg-white text-primary"
                          : "text-white"
                      }`}
                      style={{ margin: "3px 0" }}
                    >
                      <i
                        className="fa-solid fa-arrow-right me-2"
                        style={{
                          fontSize: "10px",
                          color:
                            location.pathname === "/rojmel/Income"
                              ? "#002366"
                              : "#fff",
                        }}
                      ></i>
                      {isOpen && "Income"}
                    </Link>
                  )}
                  {hasPermission("expense") && (
                    <Link
                      to="/rojmel/Expense"
                      className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                        location.pathname === "/rojmel/Expense"
                          ? "bg-white text-primary"
                          : "text-white"
                      }`}
                      style={{ margin: "3px 0" }}
                    >
                      <i
                        className="fa-solid fa-arrow-right me-2"
                        style={{
                          fontSize: "10px",
                          color:
                            location.pathname === "/rojmel/Expense"
                              ? "#002366"
                              : "#fff",
                        }}
                      ></i>
                      {isOpen && "Expense"}
                    </Link>
                  )}
                  {hasPermission("rojmelreport") && (
                    <Link
                      to="/rojmel/RojmelReport"
                      className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                        location.pathname === "/rojmel/RojmelReport"
                          ? "bg-white text-primary"
                          : "text-white"
                      }`}
                      style={{ margin: "3px 0" }}
                    >
                      <i
                        className="fa-solid fa-arrow-right me-2"
                        style={{
                          fontSize: "10px",
                          color:
                            location.pathname === "/rojmel/RojmelReport"
                              ? "#002366"
                              : "#fff",
                        }}
                      ></i>
                      {isOpen && "Rojmel Report"}
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Reports */}
          {hasPermission("reports") && (
            <Link
              to="/reports"
              className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                location.pathname === "/reports"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{ fontSize: "14px" }}
            >
              <i
                className={`fa-solid fa-file me-2`}
                style={{
                  fontSize: "16px",
                  color: location.pathname === "/reports" ? "#002366" : "#fff",
                }}
              ></i>
              {isOpen && <span>Reports</span>}
            </Link>
          )}

          {/* Reminders */}
          {hasPermission("reminders") && (
            <Link
              to="/reminders"
              className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                location.pathname === "/reminders"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{ fontSize: "14px" }}
            >
              <i
                className={`fa-solid fa-bell me-2`}
                style={{
                  fontSize: "16px",
                  color:
                    location.pathname === "/reminders" ? "#002366" : "#fff",
                }}
              ></i>
              {isOpen && <span>Reminders</span>}
            </Link>
          )}

          {/* Role Management */}
          {hasPermission("roles") && (
            <Link
              to="/role-management"
              className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                location.pathname === "/role-management"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{ fontSize: "14px" }}
            >
              <i
                className={`fa-solid fa-user-gear me-2`}
                style={{
                  fontSize: "16px",
                  color:
                    location.pathname === "/role-management"
                      ? "#002366"
                      : "#fff",
                }}
              ></i>
              {isOpen && <span>Role Management</span>}
            </Link>
          )}

          {/* User Management */}
          {hasPermission("users") && (
            <Link
              to="/user-management"
              className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                location.pathname === "/user-management"
                  ? "bg-white text-primary"
                  : "text-white"
              }`}
              style={{ fontSize: "14px" }}
            >
              <i
                className={`fa-solid fa-users-gear me-2`}
                style={{
                  fontSize: "16px",
                  color:
                    location.pathname === "/user-management"
                      ? "#002366"
                      : "#fff",
                }}
              ></i>
              {isOpen && <span>User Management</span>}
            </Link>
          )}

          {/* Configuration Dropdown */}
          {hasPermission("configuration") && (
            <>
              <div
                className={`d-flex align-items-center justify-content-between py-2 px-3 rounded text-decoration-none ${
                  isConfigOpen ? "bg-white text-primary" : "text-white"
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setIsConfigOpen(!isConfigOpen)}
              >
                <div className="d-flex align-items-center">
                  <i
                    className="fa-solid fa-sliders me-2"
                    style={{
                      fontSize: "16px",
                      color: isConfigOpen ? "#002366" : "#fff",
                    }}
                  ></i>
                  {isOpen && <span>Configuration</span>}
                </div>
                {isOpen && (
                  <i
                    className={`fa-solid fa-chevron-${
                      isConfigOpen ? "up" : "down"
                    }`}
                    style={{ fontSize: "12px" }}
                  ></i>
                )}
              </div>

              {/* Configuration Dropdown Links */}
              {isConfigOpen && (
                <div
                  className={`${isOpen ? "ps-4" : "ps-3"}`}
                  style={{ marginTop: "4px" }}
                >
                  <Link
                    to="/configuration-expense"
                    className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                      location.pathname === "/configuration-expense"
                        ? "bg-white text-primary"
                        : "text-white"
                    }`}
                    style={{ margin: "3px 0" }}
                  >
                    <i
                      className="fa-solid fa-arrow-right me-2"
                      style={{
                        fontSize: "10px",
                        color:
                          location.pathname === "/configuration-expense"
                            ? "#002366"
                            : "#fff",
                      }}
                    ></i>
                    {isOpen && "Configure Expense"}
                  </Link>

                  <Link
                    to="/configuration-income"
                    className={`d-flex align-items-center py-2 px-3 rounded text-decoration-none ${
                      location.pathname === "/configuration-income"
                        ? "bg-white text-primary"
                        : "text-white"
                    }`}
                    style={{ margin: "3px 0" }}
                  >
                    <i
                      className="fa-solid fa-arrow-right me-2"
                      style={{
                        fontSize: "10px",
                        color:
                          location.pathname === "/configuration-income"
                            ? "#002366"
                            : "#fff",
                      }}
                    ></i>
                    {isOpen && "Configure Income"}
                  </Link>
                </div>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Custom scrollbar styling */}
      <style>
        {`
          .flex-grow-1::-webkit-scrollbar {
            width: 6px;
          }
          .flex-grow-1::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          .flex-grow-1::-webkit-scrollbar-track {
            background: transparent;
          }
          a:hover {
            background-color: white !important;
            color: #002366 !important;
          }
          a:hover i {
            color: #002366 !important;
          }
        `}
      </style>
    </aside>
  );
};

export default Sidebar;
