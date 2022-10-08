'use strict';

import './css/coursee-md.css';
import './css/editor.css';
import './js/coursee';
import {GPXParser} from './loadgpx';
import * as googleMaps from 'google-maps-api';
import * as templates from './templates';
import * as moment from 'moment-timezone';
import { innerElement } from './dom-utils';
import { markdownElement } from './m2h';
import * as monaco from 'monaco-editor';
import { initVimMode, VimMode } from 'monaco-vim';
import * as path from 'path';

const AUTO_SAVE_DELAY = 5000;  //ms

// utils ================================
Date.prototype.addDays = function(days) {
    var result = new Date(this);
    result.setDate(result.getDate() + days);
    return result;
}

async function putJson(url, obj){
    try{
        const resp = await fetch(url, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
                //'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: JSON.stringify(obj),
        });
        return resp.json();
    }
    catch(error){
        console.error(error);
        return {error};
    }
}

const _upload_file_timers = {};
function uploadFileLazy(fpath, text, ms, callback) {
    //clear old timer if any
    const last = _upload_file_timers[fpath];
    if(last){
        clearTimeout(last);
        delete _upload_file_timers[fpath];
    }

    const action = async() => {
        console.log(`save path [${fpath}]: data: ${text.length}: [${text.substring(0, 15)}...]`);
        const resp = await putJson(`/upload/${fpath}`, { text });
        console.log("save resp: ", resp);
        delete _upload_file_timers[fpath];
        callback();
    };

    //if(ms == 0)
    //    action();   //do it right away, no timer cached
    //else
        _upload_file_timers[fpath] = setTimeout(action, ms);
}

// map ===============================
async function initMap(gpx, mapElem){
    mapElem.classList.remove('hide');
    const container = document.querySelector('#map');
    container.hidden = true;

    await googleMaps({
        key: 'AIzaSyDoRAou_pmXgeqexPAUlX3Xkg0eKJ_FMhg',
        language: 'zh-TW',
    })();

    const map = new google.maps.Map(mapElem, {
        center: {lat: 24.279609, lng: 121.025882},
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        zoom: 15
    });

    const parser = new GPXParser(gpx, map);
    parser.setTrackColour("#ff0000");      // Set the track line colour
    parser.setTrackWidth(5);               // Set the track line width
    parser.setMinTrackPointDelta(0.0001);   // Set the minimum distance between track points
    parser.centerAndZoom();
    parser.addTrackpointsToMap();          // Add the trackpoints
    parser.addWaypointsToMap();            // Add the waypoints

    container.hidden = false;

    return [parser, map];
}

function setMapNotFound(mapElem, errmsg)
{
    mapElem.innerHTML = errmsg;
    document.getElementById('download-trk').hidden = true;
}

// return a handler for GPX/Map
async function loadMap(url)
{
    document.getElementById('download-trk').href = url;

    const mapElem = document.getElementById('map-content');
    try{
        const resp = await fetch(url, { method: 'get', dataType: 'xml' });
        if(!resp.ok)
            return setMapNotFound(mapElem, 'Gpx Not Found');

        const text = await resp.text();
        const xml = (new window.DOMParser()).parseFromString(text, 'text/xml');
        const [gpxparser, map] =  await initMap(xml, mapElem);

        return {
            locate: (time) => {
                const loc = gpxparser.lookupLocation(time);
                map.setCenter(loc);
            }
        };
    }
    catch(err){
        console.log(mapElem, err);
        setMapNotFound(`Error to init Google Map: ${err}`);
        return null;
    }
}

// rec ==============================================
function toTimeStr(date, hh, mm)
{
    return (date || hh || mm) ? toDateTimeString(date, hh, mm) : '';
}

function addTimeTag(line, date)
{
    const data = parseRecLine(line, date);
    if(data.time2)
        return templates.toTimestamp2(data);
    else if(data.time1)
        return templates.toTimestamp(data);
    else 
        return templates.toTimethru(data);
}

function parseRecLine(line, date)
{
    const regex = /^(\d\d):?(\d\d)([~-]\d\d)?:?(\d\d)?(.*)/;
    const matches = line.match(regex);
    if(!matches)
        return {content: line.trim()};

    let [_, hh, mm, hh2, mm2, content] = matches;
    content = content.trim();
    const time1 = toMoment(date, hh, mm);
    if(!hh2)
        return {time1, content};

    const delimiter = hh2[0];
    hh2 = hh2.substr(1);
    if(!mm2){
        mm2 = hh2;
        hh2 = hh;
    }
    const time2 = toMoment(date, hh2, mm2);
    return { time1, delimiter, time2, content };
}

function toMoment(date, hh, mm){
    return moment([date.getFullYear(), date.getMonth(), date.getDate(), hh, mm ])
}

