import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import cameraIcon from "../icons/camera.png";
import micIcon from "../icons/mic.png";
import phoneIcon from "../icons/phone.png";

function App() {
  let peer;
  let roomid;
  let type;
  let remoteSocket;
  const navigate = useNavigate();
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [socket, setSocket] = useState(io("http://localhost:8000"));

  const myVideoRef = useRef(null);
  const strangerVideoRef = useRef(null);
  const [spinnerVisible, setSpinnerVisible] = useState(true);

  const toggleAudio = () => {
    const localStream = myVideoRef.current.srcObject;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsAudioMuted(!track.enabled);
    });
  };

  const toggleVideo = () => {
    const localStream = myVideoRef.current.srcObject;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsVideoMuted(!track.enabled);
    });
  };

  const servers = {
    iceServers: [
      {
        urls: ["stun:stun.arbuz.ru:3478", "stun:stun.bahnhof.net:3478"],
      },
    ],
  };

  function start() {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        if (peer) {
          myVideoRef.current.srcObject = stream;
          stream.getTracks().forEach((track) => peer.addTrack(track, stream));
          peer.ontrack = (e) => {
            strangerVideoRef.current.srcObject = e.streams[0];
            strangerVideoRef.current.play();
          };
        }
      })
      .catch(console.log);
  }

  useEffect(() => {
    socket.emit("start", (person) => {
      type = person;
    });
  }, []);

  socket.on("roomid", (id) => (roomid = id));
  socket.on("remote-socket", (id) => {
    remoteSocket = id;
    setSpinnerVisible(false);
    peer = new RTCPeerConnection(servers);
    peer.onnegotiationneeded = webrtc;
    peer.onicecandidate = (e) => {
      if (peer)
        socket.emit("ice:send", { candidate: e.candidate, to: remoteSocket });
    };
    start();
  });

  async function webrtc() {
    if (type === "p1") {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("sdp:send", { sdp: peer.localDescription });
    }
  }

  socket.on("sdp:reply", async ({ sdp }) => {
    if (peer) {
      await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      if (type === "p2") {
        const ans = await peer.createAnswer();
        await peer.setLocalDescription(ans);
        socket.emit("sdp:send", { sdp: peer.localDescription });
      }
    }
  });

  socket.on("ice:reply", async ({ candidate }) => {
    if (peer) await peer.addIceCandidate(candidate);
  });

  const leaveRoom = () => {
    socket.emit("leave");
    navigate("/");
    window.location.reload(true);
  };

  socket.on("disconnected", () => {
    peer.close();
    navigate("/");
    socket.emit("leave");
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      {spinnerVisible && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-50">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-200 font-bold mt-4">
            Waiting For Someone...
          </span>
        </div>
      )}
      <div className="relative p-8 w-full flex justify-center">
        <video
          autoPlay
          ref={myVideoRef}
          className="absolute bottom-4 right-4 w-40 h-40 bg-gray-800 rounded-lg shadow-lg 
                     border-2 border-gray-700 z-10"
        ></video>
        <video
          autoPlay
          ref={strangerVideoRef}
          className="w-full h-[calc(100vh-120px)] bg-gray-800 rounded-lg shadow-lg 
                     border-2 border-gray-700"
        ></video>
      </div>
      <div className="fixed bottom-10 flex gap-6">
        <button
          className={`p-4 rounded-full shadow-md transition transform duration-300 ease-in-out 
                     hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 
                     focus:ring-offset-2 focus:ring-offset-gray-900
                     ${
                       isVideoMuted
                         ? "bg-gray-700"
                         : "bg-purple-600 hover:bg-purple-700"
                     }`}
          onClick={toggleVideo}
        >
          <img
            src={cameraIcon}
            alt="Camera"
            className="w-6 h-6 filter brightness-0 invert"
          />
        </button>
        <button
          className={`p-4 rounded-full shadow-md transition transform duration-300 ease-in-out 
                     hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 
                     focus:ring-offset-2 focus:ring-offset-gray-900
                     ${
                       isAudioMuted
                         ? "bg-gray-700"
                         : "bg-purple-600 hover:bg-purple-700"
                     }`}
          onClick={toggleAudio}
        >
          <img
            src={micIcon}
            alt="Microphone"
            className="w-6 h-6 filter brightness-0 invert"
          />
        </button>
        <button
          className="bg-red-600 p-4 rounded-full shadow-md transition transform duration-300 
                     ease-in-out hover:bg-red-700 hover:scale-105 focus:outline-none focus:ring-2 
                     focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          onClick={leaveRoom}
        >
          <img
            src={phoneIcon}
            alt="Leave"
            className="w-6 h-6 filter brightness-0 invert"
          />
        </button>
      </div>
    </div>
  );
}

export default App;
