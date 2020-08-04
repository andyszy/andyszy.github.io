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

map.on('click', function(e) {
  var features = map.queryRenderedFeatures(e.point, {
    layers: ['peaks-overpass'] // "Exported from Overpass " seems to take awhile for names to update after changing in Mapbox Studio 
  });

  if (!features.length) {
    return;
  }

  var feature = features[0];
  var html = '<h3>' + feature.properties.name + '</h3><p>' + feature.properties.ele + ' m (' + Number(3.28084*feature.properties.ele).toFixed(0) + ' ft)</p>';
  if (feature.properties['gnis:feature_id'])
	  html += '<p><a href="https://geonames.usgs.gov/apex/f?p=GNISPQ:3:::NO::P3_FID:' + feature.properties['gnis:feature_id'] + '">USGS</a></p>';
	https://geonames.usgs.gov/apex/f?p=GNISPQ:3:::NO::P3_FID:236709
  var popup = new mapboxgl.Popup({ offset: [0, -15] })
    .setLngLat(feature.geometry.coordinates)
    .setHTML(html)
    .addTo(map);
  console.log(feature);
});
