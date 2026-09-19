import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Chat from "./Chat.component";

const messages = [
  { id: "1", userId: "me", name: "Me", text: "Hello team", timestamp: 1700000000000 },
  { id: "2", userId: "other", name: "Aisha", text: "Hi there", timestamp: 1700000060000 },
];

const setup = (props = {}) => {
  const onSend = jest.fn();
  const onClose = jest.fn();
  render(
    <Chat
      messages={messages}
      currentUserId="me"
      onSend={onSend}
      onClose={onClose}
      {...props}
    />
  );
  return { onSend, onClose };
};

test("shows messages and the sender name of other people only", () => {
  setup();
  expect(screen.getByText("Hello team")).toBeInTheDocument();
  expect(screen.getByText("Hi there")).toBeInTheDocument();
  expect(screen.getByText("Aisha")).toBeInTheDocument();
  expect(screen.queryByText("Me")).not.toBeInTheDocument();
});

test("shows an empty state when there are no messages", () => {
  setup({ messages: [] });
  expect(screen.getByText(/No messages yet/i)).toBeInTheDocument();
});

test("sends a trimmed message and clears the input", () => {
  const { onSend } = setup();
  const input = screen.getByPlaceholderText("Send a message");
  fireEvent.change(input, { target: { value: "  see you soon  " } });
  fireEvent.click(screen.getByLabelText("Send message"));
  expect(onSend).toHaveBeenCalledWith("see you soon");
  expect(input.value).toBe("");
});

test("does not send an empty message", () => {
  const { onSend } = setup();
  const input = screen.getByPlaceholderText("Send a message");
  fireEvent.change(input, { target: { value: "   " } });
  fireEvent.submit(input.closest("form"));
  expect(onSend).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Send message")).toBeDisabled();
});

test("close button calls onClose", () => {
  const { onClose } = setup();
  fireEvent.click(screen.getByLabelText("Close chat"));
  expect(onClose).toHaveBeenCalled();
});
