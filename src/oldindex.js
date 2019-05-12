const express = require('express')
const web_socket = require('./web_socket')

const body_parser = require('body-parser')
const cookie_parser = require('cookie-parser')
const session = require('express-session')
const connect_mongo = require('connect-mongo')
const mongo_store = connect_mongo(session)

const ws_dep = require('ws')

let ws = new ws_dep.Server({
  port: 2345,
  perfMessageDeflate: false,
})

const pry = require 'pryjs'

const app = express()


// Setup middleware
const json_parser = body_parser.json()

auth = (req, res, next) =>
  console.log "AUTH SESSION %j", req.session
  if req.session and req.session.user
    next()
  else
    res.sendStatus 401

ws.broadcast = (data) =>
  ws.clients.forEach (client) =>
    console.log "broadcasting to client: %j", client
    if client.readyState is ws_dep.OPEN
      client.send data

ws.room_cast = (db, room) =>
  talkers = db.collection 'talkers'
  all_talkers = talkers.find()
  eval pry.it

  ws.clients.forEach (client) =>
    unique_id = client.upgradeReq.headers['sec-websocket-key']
    talker = all_talkers.unique_id

const update_talker = (db, talker, room) => (
  talkers = db.collection('talkers')
  doc = { name: talker }
  if (room) doc.room = room

  talkers.update(doc, doc, { upsert: true })
)

const mongo_client = mongo.MongoClient;
mongo_client.connect('mongodb://localhost:27017/magic', (err, db) =>
  const store = new mongo_store({ db })

  const session_params = {
    resave: true,
    secret: 'majamcjaja',
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: false,
      maxAge: 900000000,
      secure: false,
    },
  }

  # Define middleware
  app.use(session(session_params))
  app.use(express.static('static'))

  app.post('/new-user', json_parser, (req, res) =>
    utils.handle_new_user(req, res, db)
  )

  app.post('/new-room', auth, json_parser, (req, res) =>
    utils.handle_new_room(req, res, db)
  )

  app.post('/login', json_parser, (req, res) =>
    utils.handle_login(req, res, db)
  )

  app.get('/logout', auth, (req, res) =>
    utils.handle_logout(req, res, db)
  )

  ws.on 'connection', (socket) =>
    update_talker db, socket.upgradeReq.headers['sec-websocket-key']

    socket.on 'message', (msg) =>
      data = JSON.parse msg
      if data.join_req
        update_talker db, socket.upgradeReq.headers['sec-websocket-key'],
          data.join_req
        message = JSON.stringify join: data.join_req
        socket.send message

      if data.room_msg
        ws.room_cast db, data.room, data.room_msg
      socket.send "Welcome #{data.user}"

  setInterval () =>
    rooms = db.collection 'rooms'
    rooms.find().toArray (err, coll) =>
      msg = JSON.stringify rooms: coll
      ws.broadcast msg
  , 5000

  app.listen 1234, () ->
    console.log "#{new Date} Server is listening on port 1234"



