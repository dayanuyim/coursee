import * as templates from './templates';
import { htmlToElement} from './dom-utils';
import { joinpath} from './utils';
import BiMap from 'bidirectional-map';

function partition(array, filter) {
    let pass = [], fail = [];
    array.forEach((e, idx, arr) => (filter(e, idx, arr) ? pass : fail).push(e));
    return [pass, fail];
  }

// svg utils ===================================
// prefer to using cls with css to define style
const SVG_NS = "http://www.w3.org/2000/svg";

function _svg_element(name, cls, opts){
    const elem = document.createElementNS(SVG_NS, name);
    if(cls)
        elem.classList.add(...cls.split(' '));
    for (const [key, value] of Object.entries(opts))
        elem.setAttribute(key, value);
    return elem;
}

/*
function svg_polygon(xlist, ylist, cls){

    const coords = [];
    for(let i = 0; i < xlist.length; i++)
        coords.push(`${xlist[i]},${ylist[i]}`);

    return _svg_element("polygon", cls, {
        points: coords.join(' '),
    });
}
*/

function svg_polygon(xylist, cls){
    const coords = xylist.map(({x, y}) => `${x},${y}`);
    return _svg_element("polygon", cls, {
        points: coords.join(' '),
    });
}

//<line stroke="gray" x1="100" y1="500" x2="725" y2="500"/>
function svg_line(x1, y1, x2, y2, cls){
    return _svg_element("line", cls, { x1, y1, x2, y2, });
}

function svg_circle(x, y, cls){
    return _svg_element("circle", cls, {
        cx: x,
        cy: y,
        r: 2,
    });
}

function svg_text(x, y, txt, cls){
    const text = _svg_element("text", cls, {x, y});
    text.textContent = txt;
    return text;
}

function minMax(arr){
    let min = null;
    let max = null;
    arr.forEach(v => {
        if(v == null) return;
        if(min == null || v < min) min = v;
        if(max == null || v > max) max = v;
    });
    return [min, max];
}

function floor(num, step){
    return Math.floor(num / step) * step;
}

function ceil(num, step){
    return Math.ceil(num / step) * step;
}

function replaceRange(s, begin, end, s2){
    return s.substring(0, begin) + s2 + s.substring(end);
}

function splitTimePeriod(period){
        if(!period)
            return [null, null];

        let [t1, t2] = period.split('~');
        if(t2 && t2.length == 2)
            t2 = t1.substring(0, 2) + t2;
        return [t1, t2];
}

function timestr2min(str){
    if(str == null) return null;
    return str.substring(0, 2) * 60 + parseInt(str.substring(2, 4));
}

//return: 2: not adjacent
//       -1: adjacent to the previous year, e.g. base=1, other=12
//        0: adjacent the same year
//        1: adjacent to the next year, e.g. base=12, other=1
function cmpAdjacentMonth(base, other, diff){
    if(base < 1 || base > 12) return 2;
    if(other < 1 || other > 12) return 2;
    const diff1 = Math.abs(base - other);
    if(diff1 <= diff) return 0;

    //wrap
    const diff2 = 12 - diff1;
    if(diff2 <= diff) return other > base? -1: 1

    return 2;
}

function fillLostData(data, valspan, maxstep)
{
    valspan = valspan || 0;
    maxstep = maxstep || 0;

    const idx_h = data.findIndex(v => v != null);

    //no any time info
    if(idx_h < 0){
        const step = Math.floor(Math.min(valspan / data.length, maxstep));
        for(let i = 0; i < data.length; i++)
            data[i] = i * step;
        return data;
    }

    //fill head / tail null
    const idx_t = data.findLastIndex(v => v != null);
    const step = Math.floor(Math.min(valspan/data.length, data[idx_h]/idx_h, maxstep));  // min(average, non-zero, maxstep)
    for(let i = idx_h - 1; i >= 0; i--)
        data[i] = data[i+1] - step;
    for(let i = idx_t + 1; i < data.length; i++)
        data[i] = data[i-1] + step;

    //interpolate for null datum
    for(let i = idx_h + 1; i < idx_t; i++){
        if(data[i])
            continue;

        // next non-null datum
        let j = i + 1;
        while(data[j] == null) j++;

        //interpolation
        const step = Math.floor((data[j] - data[i-1]) / (j - i + 1));
        for(; i < j; ++i)
            data[i] = data[i-1] + step;
    }

    return data;
}

