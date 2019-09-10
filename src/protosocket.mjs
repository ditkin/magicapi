import * as Board from './Board.mjs'
import * as roomManager from './room/roomManager.mjs'
import * as Id from './Id.mjs'
import Room from './room/Room.mjs'
import immutable from 'immutable'
const { List } = immutable

let _appWithWs

// TODO update board methods
function is_ready(client) {
  client.readyState === ws_dep.OPEN
}

function create_room(id) {
  roomManager.create(id)
  const body = { type: 'WAITING_ROOM', id }
  send_to_ids([id], JSON.stringify(body))
}

function update_room(room_id, board) {
  console.log(board)

  roomManager.set(room_id, { board })

  const { ids } = roomManager.get(room_id)
  const body = { ...board, type: 'GAME_UPDATED' }
  send_to_ids(ids, JSON.stringify(body))
}

function start_game(room_index) {
  const { ids } = roomManager.get(room_index)

  const board = Board.getNew(ids)
  roomManager.set(room_index, { board })

  send_start(ids)
  const body = { ...board, type: 'GAME_UPDATED' }
  send_to_ids(ids, JSON.stringify(body))
}

function send_start(ids) {
  const body = {
    type: 'GAME_START',
    user: {
      id: client.id,
    },
    opponent: {
      id: Id.getOpponentId(ids, client.id),
    },
  }
  const message = JSON.stringify(body)
  send_to_ids(ids, message)
}

function send_to_ids(ids, message) {
  ;[..._appWithWs.clients]
    .filter(client => ids.includes(client.id))
    .forEach(client => {
      client.send(message)
    })
}

function send_to_all(message) {
  ;[..._appWithWs.clients].forEach(client => {
    client.send(message)
  })
}

export const setupSocket = (client, appWithWs) => {
  _appWithWs = appWithWs
  client.on('message', msg => {
    const data = JSON.parse(msg)

    // switch (data.type) {
    //   case 'JOIN_GAME':
    //     client.id = Id.generate()
    //     const room_index = Room.getWithOpponent()
    //     if (room_index >= 0) {
    //       // room found
    //       client.room = room_index
    //       Room.seatUser(room_index, client.id)
    //       start_game(room_index)
    //     } else {
    //       // room not found, creating
    //       create_room(client.id)
    //       client.room = Room.getLast()
    //     }

    //     break
    //   case 'SEND_GAME_UPDATE':
    //     const { room } = client
    //     delete data.type
    //     update_room(room, data)
    // }

    // v2
    switch (data.type) {
      case 'REGISTER':
        client.id = Id.generate()
        const body = {
          type: 'REGISTERED',
          user: {
            id: client.id,
          },
          rooms: roomManager.get_all_as_json(),
        }
        client.send(JSON.stringify(body))
        break

      case 'CREATE_ROOM':
        const uuid = Id.generate({ room: true })
        client.room_id = uuid
        const newRoom = new Room({
          uuid,
          owner_id: client.id,
          player_ids: List([client.id]),
          name: data.name,
          max_capacity: data.max_capacity,
        })
        roomManager.create(newRoom)

        send_to_all(
          JSON.stringify({
            type: 'ROOM_CREATED',
            room: newRoom.toJS(),
          })
        )
        break

      case 'JOIN_ROOM':
        const room = roomManager.seat_user(
          data.uuid,
          client.id
        )
        if (!room) {
          const body = {
            type: 'FAILED_TO_JOIN_ROOM',
            info: 'ROOM_NOT_FOUND',
            id: data.uuid,
          }
          console.log(body)
          client.send(JSON.stringify(body))
          break
        }

        client.room = data.uuid

        if (room.max_capacity === room.player_ids.size) {
          start_game(room_index)
        } else {
          const body = {
            type: 'ROOM_JOINED',
            room: room.toJS(),
          }
          console.log(body)
          client.send(JSON.stringify(body))
        }
        break

      case 'SEND_GAME_UPDATE':
        delete data.type
        update_room(client.room, data)
    }
  })

  return ws
}
