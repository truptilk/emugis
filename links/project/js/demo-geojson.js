$(document).ready(function(){

	var map = L.map('map').setView([42.3,-83.1], 9);

	map.addLayer(L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
	}));

	L.control.attribution({
		position: 'topright'
	}).addTo(map);

	$.ajax({
		context: this,
		type: 'GET',
		dataType: "json",
		url: 'geojson/medhvpt.geojson',

		success: function(data, textStatus, jqXHR){


			pointClusterer = new QCluster.PointClusterer(data, 'median house value', map, 'medhvpt-layer',
	                                                    {
	                                                        backgroundColor: '#0099dd',
	                                                        dataFormat: 'GeoJSON'
	                                                    });

		},
		error: function(jqXHR, textStatus, errorThrown){

		}
	});

});
