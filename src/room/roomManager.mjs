const rooms = []

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
