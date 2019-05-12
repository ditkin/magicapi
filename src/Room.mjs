import immutable from 'immutable'
const { List, Record } = immutable

const rooms = []

export const getLast = () => rooms.length - 1

export const getWithOpponent = () => {
  const room_index = rooms.findIndex(
    room => room.ids.length === 1
  )
  return room_index
}

export const get = room_index => rooms[room_index]

export const set = (room_index, properties) => {
  if (!rooms[room_index]) {
    rooms[room_index] = {}
  }

  Object.keys(properties).forEach(key => {
    rooms[room_index][key] = properties[key]
  })
}

export const create = id => {
  const new_room = { ids: [id] }
  const free_index = rooms.findIndex(room => !room)

  if (free_index > -1) {
    rooms[free_index] = new_room
  } else {
    rooms.push({ ids: [id] })
  }
}

export const seatUser = (room_index, user_id) => {
  rooms[room_index].ids.push(user_id)
}
