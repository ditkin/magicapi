const pry = require('pryjs')
const  post_header = { 'Content-Type': 'text/plain' }
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

exports.handle_deck = (req, res, db) => {
  const { body: { user, pass } } = req
  const doc = { user, pass }
  if (!doc.user && !doc.pass)
    res.sendStatus(401)
  else
    _lookup_login_info(req, res, db, doc)
}

exports.handle_new_deck = (req, res, db) => {
  const { body: { name, set, cards }, session: { user } } = req
  eval(pry.it)
  const doc = { name, set, cards }

  const users = db.collection('decks')
  users.update(doc, doc, { upsert: true })

  exports.respond_post(res, doc.name)
}

exports.respond_post = (res, data) => {
  res.writeHead(200, post_header)
  res.end(data)
}


// New Deck

//# LOGOUT
//exports.handle_logout = (req, res) =>
  //req.session.destroy()
  //res.send 'logout success'
