// TODO:	Option to focus on staircases, paths, roads
var urlLoadedWithHash = window.location.hash; // Need to check this before mapbox initializes the map

mapboxgl.accessToken = 'pk.eyJ1IjoiYW5keXN6eSIsImEiOiJjajNobHFlOGUwMGNvMzJvenZpNW9jcXZ1In0._TLRxUmkf7pOTP4hgziZSg'; // replace this with your access token
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/andyszy/ckchz70872kak1jmhvr407dfr',
	hash: true
	// center: [-122.443983, 37.755773],
	// zoom: 12.81
});

map.addControl(
	new MapboxGeocoder({
		accessToken: mapboxgl.accessToken,
		mapboxgl: mapboxgl
	}), 'top-left'
);
map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

var geolocateControl = new mapboxgl.GeolocateControl({
		positionOptions: {
			enableHighAccuracy: true
		},
		trackUserLocation: false,
		showUserLocation: false
	});
map.addControl(geolocateControl, 'bottom-right');



var peakLayerNames = ['peaks-overpass', 'peaks-mapbox']; // "Exported from Overpass " seems to take awhile for names to update after changing in Mapbox Studio 
var streetLayerNames = ['road-simple copy', 'road-label-simple', 'bridge-simple', 'bite-size-roads']; 
var pathLayerNames = ['paths-highlighted', 'steps-highlighted', 'Paths and Steps Label']; 
var poiLayerNames = ['poi-label', 'airport-label']; 

function getElevationAtLngLat(lnglat) {
	var point = map.project(lnglat.coordinates);
	var allFeatures = map.queryRenderedFeatures(point, {
		layers: ['contour']
	});
   var elevations = [];
   // For each returned feature, add elevation data to the elevations array
   for (i = 0; i < allFeatures.length; i++) {
     elevations.push(allFeatures[i].properties.ele);
   }
   // console.log(elevations);
   // In the elevations array, find the largest value
   var highestElevation = Math.max(...elevations);
	return highestElevation;
}

var clickLng;
var clickLat;
map.on('click', function(e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: peakLayerNames
	});
	if (!features.length) {
		return;
	}

	var feature = features[0];
	var html = '<h3>' + feature.properties.name + '</h3>';
	var ele = feature.properties['ele'] || feature.properties['elevation_m'];
	if (ele)
		html += '<p>' + ele + ' m (' + Number(3.28084 * ele).toFixed(0) + ' ft)</p>';
	if (feature.properties['gnis:feature_id'])
		html += '<p><a href="https://geonames.usgs.gov/apex/f?p=GNISPQ:3:::NO::P3_FID:' + feature.properties['gnis:feature_id'] + '">USGS</a></p>';
	https: //geonames.usgs.gov/apex/f?p=GNISPQ:3:::NO::P3_FID:236709
		var popup = new mapboxgl.Popup({
				offset: [0, -15]
			})
			.setLngLat(feature.geometry.coordinates)
			.setHTML(html)
			.addTo(map);
});

// enumerate ids of the layers
var toggleableLayers = [{
	id: peakLayerNames.join(';'),
	displayName: "Peaks",
	default: true
}, {
	id: 'settlement-subdivision-label',
	displayName: "Neighborhoods",
	default: true
}, {
	id: 'mapbox-terrain-rgb',
	displayName: "Shading",
	default: true
}, {
	id: streetLayerNames.join(';'),
	displayName: "Streets",
	default: true
}, {
	id: pathLayerNames.join(';'),
	displayName: "Paths",
	default: true
}, {
	id: poiLayerNames.join(';'),
	displayName: "Points of Interest",
	default: true
},];

// set up the corresponding toggle button for each layer
for (var i = 0; i < toggleableLayers.length; i++) {
	var layer = toggleableLayers[i];
	var checkboxDiv = document.createElement('div');
	var checkbox = document.createElement('input');
	checkbox.type="checkbox";
	checkbox.checked = layer.default;
	checkbox.name = layer.id;
	checkbox.id = layer.id;
	var label = document.createElement('label');
	label.textContent = layer.displayName;
	label.htmlFor = layer.id;

	checkbox.onclick = function(e) {
		var layersForCheckbox = this.id.split(';');
		for (var j = 0; j < layersForCheckbox.length; j++) {
			var layerName = layersForCheckbox[j];
			// toggle layer visibility by changing the layout object's visibility property
			var visibility = map.getLayoutProperty(layerName, 'visibility');
			if (visibility == "none") {
				this.checked = true;
				map.setLayoutProperty(layerName, 'visibility', 'visible');
			} else {
				map.setLayoutProperty(layerName, 'visibility', 'none');
				this.checked = false;
			}
		}
	};

	checkboxDiv.appendChild(checkbox);
	checkboxDiv.appendChild(label);
	
	var layers = document.getElementById('mapOptions');
	layers.appendChild(checkboxDiv);
}

