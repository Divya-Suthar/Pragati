import React, { useEffect } from "react";
import DatePicker from "react-datepicker";
import { FaRegCalendarAlt } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";

const DatePickerComponent = ({ label, selectedDate, onChange, minDate,maxDate, disabled }) => {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .mui-datepicker-wrapper {
        position: relative;
        margin: 10px 0;
        width: 100%;
      }

      .mui-datepicker {
        width: 100%;
        padding: 8px 36px 4px 14px; /* Reduced padding */
        border: 1px solid #c4c4c4;
        border-radius: 4px;
        font-size: 14px; /* Reduced font size */
        outline: none;
        background-color: white;
      }

      .mui-datepicker:focus {
        border-color: #1976d2;
      }

      .label {
        position: absolute;
        top: 50%;
        left: 14px;
        transform: translateY(-50%);
        color: #757575;
        background: white;
        padding: 0 4px;
        font-size: 14px; /* Adjust label font size */
        pointer-events: none;
        transition: all 0.2s ease-out;
      }

      .mui-datepicker:focus + .label,
      .label.active {
        top: 4px;
        font-size: 12px;
        color: #1976d2;
      }

      .calendar-icon {
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        color: #757575;
        font-size: 1.1rem;
        pointer-events: none;
        z-index: 2;
      }

      .clear-btn {
        position: absolute;
        top: 50%;
        right: 36px;
        transform: translateY(-50%);
        font-size: 1.2rem;
        color: #555555;
        background: transparent;
        border: none;
        cursor: pointer;
        z-index: 3;
        padding: 0;
      }

      .disabled .mui-datepicker {
        background-color: #f5f5f5;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const inputId = `date-${label?.toLowerCase()?.replace(/\s/g, "-") || "picker"}`;

  return (
    <div className={`mui-datepicker-wrapper ${disabled ? "disabled" : ""}`}>
      {/* React Datepicker */}
      <DatePicker
        id={inputId}
        selected={selectedDate}
        onChange={onChange}
        className="mui-datepicker"
        dateFormat="dd-MM-yyyy"
        placeholderText="DD/MM/YYYY"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Floating Label */}
      {label && (
        <label htmlFor={inputId} className={`label ${selectedDate ? "active" : ""}`}>
          {label}
        </label>
      )}

      {/* Calendar Icon (Right side) */}
      <FaRegCalendarAlt className="calendar-icon" />

      {/* Clear Button (✖) */}
      {selectedDate && (
        <button
          type="button"
          className="btn btn-clear clear-btn"
          title="Clear date"
          onClick={() => onChange(null)}
        >
          ✖
        </button>
      )}
    </div>
  );
};

export default DatePickerComponent;
