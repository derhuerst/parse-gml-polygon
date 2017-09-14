'use strict'

const deepStrictEqual = require('deep-strict-equal')

const parseCoords = (s, transformCoords) => {
	const coords = s.split(' ')
	if (coords.length === 0 || (coords.length % 2) !== 0) {
		throw new Error('invalid coordinates list')
	}

	const points = []
	for (let i = 0; i < (coords.length - 1); i += 2) {
		const x = parseFloat(coords[i])
		const y = parseFloat(coords[i + 1])
		points.push(transformCoords(x, y))
	}

	return points
}

const textOf = (el) => {
	if (!el || !el.children) return null
	const c = el.children.find(c => c.type === 'text')
	return c && c.value || null
}

const findIn = (root, ...tags) => {
	let el = root
	for (let tag of tags) {
		if (!el.children) return null
		const child = el.children.find(c => c.name === tag)
		if (!child) return null
		el = child
	}
	return el
}

const parsePosList = (_, transformCoords) => {
	const coords = textOf(_)
	if (!coords) throw new Error('invalid gml:posList element')

	return parseCoords(coords, transformCoords)
}

const parsePos = (_, transformCoords) => {
	const coords = textOf(_)
	if (!coords) throw new Error('invalid gml:pos element')

	const points = parseCoords(coords, transformCoords)
	if (points.length !== 1) throw new Error('gml:pos must have 1 point')
	return points[0]
}

const parseLinearRingOrLineString = (_, transformCoords) => { // or a LineStringSegment
	let points = []

	const posList = findIn(_, 'gml:posList')
	if (posList) points = parsePosList(posList, transformCoords)
	else {
		for (let c of _.children) {
			if (c.name === 'gml:Point') {
				const pos = findIn(c, 'gml:pos')
				if (!pos) continue
				points.push(parsePos(pos, transformCoords))
			} else if (c.name === 'gml:pos') {
				points.push(parsePos(c, transformCoords))
			}
		}
	}

	if (points.length === 0) throw new Error(_.name + ' must have > 0 points')
	return points
}

const parseCurveSegments = (_, transformCoords) => {
	let points = []

	for (let c of _.children) {
		if (c.name !== 'gml:LineStringSegment') continue
		const points2 = parseLinearRingOrLineString(c, transformCoords)

		// remove overlapping
		const end = points[points.length - 1]
		const start = points2[0]
		if (end && start && deepStrictEqual(end, start)) points2.shift()

		points.push(...points2)
	}

	if (points.length === 0) {
		throw new Error('gml:Curve > gml:segments must have > 0 points')
	}
	return points
}

const parseRing = (_, transformCoords) => {
	const points = []

	for (let c of _.children) {
		if (c.name !== 'gml:curveMember') continue
		let points2

		const lineString = findIn(c, 'gml:LineString')
		if (lineString) {
			points2 = parseLinearRingOrLineString(lineString, transformCoords)
		} else {
			const segments = findIn(c, 'gml:Curve', 'gml:segments')
			if (!segments) throw new Error('invalid ' + c.name + ' element')

			points2 = parseCurveSegments(segments, transformCoords)
		}

		// remove overlapping
		const end = points[points.length - 1]
		const start = points2[0]
		if (end && start && deepStrictEqual(end, start)) points2.shift()

		points.push(...points2)
	}

	if (points.length < 4) throw new Error(_.name + ' must have >= 4 points')
	return points
}

const parseExteriorOrInterior = (_, transformCoords) => {
	const linearRing = findIn(_, 'gml:LinearRing')
	if (linearRing) {
		return parseLinearRingOrLineString(linearRing, transformCoords)
	}

	const ring = findIn(_, 'gml:Ring')
	if (ring) return parseRing(ring, transformCoords)

	throw new Error('invalid ' + _.name + ' element')
}

const parsePolygonOrRectangle = (_, transformCoords) => { // or PolygonPatch
	const exterior = findIn(_, 'gml:exterior')
	if (!exterior) throw new Error('invalid ' + _.name + ' element')

	const pointLists = [
		parseExteriorOrInterior(exterior, transformCoords)
	]

	for (let c of _.children) {
		if (c.name !== 'gml:interior') continue
		pointLists.push(parseExteriorOrInterior(c, transformCoords))
	}

	return pointLists
}

const parseSurface = (_, transformCoords) => {
	const patches = findIn(_, 'gml:patches')
	if (!patches) throw new Error('invalid ' + _.name + ' element')

	const polygons = []
	for (let c of patches.children) {
		if (c.name !== 'gml:PolygonPatch' && c.name !== 'gml:Rectangle') continue
		polygons.push(parsePolygonOrRectangle(c, transformCoords))
	}

	if (polygons.length === 0) throw new Error(_.name + ' must have > 0 polygons')
	return polygons
}

const parseMultiSurface = (_, transformCoords) => {
	let el = _

	const surfaceMembers = findIn(_, 'gml:LinearRing')
	if (surfaceMembers) el = surfaceMembers

	const polygons = []
	for (let c of el.children) {
		if (c.name === 'gml:Surface') {
			const polygons2 = parseSurface(c, transformCoords)
			polygons.push(...polygons2)
		} else if (c.name === 'gml:surfaceMember') {
			const surface = findIn(c, 'gml:Surface')
			const polygons2 = parseSurface(surface, transformCoords)
			polygons.push(...polygons2)
		}
	}

	if (polygons.length === 0) throw new Error(_.name + ' must have > 0 polygons')
	return polygons
}

const noTransform = (x, y) => [x, y]

const parse = (_, transformCoords = noTransform) => {
	if (_.name === 'gml:Polygon' || _.name === 'gml:Rectangle') {
		return {
			type: 'Polygon',
			coordinates: parsePolygonOrRectangle(_, transformCoords)
		}
	} else if (_.name === 'gml:Surface') {
		return {
			type: 'MultiPolygon',
			coordinates: parseSurface(_, transformCoords)
		}
	} else if (_.name === 'gml:MultiSurface') {
		return {
			type: 'MultiPolygon',
			coordinates: parseMultiSurface(_, transformCoords)
		}
	}
	return null // todo
}

Object.assign(parse, {
	parsePosList,
	parsePos,
	parseLinearRingOrLineString,
	parseRing,
	parseExteriorOrInterior,
	parsePolygonOrRectangle,
	parseSurface,
	parseMultiSurface
})
module.exports = parse
