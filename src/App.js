import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://videochatserver-production.up.railway.app");

const VideoChat = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [peerId, setPeerId] = useState(null);

  useEffect(() => {
    socket.on("peer-connected", async ({ peerId }) => {
      console.log(`Connected with peer: ${peerId}`);
      setPeerId(peerId);
    });

    socket.on("offer", async ({ offer, senderId }) => {
      if (!peerConnection.current) createPeerConnection(senderId);
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("answer", { answer, recipientId: senderId });
    });

    socket.on("answer", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("peer-connected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  const createPeerConnection = (recipientId) => {
    peerConnection.current = new RTCPeerConnection();

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { candidate: event.candidate, recipientId });
      }
    };

    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  };

  const startCall = async () => {
    if (!peerId) return alert("Ждём подключения второго пользователя...");

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;

    createPeerConnection(peerId);
    stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("offer", { offer, recipientId: peerId });
  };

  return (
    <div>
      <h1>WebRTC Video Chat</h1>
      <button onClick={startCall}>Start Call</button>
      <div>
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: "300px" }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "300px" }} />
      </div>
    </div>
  );
};

export default VideoChat;