//predefined section names
const Sec_name = new BiMap({
    todo: "待辦事項",
    weather:  "天氣預報",
    doc: "文件",
    mapx: "地圖",
    'trk-plan': "預計行程",
    'trk-backup': "備案行程",
    'trk-facto': "實際行程",
    'trk-rec': "行程記錄",
    epilogue: "後記",
    info: "行程資訊",
    transport: "交通",
    lodge: "住宿",
    'ref-rec': "參考記錄",
    'ref-trk': "參考行程",
});

//predefined weather names
const Weather_name = new BiMap({
    sun: "晴",
    wind: "風",
    cloud: "陰",
    "cloud-bolt": "雷",
    "cloud-rain": "雨",
    "cloud-sun-rain": "變",
    smog: "霧",
    snowflake: "雪",
});

// #####################################################

let _opt = null;
let _course_date;

function toCourseDate(day){
    if(!_course_date) return null;
    //const date = new Date(_course_date);
    //date.setDate(date.getDate() + (day-1));
    //return date;
    return new Date(_course_date.getTime() + (day-1)*86400*1000);
}

//wrapper
function getDay(date){
    return date? date.getDay(): '';
}

//configured markdown render
function mdRenderer(){
    return require('markdown-it')()
        .use(require('./markdown-it-inject-linenumbers'))
        .use(require('markdown-it-mark'))
        .use(require('markdown-it-ins'))
        .use(require('markdown-it-sup'))
        .use(require('markdown-it-sub'))
        .use(require('markdown-it-task-checkbox'))
        //.use(require("markdown-it-attrs"))
        .use(require('markdown-it-imsize'))
        .use(require("markdown-it-anchor").default, {
            slugify: s => (Sec_name.getKey(s) || 'sec') + '-header',
        })
        .use(require("markdown-it-link-attributes"), {
            attrs: {
                target: '_blank',
            }
        })
        .use(require("markdown-it-table-of-contents"), {
            containerClass: 'nav',
            includeLevel: [2, 3, 4],
        });
}

const _renderer = mdRenderer();

// #####################################################
//render markdown to html with customed extension
export function markdownHtml(markdown){
    let html = _renderer.render(markdown)
    //html = renderRecord(html);
    html = renderAltitude(html);
    html = renderWeather(html);
    html = renderTime(html);
    html = renderArrow(html);
    html = renderMap(html);
    return html;
}

export function markdownElement(markdown, opt)
{
    _opt = opt; //set options

    //amend markdown text ====
    markdown += '\n\n[[toc]]\n';

    //amend html text ====
    let html = markdownHtml(markdown);
    html = `<div>${html}</div>`;  //wrap to single element

    //amend dom element ========
    const  el = htmlToElement(html);
    extendHeader(el);
    extendNavigation(el.querySelector('.nav'));
    fixLocalPath(el);
    //extendAnchor(el);
    extendImage(el);
    extendSvg(el);
    // section context -------------
    extendSection(el);
    el.querySelectorAll('section').forEach(sec => {
        if(['trk-plan', 'trk-backup', 'trk-facto'].includes(sec.id) || sec.querySelectorAll('li code').length > 5)
            sec.querySelectorAll('h2+ul, h3+ul, h4+ul, h5+ul, h6+ul').forEach(ul => {
                extendRecBrief(ul);
            })
    });
    el.querySelectorAll('.trkseg').forEach(trkseg => {
        extendRecBriefChart(trkseg);
    });
    extendVehicle(el.querySelector('section#transport'));
    //renderRecContent(el);
    el.querySelectorAll('section').forEach(sec => {
        if(['trk-rec', 'ref-rec'].includes(sec.id))
            sec.querySelectorAll('h3+table').forEach(extendRecContent);
    });

    //el.classList.add('coursee-md');
    return el;
}

