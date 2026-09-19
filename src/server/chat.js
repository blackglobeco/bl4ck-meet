import firepadRef, { db } from "./firebase";

// Every room lives at /<roomId>, so chat messages live at /<roomId>/messages
const messagesRef = firepadRef.child("messages");

export const sendMessage = ({ userId, name, text }) =>
  messagesRef.push({
    userId,
    name,
    text,
    timestamp: db.database.ServerValue.TIMESTAMP,
  });

/**
 * Listens for chat messages sent while the current user is in the call.
 * Older messages left in the database by previous meetings are ignored.
 * Returns a function that stops listening.
 */
export const subscribeToMessages = (onMessage) => {
  let active = true;
  let query = null;
  let handler = null;

  db.database()
    .ref(".info/serverTimeOffset")
    .once("value")
    .then(
      (snap) => snap.val() || 0,
      () => 0
    )
    .then((offset) => {
      if (!active) return;
      const joinedAt = Date.now() + offset;

      query = messagesRef.limitToLast(200);
      handler = (snap) => {
        const message = snap.val();
        if (!message || !message.text) return;
        if (message.timestamp < joinedAt) return;
        onMessage({ id: snap.key, ...message });
      };
      query.on("child_added", handler);
    });

  return () => {
    active = false;
    if (query && handler) query.off("child_added", handler);
  };
};
