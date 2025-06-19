import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import { FaBars, FaKey, FaSignOutAlt } from "react-icons/fa";

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { authUser } = useSelector((state) => state.auth);
  const [userName, setUserName] = useState(
    authUser?.name || localStorage.getItem("userName") || "User"
  );
  const [userRole, setUserRole] = useState(
    authUser?.role_name || localStorage.getItem("userRole") || "Role"
  );

  // Update local state if Redux authUser changes
  useEffect(() => {
    if (authUser?.name) {
      setUserName(authUser.name);
      localStorage.setItem("userName", authUser.name);
    }
    if (authUser?.role_name) {
      setUserRole(authUser.role_name);
      localStorage.setItem("userRole", authUser.role_name);
    }
  }, [authUser]);

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  const handleLogout = (e) => {
    e.preventDefault();

    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out of Your Account",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, log me out!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("authorization");
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userName"); 
        localStorage.removeItem("userRole");
        navigate("/login");
        window.location.reload();
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="d-flex justify-content-between align-items-center px-3 shadow-sm bg-white text-black position-fixed top-0 start-0 w-100"
      style={{ height: "60px", zIndex: 1000 }}
    >
      {/* Hamburger icon */}
      <div className="d-flex align-items-center">
        <button
          onClick={onToggleSidebar}
          className="btn btn-sm text-dark me-3 position-relative"
          style={{
            marginLeft: isSidebarOpen ? "230px" : "60px",
            zIndex: 2000,
            fontSize: "1rem",
          }}
        >
          <FaBars />
        </button>
      </div>

      {/* User info dropdown */}
      <div className="position-relative" ref={dropdownRef}>
        <button
          className="btn d-flex align-items-center border text-dark custom-hover-btn"
          onClick={toggleDropdown}
          style={{
            backgroundColor: "rgb(209, 212, 221)",
            borderRadius: "6px",
            padding: "5px 10px",
            transition: "background-color 0.3s ease, color 0.3s ease",
          }}
        >
          <i className="bi bi-person-fill fs-5 me-2"></i>
          <div className="text-start">
            <div className="fw-semibold" style={{ fontSize: "14px" }}>
              {userName} ({userRole})
            </div>
          </div>
        </button>

        {showDropdown && (
          <div
            className="dropdown-menu show position-absolute"
            style={{
              right: 0,
              top: "110%",
              zIndex: 1500,
              display: "block",
              minWidth: "280px",
            }}
          >
            <Link
              className="dropdown-item d-flex align-items-center"
              to="/change-password"
            >
              <FaKey className="me-2" /> Change Password
            </Link>
            <a
              href="#"
              className="dropdown-item d-flex align-items-center"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" /> Logout
            </a>
          </div>
        )}
      </div>
      <style>
        {`
        .custom-hover-btn:hover {
          background-color: darkblue !important;
          color: white !important;
        }

        .custom-hover-btn:hover i {
          color: white !important;
        }`}
      </style>
    </header>
  );
};

export default Header;