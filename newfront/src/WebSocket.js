const connectWebSocket = () => {
  const token = localStorage.getItem("token");
  const ws = new WebSocket(`ws://localhost:8080?token=${token}`);

  ws.onopen = () => {
    console.log("WebSocket connection established.");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "notification") {
      console.log("New notification:", data.message);
      // Display the notification to the user
      alert(data.message); // Or use a toast notification library
    }
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed.");
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
};

// Call this function when the user logs in
connectWebSocket();
