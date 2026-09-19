// Plain functions (not jest.fn) wherever a return value is needed, because
// Create React App resets jest.fn() implementations before every test.
jest.mock("./firebase", () => {
  const query = { on: jest.fn(), off: jest.fn() };
  const messagesRef = { push: jest.fn(), limitToLast: () => query };
  const database = () => ({
    ref: () => ({ once: () => Promise.resolve({ val: () => 0 }) }),
  });
  database.ServerValue = { TIMESTAMP: { ".sv": "timestamp" } };
  return {
    __esModule: true,
    default: { child: () => messagesRef },
    db: { database },
    __mocks: { query, messagesRef },
  };
});

const { sendMessage, subscribeToMessages } = require("./chat");
const { __mocks } = require("./firebase");

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const snap = (key, value) => ({ key, val: () => value });

beforeEach(() => jest.clearAllMocks());

test("sendMessage pushes the message with a server timestamp", () => {
  sendMessage({ userId: "u1", name: "Sam", text: "hi" });
  expect(__mocks.messagesRef.push).toHaveBeenCalledWith({
    userId: "u1",
    name: "Sam",
    text: "hi",
    timestamp: { ".sv": "timestamp" },
  });
});

test("subscribeToMessages delivers new messages and ignores old ones", async () => {
  const onMessage = jest.fn();
  subscribeToMessages(onMessage);
  await flush();

  expect(__mocks.query.on).toHaveBeenCalledWith("child_added", expect.any(Function));
  const handler = __mocks.query.on.mock.calls[0][1];

  handler(snap("old", { userId: "a", name: "A", text: "before I joined", timestamp: 1000 }));
  handler(snap("empty", { userId: "a", name: "A", text: "", timestamp: Date.now() + 5000 }));
  handler(snap("new", { userId: "a", name: "A", text: "hello", timestamp: Date.now() + 5000 }));

  expect(onMessage).toHaveBeenCalledTimes(1);
  expect(onMessage).toHaveBeenCalledWith(
    expect.objectContaining({ id: "new", text: "hello", name: "A" })
  );
});

test("unsubscribing stops the listener", async () => {
  const unsubscribe = subscribeToMessages(jest.fn());
  await flush();
  const handler = __mocks.query.on.mock.calls[0][1];
  unsubscribe();
  expect(__mocks.query.off).toHaveBeenCalledWith("child_added", handler);
});

test("unsubscribing before Firebase answers never attaches a listener", async () => {
  const unsubscribe = subscribeToMessages(jest.fn());
  unsubscribe();
  await flush();
  expect(__mocks.query.on).not.toHaveBeenCalled();
});
