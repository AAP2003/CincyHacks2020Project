// The radius in meters to use when conducting nearby search
const searchRadius = "300";

// Promise to create a sleep-like function in JavaScript
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function load() {
    var voiceIn = new SpeechToText(true);
    voiceIn.start();
    wakeListener(voiceIn);
}

async function wakeListener(voiceIn) {

    console.log(voiceIn.getFinalScript());
    console.log(voiceIn.getFinalScript().includes("get nearby places"));

    if (voiceIn.getFinalScript().includes("get nearby places")) {
        voiceIn.clearFinalTranscript();
        voiceIn.stop();
        main();
        return;
    }   

    await sleep(1000);
    wakeListener(voiceIn);
}

// Called when the button is clicked
async function main() {
    
    // Get the current location of the user
    var location = await getLocation();

    // Get all the places within the searchRadius of the user
    var nearby = await getNearbyPlaces();

    // Object to use voice input
    var voiceIn = new SpeechToText(false);

    // Get the distance from the current location to each of the nearby places
    for (var i = 0; i < nearby.results.length; i++)
        nearby.results[i].distance = await getDistance(nearby.results[i]);

    // Sort the nearby places ascending based on distance
    nearby.results.sort((a, b) => a.distance.value - b.distance.value);
    
    // Tell the user how many places are nearby
    await textToSpeech(`There are ${nearby.results.length} places nearby.`);

    // Tell the user the name and distance to each of the nearby places
    for (var i = 0; i < nearby.results.length; i++)
        await textToSpeech(`${nearby.results[i].name} is ${nearby.results[i].distance.text} away.`);

    // Ask the user where they want to go
    await textToSpeech("Where do you want to go?");
    
    // Start the voice input
    voiceIn.start();

    // Wait 5 seconds for the user to give their voice input
    await sleep(5000);
    
    // Stop the vocie input
    var txt = voiceIn.stop();

    var closest = nearby.results[1];

    nearby.results.forEach(a => {
        if(levenshtein(txt, a.name) < levenshtein(txt, closest.name)) {
            closest = a;
        }
            
    }); 

    var data = {
        location: await getLocation(),
        steps: 0,
        directions: await getDirections(closest)
    };

    var directionsOutput = document.getElementById("directions");

    directionsOutput.innerHTML += "Your trip will take <b>" + data.directions.routes[0].legs[0].duration.text + " and cover " + data.directions.routes[0].legs[0].distance.text + "</b><br /><br />";

    for(var i = 0; i < data.directions.routes[0].legs[0].steps.length; i++)
    {
        directionsOutput.innerHTML += "For " + data.directions.routes[0].legs[0].steps[i].duration.text + " " + data.directions.routes[0].legs[0].steps[i].instructions  + "<br />";
    }

    textToSpeech("Your trip will take " + data.directions.routes[0].legs[0].duration.text + " and cover " + data.directions.routes[0].legs[0].distance.text);

    var html = "For " + data.directions.routes[0].legs[0].steps[data.steps].duration.text + " " + data.directions.routes[0].legs[0].steps[data.steps].instructions;
    var div = document.createElement("div");
    div.innerHTML = html;
    textToSpeech(div.textContent || div.innerText || "");
    
    directionLoop(data);
}

async function directionLoop(data)
{

    if(coordDistance(data.location.coords.latitude, data.location.coords.longitude, data.directions.routes[0].legs[0].steps[data.steps].end_location.lat(), data.directions.routes[0].legs[0].steps[data.steps].end_location.lng(), "") < .01) { 
        data.steps++;
        var html = data.directions.routes[0].legs[0].steps[data.steps].instructions + " for " + data.directions.routes[0].legs[0].steps[data.steps].duration.text;
        var div = document.createElement("div");
        div.innerHTML = html;
        textToSpeech(div.textContent || div.innerText || "");
    }

    if (coordDistance(data.location.coords.latitude, data.location.coords.longitude, data.directions.routes[0].legs[0].end_location.lat(), data.directions.routes[0].legs[0].end_location.lng(), "") < .01) {       
        clearInterval(interval);
        textToSpeech("You have reached your final destination!");
        var voiceIn = new SpeechToText(true);
        voiceIn.start();
        wakeListener(voiceIn);
        return;
    }  

    await sleep(5000);

    data.location = await getLocation();

    directionLoop(data);

}

function coordDistance(lat1, lon1, lat2, lon2, unit) {
    
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
        if (unit=="N") { dist = dist * 0.8684 }
        
		return dist;
	}
}

function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    var matrix = [];

    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1)); // deletion
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
                radius: searchRadius,
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
