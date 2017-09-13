'use strict'

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
	const coords = textOf(pos)
	if (!coords) throw new Error('invalid gml:pos element')

	const points = parseCoords(coords)
	if (points.length !== 1) throw new Error('gml:pos must have 1 point')
	return points
}

const parseLinearRing = (_) => {
	const posList = _.children.find(c => c.name === 'gml:posList')
	// todo: return type: Polygon ?
	if (posList) return parsePosList(posList)

	const points = []
	for (let c of children) {
		if (c.name === 'gml:Point') {
			const pos = child.children.find(c => c.name === 'pos')
			if (!pos) continue
			points.push(parsePos(pos)[0])
		} else if (c.name === 'gml:pos') {
			points.push(parsePos(c)[0])
		}
	}

	if (points.length === 0) throw new Error('gml:LinearRing must have >= points')
	return points
}

const parsePolygon = (_) => {
	const exterior = _.children.find(c => c.name === 'gml:exterior')
	if (!exterior) {
		throw new Error('gml:Polygon without gml:exterior is not supported')
	}

	const linearRing = exterior.children.find(c => c.name === 'gml:LinearRing')
	if (!linearRing) {
		throw new Error('gml:exterior without gml:LinearRing is not supported')
	}

	return {type: 'Polygon', coordinates: parseLinearRing(linearRing)}
}

module.exports = {
	parsePosList,
	parsePos,
	parseLinearRing,
	parsePolygon
}
