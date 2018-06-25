'use strict'

const path = require('path')
const fs = require('fs')
const xmlReader = require('xml-reader')
const sink = require('get-stream')
const {inspect} = require('util')
const parsePolygon = require('..')

const file = path.join(__dirname, 'polygon.gml')
const reader = fs.createReadStream(file, {encoding: 'utf8'})

// todo: make this streaming as soon as pladaria/xml-reader#9
const parser = xmlReader.create({
  // stream: true
})
sink(reader)
	.then(data => parser.parse(data))
	.catch((err) => {
	  console.error(err)
	  process.exit(1)
	})

parser.once('tag:gml:Polygon', (data) => {
  const parsed = parsePolygon(data)
  console.log(inspect(parsed, {colors: true, depth: Infinity}))
})
