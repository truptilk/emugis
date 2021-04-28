$(document).ready(function() {

  $('#mapid').height(window.innerHeight);
  $('#slide-in').height(window.innerHeight);

  /*Click event for sidebar */

  $(document).on('click','#advanced',function() {
    if($('#slide-in').hasClass('in')) {
      $('#slide-in').removeClass('in')
    } else {
      $('#slide-in').addClass('in')
    }
  });

  var map = L.map('mapid', {
    zoomControl : false
  }).setView([42,-83], 8);

  /* Base Map */
  L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  L.control.attribution({
    position: 'topright'
  }).addTo(map);

  var popup = L.popup();

  var citiesGeoJSON = null;
  var PointsGeoJSON = null;
  var PointsArray = [];
  var filters = {
    text : '',
    range : []
  }

  fetch('geojson/points.geojson',{
    method: 'GET'
  })
  .then(response => response.json())
  .then(json => {

    json.features.forEach(function(feature) {
      PointsArray.push(feature.geometry.coordinates)
    });

  fetch('json/demo.json',{
    method: 'GET'
  })
  .then(response => response.json())
  .then(json => {
    // Loop to get city list
    json.features.forEach(function(feature) {
      $('#city-select').append('<option value="'+feature.properties.NAME+'">'+feature.properties.NAME+'</option>');
    });


  citiesGeoJSON = L.geoJSON(json, {
      style: function (feature) {
          return {
            fillOpacity: 0,
            weight: 0.7,
            color: 'Blue'
          };
      },
      onEachFeature: function(feature,layer) {
        layer.on('mouseover',function() {
          layer.setStyle({fillOpacity: 0.3})
          $('#city-select').val('Hover Active');
          // Reference document at https://turfjs.org/docs/#polygon
          var points = turf.points(PointsArray);
          var totalPoints = 0;
          console.log(layer.feature.geometry.coordinates)
          if(layer.feature.geometry.coordinates[0].length===1) {
            layer.feature.geometry.coordinates.forEach(function(coords) {
              var searchWithin = turf.polygon(coords);
              var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
              totalPoints += ptsWithin.features.length;
            })
          } else {
            var searchWithin = turf.polygon(layer.feature.geometry.coordinates);
            var ptsWithin = turf.pointsWithinPolygon(points, searchWithin);
            console.log(ptsWithin)
            totalPoints += ptsWithin.features.length;
          }

          $('#city-information2').html(layer.feature.properties.NAME + ' ('+layer.feature.properties.FIPSCODE+'), ' + 'Total census tracts within ' +layer.feature.properties.NAME +': '+totalPoints); //+'Census Tracts Count'
        })
        layer.on('mouseout',function() {
          layer.setStyle({fillOpacity: 0})
          $('#city-information2').html('');
        })
      }
  }).addTo(map);

    if(PointsGeoJSON) {
      PointsGeoJSON.bringToFront();
    }
    map.fitBounds(citiesGeoJSON.getBounds());
  })
  .catch(error => console.log(error.message));

    var min = 0;
    var max = 0;
    PointsGeoJSON = L.geoJSON(json, {
        style: function (feature) {
            return {
              fillOpacity: 0.1,
              fillColor: '#000',
              color: '#000',
              opacity: 0.3
            };
        },
        pointToLayer: function(geoJsonPoint, latlng) {
          // Get min/max
          if(geoJsonPoint.properties.BLKPOP<min||min===0) {
            min = geoJsonPoint.properties.BLKPOP;
          }
          if(geoJsonPoint.properties.BLKPOP>max) {
            max = geoJsonPoint.properties.BLKPOP;
          }
          // Add popup html
          var html = '';
          var arrayOfProps = ['Place Name','Type','TractID','TotPop'];
          arrayOfProps.forEach(function(prop) {
            html += '<strong>'+prop+'</strong>: '+geoJsonPoint.properties[prop]+'<br />';
          })
          return L.circle(latlng, 100).bindPopup(html);
        }
    }).addTo(map);

  }).catch(error => console.log(error.message));

  $(document).on('keyup','#search',function(e) {
    filters.text = e.target.value;
    PointsGeoJSON.eachLayer(function(layer) {
      filterGeoJSON(layer);
    });
  });

  $(document).on('change','#city-select',function(e) {
    var newcity = e.target.value;
    if(newcity!=='') {
      citiesGeoJSON.eachLayer(function(layer) {
        if(layer.feature.properties.NAME===e.target.value) {
          layer.setStyle({color: 'Blue',fillOpacity: 0.3}),
          $('#city-information').html('<br><br><strong>Place:</strong> ' +layer.feature.properties.LABEL + '<br><br><strong> FIPS Code: </strong>' + layer.feature.properties.FIPSCODE
          + '<h3 style="color:blue;"> Population: </h3>'
          + '<strong> Total: </strong>' + layer.feature.properties.SUM_DP0010001
          + '<br><strong> Black: </strong>' + layer.feature.properties.SUM_DP0080004
        + '<br><strong> White: </strong>' + layer.feature.properties.SUM_DP0080003
        + '<br><strong> Am. Indian/Alaska Native: </strong>' + layer.feature.properties.SUM_DP0080005
        + '<br><strong> Asian: </strong>' + layer.feature.properties.SUM_DP0080006
        + '<br><strong> Asian Indian: </strong>' + layer.feature.properties.SUM_DP0080007
        + '<br><strong> Hispanic/Latino: </strong>' + layer.feature.properties.SUM_DP0100001
        + '<h3 style="color:blue;"> Households: </h3>'
        + '<strong> Total: </strong>' + layer.feature.properties.SUM_DP0130001
        + '<h3 style="color:blue;"> Housing Occupancy: </h3>'
        + '<strong> Total Housing Units: </strong>' + layer.feature.properties.SUM_DP0180001
        + '<br><strong> Vacant Housing Units: </strong>' + layer.feature.properties.SUM_DP0180003
      );
          map.fitBounds(layer.getBounds())
        }
      });
    } else {
      $('#city-information').html('');
    }
  });


  function filterGeoJSON(layer) {
    var numberOfTrue = 0;
    if(layer.feature.properties.NAME.toLowerCase().indexOf(filters.text.toLowerCase())>-1) {
      numberOfTrue += 1;
    }
    if(layer.feature.properties.NAME>=filters.range[0]&&layer.feature.properties.NAME<=filters.range[1]) {
      numberOfTrue += 1;
    }
    if(numberOfTrue===2) {
      layer.addTo(map);
    } else {
      map.removeLayer(layer);
    }
  }

});