function extendHeader(el){
    if(!el) return;
    const h1 = el.querySelector('h1');
    if(!h1) return;
    //const [title, date] = h1.textContent.split(/[()]/);
    //header.outerHTML = `<header><h1>${title}</h1><span>${date}</span></header>`;   // move to template


    // create <header>
    const header = document.createElement('header');
    h1.insertAdjacentElement('beforebegin', header);

    // move possible <time> into <header>
    const time = h1.querySelector('time');
    if(time){
        header.insertAdjacentElement('afterbegin', time);
        h1.textContent = h1.textContent.replace(/\(\)/, ''); //remove possible empty (), due to <time> moved
    }

    // move <h1> into <header>
    header.insertAdjacentElement('afterbegin', h1);

    //set global date
    //_course_date = time? new Date(time.textContent): null;
}


function extendSection(el, level=2){
    if(!el) return;
    //workable but not accurate method:
    //return html.replace(/<h2>/g, "</section><section><h2>");

    const tag = `H${level}`; 

    //collect into groups according the to header level, and gen sections html
    const secs = [];
    let sec_html = '';
    for(let i = 0; i < el.children.length; ++i){
        const child = el.children[i];

        if(child.tagName == tag){ //new group
            secs.push([]);
            const id = Sec_name.getKey(child.textContent) || `sec${secs.length}`;
            sec_html += templates.section({id});
        }

        if(secs.length > 0)     //save to the current section
            secs[secs.length-1].push(child);
    }

    // create section elements
    el.insertAdjacentHTML('beforeend', sec_html);
    const sec_els = Array.from(el.querySelectorAll('section')).slice(-secs.length);   //ensure to get the last n sections

    // move elments into sections according to @groups
    for(let i = 0; i < secs.length; ++i){
        for(let j = 0; j < secs[i].length; ++j){
            sec_els[i].appendChild(secs[i][j]);
        }
    }
}

let _is_nav_dragging = false;
function extendNavigation(el){
    if(!el) return;

    //collapse button
    el.insertAdjacentHTML('afterbegin', templates.navCollapse({collapsed: _opt.nav_collapse}));
    el.classList.toggle('collapse', _opt.nav_collapse);

    //toc
    const toc = el.querySelector('ul');
    toc.classList.add('nav-toc');
    //toc.insertAdjacentHTML('afterbegin', templates.navPageBack());
    //utils
    el.insertAdjacentHTML('beforeend', templates.navUtils());

    //drag to move
    el.addEventListener('mousedown', e => _is_nav_dragging = true, true);
    document.addEventListener('mouseup', e => _is_nav_dragging = false, true);
    document.addEventListener('mousemove', e => {
        e.preventDefault();
        if (_is_nav_dragging){
            const rect = el.getBoundingClientRect();
            /*
            el.style.left = `${rect.x + e.movementX}px`;
            el.style.top = `${rect.y + e.movementY}px`;
            el.style.bottom = 'unset';
            el.style.right = 'unset';
            */
            el.style.left = 'unset';
            el.style.top = 'unset';
            el.style.right = `${window.innerWidth - rect.right - e.movementX}px`;
            el.style.bottom = `${window.innerHeight - rect.bottom - e.movementY}px`;
        }
    }, true);
}

function fixLocalPath(el)
{
    if(!el) return;

    el.querySelectorAll('img').forEach(img => img.src = _fixLocalPath(img.src));
    el.querySelectorAll('object').forEach(obj => obj.data = _fixLocalPath(obj.data));
}

function _fixLocalPath(url){
    if(!_opt || !_opt.host || !_opt.dir)
        return url;

    if(url.startsWith(_opt.host))
        url = url.substring(_opt.host.length);  // to relative path

    return url.startsWith("http")?
        url:
        joinpath(_opt.host, _opt.dir, url);
}

/*
function extendAnchor(el)
{
    if(!el) return;
    if(!_opt || !_opt.host) return;

    const bookmark_prefix = `${_opt.host}/#`;
    el.querySelectorAll('a').forEach(a => {
        if(a.href.startsWith(bookmark_prefix)) return;
        if(a.target) return;
        a.target = '_blank';
    })
}
*/

