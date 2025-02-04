import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  IconDeviceComputerCamera,
  IconMicrophoneFilled,
  IconPlayerTrackNextFilled,
  IconPhoneFilled,
} from "@tabler/icons-react";
import logo from "/logo.svg";

function App() {
  const navigate = useNavigate();
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [spinnerVisible, setSpinnerVisible] = useState(true);

  const [messages, setMessages] = useState([]); // Chat messages
  const [newMessage, setNewMessage] = useState(""); // New message input

  const socketRef = useRef();
  const peerRef = useRef();
  const typeRef = useRef();
  const remoteSocketRef = useRef();
  const localStreamRef = useRef(null);
  const myVideoRef = useRef(null);
  const strangerVideoRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(import.meta.env.VITE_SERVER_URL);

    // Start the initial connection
    initiateConnection();

    // Listen for 'remote-socket' event from the server
    socketRef.current.on("remote-socket", (id) => {
      remoteSocketRef.current = id;
      setSpinnerVisible(false);

      // Initialize the RTCPeerConnection
      peerRef.current = new RTCPeerConnection({
        iceServers: [
          {
            urls: ["stun:stun.l.google.com:19302"], // Use a public STUN server
          },
        ],
      });

      // Handle negotiation needed event
      peerRef.current.onnegotiationneeded = handleNegotiationNeeded;

      // Handle ICE candidate event
      peerRef.current.onicecandidate = handleICECandidateEvent;

      // Handle incoming tracks (media streams)
      peerRef.current.ontrack = handleTrackEvent;

      // Start media (camera and microphone)
      startMediaStream();
    });

    // Listen for SDP reply from the server
    socketRef.current.on("sdp:reply", handleSDPReply);

    // Listen for ICE candidate reply from the server
    socketRef.current.on("ice:reply", handleICECandidateReply);

    // Handle 'disconnected' event from the server
    socketRef.current.on("disconnected", handleRemoteDisconnect);

    // Handle incoming chat messages
    socketRef.current.on("chat:receive", ({ message, from }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: message, sender: "Stranger" },
      ]);
    });

    // Handle being skipped by the other user
    socketRef.current.on("skipped", () => {
      // Clean up current connections and states
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // Clear messages
      setMessages([]);
      setNewMessage("");

      // Restart the connection process
      setSpinnerVisible(true);
      initiateConnection();
    });

    // Clean up on component unmount
    return () => {
      // Stop all media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (peerRef.current) {
        peerRef.current.close();
      }

      if (socketRef.current) {
        socketRef.current.emit("leave");
        socketRef.current.disconnect();
        // Remove all listeners
        socketRef.current.off("remote-socket");
        socketRef.current.off("sdp:reply");
        socketRef.current.off("ice:reply");
        socketRef.current.off("disconnected");
        socketRef.current.off("chat:receive");
        socketRef.current.off("skipped");
      }

      // Clear messages
      setMessages([]);
    };
  }, [navigate]);

  // Handler functions
  const initiateConnection = () => {
    // Reset state variables if needed
    peerRef.current = null;
    typeRef.current = null;
    remoteSocketRef.current = null;

    socketRef.current.emit("start", (person) => {
      typeRef.current = person;
    });
  };

  const handleNegotiationNeeded = async () => {
    if (typeRef.current === "p1") {
      try {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socketRef.current.emit("sdp:send", {
          sdp: peerRef.current.localDescription,
        });
      } catch (error) {
        console.error("Error during negotiation needed:", error);
      }
    }
  };

  const handleICECandidateEvent = (event) => {
    if (event.candidate) {
      socketRef.current.emit("ice:send", { candidate: event.candidate });
    }
  };

  const handleSDPReply = async ({ sdp }) => {
    try {
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
      if (typeRef.current === "p2") {
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socketRef.current.emit("sdp:send", {
          sdp: peerRef.current.localDescription,
        });
      }
    } catch (error) {
      console.error("Error handling SDP reply:", error);
    }
  };

  const handleICECandidateReply = async ({ candidate }) => {
    try {
      if (candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error("Error adding received ICE candidate:", error);
    }
  };

  const handleTrackEvent = (event) => {
    // Set the stream of the remote video element
    if (strangerVideoRef.current) {
      strangerVideoRef.current.srcObject = event.streams[0];
    }
  };

  const handleRemoteDisconnect = () => {
    if (peerRef.current) {
      peerRef.current.close();
    }

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Clear messages
    setMessages([]);

    navigate("/");
  };

  const startMediaStream = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        // Store the local media stream
        localStreamRef.current = stream;

        if (myVideoRef.current) {
          myVideoRef.current.srcObject = stream;
        }
        stream
          .getTracks()
          .forEach((track) => peerRef.current.addTrack(track, stream));
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });
  };

  const toggleAudio = () => {
    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsAudioMuted(!track.enabled);
      });
    }
  };

  const toggleVideo = () => {
    const localStream = localStreamRef.current;
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsVideoMuted(!track.enabled);
      });
    }
  };

  const leaveRoom = () => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (peerRef.current) {
      peerRef.current.close();
    }

    if (socketRef.current) {
      socketRef.current.emit("leave");
      socketRef.current.disconnect();
      // Remove all listeners
      socketRef.current.off("remote-socket");
      socketRef.current.off("sdp:reply");
      socketRef.current.off("ice:reply");
      socketRef.current.off("disconnected");
      socketRef.current.off("chat:receive");
      socketRef.current.off("skipped");
    }

    // Clear messages
    setMessages([]);

    navigate("/");
  };

  const skipRoom = () => {
    // Notify the server to skip
    socketRef.current.emit("skip");

    // Clean up current connections and states
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Clear messages
    setMessages([]);
    setNewMessage("");

    // Restart the connection process
    setSpinnerVisible(true);

    // Start looking for a new match
    initiateConnection();
  };

  // Chat functions
  const sendMessage = () => {
    if (newMessage.trim() !== "") {
      // Emit the 'chat:send' event to the server
      socketRef.current.emit("chat:send", { message: newMessage });

      // Add the message to the local messages array
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: newMessage, sender: "You" },
      ]);

      // Clear the input field
      setNewMessage("");
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {spinnerVisible && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-50">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-200 font-bold mt-4">
            Waiting For Someone...
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center">
          <img src={logo} alt="SoulMegle Logo" className="h-10 w-10 mr-2" />
          <span className="text-2xl font-bold text-white">SoulMegle</span>
        </div>
        {/* Control Buttons */}
        <div className="flex space-x-4">
          <button
            className={`p-3 rounded-full shadow-md transition transform duration-300 ease-in-out 
                         hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 
                         focus:ring-offset-2 focus:ring-offset-gray-900
                         ${
                           isVideoMuted
                             ? "bg-gray-700"
                             : "bg-purple-600 hover:bg-purple-700"
                         }`}
            onClick={toggleVideo}
          >
            <IconDeviceComputerCamera className="text-white" />
          </button>
          <button
            className={`p-3 rounded-full shadow-md transition transform duration-300 ease-in-out 
                         hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 
                         focus:ring-offset-2 focus:ring-offset-gray-900
                         ${
                           isAudioMuted
                             ? "bg-gray-700"
                             : "bg-purple-600 hover:bg-purple-700"
                         }`}
            onClick={toggleAudio}
          >
            <IconMicrophoneFilled className="text-white" />
          </button>
          <button
            className={`p-3 rounded-full shadow-md transition transform duration-300 ease-in-out 
                         hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:ring-offset-2 focus:ring-offset-gray-900
                         bg-blue-600 hover:bg-blue-700`}
            onClick={skipRoom}
          >
            <IconPlayerTrackNextFilled className="text-white" />
          </button>
          <button
            className="bg-red-600 p-3 rounded-full shadow-md transition transform duration-300 
                       ease-in-out hover:bg-red-700 hover:scale-105 focus:outline-none focus:ring-2 
                       focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            onClick={leaveRoom}
          >
            <IconPhoneFilled className="text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
        {/* Videos Container */}
        <div className="flex flex-col w-full md:w-1/2 p-4">
          <div className="flex flex-col items-center space-y-4">
            {/* Remote Video */}
            <div className="relative w-full max-w-md">
              <video
                autoPlay
                ref={strangerVideoRef}
                className="w-full h-auto bg-gray-800 rounded-lg shadow-lg border-2 border-gray-700"
              />
              <span className="absolute top-2 left-2 bg-gray-800 bg-opacity-75 text-gray-200 px-2 py-1 rounded">
                Stranger
              </span>
            </div>

            {/* Local Video */}
            <div className="relative w-full max-w-md">
              <video
                autoPlay
                muted // Ensure the local video is muted to prevent echo
                ref={myVideoRef}
                className="w-full h-auto bg-gray-800 rounded-lg shadow-lg border-2 border-gray-700"
              />
              <span className="absolute top-2 left-2 bg-gray-800 bg-opacity-75 text-gray-200 px-2 py-1 rounded">
                You
              </span>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex flex-col w-full md:w-1/2 p-4">
          <div className="flex flex-col flex-1 bg-gray-800 rounded-lg shadow-lg border-2 border-gray-700 p-4 overflow-hidden">
            {/* Messages Display */}
            <div className="flex-1 overflow-y-auto mb-4">
              {messages.map((msg, index) => (
                <div key={index}>
                  {/* Nameholder */}
                  <div
                    className={`mb-1 ${
                      msg.sender === "You" ? "text-right" : "text-left"
                    }`}
                  >
                    <span className="text-xs text-gray-400">{msg.sender}</span>
                  </div>
                  {/* Message */}
                  <div
                    className={`mb-2 ${
                      msg.sender === "You" ? "text-right" : "text-left"
                    }`}
                  >
                    <span
                      className={`inline-block px-3 py-2 rounded-lg ${
                        msg.sender === "You"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-200"
                      }`}
                    >
                      {msg.text}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Input Field and Send Button */}
            <div className="flex items-center">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={sendMessage}
                className="ml-2 px-4 py-2 bg-purple-600 text-white font-bold rounded-lg shadow-md hover:bg-purple-700 transition transform duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
