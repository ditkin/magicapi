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

function start_game(room_id, client_id) {
  const { player_ids } = roomManager.get(room_id)

  const board = Board.getNew(player_ids)
  roomManager.set(room_id, { board })

  send_start(player_ids, client_id)
  const body = { ...board, type: 'GAME_UPDATED' }
  send_to_ids(player_ids, JSON.stringify(body))
}

function send_start(ids, client_id) {
  const body = {
    type: 'GAME_START',
    opponent: {
      id: Id.getOpponentId(ids, client_id),
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
    console.log(client.id)
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
        console.log(data)
        const uuid = Id.generate({ room: true })
        client.room_id = uuid
        const newRoom = new Room({
          uuid,
          owner_id: client.id,
          player_ids: List([client.id]),
          name: data.name,
          max_players: data.max_players,
        })
        roomManager.create(newRoom)

        client.send(
          JSON.stringify({
            type: 'ROOM_JOINED',
            room: newRoom.toJS(),
          })
        )
        send_to_all(
          JSON.stringify({
            type: 'ROOMS_UPDATED',
            rooms: roomManager.get_all_as_json(),
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
          client.send(JSON.stringify(body))
          break
        }

        client.room_id = data.uuid
        if (room.max_players === room.player_ids.size) {
          start_game(data.uuid, client.id)
        } else {
          const body = {
            type: 'ROOM_JOINED',
            room: room.toJS(),
          }
          client.send(JSON.stringify(body))
          send_to_all(
            JSON.stringify({
              type: 'ROOMS_UPDATED',
              rooms: roomManager.get_all_as_json(),
            })
          )
        }
        break

      case 'LEAVE_ROOM':
        roomManager.unseat_user(client.room_id, client.id)
        client.room_id = undefined
        client.send(
          JSON.stringify({
            type: 'ROOM_LEFT',
          })
        )
        send_to_all(
          JSON.stringify({
            type: 'ROOMS_UPDATED',
            rooms: roomManager.get_all_as_json(),
          })
        )
        break

      case 'SEND_GAME_UPDATE':
        delete data.type
        update_room(client.room_id, data)
    }
  })

  return ws
}
