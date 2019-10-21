const user_ids = []

const room_ids = []

export const generate = ({ room = false } = {}) => {
  const set_of_ids = room ? room_ids : user_ids
  const next_id = set_of_ids.length
  set_of_ids.push(next_id)
  return next_id
}

export const getOpponentId = (ids, user_id) => {
  return ids.find(id => id !== user_id)
}
