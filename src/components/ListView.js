import React, { Component } from "react";
import BeerSpots from './BeerSpots';
import { getFSLocations, getFSDeets } from "../apis/foursquare";
import {
  checkData,
  buildInfoContent,
  buildErrorContent
} from "../utils/helpers";
import beerIcon from "../images/beer-marker.png";
import spinner from "../images/circles-loader.svg";
import PropTypes from "prop-types";

class ListView extends Component {
  static propTypes = {
    map: PropTypes.object.isRequired,
    infowindow: PropTypes.object.isRequired,
    bounds: PropTypes.object.isRequired,
    mapCenter: PropTypes.object.isRequired,
    toggleList: PropTypes.func.isRequired,
    listOpen: PropTypes.bool.isRequired
  };

  state = {
    query: "",
    allPlaces: [],
    filteredPlaces: null,
    apiReturned: false
  };

  componentDidMount() {
    getFSLocations(this.props.mapCenter)
      .then(places => {
        this.setState({
          allPlaces: places,
          filteredPlaces: places,
          apiReturned: true
        });
        if (places) this.addMarkers(places);
      })
      .catch(error => this.setState({ apiReturned: false }));
  }

  addMarkers(places) {
    const { map, bounds, infowindow, toggleList } = this.props;
    const self = this;

    places.forEach(location => {
      const position = {
        _lat: location.location.lat,
        get lat() {
          return this._lat;
        },
        set lat(value) {
          this._lat = value;
        },
        lng: location.location.lng
      };

      location.marker = new window.google.maps.Marker({
        position,
        map,
        title: location.name,
        id: location.id,
        icon: beerIcon
      });

      bounds.extend(position);

      location.marker.addListener("click", function () {
        const marker = this;

        // bounce marker three times then stop
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1900);

        // get venue details and display in infowindow
        getFSDeets(marker.id)
          .then(data => {
            checkData(marker, data);
            buildInfoContent(marker);
          })
          .catch(() => buildErrorContent(marker))
          .finally(() => {
            // set content and open window
            infowindow.setContent(marker.infoContent);
            infowindow.open(map, marker);

            // close list view in mobile if open so infowindow is not hidden by list
            if (self.props.listOpen) {
              toggleList();
            }
          });
      });
    });

    // size and center map
    map.fitBounds(bounds);
  }

  filterPlaces = event => {
    const { allPlaces } = this.state;
    const { infowindow } = this.props;
    const query = event.target.value.toLowerCase();

    // update state so input box shows current query value
    this.setState({ query: query });

    // close infoWindow when filter runs
    infowindow.close();

    // filter list markers by name of location
    const filteredPlaces = allPlaces.filter(place => {
      const match = place.name.toLowerCase().indexOf(query) > -1;
      place.marker.setVisible(match);
      return match;
    });

    // sort array before updating state
    filteredPlaces.sort(this.sortName);

    this.setState({ filteredPlaces: filteredPlaces });
  };

  showInfo = place => {
    // force marker click
    window.google.maps.event.trigger(place.marker, "click");
  };

  render() {
    const { apiReturned, filteredPlaces, query } = this.state;
    const { listOpen } = this.props;

    // API request fails
    if (apiReturned && !filteredPlaces) {
      return <div> Foursquare API request failed. Please try again later.</div>;

      // Foursqaure API request return successfully will display
    } else if (apiReturned && filteredPlaces) {
      return (
        <div className="list-view">
          <input
            type="text"
            placeholder="filter by name"
            value={query}
            onChange={this.filterPlaces}
            className="query"
            role="search"
            aria-labelledby="text filter"
            tabIndex={listOpen ? "0" : "-1"}
          />
          {apiReturned && filteredPlaces.length > 0 ? (
            <ul className="beerList">
              {filteredPlaces.map((place, id) => (
                <BeerSpots key={place.id} place={place} listOpen={listOpen} />
              ))}
            </ul>
          ) : (
              <p id="filter-error" className="empty-input">
                No places match filter
            </p>
            )}
        </div>
      );

      // API request has not returned yet
    } else {
      return (
        <div className="loading-fs">
          <h4 className="loading-message">Loading Breweries ...</h4>
          <img src={spinner} className="spinner" alt="loading indicator" />
        </div>
      );
    }
  }
}

export default ListView;