function getRoadColor(pct) {
	var h = 45 + Math.pow(pct, 2) * (-16); // red shift comes only at the extreme elevations
	var s = 68 + pct * 9;
	var l = 85 + pct * (-20);
	var lDelta = +5; /* no more than 15, otherwise clamping happens */
	if (lDelta) {
		l = Math.min(100,Math.max(0, l + lDelta));
	}
	var a = "1";
	var roadColor = "hsla(" + Number(h).toFixed(0) + ", " + Number(s).toFixed(0) + "%, " + Number(l).toFixed(0) + "%, " + a + ")";
	return roadColor;
}

// Pct should be a value between [0.0,1.0] representing normalized elevation
function getColorFromRamp(pct, lDelta) {
	var h = 45 + Math.pow(pct, 2) * (-16); // red shift comes only at the extreme elevations
	var s = 68 + pct * 9;
	var l = 85 + pct * (-20);
	if (lDelta) {
		l = Math.min(100,Math.max(0, l + lDelta));
	}
	return "hsl(" + Number(h).toFixed(0) + ", " + Number(s).toFixed(0) + "%, " + Number(l).toFixed(0) + "%)";
}

var previousMin = -1;
var previousMax = -1;
function refreshDisplay() {

	console.log("refreshDisplay()"); // DEBUG
	//Calculate min and max elevation from the contours in the viewport:

	contourFeatures = map.queryRenderedFeatures({
		layers: ['contour']
	});
	
	refreshWaterDisplay();
	chewRoads();
	refreshContourDisplay(); 
}

var waterFeatures;
function refreshWaterDisplay() {
	waterFeatures = map.queryRenderedFeatures({
		layers: ['water']
	});
	if (waterFeatures.length) {
		for (var i = 0; i < waterFeatures.length; i++) {
			var feature = waterFeatures[i];
			// console.log(feature);
		}
	}
}



var roadFeatures;
var r;  // FOR DEBUGGING ONLY

var biteSizeRoadData = {
	"type": "FeatureCollection",
	"features": []
};

function initRoadsLayer() {
	map.addSource('bite-size-roads', { 
		type: 'geojson',
		generateId: true,
		data: biteSizeRoadData 
	});
	map.addLayer({
		'id': 'bite-size-roads',
		'type': 'line',
		'source': 'bite-size-roads',
		'paint': {
			'line-width': ROADS_LINE_WIDTH,
			'line-opacity': ROADS_LINE_OPACITY,
			'line-color': ROADS_LINE_COLOR
		}
	}, 'road-simple copy');
}

// TODO: for efficiency, don't chew all roads on every refresh, only the ones that are new?

function chewRoads() {
	roadFeatures = map.queryRenderedFeatures({
		layers: ['road-simple copy', 'bridge-simple']
	});
	biteSizeRoadData.features = [];
	r = roadFeatures[0]; // FOR DEBUGGING ONLY
	if (roadFeatures.length) {
		for (var i = 0; i < roadFeatures.length; i++) {
			var subroads = turf.lineChunk(roadFeatures[i], 0.05); // 50 meter chunks. TODO: should be dynamic based on zoom level, for efficiency
			for (var j = 0; j < subroads.features.length; j++) {
				subroads.features[j].properties = roadFeatures[i].properties;
				var lnglat = turf.center(subroads.features[j]).geometry;
				var ele = getElevationAtLngLat(lnglat);
				if (ele == -Infinity) {
					console.log(ele);
				}
				subroads.features[j].properties.ele = ele;
				biteSizeRoadData.features.push(subroads.features[j]);
			}
		}
	}

	map.getSource('bite-size-roads').setData(biteSizeRoadData);

}
var bsr;  // FOR DEBUGGING ONLY

