var map = L.map('map').setView([0,0], 2);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidG9tdHJ1b25nMDYyMzk5IiwiYSI6ImNraG13cWVscTB0bWQzNW85YWNrdDN1cHkifQ.yHyazdWzemx0rGc7560vWw', {
    attribution: '<a href="anotha_egg.jpg">🐇</a>',
    maxZoom: 20,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoidG9tdHJ1b25nMDYyMzk5IiwiYSI6ImNraG13cWVscTB0bWQzNW85YWNrdDN1cHkifQ.yHyazdWzemx0rGc7560vWw'
}).addTo(map);

L.easyButton('fas fa-shopping-basket', function(){
  alert("Here is an egg >>>>>>>>>> 🥚");
}).addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var cartoData = L.layerGroup().addTo(map);
var url = "https://tomtruong062399.carto.com/api/v2/sql";
var urlGeoJSON = url + "?format=GeoJSON&q=";
var sqlQuery = "SELECT the_geom, name FROM easter_egg";
function addPopup(feature, layer) {
  layer.bindPopup(
    "<u>Name</u>: " +
    "<b>" + feature.properties.name + "</b>"
  );
}

fetch(urlGeoJSON + sqlQuery)
  .then(function(response) {
  return response.json();
  })
  .then(function(data) {
    L.geoJSON(data, {onEachFeature: addPopup}).addTo(cartoData);
  });

new L.Control.Draw({
  draw: {
    polygon: false,
    polyline: false,
    rectangle: false,
    circle: false,
    circlemarker: false,
    marker: true
  },
  edit: {
    featureGroup: drawnItems
  }
}).addTo(map);

function createFormPopup() {
  var popupContent =
    '<form>' +
    'Name:<br><input type="text" id="input_name"><br>' +
    '<input type="button" value="Submit" id="submit">'
    '</form>'
  drawnItems.bindPopup(popupContent).openPopup();
}

map.addEventListener("draw:created", function(e) {
  e.layer.addTo(drawnItems);
  createFormPopup();
});

function setData(e) {
  if(e.target && e.target.id == "submit") {

    // Get user name and description
    var enteredName = document.getElementById("input_name").value;

    // For each drawn layer
    drawnItems.eachLayer(function(layer) {
      // Create SQL expression to insert layer
      var drawing = JSON.stringify(layer.toGeoJSON().geometry);
      var sql =
        "INSERT INTO easter_egg (the_geom, name) " +
        "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
        drawing + "'), 4326), '" +
        enteredName + "')";
      console.log(sql);

      // Send the data
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
          body: "q=" + encodeURI(sql)
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        console.log("Data saved:", data);
      })
      .catch(function(error) {
        console.log("Problem saving the data:", error);
      });

    // Transfer submitted drawing to the CARTO layer
    // so it persists on the map without you having to refresh the page
    var newData = layer.toGeoJSON();
    newData.properties.name = enteredName;
    L.geoJSON(newData, {onEachFeature: addPopup}).addTo(cartoData);
  });

    // Clear drawn items layer
    drawnItems.closePopup();
    drawnItems.clearLayers();
  }
}

document.addEventListener("click", setData);

map.addEventListener("draw:editstart", function(e) {
  drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
  drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
  drawnItems.closePopup();
});
map.addEventListener("draw:deletestop", function(e) {
  if(drawnItems.getLayers().length > 0) {
    drawnItems.openPopup();
  }
});
