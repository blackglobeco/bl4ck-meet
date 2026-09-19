import React, { useRef, useEffect, useState } from "react";
import MeetingFooter from "../MeetingFooter/MeetingFooter.component";
import Participants from "../Participants/Participants.component";
import Chat from "../Chat/Chat.component";
import LeftScreen from "../LeftScreen/LeftScreen.component";
import "./MainScreen.css";
import { connect } from "react-redux";
import { setMainStream, updateUser } from "../../store/actioncreator";
import { leaveMeeting } from "../../server/peerConnection";
import { sendMessage, subscribeToMessages } from "../../server/chat";

const MainScreen = (props) => {
  const participantRef = useRef(props.participants);
  // Every stream that was ever shown (camera, then screen share...) so that
  // leaving the call can switch the camera and microphone off completely
  const streamsRef = useRef(new Set());
  const [hasLeft, setHasLeft] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatOpenRef = useRef(false);
  const currentUserIdRef = useRef(null);

  const currentUserId = props.currentUser
    ? Object.keys(props.currentUser)[0]
    : null;
  const currentUserName = props.currentUser
    ? Object.values(props.currentUser)[0].name
    : "";

  const onMicClick = (micEnabled) => {
    if (props.stream) {
      props.stream.getAudioTracks()[0].enabled = micEnabled;
      props.updateUser({ audio: micEnabled });
    }
  };
  const onVideoClick = (videoEnabled) => {
    if (props.stream) {
      props.stream.getVideoTracks()[0].enabled = videoEnabled;
      props.updateUser({ video: videoEnabled });
    }
  };

  useEffect(() => {
    participantRef.current = props.participants;
  }, [props.participants]);

  const updateStream = (stream) => {
    for (let key in participantRef.current) {
      const sender = participantRef.current[key];
      if (sender.currentUser) continue;
      const peerConnection = sender.peerConnection
        .getSenders()
        .find((s) => (s.track ? s.track.kind === "video" : false));
      peerConnection.replaceTrack(stream.getVideoTracks()[0]);
    }
    props.setMainStream(stream);
  };

  const onScreenShareEnd = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStream.getVideoTracks()[0].enabled = Object.values(
      props.currentUser
    )[0].video;

    updateStream(localStream);

    props.updateUser({ screen: false });
  };

  const onScreenClick = async () => {
    let mediaStream;
    if (navigator.getDisplayMedia) {
      mediaStream = await navigator.getDisplayMedia({ video: true });
    } else if (navigator.mediaDevices.getDisplayMedia) {
      mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
    } else {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { mediaSource: "screen" },
      });
    }

    mediaStream.getVideoTracks()[0].onended = onScreenShareEnd;

    updateStream(mediaStream);

    props.updateUser({ screen: true });
  };

  useEffect(() => {
    if (props.stream) streamsRef.current.add(props.stream);
  }, [props.stream]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (hasLeft) return undefined;
    const unsubscribe = subscribeToMessages((message) => {
      setMessages((previous) =>
        previous.some((item) => item.id === message.id)
          ? previous
          : [...previous, message]
      );
      if (message.userId !== currentUserIdRef.current && !chatOpenRef.current) {
        setUnreadCount((count) => count + 1);
      }
    });
    return unsubscribe;
  }, [hasLeft]);

  const onChatClick = () => {
    const next = !chatOpen;
    chatOpenRef.current = next;
    setChatOpen(next);
    if (next) setUnreadCount(0);
  };

  const onSendMessage = (text) => {
    if (!currentUserId) return;
    sendMessage({
      userId: currentUserId,
      name: currentUserName || "Guest",
      text,
    });
  };

  const onLeaveClick = () => {
    Object.values(props.participants || {}).forEach((participant) => {
      if (participant.peerConnection) participant.peerConnection.close();
    });
    if (props.stream) streamsRef.current.add(props.stream);
    streamsRef.current.forEach((stream) =>
      stream.getTracks().forEach((track) => track.stop())
    );
    setHasLeft(true);
    if (currentUserId) leaveMeeting(currentUserId);
  };

  if (hasLeft) return <LeftScreen />;

  return (
    <div className="wrapper">
      <div className="content-row">
        <div className="main-screen">
          <Participants />
        </div>
        {chatOpen && (
          <Chat
            messages={messages}
            currentUserId={currentUserId}
            onSend={onSendMessage}
            onClose={onChatClick}
          />
        )}
      </div>

      <div className="footer">
        <MeetingFooter
          onScreenClick={onScreenClick}
          onMicClick={onMicClick}
          onVideoClick={onVideoClick}
          onLeaveClick={onLeaveClick}
          onChatClick={onChatClick}
          chatOpen={chatOpen}
          unreadCount={unreadCount}
        />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    stream: state.mainStream,
    participants: state.participants,
    currentUser: state.currentUser,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setMainStream: (stream) => dispatch(setMainStream(stream)),
    updateUser: (user) => dispatch(updateUser(user)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(MainScreen);
