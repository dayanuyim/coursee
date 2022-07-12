import * as templates from './templates';
import { htmlToElement} from './dom-utils';
import BiMap from 'bidirectional-map';

function replaceRange(s, begin, end, s2){
    return s.substring(0, begin) + s2 + s.substring(end);
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

let _opt = null;

export function markdownElement(markdown, opt)
{
    //set options
    _opt = opt;

    const md = require('markdown-it')()
                .use(require('markdown-it-task-checkbox'))
                //.use(require("markdown-it-attrs"))
                .use(require('markdown-it-imsize'))
                .use(require("markdown-it-anchor").default, {
                    slugify: s => (Sec_name.getKey(s) || 'sec') + '-header',
                })
                .use(require("markdown-it-table-of-contents"), {
                    containerClass: 'nav',
                    includeLevel: [2,3,4],
                });

    //amend markdown ====
    markdown = '[[toc]]\n' + markdown;

    //amend html ====
    let html = md.render(markdown)
    //html = renderRecord(html);
    html = renderAltitude(html);
    html = `<div>${html}</div>`;  //wrap to single element

    //amend element ========
    const  el = htmlToElement(html);
    extendHeader(el);
    extendSection(el);
    extendNavigation(el.querySelector('.nav'));
    fixLocalPath(el);
    extendAnchor(el);
    extendSvg(el);
    el.querySelectorAll('section').forEach(sec => {
        if(['trk-plan', 'trk-backup', 'trk-facto'].includes(sec.id) || sec.querySelectorAll('li code').length > 5)
            extendRecBrief(sec.querySelector('h2+ul'));
    })
    extendTime(el);
    extendMap(el.querySelector('section#mapx'));
    extendVehicle(el.querySelector('section#transport'));
    //renderRecContent(el);
    return el;
}

function extendHeader(el){
    if(!el) return;
    const header = el.querySelector('h1');
    if(!header) return;
    const [title, date] = header.textContent.split(/[()]/);
    header.outerHTML = `<header><h1>${title}</h1><time>${date}</time></header>`;   // move to template
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

    //toc
    const toc = el.querySelector('ul');
    toc.classList.add('toc');
    toc.insertAdjacentHTML('afterbegin', '<li class="mainlink"><a href="#main">回上層目錄</a></li>');
    //uteil
    el.insertAdjacentHTML('beforeend', templates.utils());

    //drag to move
    el.addEventListener('mousedown', e => _is_nav_dragging = true, true);
    document.addEventListener('mouseup', e => _is_nav_dragging = false, true);
    document.addEventListener('mousemove', e => {
        e.preventDefault();
        if (_is_nav_dragging) {
            const rect = el.getBoundingClientRect();
            el.style.left = rect.x + e.movementX + 'px';
            el.style.top = rect.y + e.movementY + 'px';
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
    if(!_opt || !_opt.host || !_opt.subpath) return url;

    if(url.startsWith(_opt.host)){
        const path = url.substring(_opt.host.length);
        return `${_opt.host}/${_opt.subpath}${path}`
    }
    return url;
}

function extendAnchor(el)
{
    if(!el) return;
    if(!_opt || !_opt.host) return;

    const bookmark_prefix = `${_opt.host}/#`;
    el.querySelectorAll('section a').forEach(a => {
        if(a.href.startsWith(bookmark_prefix)) return;
        if(a.target) return;
        a.target = '_blank';
    })
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

function extendMap(el)
{
    if(!el) return;
    el.innerHTML = el.innerHTML.replace(/{map:(.*?)}/g, (orig, mapid) => {
        if(mapid == 'trekkr') return templates.map_trekkr();
        //other maps...
        return orig;
    });
}

function extendTime(el)
{
    if(!el) return;

    el.querySelectorAll('code').forEach(code => {
        if(isTimeFormat(code.textContent))
            code.outerHTML = `<time>${code.textContent}</time>`;
    });
}

function isTimeFormat(txt){
    if (txt.length == 4 && txt.match(/[0-2][0-9][0-5][0-9]/)) return true;
    if (txt.length == 7 && txt.match(/[0-2][0-9][0-5][0-9]~[0-5][0-9]/)) return true;
    if (txt.length == 9 && txt.match(/[0-2][0-9][0-5][0-9]~[0-2][0-9][0-5][0-9]/)) return true;
    if (txt.match(/^[0-9]+m$/)) return true;
    return false;
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

    el.querySelectorAll('li').forEach(li => {

        let html = renderWeather(li.innerHTML);
        html = renderTrkDay(html);

        //trkseg-path =========
        let begin = html.indexOf('-&gt;');
        if(begin > 0){
            //range
            begin = _lastIndexOf(html, ' ', begin) + 1;  //if not found, set to index 0
            const end = _indexOf(html, ' ', begin);      //if not found, set to html.length

            //split
            const path = html.substring(begin , end).split('-&gt;').map(loc => {
                return `<span>${loc.trim()}</span>`
            }).join('➤');

            //replace
            html = replaceRange(html, begin, end, `<span class="trkseg-path">${path}</span>`);
        }

        //re-format
        li.classList.add('trkseg');
        li.innerHTML = html;
        //li.querySelectorAll('em').forEach(extendAltitude);
    });
}

/*
function extendAltitude(em)
{
    if (!isNaN(em.textContent))
        em.classList.add('alt');
}
*/

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

function renderTrkDay(html){
    return html.replace(/(D\d+ )/,
        (orig, day) => `<span class="trkseg-day">${day}</span> `);
}

function renderWeather(html){
    return html.replace(/{(.*?)}/g, (orig, value) => {
        const key = Weather_name.getKey(value);
        return key? `<i class="fa-solid fa-${key}" title="${value}"></i>`: orig;
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

function getDay(txt)
{
    var re = /D(\d+)\s/
    var arr = txt.match(re);
    if(arr && arr.length >= 2){
        return parseInt(arr[1]);
    }

    return null;
}
