'use strict'

const path = require('path')
const fs = require('fs')
const xmlReader = require('xml-reader')
const {inspect} = require('util')
const parsePolygon = require('..')

const file = path.join(__dirname, 'polygon.gml')
const reader = fs.createReadStream(file, {encoding: 'utf8'})

const parser = xmlReader.create({stream: true})
reader.on('data', chunk => {
	parser.parse(chunk)
})

parser.once('tag:gml:Polygon', (data) => {
	const parsed = parsePolygon(data)
	console.log(inspect(parsed, {colors: true, depth: Infinity}))
})
