'use strict';

import './css/trk.css';
import {Markdown} from './markdown';
import {GPXParser} from './loadgpx';
import * as googleMaps from 'google-maps-api';

let Gmap;
let Gpxparser;

async function drawMap(gpx_data){
    const container = document.querySelector('#map');
    container.hidden = true;

    const googleMapsApi = googleMaps({
        key: 'AIzaSyDoRAou_pmXgeqexPAUlX3Xkg0eKJ_FMhg',
        language: 'zh-TW',
    });
    const googlemaps = await googleMapsApi();

    const gmap = new googlemaps.Map(document.getElementById('gmap'), {
        center: {lat: 24.279609, lng: 121.025882},
        mapTypeId: googlemaps.MapTypeId.TERRAIN,
        zoom: 15
    });

    const parser = new GPXParser(gpx_data, gmap, googlemaps);
    parser.setTrackColour("#ff0000");      // Set the track line colour
    parser.setTrackWidth(5);               // Set the track line width
    parser.setMinTrackPointDelta(0.0001);   // Set the minimum distance between track points
    parser.centerAndZoom();
    parser.addTrackpointsToMap();          // Add the trackpoints
    parser.addWaypointsToMap();            // Add the waypoints

    container.hidden = false;

    //set global
    Gmap = gmap;
    Gpxparser = parser;
}


async function loadMap(url)
{
    const gmap = document.getElementById('gmap');
    document.getElementById('download_trk').href = url;

    try{
        const resp = await fetch(url, { method: 'get', dataType: 'xml' });
        const text = await resp.text();
        const xml = (new window.DOMParser()).parseFromString(text, 'text/xml');
        await drawMap(xml);
    }
    catch(err){
        document.getElementById('download_trk').hidden = true;
        console.log(err);
        gmap.innerHTML = "Google map is not initialized due to loading GPX error";
    }
}

/*********** Records ***********************/
Date.prototype.addDays = function(days) {
    var result = new Date(this);
    result.setDate(result.getDate() + days);
    return result;
}

function padZero(txt, n)
{
    for(var i = 0; i < (n - txt.length); ++i){
        txt = "0" + txt;
    }
    return txt;
}

function toDateTimeString(date, hh, mm)
{
    var txt = "";

    //date
    if(date){
       var yyyy = date.getFullYear().toString();
       var mon = (date.getMonth()+1).toString(); // getMonth() is zero-based
       var dd  = date.getDate().toString();
       //var hh = date.getHours().toString();
       //var mm = date.getMinutes().toString();
       txt = yyyy + '-' + padZero(mon, 2) + '-' + padZero(dd, 2) + 'T';
    }

    //time
    txt += padZero(hh, 2) + ":" + padZero(mm, 2) + ":00+08:00";

    return txt
}

function genTimeTag(date, hh, mm)
{
    if(date || hh || mm){
        var dt_str = toDateTimeString(date, hh, mm);
        return '<time datetime="' + dt_str + '">';
    }

    return '<time>';
}

function addTimeTag(line, date)
{
    var regex = /^(\d\d):?(\d\d)([~-]\d\d)?:?(\d\d)?(\D)/;
    line = line.replace(regex, function(match, hh, mm, hh2, mm2, de2, offset, s){
        //end time
        if(hh2){
            var de = hh2[0];
            hh2 = hh2.substr(1);
            if(!mm2){
                mm2 = hh2;
                hh2 = hh;
            }
        }

        //add time tag
        var res = genTimeTag(date, hh, mm) + hh + mm + '</time>';
        if(hh2)
            res += de + genTimeTag(date, hh2, mm2) + hh2 + mm2 + '</time>';
        res += de2;
        return res;
    });

    return line;
}

function addRecTimeClass(line)
{
    var orig_line = line;
    var trim_line = line.trim();

    if(!trim_line)
        return "";
    
    if(orig_line.startsWith(' '))
        return '<div class="rec-timethru">' + trim_line + '</div>';
    else
        return '<div class="rec-timestamp">' + trim_line + '</div>';
}

function formatRecTag(txt, date)
{
    var lines = txt.split(/[\r\n]+/);

    var res = "";
    for(var i = 0; i < lines.length; ++i){
        var line = lines[i];
        line = addTimeTag(line, date);
        line = addRecTimeClass(line);
        res += line;
    }
    return res;
}