function extendImage(el)
{
    if(!el) return;
    el.querySelectorAll('img').forEach(img => {
        // create <figure>
        const fig = document.createElement('figure');
        img.insertAdjacentElement('beforebegin', fig);

        // move <img> and <figcaption> into <figure>
        if(img.alt)
            fig.insertAdjacentHTML('afterbegin', `<figcaption>${img.alt}</figcaption>`);
        fig.insertAdjacentElement('afterbegin', img);
    });
}

function extendSvg(el)
{
    if(!el) return;

    el.querySelectorAll('img').forEach(img => {
        //use <object> to load svg file
        if(img.src.toLowerCase().endsWith('.svg')){
            img.outerHTML = (img.width && img.height)?
                        templates.svgObject2({src: img.src, width: img.width, height: img.height}):
                        templates.svgObject({src: img.src});
        }
    });
}

function renderMap(html)
{
    //format: {map:<mapid>}
    //format: {map:<mapid>:<option>}
    return html.replace(/{map:(.*?)}/g, (orig, desc) => {
        const idx = desc.indexOf(":");
        const mapid = (idx >= 0)? desc.substring(0, idx): desc;
        const option = (idx >= 0)? desc.substring(idx + 1): null;

        if(mapid == 'trekkr'){
            const gpx = option? _fixLocalPath(option): null;
            return templates.map_trekkr({gpx});
        }
        //other maps...
        return orig;
    });
}

function renderTime(html)
{
    //try to get course date from header
    const matches = html.match(/<h1.*([12][90][0-9][0-9])-([01][0-9])-([0-3][0-9]).*<\/h1>/);
    if(matches){
        const [_, y, m, d] = matches;
        if(y > 2000 && m >= 1 && m <= 12 && d >= 1 && d <= 31)
            _course_date = new Date(y, m-1, d);  //m is index
    }

    return html.replace(/([12][90][0-9][0-9])-([01][0-9])-([0-3][0-9])/g, (orig, y, m, d) => {   // full date format
            if(y > 2000 && m >= 1 && m <= 12 && d >= 1 && d <= 31){
                const date = new Date(y, m-1, d);  //m is index
                return `<time data-weekday=${getDay(date)}>${orig}</time>`;
            }
            return orig;
        })
        .replace(/([01][0-9])\/([0-3][0-9])\(W\)/g, (orig, m, d) => {   // short date format
            if(_course_date && d >= 1 && d <= 31){
                const cmp = cmpAdjacentMonth(_course_date.getMonth(), m, 1);
                if(cmp <= 1){
                    const y = _course_date.getFullYear() + cmp;
                    const date = new Date(y, m-1, d);  //m is index
                    return `<time data-weekday=${getDay(date)}>${m}/${d}</time>`;
                }
            }
            return orig;
        })
        .replace(/<code>([0-9].*?)<\/code>/g, (orig, txt) => {   // normal time string
            if (!isTimeFormat(txt)) return orig;
            return `<time>${txt}</time>`;
        })
        /*
        .replace(/<td>([0-9].*?)<\/td>/g, (orig, txt) => {    // record timestamps
            if (!isTimeFormat(txt)) return orig;
            return `<td><time>${txt}</time></td>`;
        });
        */
}

function isTimeFormat(txt){
    if (txt.length == 4 && txt.match(/[0-2][0-9][0-5][0-9]/)) return true;                         //hhmm
    if (txt.length == 7 && txt.match(/[0-2][0-9][0-5][0-9]~[0-5][0-9]/)) return true;              //hhmm~mm
    if (txt.length == 9 && txt.match(/[0-2][0-9][0-5][0-9]~[0-2][0-9][0-5][0-9]/)) return true;    //hhmm~hhmm
    if (txt.match(/^[0-9]+m$/)) return true;
    return false;
}

function renderArrow(html)
{
    return html.replace(/-\((.*?)\)-&gt;/g, (orig, txt) => {   // normal time string
            return `<span class="arrow-legend">&nbsp;${txt}&nbsp;</span>&gt;`;
        });
}


//find last index of @ch out of @txt, but not in <tag>
function _lastIndexOf(txt, ch, idx){
    let level = 0;
    for(; idx >= 0; idx--){
        if(txt[idx] == '>')
            level++;
        else if(txt[idx] == '<')
            level--;
        else if(txt[idx] == ch && level == 0)
            break;
    }
    return idx;
}

