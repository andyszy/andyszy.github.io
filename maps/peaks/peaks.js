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

var peakLayerName = 'peaks-overpass';  // "Exported from Overpass " seems to take awhile for names to update after changing in Mapbox Studio 
map.on('click', function(e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: [peakLayerName]
	});

	if (!features.length) {
		return;
	}

	var feature = features[0];
	var html = '<h3>' + feature.properties.name + '</h3><p>' + feature.properties.ele + ' m (' + Number(3.28084 * feature.properties.ele).toFixed(0) + ' ft)</p>';
	if (feature.properties['gnis:feature_id'])
		html += '<p><a href="https://geonames.usgs.gov/apex/f?p=GNISPQ:3:::NO::P3_FID:' + feature.properties['gnis:feature_id'] + '">USGS</a></p>';
	https: //geonames.usgs.gov/apex/f?p=GNISPQ:3:::NO::P3_FID:236709
		var popup = new mapboxgl.Popup({
				offset: [0, -15]
			})
			.setLngLat(feature.geometry.coordinates)
			.setHTML(html)
			.addTo(map);
	console.log(feature);
});

// enumerate ids of the layers
var toggleableLayers = [
	{
		id: peakLayerName,
		displayName: "Peaks"
	},
	{
		id: 'settlement-subdivision-label',
		displayName: "Neighborhoods"
	}
];

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


map.on('load', function() {
	for (var i = 0; i < toggleableLayers.length; i++) {
		var layer = toggleableLayers[i];
		map.setLayoutProperty(layer.id, 'visibility', 'visible');
	}
});

