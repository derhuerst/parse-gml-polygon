'use strict'

const test = require('tape')
const h = require('hyper-xml')

const parse = require('.')

const coords = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]

const simpleExterior = {
	type: 'Polygon',
	coordinates: [coords]
}

// see http://erouault.blogspot.de/2014/04/gml-madness.html

// todo: SimplePolygon > posList
// todo: SimpleRectangle > posList

test('Polygon > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', [
				h('gml:posList', [coords.map(c => c.join(' ')).join(' ')])
			])
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Polygon > exterior > LinearRing > pos*5', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', coords.map((c) => {
				return h('gml:pos', [c.join(' ')])
			}))
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Polygon > exterior > LinearRing > Point*5 > pos', (t) => {
	const p = h('gml:Polygon', {'gml:id': 'some-id'}, [
		h('gml:exterior', [
			h('gml:LinearRing', coords.map((c, i) => {
				return h('gml:Point', {'gml:id': i + ''}, [
					h('gml:pos', [c.join(' ')])
				])
			}))
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

test('Rectangle > exterior > LinearRing > posList', (t) => {
	const p = h('gml:Rectangle', [
		h('gml:exterior', [
			h('gml:LinearRing', [
				h('gml:posList', [coords.map(c => c.join(' ')).join(' ')])
			])
		])
	])

	t.deepEqual(parse(p), simpleExterior)
	t.end()
})

// todo: Polygon > exterior > Ring > curveMember > LineString > posList
// todo: Polygon > exterior > Ring > curveMember > LineString > pos*5
// todo: Polygon > exterior > Ring > curveMember*4 > LineString > posList
// todo: Polygon > exterior > Ring > curveMember > Curve > segments > LineStringSegment > posList
// todo: Polygon > exterior > Ring > curveMember > Curve > segments > LineStringSegment*4 > posList
// todo: Polygon > exterior > Ring > curveMember > Curve > segments > LineStringSegment*4 > pointProperty*2 > Point > pos
// todo: Polygon > exterior > Ring > curveMember > CompositeCurve > curveMember > LineString > posList
// todo: Polygon > exterior > Ring > curveMember*2 > OrientableCurve > baseCurve > LineString > pos*3
// todo: Surface > patches > PolygonPatch > exterior > LinearRingh > posList
// todo: Surface > patches > Rectangle > exterior > LinearRing > posList
// todo: CompositeSurface > surfaceMember > Surface > patches > …
