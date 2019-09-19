import immutable from 'immutable'
const { List, Record, toJS } = immutable

// TODO use an immutable and do react-like state updates to overwrite
const rooms = []

// v2

const get_index = room_id =>
  rooms.findIndex(room => room.uuid === room_id)

export const get_all_as_json = () =>
  rooms.map(room => room.toJS())

export const create = room => rooms.push(room)

export const get = room_id =>
  rooms.find(room => room.uuid === room_id)

export const unseat_user = (room_id, client_id) => {
  const room_index = get_index(room_id)
  if (room_index === -1) {
    return
  }

  console.log('room ', { ...rooms[room_index] })
  rooms[room_index] = rooms[room_index].update(
    'player_ids',
    ids => ids.filterNot(id => id === client_id)
  )
}

export const seat_user = (room_id, client_id) => {
  const room_index = get_index(room_id)
  if (room_index === -1) {
    return
  }

  const room = get(room_index)
  console.log('room ', room)
  const updated_room = room.set(
    'player_ids',
    room.player_ids.push(client_id)
  )
  rooms[room_index] = updated_room
  return updated_room
}

export const set = (room_id, properties) => {
  const room_index = get_index(room_id)
  if (room_index === -1) {
    return
  }

  const room = get(room_id)
  const updated_room = room.merge(properties)
  rooms[room_index] = updated_room
  return updated_room
}

// v1
export const getLast = () => rooms.length - 1

export const getWithOpponent = () => {
  const room_index = rooms.findIndex(
    room => room.ids.length === 1
  )
  return room_index
}

// export const get = room_index => rooms[room_index]

// export const set = (room_index, properties) => {
//   if (!rooms[room_index]) {
//     rooms[room_index] = {}
//   }

//   Object.keys(properties).forEach(key => {
//     rooms[room_index][key] = properties[key]
//   })
// }

// export const create = id => {
//   const new_room = { ids: [id] }
//   const free_index = rooms.findIndex(room => !room)

//   if (free_index > -1) {
//     rooms[free_index] = new_room
//   } else {
//     rooms.push({ ids: [id] })
//   }
// }

export const seatUser = (room_index, user_id) => {
  console.log(`Seating ${user_id}`)
  rooms[room_index].ids.push(user_id)
}
