'use strict'

const deepStrictEqual = require('deep-strict-equal')
const rewind = require('@turf/rewind')

const noTransform = (...coords) => coords

const parseCoords = (s, opts = { transformCoords: noTransform, stride: 2 }, ctx = {} ) => {
	const stride = ctx.srsDimension || opts.stride || 2;

	const transformCoords = opts.transformCoords || noTransform;

	const coords = s.replace(/\s+/g, ' ').trim().split(' ')

	if (coords.length === 0 || (coords.length % stride) !== 0) {
		console.error(coords) // todo
		throw new Error(`invalid coordinates list (stride ${stride})`)
	}

	const points = []
	for (let i = 0; i < (coords.length - 1); i += stride) {
		const point = coords.slice(i, i + stride).map(parseFloat)
		points.push(transformCoords(...point))
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

const createChildContext = (_, opts, ctx) => {
	const srsDimensionAttribute = _.attributes && _.attributes.srsDimension
	if (srsDimensionAttribute) {
		const srsDimension = parseInt(srsDimensionAttribute)
		if (Number.isNaN(srsDimension) || srsDimension <= 0) throw new Error(`invalid srsDimension attribute value "${srsDimensionAttribute}", expected a positive integer`)

		const childCtx = Object.create(ctx)
		childCtx.srsDimension = srsDimension
		return childCtx;
	} else {
		return ctx;
	}
}

const parsePosList = (_, opts, ctx = {}) => {
	const coords = textOf(_)
	if (!coords) throw new Error('invalid gml:posList element')

	const childCtx = createChildContext(_, opts, ctx);
	return parseCoords(coords, opts, childCtx);
}

const parsePos = (_, opts, ctx = {}) => {
	const coords = textOf(_)
	if (!coords) throw new Error('invalid gml:pos element')

	const childCtx = createChildContext(_, opts, ctx);
	const points = parseCoords(coords, opts, childCtx)
	if (points.length !== 1) throw new Error('gml:pos must have 1 point')
	return points[0]
}

const parseLinearRingOrLineString = (_, opts, ctx = {}) => { // or a LineStringSegment
	let points = []

	const posList = findIn(_, 'gml:posList')
	if (posList) points = parsePosList(posList, opts, ctx)
	else {
		for (let c of _.children) {
			if (c.name === 'gml:Point') {
				const pos = findIn(c, 'gml:pos')
				if (!pos) continue
				points.push(parsePos(pos, opts, ctx))
			} else if (c.name === 'gml:pos') {
				points.push(parsePos(c, opts, ctx))
			}
		}
	}

	if (points.length === 0) throw new Error(_.name + ' must have > 0 points')
	return points
}

const parseCurveSegments = (_, opts, ctx = {}) => {
	let points = []

	for (let c of _.children) {
		if (c.name !== 'gml:LineStringSegment') continue
		const points2 = parseLinearRingOrLineString(c, opts, ctx)

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

const parseRing = (_, opts, ctx = {}) => {
	const points = []

	for (let c of _.children) {
		if (c.name !== 'gml:curveMember') continue
		let points2

		const lineString = findIn(c, 'gml:LineString')
		if (lineString) {
			points2 = parseLinearRingOrLineString(lineString, opts, ctx)
		} else {
			const segments = findIn(c, 'gml:Curve', 'gml:segments')
			if (!segments) throw new Error('invalid ' + c.name + ' element')

			points2 = parseCurveSegments(segments, opts, ctx)
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

const parseExteriorOrInterior = (_, opts, ctx = {}) => {
	const linearRing = findIn(_, 'gml:LinearRing')
	if (linearRing) {
		return parseLinearRingOrLineString(linearRing, opts, ctx)
	}

	const ring = findIn(_, 'gml:Ring')
	if (ring) return parseRing(ring, opts, ctx)

	throw new Error('invalid ' + _.name + ' element')
}

const parsePolygonOrRectangle = (_, opts, ctx = {}) => { // or PolygonPatch
	const exterior = findIn(_, 'gml:exterior')
	if (!exterior) throw new Error('invalid ' + _.name + ' element')

	const pointLists = [
		parseExteriorOrInterior(exterior, opts, ctx)
	]

	for (let c of _.children) {
		if (c.name !== 'gml:interior') continue
		pointLists.push(parseExteriorOrInterior(c, opts, ctx))
	}

	return pointLists
}

const parseSurface = (_, opts, ctx = {}) => {
	const patches = findIn(_, 'gml:patches')
	if (!patches) throw new Error('invalid ' + _.name + ' element')

	const polygons = []
	for (let c of patches.children) {
		if (c.name !== 'gml:PolygonPatch' && c.name !== 'gml:Rectangle') continue
		polygons.push(parsePolygonOrRectangle(c, opts, ctx))
	}

	if (polygons.length === 0) throw new Error(_.name + ' must have > 0 polygons')
	return polygons
}

const parseCompositeSurface = (_, opts, ctx = {}) => {
	const polygons = []
	for (let c of _.children) {
		if (c.name === 'gml:surfaceMember') {
			const c2 = c.children[0]
			if (c2.name === 'gml:Surface') {
				polygons.push(...parseSurface(c2, opts, ctx))
			} else if (c2.name === 'gml:Polygon') {
				polygons.push(parsePolygonOrRectangle(c2, opts, ctx))
			}
		}
	}

	if (polygons.length === 0) throw new Error(_.name + ' must have > 0 polygons')
	return polygons
}

const parseMultiSurface = (_, opts, ctx = {}) => {
	let el = _

	const surfaceMembers = findIn(_, 'gml:LinearRing')
	if (surfaceMembers) el = surfaceMembers

	const polygons = []
	for (let c of el.children) {
		if (c.name === 'gml:Surface') {
			const polygons2 = parseSurface(c, opts, ctx)
			polygons.push(...polygons2)
		} else if (c.name === 'gml:surfaceMember') {
			const c2 = c.children[0]
			if (c2.name === 'gml:CompositeSurface') {
				polygons.push(...parseCompositeSurface(c2, opts, ctx))
			} else if (c2.name === 'gml:Surface') {
				polygons.push(...parseSurface(c2, opts, ctx))
			} else if (c2.name === 'gml:Polygon') {
				polygons.push(parsePolygonOrRectangle(c2, opts, ctx))
			}
		}
	}

	if (polygons.length === 0) throw new Error(_.name + ' must have > 0 polygons')
	return polygons
}

const parse = (_, opts = { transformCoords: noTransform, stride: 2 }, ctx = {}) => {
	if (_.name === 'gml:Polygon' || _.name === 'gml:Rectangle') {
		return rewind({
			type: 'Polygon',
			coordinates: parsePolygonOrRectangle(_, opts, ctx)
		})
	} else if (_.name === 'gml:Surface') {
		return rewind({
			type: 'MultiPolygon',
			coordinates: parseSurface(_, opts, ctx)
		})
	} else if (_.name === 'gml:MultiSurface') {
		return rewind({
			type: 'MultiPolygon',
			coordinates: parseMultiSurface(_, opts, ctx)
		})
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
	parseCompositeSurface,
	parseMultiSurface
})
module.exports = parse
