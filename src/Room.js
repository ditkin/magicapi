const { List, Record } = require('immutable')

const rooms = []

exports.get_last = () => rooms.length - 1

exports.get_with_opponent = () => {
  const room_index = rooms.findIndex(
    room => room.ids.length === 1
  )
  return room_index
}

exports.get = room_index => rooms[room_index]

exports.set = (room_index, properties) => {
  if (!rooms[room_index]) {
    rooms[room_index] = {}
  }

  Object.keys(properties).forEach(key => {
    rooms[room_index][key] = properties[key]
  })
}

exports.create = id => {
  const new_room = { ids: [id] }
  const free_index = rooms.findIndex(room => !room)

  if (free_index > -1) {
    rooms[free_index] = new_room
  } else {
    rooms.push({ ids: [id] })
  }
}

exports.seat_user = (room_index, user_id) => {
  rooms[room_index].ids.push(user_id)
}
