var user_location;

async function main() {
    var nearby = await getNearbyPlaces();

    console.log(nearby);

    nearby.results.forEach(element => {
        console.log(element);
    });
}

async function getNearbyPlaces() {
    return new Promise((resolve) => {

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
                    }
                });
            });
        }

        resolve(await apiNearbyPlaces(await getLocation()));
    });
}

function getLocation() {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve);
    });
}