const express = require('express')
const session = require('express-session')

const body_parser = require('body-parser')
const cookie_parser = require('cookie-parser')

const mongo = require('mongodb')
const connect_mongo = require('connect-mongo')
const mongo_store = connect_mongo(session)

const utils = require('./http_utils')
const pry = require('pryjs')
const ws_dep = require('ws')

let ws = new ws_dep.Server({
  port: 2345,
  perfMessageDeflate: false,
})

ws.sendTargeted = (ids, body) =>
  console.log(ids)
  ws.clients.forEach(client => {
    console.log(client)
    if (
      ids.includes(client.id)
      && client.readyState === ws_dep.OPEN
    ) {
      client.send(body)
    }
  })

const app = express()

// Setup middleware
const json_parser = body_parser.json()

const auth = (req, res, next) => {
  console.log(`AUTH SESSION ${req.session}`)

  if (req.session && req.session.user)
    next()
  else
    res.sendStatus(401)
}

const mongo_client = mongo.MongoClient;

mongo_client.connect('mongodb://localhost:27017/magic', (err, db) => {
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

  // Define middleware
  app.use(session(session_params))

  // Enable CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "chrome-extension://kdjokbdmplcfbigkcjekknnfboidokfo")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    res.header("Access-Control-Allow-Credentials", "true")
    next()
  })

  app.post('/login', json_parser, (req, res) => {
    console.log('Logging In')
    utils.handle_login(req, res, db)
  })

  app.post('/deck', json_parser, (req, res) => {
    console.log('Creating Deck')
    utils.handle_new_deck(req, res, db)
  })

  app.get('/decks', json_parser, (req, res) => {
    console.log('Showing Decks')
    utils.handle_show_decks(req, res, db)
  })

  ws.on('connection', socket => {
    debugger
    socket.on('message', event => {
      debugger
      const data = JSON.parse(event)
      switch (data.type) {
        case 'SEND_GAME_UPDATE':
          const ids = data.body.players.map(player => player.id)
          ws.sendTargeted(ids, JSON.stringify(data.players))
      }
    })
  })

  app.listen(1234, () =>
    console.log(`${new Date} Server is listening on port 1234`)
  )
})

