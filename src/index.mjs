import express from 'express'
import session from 'express-session'
import ws from 'ws'
import body_parser from 'body-parser'
import cookie_parser from 'cookie-parser'
import empowerWithSocket from 'express-ws'
// import mongo from 'mongodb'
// import connect_mongo from 'connect-mongo'
// import mongo_store from session

import * as utils from './http_utils.mjs'
import { setupSocket } from './socket.mjs'

const app = express()
app.use(cookie_parser())
const appWithWs = empowerWithSocket(app)

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
app.use(session(session_params))

// Enable CORS
app.use((req, res, next) => {
  console.log(req.hostname)
  // enable for local dev
  if (req.hostname.includes('localhost')) {
    res.header('Access-Control-Allow-Origin', '*')
    return next()
  }

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

app.get('/', json_parser, (req, res, db) => {
  console.log('healthcheck')
  const cookie = req.cookies.cookieName
  if (cookie) {
    console.log('cookie exists', cookie)
  } else {
    var randomNumber = Math.random().toString()
    res.cookie('cookieName', randomNumber, {
      expires: new Date(Date.now() + 900000),
      secure: false,
      httpOnly: false,
      sameSite: 'none',
      // domain: 'localhost',
    })
    console.log('cookie created successfully')
  }
  res.writeHead(200)
  res.end('healthy')
})

app.post('/login', json_parser, (req, res, db) => {
  console.log('Logging In')
  const cookie = req.cookies.name
  if (cookie) {
    console.log('cookie exists', cookie)
  } else {
    res.cookie('name', req.body.name, {
      expires: new Date(Date.now() + 900000),
      httpOnly: false,
      sameSite: 'none',
    })
    console.log('cookie created successfully')
  }
})

app.post('/deck', json_parser, (req, res, db) => {
  console.log('Creating Deck')
  utils.handle_new_deck(req, res, db)
})

app.get('/decks', json_parser, (req, res, db) => {
  console.log('Showing Decks')
  utils.handle_show_decks(req, res, db)
})

app.ws('/', (ws, req) => {
  console.log('websocket: cookie: ', req.cookie)
  setupSocket(ws, appWithWs.getWss(), req)
})

app.listen(PORT, () =>
  console.log(
    `${new Date()} Server is listening on port ${PORT}`
  )
)