//find index of @ch out of @txt, but not in <tag>
function _indexOf(txt, ch, idx){
    let level = 0;
    for(; idx < txt.length; idx++){
        if(txt[idx] == '<')
            level++;
        else if(txt[idx] == '>')
            level--;
        else if(txt[idx] == ch && level == 0)
            break;
    }
    return idx;
}

function extendRecBrief(el)
{
    if(!el) return;

    el.querySelectorAll('li').forEach(trkseg => {

        trkseg.classList.add('trkseg');

        //trkseg day ========
        let html = renderTrkDay(trkseg.innerHTML);

        //trkseg path =========
        let begin = html.indexOf('-&gt;');
        if(begin > 0){
            //range
            begin = _lastIndexOf(html, ' ', begin) + 1;  //if not found, set to index 0
            const end = _indexOf(html, ' ', begin);      //if not found, set to html.length

            //re-format
            const locs = html.substring(begin , end).split('-&gt;');
            html = replaceRange(html, begin, end, templates.trksegPath({locs}));
            //html = replaceRange(html, begin, begin, templates.trksegUtils());  //insert before trkseg-path
        }

        //trkseg util ========
        html += templates.trksegUtils();

        trkseg.innerHTML = html

        // default flag
        if(trkseg.querySelector('time')) // || trkseg.querySelector('.alt'))
            trkseg.classList.add('grid');
    });
}

function extendRecBriefChart(trkseg)
{
    //split loc to time, alt, name
    const locations = [];
    trkseg.querySelectorAll('.trkseg-path-loc').forEach(loc => {
        let time = loc.querySelector('time');
        if(time) time = time.textContent;
        let [time1, time2] = splitTimePeriod(time);  //time may be a period

        let alt = loc.querySelector('.alt');
        if(alt) alt = parseInt(alt.textContent);

        const name = Array.from(loc.childNodes)
                .filter(n => !(n.nodeType == Node.ELEMENT_NODE &&
                              (n.tagName.toLowerCase() == 'time' || n.classList.contains('alt'))))   //not time or altitude
                .map(n => n.textContent)
                .join('');

        locations.push([timestr2min(time1), alt, name]);
        if(time2)
            locations.push([timestr2min(time2), alt, null]); //nowhere(null locaiton name) means a stopover
    });

    //gen chart
    if(locations.length){
        const chart = genLocChart(locations);
        trkseg.insertAdjacentElement('beforeend', chart);
    }
}

function genLocChart(locations)
{
    //settings ------------
    const PADDING = 20;
    const X_SCALE = 1;
    const Y_SCALE = .1;
    const ALT_INTERVAL = 200;
    const ALT_SCALE = 100;

    // data --------------------------
    const times = fillLostData(locations.map(loc => loc[0]), 12*60, 90);
    const alts = fillLostData(locations.map(loc => loc[1]));

    const [time_min, time_max] = minMax(times);
    const [alt_min, alt_max] = minMax(alts);

    // coord --------------------------
    const to_x = time => Math.round(2*PADDING + X_SCALE * (time- time_min));
    const to_y = alt =>  Math.round(  PADDING + Y_SCALE * (alt_max - alt));   //flip

    const width = to_x(time_max) + 2*PADDING;  //add right padding
    const height = to_y(alt_min) + PADDING;    //add bottom padding

    const data = locations.map((loc, i) => ({
        x: to_x(times[i]),
        y: to_y(alts[i]),
        legend: loc[2],
    }));

    const alt_ylist = [];
    const top = alt_max + ALT_INTERVAL;
    for(let alt = floor(alt_min, ALT_SCALE); alt < top; alt += ALT_INTERVAL)
        alt_ylist.push({y: to_y(alt), legend: alt});

    return genLineChart(width, height, data, alt_ylist);
}

