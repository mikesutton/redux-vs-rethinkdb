'use strict'

function initStore() {
  const r = require('rethinkdb')
  const dbOptions = { host: 'localhost', port: 28015 }
  return r.connect(dbOptions)
    .then(conn => {
      console.log('connected')
      const db = r.db('test')

      return db.tableList().run(conn)
        .then(tables => {
          if (tables.indexOf('state') !== -1) {
            console.log('deleting existing table state')
            return db.tableDrop('state').run(conn)
          }
        })
        .then(() => {
          return db.tableCreate('state').run(conn)
            .then(() => console.log('created state table'))
        })
        .then(() => {
          console.log('returning db objects')
          return {
            r: r,
            conn: conn,
            db: db,
            table: r.db('test').table('state')
          }
        })
    })
    .then(info => {
      console.log('got info', Object.keys(info))
      return info
    })
}

function counter(rethinkState, action) {
  switch (action.type) {
  case 'INCREMENT':
    console.log('returning increment')
    return rethinkState.table.get(1).update({
      state: rethinkState.r.row('state').add(1)
    }).run(rethinkState.conn).then(() => rethinkState)
  case 'DECREMENT':
    console.log('returning decrement')
    return rethinkState.table.get(1).update({
      state: rethinkState.r.row('state').add(-1)
    }).run(rethinkState.conn).then(() => rethinkState)
  default:
    // init on default
    console.log('inserting default state')
    return rethinkState.table.insert({
      id: 1,
      state: 0
    }).run(rethinkState.conn).then(() => rethinkState)
  }
}

initStore()
  .then(state => {
    console.log('rethink state table insert', typeof state.table.insert)
    return state
  })
  .then(rethinkState => counter(rethinkState, {}))
  .then(rethinkState => counter(rethinkState, { type: 'INCREMENT' }))
  .then(rethinkState => counter(rethinkState, { type: 'INCREMENT' }))
  .then(rethinkState => counter(rethinkState, { type: 'DECREMENT' }))
  .done()
