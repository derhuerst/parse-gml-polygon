'use strict'

const test = require('tape')
const h = require('hyper-xml')

const parse = require('.')

const coordsA = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]
const coordsB = [[2, 2], [2, 4], [4, 4], [4, 2], [2, 2]]

const simpleExterior = {
	type: 'Polygon',
	coordinates: [coordsA]
}
const multiExterior = {
	type: 'MultiPolygon',
	coordinates: [[coordsA], [coordsB]]
}

const posList = (coords) => {
	return h('gml:posList', [coords.map(c => c.join(' ')).join(' ')])
}
const pos5 = (coords) => {
	return coords.map((c) => {
		return h('gml:pos', [c.join(' ')])
	})
}
const point5 = (coords) => {
	return coords.map((c, i) => {
		return h('gml:Point', {'gml:id': i + ''}, [
			h('gml:pos', [c.join(' ')])
		])
	})
}

// see http://erouault.blogspot.de/2014/04/gml-madness.html

// todo: SimplePolygon > posList
// todo: SimpleRectangle > posList

test('Polygon > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [posList(coordsA)])
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Polygon > exterior > LinearRing > pos*5', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', pos5(coordsA))
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Polygon > exterior > LinearRing > Point*5 > pos', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', point5(coordsA))
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Rectangle > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Rectangle', [
		h('gml:exterior', [
			h('gml:LinearRing', [posList(coordsA)])
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember > LineString > posList', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA)])
				])
			])
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember > LineString > pos*5', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:LineString', pos5(coordsA))
				])
			])
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember*3 > LineString > posList', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA.slice(0, 2))])
				]),
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA.slice(1, 3))])
				]),
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA.slice(2, 4))])
				]),
				h('gml:curveMember', [
					h('gml:LineString', [posList(coordsA.slice(3))])
				])
			])
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember*2 > Curve > segments > LineStringSegment > posList', (t) => {
	const seg1 = h('gml:LineStringSegment', [posList(coordsA.slice(0, 3))])
	const seg2 = h('gml:LineStringSegment', [posList(coordsA.slice(2))])

	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:Curve', [
						h('gml:segments', [seg1])
					])
				]),
				h('gml:curveMember', [
					h('gml:Curve', [
						h('gml:segments', [seg2])
					])
				])
			])
		])
	])
	// console.error(require('util').inspect(p, {depth: Infinity}))

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Polygon > exterior > Ring > curveMember > Curve > segments > LineStringSegment*2 > posList', (t) => {
	const seg1 = h('gml:LineStringSegment', [posList(coordsA.slice(0, 3))])
	const seg2 = h('gml:LineStringSegment', [posList(coordsA.slice(2))])

	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:Ring', [
				h('gml:curveMember', [
					h('gml:Curve', [
						h('gml:segments', [seg1, seg2])
					])
				])
			])
		])
	])
	// console.error(require('util').inspect(p, {depth: Infinity}))

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Surface > patches > PolygonPatch > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Surface', {'gml:id': 'some-id'}, [
		h('gml:patches', [
			h('gml:PolygonPatch', {'gml:id': 'a'}, [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsA)])
				])
			]),
			h('gml:PolygonPatch', {'gml:id': 'b'}, [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsB)])
				])
			])
		])
	])

	t.deepEqual(parse(p), multiExterior)
	t.end()
})

test('Surface > patches > Rectangle > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Surface', {'gml:id': 'some-id'}, [
		h('gml:patches', [
			h('gml:Rectangle', {'gml:id': 'a'}, [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsA)])
				])
			]),
			h('gml:Rectangle', {'gml:id': 'b'}, [
				h('gml:exterior', [
					h('gml:LinearRing', [posList(coordsB)])
				])
			])
		])
	])

	t.deepEqual(parse(p), multiExterior)
	t.end()
})

// todo: Polygon > exterior > Ring > curveMember > Curve > segments > LineStringSegment*4 > pointProperty*2 > Point > pos
// todo: Polygon > exterior > Ring > curveMember > CompositeCurve > curveMember > LineString > posList
// todo: Polygon > exterior > Ring > curveMember*2 > OrientableCurve > baseCurve > LineString > pos*3
// todo: CompositeSurface > surfaceMember > Surface > patches > …
