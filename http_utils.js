const pry = require('pryjs')
const post_text_header = { 'Content-Type': 'text/plain' }
const post_json_header = { 'Content-Type': 'application/json' }

// LOGIN LOGIC
exports.handle_login = (req, res, db) => {
  const { body: { user, pass } } = req
  const doc = { user, pass }
  if (!doc.user && !doc.pass)
    res.sendStatus(401)
  else
    _lookup_login_info(req, res, db, doc)
}

_lookup_login_info = (req, res, db, doc) => {
  const users = db.collection('users')
  users.findOne(doc, (err, item) => {
    if (!item)
      res.sendStatus(401)
    else {
      req.session.user = item.user
      res.send(item.user)
    }
  })
}

exports.handle_new_deck = (req, res, db) => {
  const { body: { name, set, cards }, session: { user } } = req

  const doc = { name, set, cards }
  const queryUserObject = { user }
  const operationObject = { $push: { decks: doc } }

  const users = db.collection('users')
  users.findOneAndUpdate(queryUserObject, operationObject)

  exports.respond_post(res, name)
}

exports.handle_show_decks = async function (req, res, db) {
  const { session: { user } } = req

  const queryUserObject = { user }

  const users = db.collection('users')

  const cursor = await users.find(queryUserObject);
  const { decks } = await cursor.nextObject();

  if (!decks)
    res.sendStatus(401)

  const deckNames = decks.map(deck => deck.name)

  exports.respond_post(res, JSON.stringify(deckNames))
}

exports.respond_post = (res, data) => {
  res.writeHead(200, post_text_header)

  res.end(data)
}


// New Deck

//# LOGOUT
//exports.handle_logout = (req, res) =>
  //req.session.destroy()
  //res.send 'logout success'
