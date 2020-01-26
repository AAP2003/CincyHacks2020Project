var user_location;

function main() {
    var nearby = getNearbyPlaces();
}

const getNearbyPlaces = () => {
    getLocation(executeGMaps());
};

const getLocation = (returnCallback) => {
    if (navigator.geolocation) {
        position = navigator.geolocation.getCurrentPosition(returnCallback);
    } else {
        window.alert("could not get location")
    }
};

function executeGMaps(geoLocation)
{    
    var location = new google.maps.LatLng(0,151.1956316); 
    var request = {
        location: location,
        radius: '50',
    };

    var service = new google.maps.places.PlacesService();
    service.nearbySearch(request, gMapsCallback);
}

function gMapsCallback(results, status) {
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      var place = results[i];
      console.log(place);
    }
  }
}

// Directions
const directionLoop = (data) => {
    if (data.location == something) {

    }

    directionLoop({ "location": getLocation(), "directions": data.directions });
};

const getDirections = () => {
    
};