# parse-gml-polygon

**Convert a [GML](https://en.wikipedia.org/wiki/Geography_Markup_Language) `Polygon` into a [GeoJSON](http://geojson.org) geometry.** Accepts the format of [`xml-reader`](https://www.npmjs.com/package/xml-reader) (with the `preserveMarkup` flag) as input. Works with a subset of [GML 3.3](https://portal.opengeospatial.org/files/?artifact_id=46568).

**Parsing GML is a nightmare. This module tries to parse most of the mentioned ways to encode a polygon.** I don't intend to cover all of them though. To quote [the wonderful *GML madness* article by Even Rouault](http://erouault.blogspot.de/2014/04/gml-madness.html):

> But, you may have noticed that the child of a `CompositeCurve` is a `curveMember`, which is also the parent of the `CompositeCurve`. So we may put a `CompositeCurve` inside a `CompositeCurve`.

> […] or maybe you prefer to use `gml:surfaceMembers` (with a final `s`) instead of a `gml:surfaceMember` […]

> To conclude, we should mention that the authors of the GML specification have admitted that encoding polygons was a bit too complicated.

[![npm version](https://img.shields.io/npm/v/parse-gml-polygon.svg)](https://www.npmjs.com/package/parse-gml-polygon)
[![build status](https://img.shields.io/travis/derhuerst/parse-gml-polygon.svg)](https://travis-ci.org/derhuerst/parse-gml-polygon)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/parse-gml-polygon.svg)
[![chat on gitter](https://badges.gitter.im/derhuerst.svg)](https://gitter.im/derhuerst)
[![support me on Patreon](https://img.shields.io/badge/support%20me-on%20patreon-fa7664.svg)](https://patreon.com/derhuerst)


## Installing

```shell
npm install parse-gml-polygon
```


## Example

```js
const h = require('hyper-xml')
const parse = require('parse-gml-polygon')

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

const geometry = parse(el)
console.log(geometry)
```

```js
{
	type: 'Polygon',
	coordinates: [
		[ // exterior/outer shape
			[0, 0],
			[0, 3],
			[3, 3],
			[0, 0]
		],
		[ // interior/inner shape
			[1, 1],
			[1, 2],
			[2, 2],
			[1, 1]
		]
	]
}
```


## Usage

This library consumes a tree structure corresponding to XML. [`xml-reader`](https://www.npmjs.com/package/xml-reader) parses XML into these structures. With [`hyper-xml`](https://npmjs.com/package/hyper-xml), you can create them manually.

Look at these code examples to understand how to use `parse-gml-polygon`:

- from an XML/GML string: [`example/xml-string.js`](example/xml-string.js)
- creating a tree manually: [`example/hyper-xml.js`](example/hyper-xml.js)


## API

```js
parseGmlPolygon(tree, transformCoords = noTransform, stride = 2) => GeoJSON
```

- You may optionally pass in a `transformCoords` function, e.g. to translate them into WGS84. The default transform is `(x, y) => [x, y]`.
- `stride` specifies the number of values that each point in the polygon has. A `stride` of `3` would correspond to a polygon in a 3D coordinate system.


## Unsupported encodings

- `<gml:pointProperty xlink:href="#some-point-id"/>`
- `gml:coordinates`, which is deprecated
- see `todo`s in [the tests](test.js)


## Contributing

If you have a question or have difficulties using `parse-gml-polygon`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, refer to [the issues page](https://github.com/derhuerst/parse-gml-polygon/issues).
