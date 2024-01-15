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
import Cookies from 'js-cookie';

const AUTO_SAVE_DELAY = 5000;  //ms

// utils ================================

// Get the index of the element with minimum value
//   @peak_last: true: if there are multiple elements with the minimum value, return the index of the last element.
//               false: otherwise, return the index of the first element;
function indexOfMin(arr, peak_last){
    if(!arr || arr.length <= 0) return -1;
    const less_than = peak_last? (v1, v2) => v1 <= v2:
                                 (v1, v2) => v1 <  v2;

    let idx = 0;
    for(let i = 1; i < arr.length; ++i){
        if(less_than(arr[i], arr[idx]))
            idx = i;
    }
    return idx;
}

function str2bool(value, defval) {
    if(value === undefined)
        return defval;
    return value.toLowerCase() === "true";
}

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
        const resp = await putJson(fpath, { text });
        delete _upload_file_timers[fpath];
        callback(resp);
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
    document.getElementById("viewer").style.flex = "none";

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
export async function loadCourse(name)
{
    if(!name)
        return alert("No such record.");

    const gpxPath = `/data/${name}/course.gpx`;
    const mdPath = `/data/${name}/course.md`;

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

function addPx(px, val){
    if(!val)
        return px;
    px = px? parseInt(px.replace(/px$/, '')): 0;
    return `${px+val}px`;
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

        //init layout
        const editor = initEditor(fpath, text);
        const viewer = initViewer(fpath, text);
        viewer.focus(); //or, editor.focus();

        //init status
        const editor_vim = str2bool(Cookies.get('coursee-editor-vim'), false);
        const sync_scroll = str2bool(Cookies.get('coursee-sync-scroll'), true);
        let layout_mode = Cookies.get('coursee-layout-mode');
        if(!['view', 'edit', 'both'].includes(layout_mode))
            layout_mode = 'both';  //default

        if(sync_scroll)  document.getElementById('toolbar-sync').click();
        if(editor_vim)   document.getElementById('editor-vim').click();
        selectMode(layout_mode);
    }
    catch(err){
        console.error(err);
        return setRecNotFound(document.getElementById("viewer-content"), `Load Rec Error: ${err}`);
    }
}


let _focus_elem = 'viewer';  // sync from viewer for the first place

const _sync_scroll_context = {
    is_enabled: false,
    viewer: {
        top_line: 1,
        scrollToLine: undefined,
        //line_elems: undefined,
    },
    editor: {
        top_line: 1,
        scrollToLine: undefined,
    },
}

function initViewer(fpath, text)
{
    const viewer = document.getElementById("viewer-content");

    setViewer = (txt) => {
        innerElement(viewer, markdownElement(txt, {
            host: path.dirname(window.location.href),
            dir: path.dirname(fpath),
            nav_collapse: str2bool(Cookies.get('coursee-nav-collapse'), false),
        }));
        //_sync_scroll_context.viewer.line_elems = Array.from(viewer.querySelectorAll('[data-source-line]'))
        //                        .sort((e1, e2) => e1.dataset.sourceLine - e2.dataset.sourceLine);
                                //.filter((e, idx, arr) => !(idx > 0 && e.dataset.sourceLine == arr[idx-1].dataset.sourceLine));  // to unique
                                // ^filter^ is not mandatory; also, more elements with source-line info, even the same line number, improves scroll granularity
    }

    setViewer(text);

    //sync croll =======
    viewer.addEventListener("scroll", () => {
        updateScrollStatus('viewer', getTopVisibleLine(viewer));
    });
    viewer.addEventListener('focus', () => { _focus_elem = 'viewer'; });
    viewer.addEventListener('mouseover', () => { _focus_elem = 'viewer'; });

    _sync_scroll_context.viewer.scrollToLine = (num) => {
        //const el = _sync_scroll_context.viewer.line_elems.find(e => e.dataset.sourceLine == num)
        const el = viewer.querySelector(`[data-source-line="${num}"]`);
        if(!el) return;
        el.scrollIntoView({
            behavior: "auto",
            block: "start",
            inline: "nearest",
        });
    };

    // boundary bar =========
    let boundary_x;
    const boundary = document.getElementById('viewer-boundary');
    boundary.addEventListener('mousedown', e => { boundary_x = e.clientX; }, true);
    document.addEventListener('mouseup', e => boundary_x = undefined, true);
    document.addEventListener('mousemove', e => {
        e.preventDefault();
        if (boundary_x){
            const diff = e.clientX - boundary_x;
            boundary_x = e.clientX;
            tuneBoundary(diff);
        }
    }, true);

    return viewer;
}

