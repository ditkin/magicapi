import pry from 'pryjs'

const post_text_header = { 'Content-Type': 'text/plain' }
const post_json_header = {
  'Content-Type': 'application/json',
}

const _lookup_login_info = (req, res, db, doc) => {
  const users = db.collection('users')
  users.findOne(doc, (err, item) => {
    if (!item) res.sendStatus(401)
    else {
      req.session.user = item.user
      res.send(item.user)
    }
  })
}

// LOGIN LOGIC
export const handle_login = (req, res, db) => {
  const {
    body: { user, pass },
  } = req
  const doc = { user, pass }
  if (!doc.user && !doc.pass) res.sendStatus(401)
  else _lookup_login_info(req, res, db, doc)
}

export const handle_new_deck = (req, res, db) => {
  const {
    body: { name, set, cards },
    session: { user },
  } = req

  const doc = { name, set, cards }
  const queryUserObject = { user }
  const operationObject = { $push: { decks: doc } }

  const users = db.collection('users')
  users.findOneAndUpdate(queryUserObject, operationObject)

  respond_post(res, name)
}

export const respond_post = (res, data) => {
  res.writeHead(200, post_text_header)

  res.end(data)
}

export const handle_show_decks = async function(
  req,
  res,
  db
) {
  const {
    session: { user },
  } = req

  const queryUserObject = { user }

  const users = db.collection('users')

  const cursor = await users.find(queryUserObject)
  const { decks } = await cursor.nextObject()

  if (!decks) res.sendStatus(401)

  const deckNames = decks.map(deck => deck.name)

  respond_post(res, JSON.stringify(deckNames))
}

// New Deck

//# LOGOUT
//export const handle_logout = (req, res) =>
//req.session.destroy()
//res.send 'logout success'
