import { Server } from "socket.io";
import Message from "../models/chat.model.js";
import AIMessage from "../models/aiMessage.model.js";
import User from "../models/auth.model.js";
import { generateAIResponse } from "../services/ai.service.js";
import { sendPushNotification } from "../services/pushNotification.service.js";

let io;
const users = new Map(); // Map to track socketId mapped to userId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user connected
    socket.on("register", (userId) => {
      users.set(userId, socket.id);
      console.log(`User registered: ${userId} -> Socket: ${socket.id}`);
      io.emit("user_status", { userId, isOnline: true });
    });

    // Admin joins admin room for realtime updates
    socket.on("join_admin_room", () => {
      socket.join("admin_room");
      console.log(`Socket ${socket.id} joined admin_room`);
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
        
        let message = await Message.create({
          sender,
          receiver,
          content,
          messageType: messageType || 'text',
          imageUrl,
          replyTo: replyTo || null,
          isRead: false
        });

        if (replyTo) {
          message = await message.populate('replyTo');
        }

        const saved = message.toObject();

        const senderUser = await User.findById(sender).select('name email');
        if (senderUser) {
          saved.senderName = senderUser.name || senderUser.email;
        }

        const receiverSocketId = users.get(receiver);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", saved);
        } else {
          // Receiver is offline, send push notification
          const title = `New message from ${saved.senderName || 'someone'}`;
          const body = messageType === 'image' ? 'Sent an image' : content;
          sendPushNotification(receiver, title, body, {
            type: 'chat',
            senderId: sender.toString(),
            messageId: saved._id.toString()
          });
        }

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

    // ─── AI Persona Chat ────────────────────────────────────────────────────
    socket.on("send_ai_message", async (data) => {
      try {
        const { userId, persona, content } = data;

        // Save the user's message
        const userMsg = await AIMessage.create({
          sender: userId,
          persona,
          role: 'user',
          content,
        });

        // Emit the saved user message back with its DB _id
        socket.emit('ai_message_saved', userMsg.toObject());

        // Emit typing indicator
        socket.emit('ai_typing', { persona, isTyping: true });

        // Fetch last 10 messages for context
        const history = await AIMessage.find({ sender: userId, persona })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        const contextMessages = history.reverse().map(m => ({
          role: m.role,
          content: m.content,
        }));

        // Fetch user's name for personalization
        const userDoc = await User.findById(userId).select('name email').lean();
        const userName = userDoc?.name || userDoc?.email || 'User';

        // Generate the AI response
        const aiText = await generateAIResponse(persona, contextMessages, userName);

        // Save the AI response
        const aiMsg = await AIMessage.create({
          sender: userId,
          persona,
          role: 'assistant',
          content: aiText,
        });

        // Stop typing indicator and emit the response
        socket.emit('ai_typing', { persona, isTyping: false });
        socket.emit('ai_response', aiMsg.toObject());

      } catch (err) {
        console.error('AI chat error:', err);
        socket.emit('ai_typing', { persona: data?.persona, isTyping: false });
        socket.emit('ai_response', {
          _id: Date.now().toString(),
          sender: data?.userId,
          persona: data?.persona,
          role: 'assistant',
          content: "I'm sorry, something went wrong. Please try again. 💛",
          createdAt: new Date().toISOString(),
        });
      }
    });

    // Handle read receipts
    socket.on("mark_read", async (data) => {
      const { messageIds, readerId, senderId } = data;
      
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
        socket.emit("call_busy", { receiverId, reason: "offline" });
        // Send a push notification for the call
        sendPushNotification(receiverId, 'Incoming Call', `${callerName} is calling you`, {
          type: 'call',
          callerId,
          channelName,
          isVideo: isVideo.toString()
        });
      }
    });

    socket.on("call_accepted", (data) => {
      const { callerId, channelName } = data;
      const callerSocketId = users.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call_accepted", { channelName });
      }
    });

    socket.on("call_rejected", (data) => {
      const { callerId } = data;
      const callerSocketId = users.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call_rejected", {});
      }
    });

    socket.on("call_ended", (data) => {
      const { otherUserId } = data;
      const otherSocketId = users.get(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit("call_ended", {});
      }
    });

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
        
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", callMessage);
        } else if (messageType === 'missed_call') {
           // Send missed call push notification
           const caller = await User.findById(senderId).select('name');
           sendPushNotification(receiverId, 'Missed Call', `You missed a call from ${caller?.name || 'someone'}`, {
             type: 'missed_call',
             callerId: senderId
           });
        }
      } catch (err) {
        console.error("Error saving call log:", err);
      }
    });
 
    // Handle real-time patient vitals updates
    socket.on("patient_vitals_update", async (data) => {
      try {
        const { userId, vitals } = data;
        const User = (await import("../models/auth.model.js")).default;
        
        await User.findByIdAndUpdate(userId, {
          $set: {
            vitals: {
              ...vitals,
              lastSynced: new Date()
            }
          }
        });
        
        console.log(`Vitals updated for user: ${userId}`);
      } catch (err) {
        console.error("Error updating patient vitals:", err);
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
