import React from "react";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { act } from "react-dom/test-utils";
import { render, screen, fireEvent } from "@testing-library/react";
import MainScreen from "./MainScreen.component";
import { leaveMeeting } from "../../server/peerConnection";
import { sendMessage } from "../../server/chat";

// Keep Firebase and WebRTC out of these tests
jest.mock("../../server/peerConnection", () => ({ leaveMeeting: jest.fn() }));
jest.mock("../../server/chat", () => ({
  sendMessage: jest.fn(),
  subscribeToMessages: (callback) => {
    global.__chatCallback = callback;
    return () => {};
  },
}));
jest.mock("../Participants/Participants.component", () => () => (
  <div data-testid="participants" />
));

const makeTrack = () => ({ enabled: true, stop: jest.fn() });

const setup = () => {
  const cameraTrack = makeTrack();
  const micTrack = makeTrack();
  const stream = {
    getAudioTracks: () => [micTrack],
    getVideoTracks: () => [cameraTrack],
    getTracks: () => [micTrack, cameraTrack],
  };
  const closeConnection = jest.fn();
  const state = {
    mainStream: stream,
    currentUser: { me: { name: "Me", audio: true, video: false, screen: false } },
    participants: {
      me: { name: "Me", currentUser: true },
      other: { name: "Aisha", peerConnection: { close: closeConnection } },
    },
  };
  render(
    <Provider store={createStore((s) => s, state)}>
      <MainScreen />
    </Provider>
  );
  return { cameraTrack, micTrack, closeConnection };
};

const receive = (message) =>
  act(() => {
    global.__chatCallback({ timestamp: Date.now(), name: "Aisha", ...message });
  });

test("leave and chat buttons are in the footer", () => {
  setup();
  expect(screen.getByTestId("participants")).toBeInTheDocument();
  expect(document.querySelector(".meeting-icons.leave-button")).toBeInTheDocument();
  expect(document.querySelector(".meeting-icons.chat-toggle")).toBeInTheDocument();
});

test("chat toggles open and closed", () => {
  setup();
  const chatButton = document.querySelector(".chat-toggle");
  expect(screen.queryByText("In-call messages")).not.toBeInTheDocument();
  fireEvent.click(chatButton);
  expect(screen.getByText("In-call messages")).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Close chat"));
  expect(screen.queryByText("In-call messages")).not.toBeInTheDocument();
});

test("unread badge counts messages from others while chat is closed, then clears", () => {
  setup();
  receive({ id: "1", userId: "other", text: "ping" });
  receive({ id: "2", userId: "other", text: "ping 2" });
  expect(document.querySelector(".chat-badge").textContent).toBe("2");

  fireEvent.click(document.querySelector(".chat-toggle"));
  expect(document.querySelector(".chat-badge")).not.toBeInTheDocument();
  expect(screen.getByText("ping 2")).toBeInTheDocument();
});

test("my own messages do not raise the unread badge", () => {
  setup();
  receive({ id: "1", userId: "me", text: "mine" });
  expect(document.querySelector(".chat-badge")).not.toBeInTheDocument();
});

test("typing a message sends it with my id and name", () => {
  setup();
  fireEvent.click(document.querySelector(".chat-toggle"));
  fireEvent.change(screen.getByPlaceholderText("Send a message"), {
    target: { value: "hello all" },
  });
  fireEvent.click(screen.getByLabelText("Send message"));
  expect(sendMessage).toHaveBeenCalledWith({
    userId: "me",
    name: "Me",
    text: "hello all",
  });
});

test("leaving stops camera and mic, closes connections, and shows the left screen", () => {
  const { cameraTrack, micTrack, closeConnection } = setup();
  fireEvent.click(document.querySelector(".leave-button"));

  expect(cameraTrack.stop).toHaveBeenCalled();
  expect(micTrack.stop).toHaveBeenCalled();
  expect(closeConnection).toHaveBeenCalled();
  expect(leaveMeeting).toHaveBeenCalledWith("me");
  expect(screen.getByText("You left the meeting")).toBeInTheDocument();
  expect(screen.getByText("Rejoin")).toBeInTheDocument();
  expect(screen.queryByTestId("participants")).not.toBeInTheDocument();
});
