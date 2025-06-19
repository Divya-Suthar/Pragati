import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const Reports = () => {

  useEffect(() => {
       window.scroll(0,0);
  }, [])
  
  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-md-flex d-block align-items-center justify-content-between my-4 page-header-breadcrumb">
        <h1 className="page-title fw-semibold fs-18 mb-0">Reports</h1>
        <div className="ms-md-1 ms-0">
          <nav>
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                 <Link to="/">Dashboards</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Reports
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Reports</div>
              <div className="d-flex flex-wrap justify-content-between">
                <div className="d-flex align-items-center ms-auto"></div>
              </div>
            </div>

            <div className="card-body">
              <Link to="/reports/income">
                <div
                  className="alert alert-primary d-flex justify-content-between align-items-center mb-3"
                  role="alert"
                >
                  <p className="mb-0 fs-20 d-flex">
                    <i className="ri-file-text-line me-2"></i> Income vs. Expense Report
                  </p>
                </div>
              </Link>

              <Link to="renewal">
                <div
                  className="alert alert-primary d-flex justify-content-between align-items-center mb-3"
                  role="alert"
                >
                  <p className="mb-0 fs-20 d-flex">
                    <i className="ri-file-text-line me-2"></i> Due Renewal
                    Report
                  </p>
                </div>
              </Link>

              <Link to="/reports/brokerage">
                <div
                  className="alert alert-primary d-flex justify-content-between align-items-center mb-3"
                  role="alert"
                >
                  <p className="mb-0 fs-20 d-flex">
                    <i className="ri-file-text-line me-2"></i> Brokerage and
                    Interest Report
                  </p>
                </div>
              </Link>

              <Link to="/reports/AllExpenseReport">
                <div
                  className="alert alert-primary d-flex justify-content-between align-items-center mb-3"
                  role="alert"
                >
                  <p className="mb-0 fs-20 d-flex">
                    <i className="ri-file-text-line me-2"></i> All Expense
                    Report
                  </p>
                </div>
              </Link>

              <Link to="/reports/DailyClosingBalanceReport">
                <div
                  className="alert alert-primary d-flex justify-content-between align-items-center mb-3"
                  role="alert"
                >
                  <p className="mb-0 fs-20 d-flex">
                    <i className="ri-file-text-line me-2"></i> Daily Closing
                    Balance Report
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* End::row-3 */}
    </div>
  );
};

export default Reports;
