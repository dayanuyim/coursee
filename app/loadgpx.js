///////////////////////////////////////////////////////////////////////////////
// loadgpx.4.js
//
// Javascript object to load GPX-format GPS data into Google Maps.
//
// Copyright (C) 2006 Kaz Okuda (http://notions.okuda.ca)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// If you use this script or have any questions please leave a comment
// at http://notions.okuda.ca/geotagging/projects-im-working-on/gpx-viewer/
// A link to the GPL license can also be found there.
//
///////////////////////////////////////////////////////////////////////////////
//
// History:
//    revision 1 - Initial implementation
//    revision 2 - Removed LoadGPXFileIntoGoogleMap and made it the callers
//                 responsibility.  Added more options (colour, width, delta).
//    revision 3 - Waypoint parsing now compatible with Firefox.
//    revision 4 - Upgraded to Google Maps API version 2.  Tried changing the way
//               that the map calculated the way the center and zoom level, but
//               GMAP API 2 requires that you center and zoom the map first.
//               I have left the bounding box calculations commented out in case
//               they might come in handy in the future.
//
//    5/28/2010 - Upgraded to Google Maps API v3 and refactored the file a bit.
//                          (Chris Peplin)
//
// Author: Kaz Okuda
// URI: http://notions.okuda.ca/geotagging/projects-im-working-on/gpx-viewer/
//
// Updated for Google Maps API v3 by Chris Peplin
// Fork moved to GitHub: https://github.com/peplin/gpxviewer
//
///////////////////////////////////////////////////////////////////////////////

export function GPXParser(xmlDoc, map) {
    this.xmlDoc = xmlDoc;
    this.map = map;
    this.trackcolour = "#ff00ff"; // red
    this.trackwidth = 5;
    this.mintrackpointdelta = 0.0001;

    this._minlat = null;
    this._maxlat = null;
    this._minlon = null;
    this._maxlon = null;

    this._locations = [];
    this._loadLocations(this._locations, "wpt");
    this._loadLocations(this._locations, "trkpt");
}

// Set the colour of the track line segements.
GPXParser.prototype.setTrackColour = function(colour) {
    this.trackcolour = colour;
}

// Set the width of the track line segements
GPXParser.prototype.setTrackWidth = function(width) {
    this.trackwidth = width;
}

// Set the minimum distance between trackpoints.
// Used to cull unneeded trackpoints from map.
GPXParser.prototype.setMinTrackPointDelta = function(delta) {
    this.mintrackpointdelta = delta;
}

GPXParser.prototype.translateName = function(name) {
    if(name == "wpt") {
        return "Waypoint";
    }
    else if(name == "trkpt") {
        return "Track Point";
    }
}

function arrayExists(arr){
    return arr && arr.length && arr.length > 0;
}

GPXParser.prototype.createMarker = function(point) {
    const lon = parseFloat(point.getAttribute("lon"));
    const lat = parseFloat(point.getAttribute("lat"));

    let name = point.getElementsByTagName("name");
    name = arrayExists(name)? name[0].innerHTML: "";

    let sym = point.getElementsByTagName("sym");
    sym = arrayExists(sym)? sym[0].innerHTML: "";

    let html = "";
    let pointElements = point.getElementsByTagName("html");
    if(arrayExists(pointElements)) {
        for(let i = 0; i < pointElements.item(0).childNodes.length; i++) {
            html += pointElements.item(0).childNodes[i].nodeValue;
        }
    }
    else {
        // Create the html if it does not exist in the point.
        html = "<b>" + this.translateName(point.nodeName) + "</b><br>";
        const attributes = point.attributes;
        const attrlen = attributes.length;
        for(let i = 0; i < attrlen; i++) {
            html += attributes.item(i).name + " = " +
                    attributes.item(i).nodeValue + "<br>";
        }

        if(point.hasChildNodes) {
            const children = point.childNodes;
            const childrenlen = children.length;
            for(let i = 0; i < childrenlen; i++) {
                // Ignore empty nodes
                if(children[i].nodeType != 1) continue;
                if(children[i].firstChild == null) continue;
                html += children[i].nodeName + " = " +
                        children[i].firstChild.nodeValue + "<br>";
            }
        }
    }

    const marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat,lon),
        map: this.map,
    });

    if(name) marker.setLabel(name);
    if(sym) marker.setIcon("images/gps_icon/32/" + sym + ".png");
    /*
    if(sym){
        var icon = {
            url: "images/gps_icon/" + sym + ".png",
            size: new google.maps.Size(96, 96),
            origin: new google.maps.Point(0, 0),
            //anchor: new google.maps.Point(16, 16)
        };
        var shape = {
            coords: [0, 0, 0, 32, 32, 32, 32, 0],
            type: 'poly'
        };
        marker.setIcon(icon);
        marker.setShape(shape);
    }
    */

    const infowindow = new google.maps.InfoWindow({
        content: html,
        size: new google.maps.Size(50,50)
    });

    google.maps.event.addListener(marker, "click", function() {
        infowindow.open(this.map, marker);
        setTimeout(function(){infowindow.close();}, '2000');
    });
}

