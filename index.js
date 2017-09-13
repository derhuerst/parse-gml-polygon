'use strict'

const deepStrictEqual = require('deep-strict-equal')

const parseCoords = (s) => {
	const coords = s.split(' ')
	if (coords.length === 0 || (coords.length % 2) !== 0) {
		throw new Error('invalid coordinates list')
	}

	const points = []
	for (let i = 0; i < (coords.length - 1); i += 2) {
		// todo: transform coordinates
		points.push([
			parseFloat(coords[i]), // x
			parseFloat(coords[i + 1]) // y
		])
	}

	return points
}

const textOf = (el) => {
	if (!el || !el.children) return null
	const c = el.children.find(c => c.type === 'text')
	return c && c.value || null
}

const parsePosList = (_) => {
	const coords = textOf(_)
	if (!coords) throw new Error('invalid gml:posList element')

	return parseCoords(coords)
}

const parsePos = (_) => {
	const coords = textOf(_)
	if (!coords) throw new Error('invalid gml:pos element')

	const points = parseCoords(coords)
	if (points.length !== 1) throw new Error('gml:pos must have 1 point')
	return points
}

const parseLinearRingOrLineString = (_) => {
	let points = []

	const posList = _.children.find(c => c.name === 'gml:posList')
	if (posList) points = parsePosList(posList)
	else {
		for (let c of _.children) {
			if (c.name === 'gml:Point') {
				const pos = c.children.find(c => c.name === 'gml:pos')
				if (!pos) continue
				points.push(parsePos(pos)[0])
			} else if (c.name === 'gml:pos') {
				points.push(parsePos(c)[0])
			}
		}
	}

	if (points.length === 0) throw new Error(_.name + ' must have > 0 points')
	return points
}

const parseRing = (_) => {
	const points = []

	for (let c of _.children) {
		if (c.name !== 'gml:curveMember') continue

		const lineString = c.children.find(c => c.name === 'gml:LineString')
		if (!lineString) {
			throw new Error(c.name + ' without gml:LineString is not supported')
		}

		const points2 = parseLinearRingOrLineString(lineString)

		// remove overlapping
		const end = points[points.length - 1]
		const start = points2[0]
		if (end && start && deepStrictEqual(end, start)) points2.shift()

		points.push(...points2)
	}

	if (points.length === 0) throw new Error('gml:Ring must have > 0 points')
	return points
}

const parsePolygonOrRectangle = (_) => {
	const exterior = _.children.find(c => c.name === 'gml:exterior')
	if (!exterior) {
		throw new Error(_.name + ' without gml:exterior is not supported')
	}

	let points = []

	const linearRing = exterior.children.find(c => c.name === 'gml:LinearRing')
	if (linearRing) {
		points = parseLinearRingOrLineString(linearRing)
	} else {
		const ring = exterior.children.find(c => c.name === 'gml:Ring')
		if (ring) {
			points = parseRing(ring)
		} else throw new Error('invalid gml:exterior element')
	}

	return {type: 'Polygon', coordinates: [points]}
}

module.exports = {
	parsePosList,
	parsePos,
	parseLinearRingOrLineString,
	parseRing,
	parsePolygonOrRectangle
}
