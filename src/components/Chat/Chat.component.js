import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import "./Chat.css";

const MAX_LENGTH = 1000;

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const Chat = ({ messages, currentUserId, onSend, onClose }) => {
  const [text, setText] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <aside className="chat-panel" aria-label="In-call messages">
      <div className="chat-header">
        <h2 className="chat-title">In-call messages</h2>
        <button
          type="button"
          className="chat-close"
          onClick={onClose}
          aria-label="Close chat"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="chat-notice">
        Everyone in the call can see these messages. You only see messages sent
        while you are in the call.
      </div>

      <div className="chat-messages" ref={listRef}>
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hello to everyone.</p>
        )}
        {messages.map((message) => {
          const isMine = message.userId === currentUserId;
          return (
            <div
              key={message.id}
              className={`chat-message ${isMine ? "mine" : "theirs"}`}
            >
              <div className="chat-meta">
                {!isMine && (
                  <span className="chat-sender">{message.name || "Guest"}</span>
                )}
                <span className="chat-time">{formatTime(message.timestamp)}</span>
              </div>
              <div className="chat-bubble">{message.text}</div>
            </div>
          );
        })}
      </div>

      <form className="chat-form" onSubmit={submit}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Send a message"
          value={text}
          maxLength={MAX_LENGTH}
          onChange={(event) => setText(event.target.value)}
        />
        <button
          type="submit"
          className="chat-send"
          disabled={!text.trim()}
          aria-label="Send message"
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </aside>
  );
};

export default Chat;
