var temp = document.getElementById('para');

async function main() {
    var location = await getLocation();

    if (window.DeviceOrientationEvent) {
        // Listen for the deviceorientation event and handle the raw data
        window.addEventListener('deviceorientation', function(eventData) {
          var compassdir;
      
          if(event.webkitCompassHeading) {
            // Apple works only with this, alpha doesn't work
            compassdir = event.webkitCompassHeading;  
          }
          else compassdir = event.alpha;
          console.log(compassdir);
        });
      }

    var nearby = await getNearbyPlaces();
    var voiceIn = new SpeechToText();

    console.log(nearby);

    for (var i = 0; i < nearby.results.length; i++)
        nearby.results[i].distance = await getDistance(nearby.results[i]);

    nearby.results.sort((a, b) => a.distance.value - b.distance.value);
    textToSpeech(`There are ${nearby.results.length} places nearby.`);
    for (var i = 0; i < nearby.results.length; i++)
        await textToSpeech(`${nearby.results[i].name} is ${nearby.results[i].distance.text} away.`);

    window.setTimeout(() => {}, 1000);

    var txt = await voiceIn.getText();

    console.log(txt);

    var closest = nearby.results[0];
    nearby.results.forEach(a => {
        if (levenshtein(txt, a.name) < levenshtein(txt, closest.name))
            closest = a;
    });

    console.log(closest);

}

function directionLoop(data) {

    
}

function levenshtein(a, b) {
    if(a.length === 0) return b.length;
    if(b.length === 0) return a.length;
  
    var matrix = [];
  
    // increment along the first column of each row
    var i;
    for(i = 0; i <= b.length; i++){
      matrix[i] = [i];
    }
  
    // increment each column in the first row
    var j;
    for(j = 0; j <= a.length; j++){
      matrix[0][j] = j;
    }
  
    // Fill in the rest of the matrix
    for(i = 1; i <= b.length; i++){
      for(j = 1; j <= a.length; j++){
        if(b.charAt(i-1) == a.charAt(j-1)){
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                  Math.min(matrix[i][j-1] + 1, // insertion
                                           matrix[i-1][j] + 1)); // deletion
        }
      }
    }
  
    return matrix[b.length][a.length];
  }

async function getDistance(destination) {
    var directions = await getDirections(destination);

    return new Promise(resolve => {
        resolve(directions.routes[0].legs[0].distance);
    });
}

async function getDirections(destination) {
    var location = await getLocation();

    var gMapsLocation = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);

    return new Promise(resolve => {

        var directionsService = new google.maps.DirectionsService();

        var request = {
            origin: gMapsLocation,
            destination: { placeId: destination.place_id },
            travelMode: "WALKING"
        }

        directionsService.route(request, function (response, status) {
            if (status == "OK") {
                resolve(response);
            }
        });
    });
}

async function getNearbyPlaces() {
    function apiNearbyPlaces(geoLocation) {
        return new Promise((resolve) => {
            var location = new google.maps.LatLng(geoLocation.coords.latitude, geoLocation.coords.longitude);
            var request = {
                location: location,
                radius: '250',
            };
            var map = new google.maps.Map(document.getElementById('map'));
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch(request, (results, status) => {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                    resolve({ "results": results, "status": status });
                } else {
                    resolve({ "results": [], "status": status });
                }
            });
        });
    }

    var out = await apiNearbyPlaces(await getLocation());

    return new Promise((resolve) => {
        resolve(out);
    });
}

function getLocation() {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve);
    });
}