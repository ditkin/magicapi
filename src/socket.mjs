import * as Board from './Board.mjs'
import * as roomManager from './room/roomManager.mjs'
import * as Id from './Id.mjs'
import Room from './room/Room.mjs'
import immutable from 'immutable'
const { List } = immutable

let _appWithWs

function register(client) {
  console.log(`registering client ${client.id}`)

  client.id = Id.generate()
  const body = {
    type: 'REGISTERED',
    rooms: roomManager.get_all_as_json(),
    user: {
      id: client.id,
    },
  }
  client.send(JSON.stringify(body))
}

function create_room(client, data) {
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
}

function join_room(client, data) {
  const room = roomManager.seat_user(data.uuid, client.id)
  if (!room) {
    const body = {
      type: 'FAILED_TO_JOIN_ROOM',
      info: 'ROOM_NOT_FOUND',
      id: data.uuid,
    }
    client.send(JSON.stringify(body))
    return
  }

  client.room_id = data.uuid
  // confirm the joiner joined this room
  const body = {
    type: 'ROOM_JOINED',
    room: room.toJS(),
  }
  client.send(JSON.stringify(body))

  if (room.max_players === room.player_ids.size) {
    start_game(data.uuid, client.id)
  } else {
    send_to_all(
      JSON.stringify({
        type: 'ROOMS_UPDATED',
        rooms: roomManager.get_all_as_json(),
      })
    )
  }
}

function update_room(room_id, board) {
  roomManager.set(room_id, { board })

  const { player_ids } = roomManager.get(room_id)
  const body = { ...board, type: 'GAME_UPDATED' }
  send_to_ids(player_ids, JSON.stringify(body))
}

function start_game(room_id, joiner_id) {
  const { player_ids } = roomManager.get(room_id)

  const board = Board.getNew(player_ids)
  roomManager.set(room_id, { board })

  send_start(player_ids, joiner_id)
  const body = { ...board, type: 'GAME_UPDATED' }
  send_to_ids(player_ids, JSON.stringify(body))
}

function send_start(ids, joiner_id) {
  // tell the users which player joined last
  const owner_id = Id.getOpponentId(ids, joiner_id)
  const joinerStartBody = {
    type: 'GAME_START',
    opponentId: owner_id,
  }
  const joinerStartMessage = JSON.stringify(joinerStartBody)
  send_to_ids([joiner_id], joinerStartMessage)

  const ownerStartBody = {
    type: 'GAME_START',
    opponentId: joiner_id,
  }
  const ownerStartMessage = JSON.stringify(ownerStartBody)
  send_to_ids([owner_id], ownerStartMessage)
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

function leave_room(client) {
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
}

function send_chat(client, data) {
  const { room_id } = client
  const { chat, player_ids } = roomManager.get(room_id)
  const appendedChat = chat.push(data.chat)
  roomManager.set(client.room_id, { chat: appendedChat })

  const body = {
    chat: appendedChat.toArray(),
    type: 'CHAT_SENT',
  }
  send_to_ids(player_ids, JSON.stringify(body))
}

export const setupSocket = (client, appWithWs, req) => {
  _appWithWs = appWithWs
  client.on('message', msg => {
    const data = JSON.parse(msg)
    console.log(data)
    switch (data.type) {
      case 'REGISTER':
        register(client)
        break

      case 'CREATE_ROOM':
        create_room(client, data)
        break

      case 'JOIN_ROOM':
        join_room(client, data)
        break

      case 'LEAVE_ROOM':
        leave_room(client)
        break

      case 'SEND_CHAT':
        console.log(data)
        send_chat(client, data)
        break

      case 'SEND_GAME_UPDATE':
        delete data.type
        update_room(client.room_id, data)
    }
  })

  return ws
}
