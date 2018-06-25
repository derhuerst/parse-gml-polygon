'use strict'

const xmlReader = require('xml-reader')
const {inspect} = require('util')
const parsePolygon = require('..')

const parser = xmlReader.create()
parser.once('tag:gml:Polygon', (data) => {
  const parsed = parsePolygon(data)
  console.log(inspect(parsed, {colors: true, depth: Infinity}))
})

parser.parse(`
<?xml version="1.0" encoding="UTF-8"?>
<gml:Polygon gml:id="some-id">
  <gml:exterior>
    <gml:LinearRing>
      <gml:posList>0 0 0 3 3 3 0 0</gml:posList>
    </gml:LinearRing>
  </gml:exterior>
  <gml:interior>
    <gml:LinearRing>
      <gml:posList>1 1 1 2 2 2 1 1</gml:posList>
    </gml:LinearRing>
  </gml:interior>
</gml:Polygon>
`)
