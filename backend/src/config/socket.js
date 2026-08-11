const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
require("dotenv").config();

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
            credentials: true
        }
    });

    io.use((socket, next) => {
        try {
            // Read cookie string
            const cookieStr = socket.handshake.headers.cookie;
            if (!cookieStr) return next(new Error("Authentication error"));

            // Parse cookies
            const cookies = Object.fromEntries(cookieStr.split('; ').map(c => c.split('=')));
            const token = cookies.token;

            if (!token) return next(new Error("Authentication error"));

            // Verify JWT
            const decoded = jwt.verify(token, process.env.JWT_KEY);
            socket.user = decoded; 
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id} for user ${socket.user._id}`);
        // Join a room with their userId for private messages
        socket.join(socket.user._id.toString());

        // They could also join a contest specific room if needed
        socket.on("joinContest", (contestId) => {
            socket.join(`contest_${contestId}`);
        });

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) throw new Error("Socket.io is not initialized!");
    return io;
};

module.exports = { initSocket, getIo };
