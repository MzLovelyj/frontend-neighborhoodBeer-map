import { CLIENT_ID, CLIENT_SECRET } from "../data/credentials";
//^^Keep Secret key info in the Data Folder that's why importing to keep info private. 

const sortName = (a, b) => {
  // remove case senstivity
  const nameA = a.name.toUpperCase();
  const nameB = b.name.toUpperCase();
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  // if names are equal
  return 0;
};

// url and params
const fSURL = "https://api.foursquare.com/v2/venues/";
//Version should be : YYYYMMDD. Also Increase this date as often as possible (typically every couple months)
//Updated today's date to see if more would show up or to keep as up to date per FS Api Documention 
const VERS = "20181113";
/**Limit results to venues within this many meters of the specified location. 
 * Defaults to a city-wide area. Only valid for requests with intent=browse, or
 * requests with intent=checkin and categoryId or query. Does not apply to match intent requests. 
 * The maximum supported radius is currently 100,000 meters. */
//FYI Radius works best on map at the max
const RADIUS = "100000";
const categories = {
  //The miami Breweries/ Beer spots Id from the Foursquare API Documentation
  Brewery: "50327c8591d4c4b30a586d5d",
  BeerBar: "56aa371ce4b08b9a8d57356c"
};
// create array of categories
const CATEGORY_ID = Object.keys(categories).map(cat => categories[cat]);

export const getFSLocations = mapCenter => {
  const requestURL = `${fSURL}search?ll=${mapCenter.lat},${mapCenter.lng}
  &client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&v=${VERS}&categoryId=${CATEGORY_ID}
  &radius=${RADIUS}&limit=50`;
  return (
    fetch(requestURL)
      //^^ FFoursquare API Documentation: Number of results to return, up to 50.
      .then(response => {
        if (!response.ok) {
          throw response;
        } else return response.json();
      })
      .then(data => {
        const places = data.response.venues;
        const beerPlaces = places.filter(
          place => place.location.address &&
            place.location.city &&
            place.location.city === "Miami");

        // sorting the beer Spots before updating state
        beerPlaces.sort(sortName);

        return beerPlaces;
      })
  );
};

export const getFSDeets = fsid => {
  // use Foursquare id for search
  const FSID = fsid;

  const requestURL = `${fSURL}${FSID}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&v=${VERS}`;
  return fetch(requestURL).then(response => {
    if (!response.ok) {
      throw response;
    } else return response.json();
  });
};