function computeRoadElevations() {
	// Need to re-query the map for these features, so they have the correct mapbox-generated ID's attached
	biteSizeRoadFeatures = map.queryRenderedFeatures({
		layers: ['bite-size-roads']
	}); // TODO: figure out why this is coming back empty :(
	
	console.log("biteSizeRoadFeatures.length = " + biteSizeRoadFeatures.length);
	bsr = biteSizeRoadFeatures[0]; // FOR DEBUGGING ONLY
	for (var i = 0; i < biteSizeRoadFeatures.length; i++) {
		var f = biteSizeRoadFeatures[i];
		var lnglat = turf.center(f).geometry;
		var ele = getElevationAtLngLat(lnglat); // TODO: reuse contours for efficiency

		map.setFeatureState(
		{ source: 'bite-size-roads', id: f.id },
		{ ele: ele }
		);
	}
}

var contourFeatures;
function refreshContourDisplay() {

	// console.log(features)

	// TODO: Find a way to filter out contours that aren't actually visible in the viewport. This is challenging because some contours are within the viewport but entirely occluded by higher-elevation contours. These should be ignored for purposes of coloring
	
	if (contourFeatures.length) {
		var min = Number.MAX_SAFE_INTEGER;
		var max = Number.MIN_SAFE_INTEGER;
		for (var i = 0; i < contourFeatures.length; i++) {
			var ele = contourFeatures[i].properties.ele;
			if (ele < min)
				min = ele;
			if (ele > max)
				max = ele;
		}

		if (min < 0) min = 0; // Don't allow minimum elevations below sea level

		// if either min or max has changed, redraw
		if (min != previousMin || max != previousMax) {
			paintContours(min, max);
			previousMin = min;
			previousMax = max;
		}
	} else {
		paintContours(0, 250); // initialize with reasonable SF values. TODO(andys) find a less hacky way

	}
}

var numSteps = 8;

var scale = document.getElementById('scale');
var colorElements = Array();
for (var i = 0; i < numSteps; i++) {
	var color = document.createElement('div');
	scale.appendChild(color);
	colorElements.push(color);
	color.style.width = Number(100/numSteps)+"%";
}

var elevationSteps;
var displayIncrement = 10; /* round to nearest 10 meters before displaying, to match actual resolution of contour data. TODO(andys) make this based on actual data rather than hard-coded? */

// TODO: alternate idea, hardcode multiples of 10,20,50,100,250,500,1000 etc to be allowable increments, and skip some of the fancy logarithmic business?

function nearestPowerOfTwo(aSize) {
	return Math.pow( 2, Math.ceil( Math.log( aSize ) / Math.log( 2 ) ) );
}

// Rounds x to the nearest multiple of y
function roundToNearest(x,y)
{
    return Math.ceil(x/y)*y;
}

