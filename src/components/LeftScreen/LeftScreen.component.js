import React from "react";
import "./LeftScreen.css";

const rejoin = () => {
  // The room id is still in the address bar, so reloading rejoins the same room
  window.location.reload();
};

const startNewMeeting = () => {
  window.location.href = window.location.pathname;
};

const LeftScreen = () => (
  <div className="left-screen">
    <h1 className="left-title">You left the room</h1>
    <p className="left-text">Your camera and microphone are off.</p>
    <div className="left-actions">
      <button type="button" className="left-button outline" onClick={rejoin}>
        Rejoin
      </button>
      <button
        type="button"
        className="left-button filled"
        onClick={startNewMeeting}
      >
        New meeting
      </button>
    </div>
  </div>
);

export default LeftScreen;
