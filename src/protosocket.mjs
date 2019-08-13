import * as Board from './Board.mjs'
import * as Room from './Room.mjs'
import * as Id from './Id.mjs'

export const setupSocket = (ws, appWithWs) => {
  debugger
  const is_ready = client =>
    client.readyState === ws_dep.OPEN

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

    const board = Board.getNew(ids)
    Room.set(room_index, { board })

    ws.send_start(ids)
    const body = { ...board, type: 'GAME_UPDATED' }
    ws.send_targeted(ids, JSON.stringify(body))
  }

  ws.send_start = function(ids) {
    ;[...appWithWs.clients]
      .filter(client => ids.includes(client.id))
      .forEach(client => {
        const body = {
          type: 'GAME_START',
          user: {
            id: client.id,
          },
          opponent: {
            id: Id.getOpponentId(ids, client.id),
          },
        }
        client.send(JSON.stringify(body))
      })
  }

  ws.send_targeted = (ids, message) =>
    [...appWithWs.clients]
      .filter(client => ids.includes(client.id))
      .forEach(client => {
        client.send(message)
      })

  ws.on('open', (event, ...args) => {
    debugger
    console.log('New connection!')
  })

  ws.on('message', msg => {
    debugger
    const data = JSON.parse(msg)

    switch (data.type) {
      case 'JOIN_GAME':
        ws.id = Id.generate()
        const room_index = Room.getWithOpponent()
        if (room_index >= 0) {
          // room found
          ws.room = room_index
          Room.seatUser(room_index, ws.id)
          ws.start_game(room_index)
        } else {
          // room not found, creating
          ws.create_room(ws.id)
          ws.room = Room.getLast()
        }

        break
      case 'SEND_GAME_UPDATE':
        const { room } = ws
        delete data.type
        ws.update_room(room, data)
    }
  })

  return ws
}
