import { useEffect, useState } from "react";
import { io } from "socket.io-client";

//
// 🔥 CUSTOM HOOK FOR ESCALATION NOTIFICATIONS
//
export const useEscalationNotifications = (userId, isLoggedIn) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    // Connect to socket server
    const socketInstance = io(
      process.env.REACT_APP_API_URL || "http://localhost:8000",
      {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      }
    );

    socketInstance.on("connect", () => {
      console.log("✅ Connected to notification server");

      // Join user-specific room
      socketInstance.emit("join-user", { userId });
    });

    // Listen for task reminders
    socketInstance.on("task-reminder-popup", (data) => {
      console.log("📢 Task reminder received:", data);
      setCurrentNotification({
        ...data,
        id: Date.now(),
      });
      setNotifications((prev) => [...prev, data]);
    });

    // Listen for HR escalation
    socketInstance.on("hr-escalation-popup", (data) => {
      console.log("📢 HR escalation received:", data);
      setCurrentNotification({
        ...data,
        id: Date.now(),
      });
      setNotifications((prev) => [...prev, data]);
    });

    // Listen for Admin escalation
    socketInstance.on("admin-escalation-popup", (data) => {
      console.log("📢 Admin escalation received:", data);
      setCurrentNotification({
        ...data,
        id: Date.now(),
      });
      setNotifications((prev) => [...prev, data]);
    });

    // Listen for final escalation
    socketInstance.on("final-escalation-popup", (data) => {
      console.log("📢 Final escalation received:", data);
      setCurrentNotification({
        ...data,
        id: Date.now(),
      });
      setNotifications((prev) => [...prev, data]);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Disconnected from notification server");
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit("leave-user", { userId });
      socketInstance.disconnect();
    };
  }, [userId, isLoggedIn]);

  const clearNotification = () => {
    setCurrentNotification(null);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setCurrentNotification(null);
  };

  return {
    socket,
    notifications,
    currentNotification,
    clearNotification,
    clearAllNotifications,
  };
};

export default useEscalationNotifications;