//TODO: more efficient way to do this?
//  e.g. search from the last top line elment, instead from begining.
function getTopVisibleLine(viewer) {
    const rect_v = viewer.getBoundingClientRect();
    const distance = (el) =>{
        const rect = el.getBoundingClientRect();
        if(rect.bottom <= rect_v.top || rect.top >= rect_v.bottom)  //not visible
            return Infinity;
        return 10000 * (rect.top < rect_v.top? 0: 1) +   // prefer the element cross the top
               Math.min(Math.abs(rect.top - rect_v.top), Math.abs(rect.bottom - rect_v.top));
    }

    /*
    const line_elems = _sync_scroll_context.viewer.line_elems;
    const idx = indexOfMin(line_elems.map(distance), true);
    return idx < 0? 0: line_elems[idx].dataset.sourceLine;

    */
    let min = Infinity;
    let elem = null;
    viewer.querySelectorAll('[data-source-line]').forEach(el => {
        const v = distance(el);
        if(v <= min) {         //if multiple elements with the min distance, choose the last one
            min = v;
            elem = el;
        }
    });
    return elem? elem.dataset.sourceLine : 0;
}


function tuneBoundary(diff)
{
    const tuneLeft = el => el.style.left = `${el.offsetLeft + diff}px`;
    const tuneWidthL = el => el.style.width = `${el.offsetWidth + diff}px`;
    const tuneWidthR = el => el.style.width = `${el.offsetWidth - diff}px`;

    tuneWidthL(document.getElementById('editor-content'));
    tuneWidthL(document.getElementById('editor-status'));
    tuneLeft(document.getElementById('toolbar-sync'));
    tuneLeft(document.getElementById('viewer'));
    tuneWidthR(document.getElementById('viewer-content'));
    //document.getElementById('editor-status').style.width = document.getElementById('editor-content').style.width;
}

let _editor_content_changed = false;
let _editor_vim_plugin = null;

function uploadFile(fpath, text, ms){
    uploadFileLazy(fpath, text, ms, (resp)=>{
        _editor_content_changed = !resp.done;
        if(!resp.done)
            console.error('save resp error', resp.error);
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
        fontSize: 15,
        fontFamily: '等距更紗黑體 TC,Noto Sans Mono CJK TC,Noto Sans Mono TC,monospace',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        //wordWrap: 'wordWrapColumn',
        //wordWrapColumn: 60,
        //wrappingIndent: 'indent',
    });
    editor.onDidChangeModelContent(e => {
        _editor_content_changed = true;
        const text = editor.getValue();
        setViewer(text);   //refresh viewer
        syncTargetScroll();  //try to put the viewer in the fixed position
        uploadFile(fpath, text, AUTO_SAVE_DELAY);
    });

    editor.onDidScrollChange(function (e) {
        updateScrollStatus('editor', editor.getVisibleRanges()[0].startLineNumber);
      });

    editor.onDidFocusEditorWidget((e) => { _focus_elem = 'editor'; });
    editor.onMouseMove((e)=>{ _focus_elem = 'editor'; })

    _sync_scroll_context.editor.scrollToLine = (num) => {
        const line_height = editor.getOption(monaco.editor.EditorOption.lineHeight);
        editor.setScrollTop((num-1) * line_height);
    }

    //save on exit if changed
    window.addEventListener('beforeunload', ()=>{
        if(_editor_content_changed)
            uploadFile(fpath, editor.getValue(), 0);
    })

    //vim plugin
    VimMode.Vim.defineEx('write', 'w', function() {
        uploadFile(fpath, editor.getValue(), 0);
    });

    // register editor methods
    window._editor = {
        setVimMode: (enabled) => {
            if (enabled) {
                _editor_vim_plugin = initVimMode(editor, document.getElementById('editor-status'))
            }
            else if (_editor_vim_plugin) {
                _editor_vim_plugin.dispose();
                _editor_vim_plugin = null;
            }
        },
        insertText: (text, src=null) => {
            let selection = editor.getSelection();
            let id = { major: 1, minor: 1 };
            let op = {identifier: id, range: selection, text, forceMoveMarkers: true};
            editor.executeEdits(src, [op]);
        }
    };

    return editor;
}

function updateScrollStatus(owner, lineno){
    // check if line changed
    if(!lineno) return;
    if(_sync_scroll_context[owner].top_line == lineno) return;
    _sync_scroll_context[owner].top_line = lineno;

    // sync the editor
    if(owner != _focus_elem) return;  // scroll not control by myself
    syncTargetScroll();
}

function syncTargetScroll(){
    if(!_sync_scroll_context.is_enabled) return;
    const lineno = _sync_scroll_context[_focus_elem].top_line;
    const target = (_focus_elem == 'viewer')? 'editor': 'viewer';
    //console.log(`${_focus_elem}: scroll ${target} from ${_sync_scroll_context[target].top_line} to line: ${lineno}`);
    _sync_scroll_context[target].scrollToLine(lineno);
}

window._setSyncScroll = (enabled)=>{
    _sync_scroll_context.is_enabled = enabled;
    syncTargetScroll();
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