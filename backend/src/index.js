const express = require('express')
const app = express();
const http = require('http');
require('dotenv').config();
const main = require('./config/db')
const cookieParser = require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit")
const contestRouter = require("./routes/contestRoutes")
const videoRouter = require("./routes/videoRouter");
const aiRouter = require("./routes/aiRouter");
const cors = require('cors')

const { initSocket } = require('./config/socket');
require('./config/submissionQueue');

const server = http.createServer(app);
initSocket(server);

app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    credentials: true
}))

app.use(express.json());
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/contest', contestRouter);
app.use('/video', videoRouter);
app.use('/ai', aiRouter);


const InitalizeConnection = async () => {
    try {

        await main();
        console.log("DB Connected");

        server.listen(process.env.PORT, () => {
            console.log("Server listening at port number: " + process.env.PORT);
        })

    }
    catch (err) {
        console.log("Error: " + err);
    }
}


InitalizeConnection();

