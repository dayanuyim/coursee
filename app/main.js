'use strict';

import './css/coursee-md.css';
import './css/editor.css';
import './js/coursee';
import {GPXParser} from './loadgpx';
import * as googleMaps from 'google-maps-api';
import * as templates from './templates';
import * as moment from 'moment-timezone';
import { innerElement, isInViewport } from './dom-utils';
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
        //console.log(`save path [${fpath}]: data: ${text.length}: [${text.substring(0, 15)}...]`);
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

function setMarkdownDownload(fpath)
{
    const el = document.getElementById('download-rec');
    el.href = fpath;
    el.download = decodeURI(fpath.split('/')[1]) + ".md";   // data/<name>/course.md
}

let setViewer;
async function loadMarkdown(fpath)
{
    try{
        //fetch
        const resp = await fetch(fpath, {contentType: "text/markdown;charset=UTF-8;"});
        if(!resp.ok)
            throw new Error(`Markdown '${fpath}' not found`);
        const text = await resp.text();

        //markdown editor
        initEditor(fpath, text);

        //markdown viewer
        initViewer(fpath, text);

        //init status
        //TODO: set by coockie
        document.getElementById('toolbar-both').click();
        document.getElementById('toolbar-sync').click();
    }
    catch(err){
        console.error(err);
        return setRecNotFound(document.getElementById("rec-content"), `Load Rec Error: ${err}`);
    }
}

let _sync_scroll_from;
let _focus_elem;
let _is_sync_scroll = false;;

let _viewer_top_line_num;
function initViewer(fpath, text)
{
    const viewer = document.getElementById("rec-content");
    const opt = {
        host: path.dirname(window.location.href),
        dir: path.dirname(fpath),
    };
    setViewer = txt => innerElement(viewer, markdownElement(txt, opt));

    setViewer(text);

    const line_elems = Array.from(document.querySelectorAll('[data-source-line]'))
                            .sort((e1, e2) => e1.dataset.sourceLine - e2.dataset.sourceLine)
                            .filter((e, idx, arr) => !(idx > 0 && e.dataset.sourceLine == arr[idx-1].dataset.sourceLine));

    viewer.addEventListener("scroll", function(){
        _focus_elem = 'viewer';
        syncEditorScroll(getTopVisibleLine(line_elems));
    });

    /*
    viewer.addEventListener('focus', () => {
        console.log('focus viewer');
    });
    */
}

function getTopVisibleLine(line_elems) {
    for(const el of line_elems) {
        if(isInViewport(el))
            return el.dataset.sourceLine;
    }
    return 0;
}

let _editor_content_changed = false;
let _editor_vim_plugin;
let _editor_top_line_num;
let scrollEditorToLine;

function _upload_file(fpath, text, ms){
    uploadFileLazy(fpath, text, ms, ()=>{
        _editor_content_changed = false;
    });
}

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
        const text = editor.getValue();
        setViewer(text);   //refresh viewer
        _upload_file(fpath, text, AUTO_SAVE_DELAY);
    });

    editor.onDidScrollChange(function (e) {
        _focus_elem = 'editor';
        syncViewerScroll(editor.getVisibleRanges()[0].startLineNumber);
      });

    /*
    editor.onDidFocusEditorWidget((e) => {
        console.log('focus editor');
    });
    */

    scrollEditorToLine = function(num){
        const line_height = editor.getOption(monaco.editor.EditorOption.lineHeight);
        editor.setScrollTop((num-1) * line_height);
    }

    //save on exit if changed
    window.addEventListener('beforeunload', ()=>{
        if(_editor_content_changed)
            _upload_file(fpath, editor.getValue(), 0);
    })

    //vim plugin
    VimMode.Vim.defineEx('write', 'w', function() {
        _upload_file(fpath, editor.getValue(), 0);
    });

    window._setEditorVim = (enabled) => {
        if(enabled){
            _editor_vim_plugin = initVimMode(editor, document.getElementById('editor-status'))
        }
        else if(_editor_vim_plugin){
            _editor_vim_plugin.dispose();
            _editor_vim_plugin = null;
        }
    };
}

function syncViewerScroll(lineno){
    // check if fired by human or program
    if(_sync_scroll_from){
        //console.log(`editor: ignore fired from ${_sync_scroll_from}`);
        return _sync_scroll_from = undefined;
    }

    // check if line changed
    if(!lineno) return;
    if(_editor_top_line_num == lineno) return;
    _editor_top_line_num = lineno;   //line is changed
    if(!_is_sync_scroll) return;

    // sync the editor
    //console.log('editor: scroll viewer to line: ' + lineno);
    _sync_scroll_from = 'editor';
    scrollViewerToLine(lineno);
}

function syncEditorScroll(lineno){
    // check if fired by human or program
    if(_sync_scroll_from){
        //console.log(`viewer: ignore fired from ${_sync_scroll_from}`);
        return _sync_scroll_from = undefined;
    }

    // check if line changed
    if(!lineno) return;
    if(_viewer_top_line_num == lineno) return;
    _viewer_top_line_num = lineno;
    if(!_is_sync_scroll) return;

    // sync the editor
    //console.log('viewer: scroll editor to line: ' + lineno);
    _sync_scroll_from = 'viewer';
    scrollEditorToLine(lineno);
}

window._setSyncScroll = (enabled)=>{
    _is_sync_scroll = enabled;
    if(!enabled) return;

    if(_focus_elem == 'viewer'){
        _sync_scroll_from = 'viewer';
        scrollEditorToLine(_viewer_top_line_num);
    }
    else{
        _sync_scroll_from = 'editor';
        scrollViewerToLine(_editor_top_line_num);
    }
}

function scrollViewerToLine(num){
    const el = document.body.querySelector(`[data-source-line='${num}'`);
    //console.log(el, el.scrollTop, el.scrollLeft, el.scrollWidth);
    if(el){
        el.scrollIntoView({
            behavior: "auto",
            block: "start",
            inline: "nearest",
        });
    }
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