GPXParser.prototype.addTrackSegmentToMap = function(trackSegment, colour,
        width) {
    const trackpoints = trackSegment.getElementsByTagName("trkpt");
    if(trackpoints.length == 0) {
        return;
    }

    var pointarray = [];

    // process first point
    var lastlon = parseFloat(trackpoints[0].getAttribute("lon"));
    var lastlat = parseFloat(trackpoints[0].getAttribute("lat"));
    var latlng = new google.maps.LatLng(lastlat,lastlon);
    pointarray.push(latlng);

    for(let i = 1; i < trackpoints.length; i++) {
        var lon = parseFloat(trackpoints[i].getAttribute("lon"));
        var lat = parseFloat(trackpoints[i].getAttribute("lat"));

        // Verify that this is far enough away from the last point to be used.
        var latdiff = lat - lastlat;
        var londiff = lon - lastlon;
        if(Math.sqrt(latdiff*latdiff + londiff*londiff)
                > this.mintrackpointdelta) {
            lastlon = lon;
            lastlat = lat;
            latlng = new google.maps.LatLng(lat,lon);
            pointarray.push(latlng);
        }

    }

    var polyline = new google.maps.Polyline({
        path: pointarray,
        strokeColor: colour,
        strokeWeight: width,
        map: this.map
    });
}

GPXParser.prototype.addTrackToMap = function(track, colour, width) {
    var segments = track.getElementsByTagName("trkseg");
    for(var i = 0; i < segments.length; i++) {
        var segmentlatlngbounds = this.addTrackSegmentToMap(segments[i], colour,
                width);
    }
}

GPXParser.prototype.centerAndZoom = function() {
    //default location
    if(this._minlat == null || this._maxlat == null || this._minlon == null || this._maxlon == null){
        this.map.setCenter(new google.maps.LatLng(49.327667, -122.942333), 14);
    }
    //set
    else{
        var centerlon = (this._maxlon + this._minlon) / 2;
        var centerlat = (this._maxlat + this._minlat) / 2;

        var bounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(this._minlat, this._minlon),
                new google.maps.LatLng(this._maxlat, this._maxlon));
        this.map.setCenter(new google.maps.LatLng(centerlat, centerlon));
        this.map.fitBounds(bounds);
    }
}

GPXParser.prototype.centerAndZoomOfSeg = function(trackSegment) {

    var pointlist = new Array("trkpt", "wpt");
    var minlat = 0;
    var maxlat = 0;
    var minlon = 0;
    var maxlon = 0;

    for(var pointtype = 0; pointtype < pointlist.length; pointtype++) {

        // Center the map and zoom on the given segment.
        var trackpoints = trackSegment.getElementsByTagName(
                pointlist[pointtype]);

        // If the min and max are uninitialized then initialize them.
        if((trackpoints.length > 0) && (minlat == maxlat) && (minlat == 0)) {
            minlat = parseFloat(trackpoints[0].getAttribute("lat"));
            maxlat = parseFloat(trackpoints[0].getAttribute("lat"));
            minlon = parseFloat(trackpoints[0].getAttribute("lon"));
            maxlon = parseFloat(trackpoints[0].getAttribute("lon"));
        }

        for(var i = 0; i < trackpoints.length; i++) {
            var lon = parseFloat(trackpoints[i].getAttribute("lon"));
            var lat = parseFloat(trackpoints[i].getAttribute("lat"));

            if(lon < minlon) minlon = lon;
            if(lon > maxlon) maxlon = lon;
            if(lat < minlat) minlat = lat;
            if(lat > maxlat) maxlat = lat;
        }
    }

    if((minlat == maxlat) && (minlat == 0)) {
        this.map.setCenter(new google.maps.LatLng(49.327667, -122.942333), 14);
        return;
    }

    // Center around the middle of the points
    var centerlon = (maxlon + minlon) / 2;
    var centerlat = (maxlat + minlat) / 2;

    var bounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(minlat, minlon),
            new google.maps.LatLng(maxlat, maxlon));
    this.map.setCenter(new google.maps.LatLng(centerlat, centerlon));
    this.map.fitBounds(bounds);
}

