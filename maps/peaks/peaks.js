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