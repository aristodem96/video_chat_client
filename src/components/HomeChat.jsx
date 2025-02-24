import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

// Замените на URL вашего сервера
const socket = io("https://videochatserver-production.up.railway.app");

const HomeChat = () => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const [peerId, setPeerId] = useState(null);  // Держим ID второго пользователя

    useEffect(() => {
        // Обработка события peer-connected, когда подключается второй участник
        socket.on("peer-connected", async ({ peerId }) => {
            console.log(`Connected with peer: ${peerId}`);
            setPeerId(peerId);  // Сохраняем ID второго пользователя
        });

        // Обработка предложения звонка от первого участника
        socket.on("offer", async ({ offer, senderId }) => {
            if (!peerConnection.current) createPeerConnection(senderId);
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit("answer", { answer, recipientId: senderId });
        });

        // Обработка ответа от второго участника
        socket.on("answer", async ({ answer }) => {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        // Обработка ICE-кандидатов
        socket.on("ice-candidate", async ({ candidate }) => {
            if (peerConnection.current) {
                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        // Очистка подписок на события при размонтировании компонента
        return () => {
            socket.off("peer-connected");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
        };
    }, []);

    // Функция для создания peer connection
    const createPeerConnection = (recipientId) => {
        peerConnection.current = new RTCPeerConnection();

        // Отправляем ICE-кандидаты
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", { candidate: event.candidate, recipientId });
            }
        };

        // При получении медиа-потока от второго участника, выводим на экран
        peerConnection.current.ontrack = (event) => {
            remoteVideoRef.current.srcObject = event.streams[0];
        };
    };

    // Функция для старта звонка
    const startCall = async () => {
        if (!peerId) return alert("Ждём подключения второго пользователя...");

        // Получаем медиа-данные от пользователя
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideoRef.current.srcObject = stream;

        createPeerConnection(peerId);
        // Добавляем локальные потоки
        stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

        // Создаём предложение (offer)
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);

        // Отправляем предложение второму участнику
        socket.emit("offer", { offer, recipientId: peerId });
    };

    return (
        <div className="home_chat_container">
            <div className="home_chat_title">
                Error Chat
            </div>
            <div className="home_video_container">
                <video ref={localVideoRef} autoPlay playsInline style={{ width: "50%" }} />
                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "50%" }} />
            </div>
            <button className="btn_start_call" onClick={startCall}>Start Call</button>
        </div>

    );
};

export default HomeChat;
