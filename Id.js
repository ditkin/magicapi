const user_ids = []

exports.generate = () => {
  const next_id = user_ids.length
  user_ids.push(next_id)
  return next_id
}

exports.get_opponent_id = (ids, user_id) => {
  return ids.find(id => id !== user_id)
}
