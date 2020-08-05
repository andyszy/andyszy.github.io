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
	displayName: "Peaks",
	default: true
}, {
	id: 'settlement-subdivision-label',
	displayName: "Neighborhoods",
	default: true
}, {
	id: 'mapbox-terrain-rgb',
	displayName: "Shading",
	default: true // TODO(andys) decide if the map is better with shading off
}];

// set up the corresponding toggle button for each layer
for (var i = 0; i < toggleableLayers.length; i++) {
	var layer = toggleableLayers[i];
	var checkbox = document.createElement('input');
	checkbox.type="checkbox";
	checkbox.checked = layer.default ? 'checked' : '';
	checkbox.name = layer.id;
	checkbox.id = layer.id;
	var label = document.createElement('label');
	label.textContent = layer.displayName;
	label.for = layer.id;

	checkbox.onclick = function(e) {
		var clickedLayer = this.id;
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		// toggle layer visibility by changing the layout object's visibility property
		if (visibility === 'visible') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
			this.checked = '';
		} else {
			this.checked = 'checked';
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
		}
	};

	var layers = document.getElementById('mapOptions');
	layers.appendChild(checkbox);
	layers.appendChild(label);
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
		layers: ['contour']
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

var numSteps = 8;
// TODO(andys): Make this dynamic based on zoom level

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

function paintContours(min, max) {
	var span = max - min;

	elevationSteps = Array();
	for (var i = 0; i < numSteps; i++) {
		elevationSteps.push(Number(min + (i / numSteps) * span));
	}

	// elevationSteps = [0, 50, 100, 200, 250];
	// console.log(elevationSteps);

	var fillColorProperty = ["step", ["get", "ele"],
		"hsla(45, 100%, 100%,0%)" /* rest of mapbox property to be filled in below */
	]; 
	var lineColorProperty = ["step", ["get", "ele"],
		"hsl(45, 100%, 100%)" /* rest of mapbox property to be filled in below */
	]; 
	
	for (var i = 0; i < numSteps; i++) {
		var ele = elevationSteps[i];
		var fillColor = getColorFromRamp(i / (numSteps-1));
		var lineColor = getColorFromRamp((i+1) / (numSteps-1)); // Contour line uses the color from the next elevation up
		
		fillColorProperty.push(ele, fillColor);
		lineColorProperty.push(ele, lineColor);
		colorElements[i].style.backgroundColor = fillColor;
		var eleForDisplay = ele - (ele % displayIncrement); // round this down to the nearest multiple of the allowable increment

		colorElements[i].textContent = Number(eleForDisplay).toFixed(0);
		if ((i > 0) && (colorElements[i].textContent == colorElements[i-1].textContent)) {
			colorElements[i].style.display = 'none';
		} else{
			colorElements[i].style.display = '';
		}
		
	}
	map.setPaintProperty('contour', 'fill-color', fillColorProperty);
	map.setPaintProperty('contour lines', 'line-color', lineColorProperty);
}
map.on('load', function() {
	for (var i = 0; i < toggleableLayers.length; i++) {
		var layer = toggleableLayers[i];
		map.setLayoutProperty(layer.id, 'visibility', layer.default ? 'visible' : 'none');
	}

	refreshContourDisplay();

});

map.on('sourcedata', (e) => {
	if (map.loaded()) {
		refreshContourDisplay();
		map.off('sourcedata');
	}
});


map.on('moveend', function() { // Could also do on "move" but it'd be less performant
	refreshContourDisplay();
});
