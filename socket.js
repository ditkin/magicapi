const ws_dep = require('ws')
const board_utils = require('./board')

let possible_ids = [123, 456, 789, 101, 102, 103]

const generate_UUID = () => {
  const index = Math.floor(
    Math.random() * possible_ids.length
  )
  const id_array = possible_ids.splice(index, 1)
  return id_array[0]
}

const get_opponent_id = (ids, user_id) => {
  return ids.find(id => id !== user_id)
}

exports.start = () => {
  const is_ready = client =>
    client.readyState === ws_dep.OPEN

  let ws = new ws_dep.Server({
    port: 2345,
    perfMessageDeflate: false,
  })

  ws.rooms = []
  ws.get_room_with_opponent = () => {
    const room_index = ws.rooms.findIndex(
      room => room.ids.length === 1
    )
    return room_index
  }

  ws.seat_user = client => {
    ws.rooms[client.room].ids.push(client.id)
  }

  ws.start_game = room_index => {
    const { ids } = ws.rooms[room_index]

    const game_board = board_utils.get_new(ids)
    ws.rooms[room_index].board = game_board

    ws.send_start(ids)
    const body = { ...game_board, type: 'GAME_UPDATED' }
    ws.send_targeted(ids, JSON.stringify(body))
  }

  ws.create_room = id => {
    ws.rooms.push({ ids: [id], board: null })
    const body = { type: 'WAITING_ROOM', id }
    ws.send_targeted([id], JSON.stringify(body))
  }

  ws.update_room = (room_id, board) => {
    ws.rooms[room_id].board = board
    const body = { ...board, type: 'GAME_UPDATED' }
    ws.send_targeted(ids, JSON.stringify(body))
  }

  ws.send_start = function(ids) {
    [...this.clients]
      .filter(client => ids.includes(client.id))
      .forEach(client => {
        const body = {
          type: 'GAME_START',
          user: {
            id: client.id,
          },
          opponent: {
            id: get_opponent_id(ids, client.id),
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
          socket.id = generate_UUID()

          const room_index = ws.get_room_with_opponent()
          if (room_index >= 0) {
            // room found
            socket.room = room_index
            ws.seat_user(socket)
            ws.start_game(room_index)
          } else {
            // room not found, creating
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
