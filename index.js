async function main() {
    var nearby = await getNearbyPlaces();
    for (var i = 0; i < nearby.results.length; i++) 
        nearby.results[i].distance = await getDistance(nearby.results[i]);

    nearby.results.sort((a, b) => a.distance.value - b.distance.value);

    for (var i = 0; i < nearby.results.length; i++) 
        console.log({
            "name": nearby.results[i].name,
            "distance":nearby.results[i].distance
        });
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
            destination: {placeId: destination.place_id},
            travelMode: "WALKING"
        }

        directionsService.route(request, function(response, status) {
            if(status == "OK") {
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
                    resolve({"results": results, "status" : status});
                } else {
                    resolve({"results": [], "status": status});
                }
            });
        });
    }

    var out = await apiNearbyPlaces(await getLocation());

    return new Promise((resolve) =>  {
        resolve(out);
    });
}

function getLocation() {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve);
    });
}