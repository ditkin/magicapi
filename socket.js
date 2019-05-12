const ws_dep = require('ws')
const Board = require('./Board')
const Room = require('./Room')
const Id = require('./Id')

exports.start = () => {
  const is_ready = client =>
    client.readyState === ws_dep.OPEN

  let ws = new ws_dep.Server({
    port: 2345,
    perfMessageDeflate: false,
  })

  ws.create_room = id => {
    Room.create(id)
    const body = { type: 'WAITING_ROOM', id }
    ws.send_targeted([id], JSON.stringify(body))
  }

  ws.update_room = (room_id, board) => {
    Room.set(room_id, { board })
    const { ids } = Room.get(room_id)
    const body = { ...board, type: 'GAME_UPDATED' }
    ws.send_targeted(ids, JSON.stringify(body))
  }

  ws.start_game = room_index => {
    const { ids } = Room.get(room_index)

    const board = Board.get_new(ids)
    Room.set(room_index, { board })

    ws.send_start(ids)
    const body = { ...board, type: 'GAME_UPDATED' }
    ws.send_targeted(ids, JSON.stringify(body))
  }

  ws.send_start = function(ids) {
    ;[...this.clients]
      .filter(client => ids.includes(client.id))
      .forEach(client => {
        const body = {
          type: 'GAME_START',
          user: {
            id: client.id,
          },
          opponent: {
            id: Id.get_opponent_id(ids, client.id),
          },
        }
        client.send(JSON.stringify(body))
      })
  }

  ws.send_targeted = (ids, message) =>
    [...ws.clients]
      .filter(client => ids.includes(client.id))
      .forEach(client => {
        client.send(message)
      })

  ws.on('connection', socket => {
    socket.on('message', event => {
      const data = JSON.parse(event)

      switch (data.type) {
        case 'JOIN_GAME':
          socket.id = Id.generate()
          const room_index = Room.get_with_opponent()
          if (room_index >= 0) {
            // room found
            socket.room = room_index
            Room.seat_user(room_index, socket.id)
            ws.start_game(room_index)
          } else {
            // room not found, creating
            ws.create_room(socket.id)
            socket.room = Room.get_last()
          }

          break
        case 'SEND_GAME_UPDATE':
          const { room } = socket
          delete data.type
          ws.update_room(room, data)
      }
    })
  })

  return ws
}
