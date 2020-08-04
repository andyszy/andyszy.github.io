mapboxgl.accessToken = 'pk.eyJ1IjoiYW5keXN6eSIsImEiOiJjajNobHFlOGUwMGNvMzJvenZpNW9jcXZ1In0._TLRxUmkf7pOTP4hgziZSg'; // replace this with your access token
var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/andyszy/ckchz70872kak1jmhvr407dfr',
	center: [-122.443983, 37.755773],
	zoom: 12.81
});

map.addControl(
	new MapboxGeocoder({
		accessToken: mapboxgl.accessToken,
		mapboxgl: mapboxgl
	})
);

var peakLayerName = 'peaks-overpass'; // "Exported from Overpass " seems to take awhile for names to update after changing in Mapbox Studio 
map.on('click', function(e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: [peakLayerName]
	});

	if (!features.length) {
		return;
	}

	var feature = features[0];
	var html = '<h3>' + feature.properties.name + '</h3>';
	if (feature.properties['ele'])
		html += '<p>' + feature.properties.ele + ' m (' + Number(3.28084 * feature.properties.ele).toFixed(0) + ' ft)</p>';
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
	id: peakLayerName,
	displayName: "Peaks"
}, {
	id: 'settlement-subdivision-label',
	displayName: "Neighborhoods"
}];

// set up the corresponding toggle button for each layer
for (var i = 0; i < toggleableLayers.length; i++) {
	var layer = toggleableLayers[i];
	var link = document.createElement('a');
	link.href = '#';
	link.className = 'active';
	link.textContent = layer.displayName;
	link.id = layer.id;

	link.onclick = function(e) {
		var clickedLayer = this.id;
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		// toggle layer visibility by changing the layout object's visibility property
		if (visibility === 'visible') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
			this.className = '';
		} else {
			this.className = 'active';
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
		}
	};

	var layers = document.getElementById('menu');
	layers.appendChild(link);
}


var scale = document.getElementById('scale');
var colorElements = Array();
for (var i = 0; i < 5; i++) {
	var color = document.createElement('div');
	scale.appendChild(color);
	colorElements.push(color);
}


// Pct should be a value between [0.0,1.0] representing normalized elevation
function getColorFromRamp(pct) {
	var h = 45 + Math.pow(pct, 2.5) * (-22); // red shift comes only at the extreme elevations
	var s = 68 + pct * 9;
	var l = 85 + pct * (-20);
	return "hsl(" + Number(h).toFixed(0) + ", " + Number(s).toFixed(0) + "%, " + Number(l).toFixed(0) + "%)";
}


function refreshContourDisplay(min, max) {

	//Calculate min and max elevation from the contours in the viewport:

	var features = map.queryRenderedFeatures({
		layers: ['contours-HDR']
	});
	// console.log(features)

	if (features.length) {
		var min = Number.MAX_SAFE_INTEGER;
		var max = Number.MIN_SAFE_INTEGER;
		for (var i = 0; i < features.length; i++) {
			var ele = features[i].properties.ele;
			if (ele < min)
				min = ele;
			if (ele > max)
				max = ele;
		}

		if (min < 0) min = 0; // Don't allow minimum elevations below sea level

		paintContours(min, max);
	} else {
		paintContours(0, 250); // initialize with reasonable SF values. TODO(andys) find a less hacky way
		
	}
}

function paintContours(min, max) {
	var span = max - min;

	elevationSteps = [min, min + 0.2 * span, min + 0.4 * span, min + 0.8 * span, max];
	// elevationSteps = [0, 50, 100, 200, 250];
	// console.log(elevationSteps);

	map.setPaintProperty('contours-HDR', 'fill-color', [
		"step", ["get", "ele"],
		"hsl(45, 100%, 100%)",
		elevationSteps[0], getColorFromRamp(0),
		elevationSteps[1], getColorFromRamp(.25),
		elevationSteps[2], getColorFromRamp(.5),
		elevationSteps[3], getColorFromRamp(.75),
		elevationSteps[4], getColorFromRamp(1)
	]);
	
	// map.setPaintProperty('contours-HDR', 'fill-color', [
	// 	"interpolate", ["linear"], ["get", "ele"],
	// 	-400, "hsl(45, 100%, 100%)",
	// 	elevationSteps[0], getColorFromRamp(0),
	// 	elevationSteps[1], getColorFromRamp(.25),
	// 	elevationSteps[2], getColorFromRamp(.5),
	// 	elevationSteps[3], getColorFromRamp(.75),
	// 	elevationSteps[4], getColorFromRamp(1)
	// ]);
	
	
	for (var i = 0; i < colorElements.length; i++) {
		var elem = colorElements[i];
		elem.style.backgroundColor = getColorFromRamp(0.25*i);
		elem.textContent = Number(elevationSteps[i]).toFixed(0);
	}

	map.setPaintProperty('contour lines', 'line-color', [
		"step", ["get", "ele"],
		"hsl(45, 100%, 100%)",
		elevationSteps[0], getColorFromRamp(.25),
		elevationSteps[1], getColorFromRamp(.5),
		elevationSteps[2], getColorFromRamp(.75),
		elevationSteps[3], getColorFromRamp(1),
		elevationSteps[4], getColorFromRamp(1.25)
	]);
}
map.on('load', function() {
	for (var i = 0; i < toggleableLayers.length; i++) {
		var layer = toggleableLayers[i];
		map.setLayoutProperty(layer.id, 'visibility', 'visible');
	}

	// Hide static contour layers from mapbox studio
	// map.setLayoutProperty('contour lines', 'visibility', 'none');
	map.setLayoutProperty('contour', 'visibility', 'none');

	// Add HDR contour layers

	map.addLayer({
		"id": "contours-HDR",
		"type": "fill",
		"source": {
			type: 'vector',
			url: 'mapbox://mapbox.mapbox-terrain-v2'
		},
		"source-layer": "contour",
		'layout': {
			'visibility': 'visible'
		}
	}, 'contour lines'); // Add contours below contour lines and hillshading
	refreshContourDisplay();

});

map.on('sourcedata', (e) => {
	if (map.loaded()) {
		refreshContourDisplay();
		map.off('sourcedata');
	}
});


map.on('move', function() {
	refreshContourDisplay();
});
