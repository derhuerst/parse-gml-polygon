'use strict'

const h = require('hyper-xml')
const parsePolygon = require('..')

const el = h('gml:Polygon', {'gml:id': 'some-id'}, [
	h('gml:exterior', [
		// triangle of 0|0 0|3 3|3
		h('gml:LinearRing', [
			h('gml:posList', ['0 0 0 3 3 3 0 0'])
		])
	]),
	h('gml:interior', [
		// triangle of 1|1 1|2 2|2
		h('gml:LinearRing', [
			h('gml:posList', ['1 1 1 2 2 2 1 1'])
		])
	])
])
console.log(parsePolygon(el))
