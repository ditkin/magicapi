import immutable from 'immutable'
const { List, Record } = immutable

const defaults = {
  owner_id: null,
  name: 'Game room',
  uuid: null,
  max_capacity: 2,
  player_ids: List(),
  board: null,
}

export default class Room extends Record(defaults) {
  static from(json) {
    return new Room(json)
  }
}