//gen <div class="rec-content">, from content and title elemnt
function genRecContentElem(content, title, base_date)
{
    //parse date from title_elem
    var day = getDay(title.innerHTML);
    if(day != null){
        //retag content_elem and as title_elem's child
        var date = (base_date)? base_date.addDays(day): null;
        var content_txt = formatRecTag(content.innerHTML, date);

        var elem = document.createElement("DIV");
        elem.className += "rec-content ";
        elem.innerHTML = content_txt;
        return elem;
    }

    return null;
}

function getStartDate(txt)
{
    var re = /\d\d\d\d[\/.-]\d{1,2}[\/.-]\d{1,2}/m;
    var arr =  txt.match(re);
    if(arr && arr.length >= 1){
        var date = arr[0].replace(/\//g, '-');
        return new Date(date);
    }

    return null;
}

function getDay(txt)
{
    var re = /D(\d+)\s/
    var arr = txt.match(re);
    if(arr && arr.length >= 2){
        return parseInt(arr[1]);
    }

    return null;
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function setRecContent(elem, html)
{
    elem.innerHTML = html.replace(/<pre><code>/g, "<article>").replace(/<\/code><\/pre>/g, "</article>");

    //get start day
    var start_date = (elem.firstChild)? getStartDate(elem.firstChild.innerHTML): null;
    var base_date = start_date? start_date.addDays(-1): null;
    console.log("base_date: " + base_date);

    for(let i = 0; i < elem.children.length; ++i){
        const curr = elem.children[i];
        const last = (i == 0)? null: elem.children[i-1];

        if(curr.tagName == "ARTICLE"){
            //the rec per day, replace 'article' by 'content' elemnt
            if (last && last.tagName == "H2"){
                var content_elem = genRecContentElem(curr, last, base_date);
                if(content_elem != null)
                    elem.replaceChild(content_elem, curr);
            }
            //normal
            else{
                curr.innerHTML = curr.innerHTML.replace(/[\r\n]+/g, '<BR>');
            }
        }
    }
}

function loadText(elem, fname)
{
    fetch(fname, {contentType: "text/plain;charset=UTF-8;"})
        .then(function(res){
            res = formatRecTag(res);
            elem.innerHTML = "<pre>" + res + "</pre>";
        })
        .catch(function(err){
            elem.innerHTML = "Record not found";
        });
}

function setRecNotFounc(recElem)
{
    recElem.innerHTML = "[Record not found]";
    document.getElementById('download_rec').hidden = true;
    document.getElementById("container").style.display = "flex";
    document.getElementById("container").style["flex-flow"] = "column";
    document.getElementById("rec").style.flex = "none";

    const map_elem = document.getElementById("map");
    if(map_elem){
        map_elem.style.position = "static";
        map_elem.style.flex = "auto";
        map_elem.style.width = "100%";

        const gmap = document.getElementById('gmap');
        const rec = document.getElementById('rec');
        const adjust_height = gmap.scrollHeight - rec.scrollHeight - 40;
        gmap.style.height = `${adjust_height}px`;
    }
}

async function loadMarkdown(rec_file)
{
    const recElem = document.getElementById("rec");

    try{
        const resp = await fetch(rec_file, {contentType: "text/markdown;charset=UTF-8;"});
        if(!resp.ok)
            return setRecNotFounc(recElem);

        console.log(resp);
        const text = await resp.text();
        setRecContent(recElem, Markdown.toHTML(text));
        document.getElementById('download_rec').href = rec_file;
        setRecTimestampFocus();
    }
    catch(err){
        console.log(err);
        setRecNotFounc(recElem);
    }
}

// TODO @id -> @mdUrl
export function loadRec(id)
{
    if(!id){
        rec.innerHTML = "No such record.";
        return;
    }

    loadMarkdown(`data/treks/${id}.md`);
    loadMap(`data/treks/${id}.gpx`)

    //const rec_txt = "data/treks/" + id + ".txt";
    //loadText(rec, rec_txt);
}

function setRecTimestampFocus()
{
    document.querySelectorAll(".rec-timestamp").forEach(elem => {
        const time = elem.getElementsByTagName('time');
        if(time && time.length > 0){
            const dt_str = time[0].getAttribute('datetime');
            if (dt_str)
                elem.addEventListener('click', () => focusLocation(dt_str));
        }
    });
}

function focusLocation(dt_str)
{
    var dt = new Date(dt_str);
    var loc = Gpxparser.lookupLocation(dt);
    Gmap.setCenter(loc);
}

function getId()
{
    var id = location.hash;
    if(id.startsWith('#'))
        id = id.substr(1)
    return id;
}