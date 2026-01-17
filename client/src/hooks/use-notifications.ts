import { useState, useEffect } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    }
    return Notification.permission === "granted";
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    }
  };

  const scheduleNotification = (title: string, date: Date, options?: NotificationOptions) => {
    const now = new Date().getTime();
    const scheduleTime = date.getTime();
    const delay = scheduleTime - now;

    if (delay > 0) {
      setTimeout(() => {
        sendNotification(title, options);
      }, delay);
    }
  };

  return {
    permission,
    requestPermission,
    sendNotification,
    scheduleNotification,
  };
}

