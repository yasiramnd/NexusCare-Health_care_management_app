// Medical-style loading animation

import React from "react";

function Loader() {
  return (
    <div className="loader-container">
      <div className="heartbeat"></div>
      <p>Loading Emergency Profile...</p>
    </div>
  );
}

export default Loader;