function paintContours(min, max) {
	var span = max - min;

	elevationSteps = Array();
	
	// // Handle case where we need a zero contour:
 // 	if (min < displayIncrement) {
 // 		elevationSteps.push(Number(0));
 // 	}
	

	var logmin = Math.log10(min/displayIncrement);
	if (logmin < 0 || isNaN(logmin)) 
		logmin = 0;
	var logmax = Math.log10(max/displayIncrement);
	if (logmax < 0  || isNaN(logmin))
		logmax = 0;
	var logspan = logmax-logmin;
	var logincrement = nearestPowerOfTwo(logspan/numSteps);
	
	logmin = roundToNearest(logmin, logincrement);
	if (logmin < 0 || isNaN(logmin)) 
		logmin = 0;
	
	// console.log('{' + logmin + ','+ logmax +'}')
	for (var i = logmin; i < logmax; i += logincrement) {
		var ele = displayIncrement*Math.ceil(10**i);
		if (elevationSteps[elevationSteps.length - 1] == ele) {
			// This is redundant with the previous step; don't add it.
		} else {
			elevationSteps.push(ele);
		}
	}

	// elevationSteps = [0, 50, 100, 200, 250];
	// console.log(elevationSteps);

	var fillColorProperty = ["step", ["get", "ele"],
		"hsla(45, 100%, 100%,0%)" /* rest of mapbox property to be filled in below */
	]; 
	var lineColorProperty = ["step", ["get", "ele"],
		"hsl(45, 100%, 100%)" /* rest of mapbox property to be filled in below */
	]; 
	var labelColorProperty = ["step", ["get", "ele"],
		"hsl(45, 100%, 100%)" /* rest of mapbox property to be filled in below */
	]; 
	var haloColorProperty = ["step", ["get", "ele"],
		"hsl(45, 100%, 100%)" /* rest of mapbox property to be filled in below */
	]; 
	var roadColorProperty = ["step", ["get", "ele"],
		"hsla(45, 100%, 100%, 100%)" /* rest of mapbox property to be filled in below */
	]; 
	for (var i = 0; i < numSteps; i++) {
		colorElements[i].style.display = 'none';
	}
	
	map.setFilter('contour-label', [
	  "match",
	  ["get", "ele"],
	  elevationSteps,
	  true,
	  false
	]);
	
	for (var i = 0; i < elevationSteps.length; i++) {
		var ele = elevationSteps[i];
		var fillColor = getColorFromRamp(i / (elevationSteps.length-1));
		var lineColor = getColorFromRamp((i+1) / (elevationSteps.length-1)); // Contour line uses the color from the next elevation up
		var labelColor = getColorFromRamp((i) / (elevationSteps.length-1), -20);
		var haloColor = getColorFromRamp((i+1) / (elevationSteps.length-1), +20);
		var roadColor = getRoadColor((i) / (elevationSteps.length-1));	
		
		fillColorProperty.push(ele, fillColor);
		lineColorProperty.push(ele, lineColor);
		labelColorProperty.push(ele, labelColor);
		haloColorProperty.push(ele, haloColor);
		roadColorProperty.push(ele, roadColor);

		colorElements[i].style.backgroundColor = fillColor;
		var eleForDisplay = ele - (ele % displayIncrement); // round this down to the nearest multiple of the allowable increment

		colorElements[i].textContent = Number(eleForDisplay).toFixed(0);
		colorElements[i].style.display = '';
		
	}
	if (elevationSteps.length > 0) {
		map.setPaintProperty('contour', 'fill-color', fillColorProperty);
		map.setPaintProperty('contour lines', 'line-color', lineColorProperty);
		map.setPaintProperty('contour-label', 'text-color', labelColorProperty);
		map.setPaintProperty('contour-label', 'text-halo-color', haloColorProperty);
		map.setPaintProperty('road-simple copy', 'line-opacity', 0);
		map.setPaintProperty('bridge-simple', 'line-opacity', 0);		
		map.setPaintProperty('bite-size-roads', 'line-color', roadColorProperty);
	}
}
map.on('load', function() {
	initRoadsLayer();
	
	for (var i = 0; i < toggleableLayers.length; i++) {
		var layer = toggleableLayers[i];
		var mapboxLayerNames = layer.id.split(';');
		for (var j = 0; j < mapboxLayerNames.length; j++) {
			if (map.getLayer(mapboxLayerNames[j])) {
				map.setLayoutProperty(mapboxLayerNames[j], 'visibility', layer.default ? 'visible' : 'none');
			}
		}
	}
	if (urlLoadedWithHash) {
		// The URL hash already contains a lat/long. Do nothing
	} else {
		// Request location permission and go to the user's current location
		geolocateControl.trigger(); 
	}
	refreshDisplay();
});


map.on('moveend', function() { // Could also do on "move" but it'd be less performant
	refreshDisplay();
});

$('#legendIcon').click(function() {
  $('#legend').toggleClass( "showLegend" );
});

$('#about').click(function() {
	window.location.href= '../#onion-map';
});


$(function() {      
    let isMobile = window.matchMedia("only screen and (max-width: 760px)").matches;
	 $('#legend').toggleClass( "showLegend" , false);// !isMobile
 });
 
 
var ROADS_LINE_WIDTH = [
	"interpolate", ["exponential", 1.5],
	["zoom"],
	5, [
		"match", ["get", "class"],
		[
			"motorway",
			"trunk",
			"primary"
		],
		0.375, ["secondary", "tertiary"],
		0.05,
		0
	],
	13, [
		"match", ["get", "class"],
		[
			"motorway",
			"trunk",
			"primary"
		],
		2, ["secondary", "tertiary"],
		1.25, [
			"motorway_link",
			"trunk_link",
			"primary_link",
			"street",
			"street_limited"
		],
		0.5,
		0.25
	],
	15, [
		"match", ["get", "class"],
		[
			"motorway",
			"trunk",
			"primary"
		],
		6, ["secondary", "tertiary"],
		3.75, [
			"motorway_link",
			"trunk_link",
			"primary_link",
			"street",
			"street_limited"
		],
		1.5,
		0.75
	],
	18, [
		"match", ["get", "class"],
		[
			"motorway",
			"trunk",
			"primary"
		],
		16, ["secondary", "tertiary"],
		13, [
			"motorway_link",
			"trunk_link",
			"primary_link",
			"street",
			"street_limited"
		],
		9,
		5
	]
];

var ROADS_LINE_OPACITY = [
	"interpolate", ["linear"],
	["zoom"],
	13,
	0,
	15,
	1
];

var ROADS_LINE_COLOR = "hsla(232, 2%, 100%, 0)";