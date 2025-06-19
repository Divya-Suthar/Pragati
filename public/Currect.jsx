import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Swal from "sweetalert2";
import { loginUser, verifyOtp } from "../redux/actions/authActions";

const Login = () => {

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { formData, showOtpFields, loading } = useSelector(
    (state) => state.auth
  );
  const [errors, setErrors] = useState({});
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [ipAddress, setIpAddress] = useState("");

  useEffect(() => {
    fetch("https://api64.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setIpAddress(data.ip))
      .catch(() => setIpAddress("Unable to fetch IP"));
  }, []);

  const validateUsername = (username) => {
    if (!username)
      return "Username cannot be blank. Please enter your username.";
    if (username.length < 5) return "Username must be at least 5 characters.";
    if (username.length > 30) return "Username must be at most 30 characters.";
    if (/[^a-zA-Z0-9._-]/.test(username) || /^[._-]|[._-]$/.test(username))
      return "Invalid username. Please enter a valid username.";
    return "";
  };

  const validatePassword = (password) => {
    if (!password)
      return "Password cannot be blank. Please enter your password.";
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
      return "Invalid Password. It must include uppercase, lowercase, a number, and a special character.";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch({ type: "UPDATE_FORM", payload: { name, value: value.trim() } });

    let errorMsg =
      name === "username" ? validateUsername(value) : validatePassword(value);
    setErrors((prevErrors) => ({ ...prevErrors, [name]: errorMsg }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault(); // Prevents default form submission
    if (!errors.username && !errors.password && formData.username && formData.password) {
      handleSendOtp();
    }
  };
  
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSendOtp = async () => {
    if (!errors.username && !errors.password) {
      const payload = {
        username: formData.username,
        password: formData.password,
        ip: ipAddress,
        dateTime: new Date().toISOString().replace("T", " ").slice(0, 19), 
      };
  
      try {
        const response = await dispatch(loginUser(payload));
        if (response) {
          Swal.fire({
            icon: response.errorcode === 0 ? "success" : "error",
            title: response.message,
            confirmButtonText: "OK",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Login failed",
            text: "Invalid username. Please enter a valid username",
            confirmButtonText: "OK",
          });
        }
      } catch (error) {
        console.error("Login error:", error);
        Swal.fire({
          icon: "error",
          title: "Error while logging in",
          text: "Please try again.",
          confirmButtonText: "OK",
        });
      }
    }
  };
  
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join("");
    if (enteredOtp.length !== 4) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: "Please enter a 4-digit OTP.",
        confirmButtonText: "OK",
      });
      return;
    }
  
    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        otp: enteredOtp,
        ip: ipAddress,
        dateTime: new Date().toISOString().replace("T", " ").slice(0, 19),
      };
  
      const response = await dispatch(verifyOtp(payload));
  
      if (response && response.errorcode === 0) {
        Swal.fire({
          icon: "success",
          title: "OTP Verified!",
          text: "Login successful.",
          confirmButtonText: "OK",
        }).then(() => {
          localStorage.setItem("isAuthenticated", "true");
          navigate("/dashboard"); 
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "OTP Verification Failed",
          text: response?.message || "Invalid OTP. Please try again.",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
        confirmButtonText: "OK",
      });
    }
  };
  

  const handleOtpChange = (index, value, event) => {
    
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    } else if (event.key === "Backspace" && index > 0 && value === "") {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };
  

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center authentication authentication-basic h-100">
        <div className="col-xxl-5 col-md-6 col-sm-8 col-12">
          <div className="my-3 d-flex justify-content-center">
            <Link to="/" className="text-decoration-none">
              <h4>
                Finance App <b>Pragati</b>
              </h4>
            </Link>
          </div>
          <div className="card custom-card">
            <div className="card-body p-5">
              <p className="h4 fw-semibold mb-2 text-center">Log In</p>

              <form onSubmit={handleFormSubmit}>
                <div className="row gy-3">
                  <div className="col-xl-12">
                    <label
                      htmlFor="signin-username"
                      className="form-label text-default"
                    >
                      User Name
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="signin-username"
                      name="username"
                      placeholder="User Name"
                      value={formData.username}
                      onChange={handleChange}
                  
                    />
                    {errors.username && (
                      <div style={{ color: "red" }}>{errors.username}</div>
                    )}
                  </div>

                  <div className="col-xl-12">
                    <label
                      htmlFor="signin-password"
                      className="form-label text-default d-block"
                    >
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        className="form-control form-control-lg"
                        id="signin-password"
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <button
                        className="btn btn-light"
                        type="button"
                        onClick={togglePasswordVisibility}
                      >
                        <i
                          className={
                            passwordVisible ? "ri-eye-line" : "ri-eye-off-line"
                          }
                        ></i>
                      </button>
                      <button
                        type="button"
                        className="btn btn-lg btn-primary ms-3"
                        disabled={
                          Object.values(errors).some((error) => error) ||
                          !formData.username ||
                          !formData.password
                        }
                        onClick={handleSendOtp}
                      >
                        {loading ? "Sending..." : "Send OTP"}
                      </button>
                    </div>
                    {errors.password && (
                      <div style={{ color: "red" }}>{errors.password}</div>
                    )}
                    <div className="text-start mt-2">
                      <Link
                        to="/reset-password"
                        className="text-primary fw-bold"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  {showOtpFields && (
                    <div className="col-xl-12">
                      <label className="form-label text-default fw-bold">
                        Enter OTP *
                      </label>
                      <div className="row gy-3 p-0 m-0 text-center">
                        {otp.map((digit, index) => (
                          <div className="col-3 px-1 mt-0" key={index}>
                            <input
                              type="text"
                              className="form-control form-control-lg text-center"
                              id={`otp-${index}`}
                              maxLength="1"
                              value={digit}
                              onChange={(e) =>
                                handleOtpChange(index, e.target.value, e)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Backspace") {
                                  handleOtpChange(index, "", e);
                                }
                              }}
                              style={{ fontSize: "16px" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="col-xl-12 d-grid mt-3">
                    <button
                      type="button"
                      className="btn btn-lg btn-primary"
                      disabled={otp.includes("")}
                      onClick={handleVerifyOtp} 
                    >
                      Login
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
