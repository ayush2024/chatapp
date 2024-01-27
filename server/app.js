const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');
const io = require('socket.io')(8080, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ["GET", "POST"],
        credentials: true,
    }
})

// connect to DB
require('./db/connection.js');

// Import files
const Users = require('./models/Users.js');
const Conversations = require('./models/Conversations.js');
const Messages = require('./models/Messages.js');

const port = 8000;

// app use
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Socket.Io
let users = [];
io.on('connection', socket => {
    console.log("User conncted", socket.id);
    socket.on('addUser', userId => {
        const isUserExist = users.find(user => user.userId === userId);
        if (!isUserExist) {
            const user = { userId, socketId: socket.id };
            users.push(user);
            io.emit('getUsers', users);
        }
    });

    socket.on('sendMessage', async ({ senderId, receiverId, message, conversationId }) => {
        const receiver = users.find(user => user.userId === receiverId);
        const sender = users.find(user => user.userId === senderId);
        const user = await Users.findById(senderId);
        console.log('sender :>> ', sender, receiver);
        if (receiver) {
            io.to(receiver.socketId).to(sender.socketId).emit('getMessage', {
                senderId,
                message,
                conversationId,
                receiverId,
                user: { id: user._id, fullName: user.fullName, email: user.email }
            });
        } else {
            io.to(sender.socketId).emit('getMessage', {
                senderId,
                message,
                conversationId,
                receiverId,
                user: { id: user._id, fullName: user.fullName, email: user.email }
            });
        }
    });

    socket.on('disconnect', () => {
        users = users.filter(user => user.socketId !== socket.id);
        io.emit('getUsers', users);
    });
})


// Routes
app.get('/', (req, res) => {
    res.send("Hello baby")
})

app.post('/api/register', async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            res.status(400).send('Please fill all required fields');
        } else {
            const isAlredyExist = await Users.findOne({ email });
            if (isAlredyExist)
                res.status(400).send('User already exist');
            else {
                const newUser = new Users({ fullName, email });
                bcryptjs.hash(password, 10, (err, hashedPassword) => {
                    newUser.set('password', hashedPassword);
                    newUser.save();
                    next();
                })
                return res.status(200).send('User registered successfully...')
            }
        }
    } catch (err) {
        console.log("error", err);
    }
})

app.post('/api/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).send('Please fill all required fields');
        } else {
            const user = await Users.findOne({ email });
            if (!user) {
                res.status(400).send('User email or password is incorrect');
            } else {
                const validateUser = await bcryptjs.compare(password, user.password);
                if (!validateUser) {
                    res.status(400).send('User email or password is incorrect');

                } else {
                    const payload = {
                        userId: user._id,
                        email: user.email
                    }
                    const JWT_SCERET_KEY = 'kjgdbgkigbergbs';
                    jwt.sign(payload, JWT_SCERET_KEY, { expiresIn: 84600 }, async (err, token) => {
                        await Users.updateOne({ _id: user._id }, {
                            $set: { token }
                        })
                        user.save();
                        // next();
                        res.status(200).json({ user: { id: user._id, email: user.email, fullName: user.fullName }, token: token });
                    })
                    // res.status(200).json({user});
                }
            }
        }
    } catch (err) {
        console.log('error', err);
    }
})

app.post('/api/conversation', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        const newConversation = new Conversations({ members: [senderId, receiverId] });
        await newConversation.save();
        res.status(200).send('Conversation created successfully');
    } catch (error) {
        console.log('error', err);
    }
})

app.get('/api/conversation/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const conversations = await Conversations.find({ members: { $in: [userId] } });
        const conversationUserData = Promise.all(conversations.map(async (conversation) => {
            const receiverId = conversation.members.find((member) => member !== userId);
            const user = await Users.findById(receiverId);

            // const user = receiverId ? await Users.findById(receiverId) : null;
            return { user: { receiverId: user._id, email: user.email, fullName: user.fullName }, conversationId: conversation._id }
            console.log(conversationUserData);
        }))
        res.status(200).json(await conversationUserData);
    } catch (error) {
        console.log('error', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


// app.get('/api/conversation/:userId', async (req, res) => {
//     try {
//         const userId = req.params.userId;

//         const conversations = await Conversations.find({ members: { $in: [userId] } }).exec();
//         console.log(conversations);


//         if (conversations.length === 0) {
//             return res.status(404).json({ message: 'No conversations found for the provided userId' });
//         }

//         const conversationUserData = await Promise.all(conversations.map(async (conversation) => {
//             const receiverId = conversation.members.find((member) => member !== userId);
//             const user = receiverId ? await Users.findById(receiverId) : null;

//             if (!user) {
//                 console.log(`User not found for conversationId: ${conversation._id}`);
//                 return null; // or handle this case as needed
//             }

//             return { user: { email: user.email, fullName: user.fullName }, conversationId: conversation._id };
//         }));

//         const filteredData = conversationUserData.filter(data => data !== null);

//         res.status(200).json(filteredData);
//     } catch (error) {
//         console.log('error', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


app.post('/api/message', async (req, res) => {
    try {
        const { conversationId, senderId, message, receiverId = '' } = req.body;
        if (!senderId || !message) return res.status(400).send('Please fill all required fields');
        if (conversationId === 'new' && receiverId) {
            const newConversation = new Conversations({ members: [senderId, receiverId] });
            await newConversation.save();
            const newMessage = new Messages({ conversationId: newConversation._id, senderId, message });
            await newMessage.save();
            return res.status(200).send('Message sent successfully');
        }
        const newMessage = new Messages({ conversationId, senderId, message });
        await newMessage.save();
        res.status(200).send('Message sent successfully');
    } catch (error) {
        console.log('error', error);
    }
})


app.get('/api/message/:conversationId', async (req, res) => {
    try {
        const checkMessages = async (conversationId) => {
            const messages = await Messages.find({ conversationId });
            const messageUserData = Promise.all(messages.map(async (msg) => {
                const user = await Users.findById(msg.senderId);
                return { user: { id: user._id, email: user.email, fullName: user.fullName }, message: msg.message }
            }));
            res.status(200).json(await messageUserData);
        }

        const conversationId = req.params.conversationId;
        if (conversationId === 'new') {
            const checkConversation = await Conversations.find({ members: { $all: [req.query.senderId, req.query.receiverId] } })
            if (checkConversation.length > 0) {
                checkMessages(checkConversation[0]._id);
            } else {
                return res.status(200).json([]);
            }
        } else {
            checkMessages(conversationId);
        }
        // console.log(messageUserData);
    } catch (error) {
        console.log('error', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/users/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const users = await Users.find({ _id: { $ne: userId } });
        const userData = Promise.all(users.map(async (user) => {
            return { user: { email: user.email, fullName: user.fullName, receiverId: user._id } };
        }))
        res.status(200).json(await userData);
    } catch (error) {
        console.log('error', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


app.listen(port, (req, res) => {
    console.log(`Server is listening on port ${port}`);
})