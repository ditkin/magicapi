const ws_dep = require('ws')
const board = require('./board')

let possible_ids = [123, 456]

const generate_UUID = () => {
  const index = Math.floor(Math.random() * possible_ids.length)
  const id_array = possible_ids.splice(index, 1)
  return id_array[0]
}

const get_opponent_id = (ids, user_id) => {
  const user_index = ids.findIndex(id => id === user_id)
  return 1 - user_index
}

exports.start = () => {
  const is_ready = client => client.readyState === ws_dep.OPEN

  let ws = new ws_dep.Server({
    port: 2345,
    perfMessageDeflate: false,
  })

  ws.rooms = []
  ws.get_room_with_opponent = () => {
    const room_index = this.rooms.findIndex(
      room => room.ids.length === 1
    )
    return room_index
  }

  ws.seat_user = client => {
    this.rooms[client.room].users.push([client.id])
  }

  ws.start_game = room_index => {
    this.rooms[room_index].board = board.get_new()

    const { ids, board } = this.rooms[room_index]

    this.send_start(ids)
    const body = { ...board, type: 'GAME_UPDATED' }
    this.send_targeted(ids, JSON.stringify(body))
  }

  ws.create_room = id => {
    this.rooms.push({ ids: [id], board: null })
  }

  ws.update_room = (room_id, board) => {
    this.rooms[room_id].board = board
    const body = { ...board, type: 'GAME_UPDATED' }
    this.send_targeted(ids, JSON.stringify(body))
  }

  ws.send_start = ids => {
    this.clients
      .filter(client => ids.includes(client.id))
      .forEach(client => {
        const body = {
          type: 'GAME_START'
          opponent: {
            id: get_opponent_id(ids, client.id)
          }
        }
        client.send(JSON.stringify(body))
      })
  }

  ws.send_targeted = (ids, message) =>
    this.clients.forEach(client => {
      if (ids.includes(client.id) && is_ready(client)) {
        client.send(message)
      }
    })

  ws.on('connection', socket => {
    socket.on('message', event => {
      const data = JSON.parse(event)

      switch (data.type) {
        case 'JOIN_GAME':
          socket.id = generateUUID()

          const room_index = ws.get_room_with_opponent()
          if (room_index >= 0) { // room found
            socket.room = room_index
            ws.seat_user(socket)
            ws.start_game(room_index)
          }
          else { // room not found, creating
            ws.create_room(socket.id)
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