function genLineChart(width, height, data, ycoords)
{
    // utils
    const svg_shadow = function(start, stop, cls){
        const xylist = data.slice(start, stop+1);
        xylist.push({y: height, x: xylist[xylist.length-1].x});
        xylist.push({y: height, x: xylist[0].x});
        return svg_polygon(xylist, cls);
    }

    // svg
    const svg = _svg_element('svg', 'trkseg-chart', {
        viewBox: `0 0 ${width} ${height}`,
        width,
        //preserveAspectRatio: 'none',
    });

    const chart_inserts = elem => svg.insertAdjacentElement('afterbegin', elem);
    const chart_appends = elem => svg.insertAdjacentElement('beforeend', elem);

    // draw y-coord lines
    if(ycoords){
        const xmin = data[0].x;
        const xmax = data[data.length-1].x;
        ycoords.forEach(({y, legend}) => {
            chart_appends(svg_line(xmin, y, xmax, y, 'trkseg-chart-alt-line'));
            chart_appends(svg_text(xmin, y, legend, 'trkseg-chart-alt-legend'));
        });
    }

    // draw line
    for(let i = 1; i < data.length; ++i)
        chart_appends(svg_line(data[i-1].x, data[i-1].y, data[i].x, data[i].y, 'trkseg-chart-loc-path'));

    // draw locations or stopover shadows
    data.forEach(({x, y, legend}, i) => {
        if(!legend){   //stopover location
            chart_inserts(svg_shadow(i-1, i, 'trkseg-chart-shadow-stopover'));
            chart_appends(svg_text((data[i-1].x + x)/2, (y + height)/2, '⏳', 'trkseg-chart-loc-stopover'));
        }
        else{
            const place = (i == 0)? ' first': (i == data.length - 1)? ' last': '';
            chart_appends(svg_circle(x, y));
            chart_appends(svg_text(x, y, legend, 'trkseg-chart-loc-name' + place));
        }
    });

    // shadow for all
    chart_inserts(svg_shadow(0, data.length-1, 'trkseg-chart-shadow'));

    return svg;
}



// *NNNN* or <em>NNNN</em>
function renderAltitude(html)
{
    const to_altitue = (orig, alt) => {
        return `<em class="alt">${alt}</em>`;
    };

    html = html.replace(/\*(\d+)\*/g, to_altitue);
    html = html.replace(/<em>(\d+)<\/em>/g, to_altitue);
    return html;
}

function renderWeather(html){
    return html.replace(/{(.*?)}/g, (orig, value) => {
        const key = Weather_name.getKey(value);
        return key? `<i class="fa-solid fa-${key}" title="${value}"></i>`: orig;
    });
}

function renderTrkDay(html){

    return html.replace(/D(\d+) /, (orig, day) => {
            const date = toCourseDate(day);
            return `<span class="trkseg-day" data-weekday="${getDay(date)}">D${day}</span> `;
        });
}

function extendVehicle(el){
    if(!el) return;

    el.querySelectorAll('li').forEach(li => {
        li.innerHTML = li.innerHTML.replace(/{(.*?)}/g, (orig, value) => {
            return `<span class="vehicle">${value}</span>`;
        });
    });
}

function extendRecContent(el){
    el.classList.add('rec-content');
    el.querySelectorAll('td:first-child').forEach(td => {
        if(td.textContent)
            td.innerHTML = `<time>${td.textContent}</time>`;
    });
}

///////// orignal rec conetent, itneraction with google map //////////////////////
function renderRecord(html){
    return html.replace(/<pre><code>/g, "<article>").replace(/<\/code><\/pre>/g, "</article>")
}

function renderRecContent(el)
{
    //get start day
    var start_date = (el.firstChild)? getStartDate(el.firstChild.innerHTML): null;
    var base_date = start_date? start_date.addDays(-1): null;
    //console.log("base_date: " + base_date);

    for(let i = 0; i < el.children.length; ++i){
        const curr = el.children[i];
        const last = (i == 0)? null: el.children[i-1];

        if(curr.tagName == "ARTICLE"){
            //the rec per day, replace 'article' by 'content' elemnt
            if (last && last.tagName == "H3"){
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

//gen <div class="rec-content">, from content and title elemnt
function genRecContentElem(content, title, base_date)
{
    //parse date from title_elem
    var day = getTrkDay(title.innerHTML);
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

function getTrkDay(txt)
{
    var re = /D(\d+)\s/
    var arr = txt.match(re);
    if(arr && arr.length >= 2){
        return parseInt(arr[1]);
    }

    return null;
}
