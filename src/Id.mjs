const user_ids = []

export const generate = () => {
  const next_id = user_ids.length
  user_ids.push(next_id)
  return next_id
}

export const getOpponentId = (ids, user_id) => {
  return ids.find(id => id !== user_id)
}