GPXParser.prototype.centerAndZoomToLatLngBounds = function(latlngboundsarray) {
    var boundingbox = new google.maps.LatLngBounds();
    for(var i = 0; i < latlngboundsarray.length; i++) {
        if(!latlngboundsarray[i].isEmpty()) {
            boundingbox.extend(latlngboundsarray[i].getSouthWest());
            boundingbox.extend(latlngboundsarray[i].getNorthEast());
        }
    }

    var centerlat = (boundingbox.getNorthEast().lat() +
            boundingbox.getSouthWest().lat()) / 2;
    var centerlng = (boundingbox.getNorthEast().lng() +
            boundingbox.getSouthWest().lng()) / 2;
    this.map.setCenter(new google.maps.LatLng(centerlat, centerlng),
            this.map.getBoundsZoomLevel(boundingbox));
}

GPXParser.prototype.addTrackpointsToMap = function() {
    var tracks = this.xmlDoc.documentElement.getElementsByTagName("trk");
    for(var i = 0; i < tracks.length; i++) {
        this.addTrackToMap(tracks[i], this.trackcolour, this.trackwidth);
    }
}

GPXParser.prototype.addWaypointsToMap = function() {
    var waypoints = this.xmlDoc.documentElement.getElementsByTagName("wpt");
    for(var i = 0; i < waypoints.length; i++) {
        this.createMarker(waypoints[i]);
    }
}

/***************************************************************/
GPXParser.prototype._insertLocTable = function(table, item) {
    var [time, _, _] = item;

    //get the lndex, which is just smaller than item;
    var i;
    for(i = table.length -1; i >= 0; --i){
        var [curr_time, _, _] = table[i];
        if(time > curr_time)
            break;
    }

    //insert after the idx
    table.splice(i + 1, 0, item);
}

GPXParser.prototype._loadLocations = function(table, name)
{
    var pts = this.xmlDoc.documentElement.getElementsByTagName(name);
    for(var i = 0; i < pts.length; i++) {
        var pt = pts[i];

        //get wpt_time
        var time_elem = pt.getElementsByTagName("time");
        var time = (time_elem && time_elem.length > 0)? (new Date(time_elem[0].innerHTML)).getTime(): 0;
        var lat = parseFloat(pt.getAttribute("lat"));
        var lon = parseFloat(pt.getAttribute("lon"));

        this._insertLocTable(table, [time, lat, lon, name]);

        //rec min/max lat/lon
        if(this._minlat == null || this._minlat > lat) this._minlat = lat;
        if(this._maxlat == null || this._maxlat < lat) this._maxlat = lat;
        if(this._minlon == null || this._minlon > lon) this._minlon = lon;
        if(this._maxlon == null || this._maxlon < lon) this._maxlon = lon;
    }
}

GPXParser.prototype._printLocTable = function(table) {
    for(var i = 0; i < table.length; ++i){
        var [time, lat, lon] = table[i];
        console.log("[" + i + "]: " + time + ", " + lat + ", " + lon);
    }
}

//return the index of the most closed less-than item
GPXParser.prototype._getClosedLocation = function(table, time){
    for(var i = 0; i < table.length; ++i){
        var [curr_time, _, _] = table[i];
        if(curr_time > time)
            return i - 1;
    }

    return table.length - 1;
}

GPXParser.prototype._estLocation = function(time, loc1, loc2)
{
    let _, lat, lon;

    if(loc1 == null){
        [_, lat, lon] = loc2;
    }
    else if (loc2 == null){
        [_, lat, lon] = loc1;
    }
    else{
        const [t2, lat2, lon2] = loc2;
        const [t1, lat1, lon1] = loc1;
        lat = (lat2 - lat1) * (time - t1) / (t2 - t1) + lat1;
        lon = (lon2 - lon1) * (time - t1) / (t2 - t1) + lon1;
    }

    return new google.maps.LatLng(lat, lon);
}

GPXParser.prototype.lookupLocation = function(dt)
{
    var time = dt.getTime();

    //lookup
    var idx = this._getClosedLocation(this._locations, time);
    var loc1 = (idx == -1)? null: this._locations[idx];
    var loc2 = (idx == this._locations -1)? null: this._locations[idx+1];
    console.log(dt + ":" + idx);
    console.log("estimate location between second diff (" + ((loc1 == null)? "null": (loc1[0]-time)/1000) + ", " + ((loc2 == null)? "null": (loc2[0]-time)/1000) + ")");

    //estimate
    var latlng = this._estLocation(time, loc1, loc2);

    return latlng;
}