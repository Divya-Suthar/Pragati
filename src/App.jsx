
import React, { useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Swal from 'sweetalert2';
import Login from "./Component/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import PartyMaster from "./Pages/Party/PartyMaster";
import Header from "./Pages/header/header";
import Sidebar from "./Pages/Sidebar/Sidebar";
import Footer from "./Pages/Footer/Footer";
import ConfigExpense from "./Pages/Configuration/configExpense";
import ConfigIncome from "./Pages/Configuration/configIncome";
import PartyTransactions from "./Pages/Party/PartyTransaction";
import Reports from "./Pages/Report/report";
import Income from "./Pages/Report/Income";
import Renewal from "./Pages/Report/Renewal";
import Brokerage from "./Pages/Report/Brokerage";
import AllExpense from "./Pages/Report/AllExpense";
import DailyBalance from "./Pages/Report/DailyBalance";
import Incomes from "./Pages/Rojmel/Incomes";
import Expense from "./Pages/Rojmel/Expense";
import RojmelReport from "./Pages/Rojmel/RojmelReport";
import Reminders from "./Pages/Reminders/Reminders";
import Role from "./Pages/Management/Role";
import User from "./Pages/Management/User";


const ProtectedRouteWithPermission = ({ children, requiredPermission }) => {
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const permissions = userData.permissions || {};
  
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission = permissions[requiredPermission]?.read || false;
  
  if (!hasPermission) {
    Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: "You don't have permission to access this page",
      confirmButtonText: "OK",
    });
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};


const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <div style={{ minHeight: "100vh", overflowX: "hidden" }}>
      {/* Header */}
      <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      {/* Main content */}
      <div className="d-flex pt-5">
        {/* Sidebar */}
        <Sidebar isOpen={isSidebarOpen} />

        {/* Content area */}
        <div
          className="container-fluid"
          style={{
            marginLeft: isSidebarOpen ? "230px" : "70px",
            width: isSidebarOpen ? "calc(100% - 230px)" : "calc(100% - 70px)",
            transition: "margin-left 0.3s ease, width 0.3s ease",
          }}
        >
          {children}
        </div>
      </div>
      <Footer />
    </div>
    </>
  );
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: localStorage.getItem("isAuthenticated") ? (
      <Navigate to="/dashboard" replace />
    ) : (
      <Login />
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/party-master",
    element: (
      <ProtectedRouteWithPermission requiredPermission="party_master">
        <MainLayout>
          <PartyMaster />
        </MainLayout>
      </ProtectedRouteWithPermission>
    ),
  },
  {
    path: "/party-transaction",
    element: (
      <ProtectedRouteWithPermission requiredPermission="party_transaction">
        <MainLayout>
          <PartyTransactions />
        </MainLayout>
      </ProtectedRouteWithPermission>
    ),
  },

  {
    path: "/configuration-expense",
    element: (
      <ProtectedRouteWithPermission requiredPermission="configuration">
        <MainLayout>
          <ConfigExpense />
        </MainLayout>
      </ProtectedRouteWithPermission>
    ),
  },
  {
    path: "/configuration-income" ,
    element: (
      <ProtectedRoute requiredPermission="configuration">
        <MainLayout>
          <ConfigIncome />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute requiredPermission="reports">
        <MainLayout>
          <Reports />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports/income",
    element: (
      <ProtectedRoute requiredPermission="reports">
        <MainLayout>
          <Income />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports/renewal",
    element: (
      <ProtectedRoute requiredPermission="reports">
        <MainLayout>
          <Renewal />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports/brokerage",
    element: (
      <ProtectedRoute requiredPermission="reports">
        <MainLayout>
          <Brokerage />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports/AllExpenseReport",
    element: (
      <ProtectedRoute requiredPermission="reports">
        <MainLayout>
          <AllExpense />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports/DailyClosingBalanceReport",
    element: (
      <ProtectedRoute requiredPermission="reports">
        <MainLayout>
          <DailyBalance />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/rojmel/Income",
    element: (
      <ProtectedRoute requiredPermission="income">
        <MainLayout>
          <Incomes />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/rojmel/Expense",
    element: (
      <ProtectedRoute requiredPermission="expense">
        <MainLayout>
          <Expense />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/rojmel/RojmelReport",
    element: (
      <ProtectedRoute requiredPermission="rojmelreport"> 
        <MainLayout>
          <RojmelReport />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/reminders",
    element: (
      <ProtectedRoute requiredPermission="reminders">
        <MainLayout>
          <Reminders />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
    {
    path: "/role-management",
    element: (
      <ProtectedRoute requiredPermission="roles">
        <MainLayout>
          <Role />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: "/user-management",
    element: (
      <ProtectedRoute requiredPermission="users">
        <MainLayout>
          <User />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;

