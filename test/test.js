const mock = require('./mock.json')
const assert = require('assert')
const Hbase = require('../src/index.js')
const hbase = new Hbase({
  host: 'hbase',
  port: 9090,
  prefix: 'prefix',
  logLevel: 3
})

describe('hbase client', function() {

  it('should get table names', function() {
    return hbase.getTables()
  })

  it('should delete existing tables', function() {
    this.timeout(5000)

    function deleteTable(name) {
      return hbase.disableTable(name)
      .then(() => {
        return hbase.deleteTable(name)
      })
    }

    return hbase.getTables()
    .then(tables => {
      const list = []

      tables.forEach(name => {
        list.push(deleteTable(name))
      })

      return Promise.all(list)
    })
  })

  it('should create a tables', function() {
    return hbase.createTable({
      table: 'test',
      columnFamilies: ['f', 'd']
    })
    .then(() => {
      return hbase.createTable({
        table: 'test2',
        columnFamilies: ['f', 'd'],
        prefix: 'alt'
      })
    })
  })

  it('should save a single row', function() {
    return hbase.putRow(mock.row)
  })

  it('should save a single row with column families', function() {
    return hbase.putRow(mock.rowWithColumnFamilies)
  })

  it('should save a multiple rows', function() {
    return hbase.putRows(mock.rows)
  })

  it('should get a row by key', function() {
    return hbase.getRow({
      table: mock.row.table,
      rowkey: mock.row.rowkey
    })
    .then(row => {
      assert.strictEqual(row.rowkey, mock.row.rowkey)
      assert.deepEqual(row.columns, mock.row.columns)
    })
  })

  it('should get a row by key with column families', function() {
    return hbase.getRow({
      table: mock.rowWithColumnFamilies.table,
      rowkey: mock.rowWithColumnFamilies.rowkey,
      includeFamilies: true
    })
    .then(row => {
      assert.strictEqual(row.rowkey, mock.rowWithColumnFamilies.rowkey)
      assert.deepEqual(row.columns, mock.rowWithColumnFamilies.columns)
    })
  })

  it('should get a rows by scan', function() {
    this.timeout(5000)
    return hbase.getScan({
      table: 'test',
      startRow: 'A',
      stopRow: 'Z'
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 4)
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|1')
    })
  })

  it('should get a rows by scan with limit', function() {
    this.timeout(5000)
    return hbase.getScan({
      table: 'test',
      startRow: 'A',
      stopRow: 'Z',
      limit: 2
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 2)
      assert.strictEqual(resp.marker, 'ROW|3')
    })
  })

  it('should get a rows by scan with marker', function() {
    this.timeout(5000)
    return hbase.getScan({
      table: 'test',
      startRow: 'A',
      stopRow: 'Z',
      limit: 1,
      marker: 'ROW|3'
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 1)
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|3')
      assert.strictEqual(resp.marker, 'ROW|4')
    })
  })

  it('should get a rows by scan', function() {
    this.timeout(5000)
    return hbase.getScan({
      table: 'test',
      startRow: 'A',
      stopRow: 'Z',
      descending: true
    }).then(resp => {
      assert.strictEqual(resp.rows.length, 4)
      assert.strictEqual(resp.rows[0].rowkey, 'ROW|4')
    })
  })

  it('should delete a column', function() {
    this.timeout(5000)
    return hbase.deleteColumn({
      table: 'test',
      rowkey: 'ROW|1',
      column: 'd:foo'
    })
  })

  it('should delete columns', function() {
    this.timeout(5000)
    return hbase.deleteColumns({
      table: 'test',
      rowkey: mock.rowWithColumnFamilies.rowkey,
      columns: Object.keys(mock.rowWithColumnFamilies.columns)
    })
  })

  it('should delete a row', function() {
    this.timeout(5000)
    return hbase.deleteRow({
      table: 'test',
      rowkey: 'ROW|1'
    })
  })

  it('should delete rows', function() {
    this.timeout(5000)
    return hbase.deleteRows({
      table: 'test',
      rowkeys: ['ROW|2', 'ROW|3']
    })
  })
})
