/* 
  Sources 
  https://www.youtube.com/watch?v=Ud5xKCYQTjM
  https://www.youtube.com/watch?v=s2aXBBzazAw
*/
var commandsEnum = require('./commandEnum.js');

// // Express server
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const bodyparser = require("body-parser");
// const jwt = require("jsonwebtoken");
const session = require("express-session");
// const PORT = process.env.PORT;
const PORT = process.env.PORT || 4000;

// const INDEX = "/index.html";
const app = express();

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "secret35264",
    saveUninitialized: true,
    resave: false,
    cookie: {
      httpOnly: true,
      maxAge: 3600000,
    },
  })
);

//const users = [{name:"aa",password:"aa"}];
const users = [];

app.post("/login", async (req, res) => {
  console.log(req.body.username);
  const user = users.find((user) => user.username === req.body.username);
  if (user == null) {
    return res.status(400).send("Utente non trovato");
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.send({
        token: "test_token_123",
        username: user.username,
        roles: [1, 4],
      });
    } else {
      res.send("Not logged");
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/users", (req, res) => {
  res.json(users);
});

app.post("/users", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const user = { username: req.body.username, password: hashedPassword };
    users.push(user);
    res.send("Utente inserito in array");
  } catch (error) {}
});
app.use('/cmd', (req, res) => {
  const cmd = commandsEnum[req.query.command] !== undefined ? commandsEnum[req.query.command] : 'black';
  console.log('cmd:' + cmd);
  res.send(cmd);

});

// app.use((_req, res) => res.sendFile(INDEX, { root: __dirname }));

const server = app.listen(PORT, () =>
  console.log(`Listening on port ${PORT}..`)
);

/* 
  Web Socket server
  Application: Chat and Tic Tac Toe
*/

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("reqTurn", (data) => {
    const room = JSON.parse(data).room;
    io.to(room).emit("playerTurn", data);
  });
  socket.on("create", (room) => {
    socket.join(room);
    console.log("Create: " + room);
    console.log("Joined: " + room);
  });
  socket.on("join", (room) => {
    socket.join(room);
    io.to(room).emit("opponent_joined");
    console.log("Joined: " + room);
  });
  socket.on("reqRestart", (data) => {
    const room = JSON.parse(data).room;
    console.log("Game restart");
    console.log("Room: " + room);
    io.to(room).emit("restart");
  });
});

console.log("The WebSocket server is running on port 4000");