function formatRecTag(txt, date)
{
    const lines = txt.split(/[\r\n]+/);
    return lines.reduce((acc, line) => acc + addTimeTag(line, date), '');
}

function loadText(elem, fname)
{
    fetch(fname, {contentType: "text/plain;charset=UTF-8;"})
        .then(function(res){
            res = formatRecTag(res);
            elem.innerHTML = "<pre>" + res + "</pre>";
        })
        .catch(function(err){
            elem.innerHTML = "Record Not Found";
        });
}

function setRecNotFound(recElem, msg)
{
    recElem.innerHTML = msg;
    document.getElementById('download-rec').hidden = true;

    //adjust rec section
    document.getElementById("container").style.display = "flex";
    document.getElementById("container").style["flex-flow"] = "column";
    document.getElementById("rec").style.flex = "none";

    //adjust map section
    const mapElem = document.getElementById("map");
    mapElem.style.position = "static";
    mapElem.style.flex = "auto";
    mapElem.style.width = "100%";

    const map = document.getElementById('map-content');
    const adjust_height = map.scrollHeight - recElem.scrollHeight - 40;
    map.style.height = `${adjust_height}px`;
}

// TODO @name -> @mdUrl
export async function loadRec(name)
{
    if(!name){
        rec.innerHTML = "No such record.";
        return;
    }

    const gpxPath = `data/${name}/course.gpx`;
    const mdPath = `data/${name}/course.md`;

    setMarkdownDownload(mdPath);
    loadMarkdown(mdPath);
    /*
    const [ mapHandler, _ ] = await Promise.all([
        loadMap(gpxPath),
        loadMarkdown(mdPath),
    ]);

    if(mapHandler)
        setRecTimestampFocus(mapHandler);
    */
}

function setMarkdownDownload(mdPath)
{
    const el = document.getElementById('download-rec');
    el.href = mdPath;
    el.download = decodeURI(mdPath.split('/')[1]) + ".md";   // data/<name>/course.md
}

async function loadMarkdown(mdPath)
{
    try{
        //fetch
        const resp = await fetch(mdPath, {contentType: "text/markdown;charset=UTF-8;"});
        if(!resp.ok)
            throw new Error(`Markdown '${mdPath}' not found`);
        const text = await resp.text();

        //markdown editor
        initEditor(mdPath, text);

        //markdown -> html element
        innerElement(document.getElementById("rec"), markdownElement(text, {
            host: path.dirname(window.location.href),
            dir: path.dirname(mdPath),
        }));

        //init status
        document.getElementById('toolbar-both').click();
    }
    catch(err){
        console.error(err);
        return setRecNotFound(document.getElementById("rec"), `Load Rec Error: ${err}`);
    }
}

let _editor_content_changed = false;

function _upload_file(fpath, text, ms){
    uploadFileLazy(fpath, text, ms, ()=>{
        _editor_content_changed = false;
    });
}

let _editor_vim_plugin;
function initEditor(fpath, text)
{
    //editor
    const editor = monaco.editor.create(document.getElementById('editor-content'), {
        value: text,
        language: 'markdown',
        minimap: {
            enabled: false,
        },
        theme: "vs-dark",
        fontSize: 14,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        });
    editor.focus();
    editor.onDidChangeModelContent(e => {
        _editor_content_changed = true;
        _upload_file(fpath, editor.getValue(), AUTO_SAVE_DELAY);
    });

    //vim plugin
    const vim = initVimMode(editor, document.getElementById('editor-status'))
    VimMode.Vim.defineEx('write', 'w', function() {
        _upload_file(fpath, editor.getValue(), 0);
    });

    //save on exit if changed
    window.addEventListener('beforeunload', ()=>{
        if(_editor_content_changed)
            _upload_file(fpath, editor.getValue(), 0);
    })

    //vim plugin
    VimMode.Vim.defineEx('write', 'w', function() {
        _upload_file(fpath, editor.getValue(), 0);
    });

    window.setEditorVim = (target) => {
        target.classList.toggle('vim');
        const enabled = target.classList.contains('vim');

        if(enabled){
            _editor_vim_plugin = initVimMode(editor, document.getElementById('editor-status'))
        }
        else if(_editor_vim_plugin){
            _editor_vim_plugin.dispose();
            _editor_vim_plugin = null;
        }
    };
}

function setRecTimestampFocus(mapHandler)
{
    document.querySelectorAll(".rec-timestamp").forEach(elem => {
        const timeElem = elem.querySelector('time');
        if(!timeElem) return;
        const timeStr = timeElem.getAttribute('datetime');
        if(!timeStr) return;
        const date = new Date(timeStr);
        elem.addEventListener('click', () => mapHandler.locate(date));
    });
}