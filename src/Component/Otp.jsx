import React, { useState } from "react";
import { Link } from "react-router-dom";

const OTP = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleOtpChange = (index, event) => {
    let value = event.target.value;
    if (value.length > 1) return;

    let newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center authentication authentication-basic h-100">
        <div className="col-xxl-5 col-md-6 col-sm-8 col-12">
          <div className="my-3 d-flex justify-content-center">
            <Link to="/">
              <h4>
                Finance App <b>Pragati</b>
              </h4>
            </Link>
          </div>
          <div className="card custom-card">
            <div className="card-body p-5">
              <p className="h4 fw-semibold mb-2 text-center">Log In</p>
              <div className="row gy-3">
                <div className="col-xl-12">
                  <label htmlFor="signin-username" className="form-label text-default">
                    User Name
                  </label>
                  <input type="text" className="form-control form-control-lg" id="signin-username" placeholder="User Name" />
                </div>

                <div className="col-xl-12 mb-2">
                  <label htmlFor="signin-password" className="form-label text-default d-block">
                    Password
                  </label>
                  <div className="input-group">
                    <input type={passwordVisible ? "text" : "password"} className="form-control form-control-lg" id="signin-password" placeholder="Password" />
                    <button className="btn btn-light" type="button" onClick={togglePasswordVisibility}>
                      <i className={passwordVisible ? "ri-eye-line" : "ri-eye-off-line"}></i>
                    </button>
                    <Link to="/otp" className="btn btn-lg btn-primary ms-3">
                      Send OTP
                    </Link>
                  </div>
                  <div className="mt-2">
                    <Link to="/reset-password" className="float-end text-danger">
                      Forget password?
                    </Link>
                  </div>
                </div>
              </div>

              <label htmlFor="otp-inputs" className="form-label text-default d-block mt-2">
                Enter OTP
              </label>
              <div className="row gy-3 p-0 m-0">
                {otp.map((digit, index) => (
                  <div className="col-3 px-1 mt-0" key={index}>
                    <input
                      type="text"
                      className="form-control form-control-lg text-center"
                      id={`otp-${index}`}
                      maxLength="1"
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event)}
                    />
                  </div>
                ))}
              </div>

              <div className="col-xl-12 d-grid mt-3 px-1">
                <Link to="/dashboard" className="btn btn-lg btn-primary">
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTP;
