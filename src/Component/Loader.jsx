import React from "react";
import { ClipLoader } from "react-spinners";

const LoaderSpinner = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10001,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <ClipLoader color="#007bff" size={50} />
      </div>
    </div>
  );
};

export default LoaderSpinner;