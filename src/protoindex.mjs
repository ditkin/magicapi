import express from 'express'
import session from 'express-session'
import ws from 'ws'
import body_parser from 'body-parser'
import cookie_parser from 'cookie-parser'

// import mongo from 'mongodb'
// import connect_mongo from 'connect-mongo'
// import mongo_store from session

import * as utils from './http_utils.mjs'
import { startSocketServer } from './socket.mjs'

const server = express()
const PORT = process.env.PORT || 1234

// Setup middleware
const json_parser = body_parser.json()

const auth = (req, res, next) => {
  console.log(`AUTH SESSION ${req.session}`)

  if (req.session && req.session.user) next()
  else res.sendStatus(401)
}

// const mongo_client = mongo.MongoClient;

// mongo_client.connect('mongodb://localhost:27017/magic', (err, db) => {
//   const store = new mongo_store({ db })

const session_params = {
  resave: true,
  secret: 'majamcjaja',
  saveUninitialized: false,
  //store,
  cookie: {
    httpOnly: false,
    maxAge: 900000000,
    secure: false,
  },
}

// Define middleware
server.use(session(session_params))

// Enable CORS
server.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Origin',
    'chrome-extension://kdjokbdmplcfbigkcjekknnfboidokfo'
  )
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})

server.post('/login', json_parser, (req, res, db) => {
  console.log('Logging In')
  utils.handle_login(req, res, db)
})

server.post('/deck', json_parser, (req, res, db) => {
  console.log('Creating Deck')
  utils.handle_new_deck(req, res, db)
})

server.get('/decks', json_parser, (req, res, db) => {
  console.log('Showing Decks')
  utils.handle_show_decks(req, res, db)
})

const wss = new ws.Server({ server })

wss.on('connection', socket => {
  console.log('Client connected')
  socket.on('close', () =>
    console.log('Client disconnected')
  )
})

server.listen(PORT, () =>
  console.log(
    `${new Date()} Server is listening on port ${PORT}`
  )
)

//   socket.on('message', event => {
//     const data = JSON.parse(event)

//     switch (data.type) {
//       case 'JOIN_GAME':
//         socket.id = Id.generate()
//         const room_index = Room.getWithOpponent()
//         if (room_index >= 0) {
//           // room found
//           socket.room = room_index
//           Room.seatUser(room_index, socket.id)
//           ws.start_game(room_index)
//         } else {
//           // room not found, creating
//           ws.create_room(socket.id)
//           socket.room = Room.getLast()
//         }

//         break
//       case 'SEND_GAME_UPDATE':
//         const { room } = socket
//         delete data.type
//         ws.update_room(room, data)
//     }
//   })
// })
// startSocketServer(server)
