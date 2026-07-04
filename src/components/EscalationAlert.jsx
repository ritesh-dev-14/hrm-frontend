import React, { useState, useEffect } from "react";
import "./EscalationAlert.css";

//
// 🔥 ESCALATION ALERT COMPONENT
// Displays pop-up notifications for task escalations
//
const EscalationAlert = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);

      // Auto-close after 10 seconds for info, 15 for warning, 20 for critical
      const duration =
        notification.level === "critical"
          ? 20000
          : notification.level === "danger"
          ? 15000
          : 10000;

      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!isVisible || !notification) return null;

  const getLevelClass = (level) => {
    const levelMap = {
      info: "alert-info",
      warning: "alert-warning",
      danger: "alert-danger",
      critical: "alert-critical",
    };
    return levelMap[level] || "alert-info";
  };

  const getLevelIcon = (level) => {
    const iconMap = {
      info: "ℹ️",
      warning: "⚠️",
      danger: "🚨",
      critical: "🚨🚨",
    };
    return iconMap[level] || "ℹ️";
  };

  return (
    <div className={`escalation-alert ${getLevelClass(notification.level)}`}>
      <div className="alert-content">
        <span className="alert-icon">{getLevelIcon(notification.level)}</span>
        <div className="alert-text">
          <h4 className="alert-title">{notification.title}</h4>
          <p className="alert-message">{notification.message}</p>
        </div>
        <button
          className="alert-close"
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
        >
          ✕
        </button>
      </div>

      {/* Progress bar for auto-close */}
      <div className="alert-progress"></div>
    </div>
  );
};

export default EscalationAlert;
