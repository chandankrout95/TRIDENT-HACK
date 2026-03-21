import { Server } from "socket.io";
import Message from "../models/chat.model.js";

let io;
const users = new Map(); // Map to track socketId mapped to userId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // allow React Native and React Web clients
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user connected
    socket.on("register", (userId) => {
      users.set(userId, socket.id);
      console.log(`User registered: ${userId} -> Socket: ${socket.id}`);
      
      // Notify contacts that they are online (optional real-time feature)
      io.emit("user_status", { userId, isOnline: true });
    });

    // Check online status of a specific user
    socket.on("check_online_status", (userId) => {
      const isOnline = users.has(userId);
      socket.emit("user_status", { userId, isOnline });
    });

    // Handle incoming messages — save to MongoDB and relay
    socket.on("send_message", async (data) => {
      try {
        const { sender, receiver, content, messageType, imageUrl, replyTo } = data;
        
        // Save to DB
        let message = await Message.create({
          sender,
          receiver,
          content,
          messageType: messageType || 'text',
          imageUrl,
          replyTo: replyTo || null,
          isRead: false
        });

        // Populate replyTo for real-time relay
        if (replyTo) {
          message = await message.populate('replyTo');
        }

        const saved = message.toObject();

        // Send to receiver if online
        const receiverSocketId = users.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", saved);
        }

        // Confirm back to sender with DB _id
        socket.emit("message_sent", saved);

      } catch (err) {
        console.error("Error saving/sending message", err);
      }
    });

    // Handle typing events
    socket.on("typing", (data) => {
      const { receiverId, isTyping, senderId } = data;
      const receiverSocketId = users.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", { senderId, isTyping });
      }
    });

    // Handle read receipts
    socket.on("mark_read", async (data) => {
      const { messageIds, readerId, senderId } = data; // the messages the user just read
      
      try {
        await Message.updateMany(
           { _id: { $in: messageIds } },
           { $set: { isRead: true, readAt: new Date() } }
        );

        const senderSocketId = users.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messages_read", { messageIds, readerId });
        }
      } catch (err) {
        console.error("Error updating read status", err);
      }
    });

    // ─── Call Signaling ──────────────────────────────────────────────────────
    // Caller initiates a call → forward to receiver
    socket.on("call_initiate", (data) => {
      const { callerId, callerName, receiverId, channelName, isVideo } = data;
      const receiverSocketId = users.get(receiverId);
      console.log(`Call initiated: ${callerId} → ${receiverId} (channel: ${channelName}, video: ${isVideo})`);
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call_incoming", {
          callerId,
          callerName,
          channelName,
          isVideo,
        });
      } else {
        // Receiver not online
        socket.emit("call_busy", { receiverId, reason: "offline" });
      }
    });

    // Receiver accepts the call → notify caller
    socket.on("call_accepted", (data) => {
      const { callerId, channelName } = data;
      const callerSocketId = users.get(callerId);
      console.log(`Call accepted by receiver, notifying caller: ${callerId}`);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call_accepted", { channelName });
      }
    });

    // Receiver rejects the call → notify caller
    socket.on("call_rejected", (data) => {
      const { callerId } = data;
      const callerSocketId = users.get(callerId);
      console.log(`Call rejected, notifying caller: ${callerId}`);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call_rejected", {});
      }
    });

    // Either party ends the call → notify the other
    socket.on("call_ended", (data) => {
      const { otherUserId } = data;
      const otherSocketId = users.get(otherUserId);
      console.log(`Call ended, notifying: ${otherUserId}`);
      if (otherSocketId) {
        io.to(otherSocketId).emit("call_ended", {});
      }
    });

    // Save call log
    socket.on("save_call_log", async (data) => {
      try {
        const { senderId, receiverId, isVideo, duration, status } = data;
        
        let messageType = isVideo ? 'video_call' : 'audio_call';
        if (status === 'missed' || status === 'declined' || status === 'busy') {
          messageType = 'missed_call';
        }

        let content = isVideo ? 'Video call' : 'Voice call';
        if (messageType === 'missed_call') content = 'Missed call';

        const callMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          messageType,
          duration,
        });

        const senderSocketId = users.get(senderId);
        const receiverSocketId = users.get(receiverId);

        if (senderSocketId) io.to(senderSocketId).emit("receive_message", callMessage);
        if (receiverSocketId) io.to(receiverSocketId).emit("receive_message", callMessage);
      } catch (err) {
        console.error("Error saving call log:", err);
      }
    });

    // ─── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      let disconnectedUserId = null;
      
      for (let [userId, mappedSocketId] of users.entries()) {
        if (mappedSocketId === socket.id) {
          disconnectedUserId = userId;
          users.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
         io.emit("user_status", { userId: disconnectedUserId, isOnline: false });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
