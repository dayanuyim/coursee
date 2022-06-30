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
                .use(require('markdown-it-checkbox'))
                //.use(require("markdown-it-attrs"))
                .use(require("markdown-it-anchor").default)
                .use(require("markdown-it-table-of-contents"), {
                    containerClass: 'nav',
                    includeLevel: [2,3,4],
                });

    //amend markdown ====
    markdown = '[[toc]]\n' + markdown;

    //amend html ====
    let html = md.render(markdown)
    html = `<div>${html}</div>`;  //wrap to single element
    //html = renderRecord(html);

    //amend element ========
    const  el = htmlToElement(html);
    renderHeader(el);
    renderSection(el);
    renderNavigation(el.querySelector('.nav'));
    fixLocalPath(el);
    renderAnchor(el);
    renderImage(el);
    el.querySelectorAll('section').forEach(sec => {
        if(['trk-plan', 'trk-backup', 'trk-facto'].includes(sec.id) || sec.querySelectorAll('li code').length > 5)
            renderRecBrief(sec.querySelector('h2+ul'));
    })
    extendTime(el);
    extendMap(el.querySelector('section#mapx'));
    extendVehicle(el.querySelector('section#transport'));
    //renderRecContent(el);
    return el;
}

function renderRecord(html){
    return html.replace(/<pre><code>/g, "<article>").replace(/<\/code><\/pre>/g, "</article>")
}

function renderHeader(el){
    if(!el) return;
    const header = el.querySelector('h1');
    if(!header) return;
    const [title, date] = header.textContent.split(/[()]/);
    header.outerHTML = `<header><h1>${title}</h1><time>${date}</time></header>`;   // move to template
}


function renderSection(el, level=2){
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

function renderNavigation(el){
    if(!el) return;

    const toc = el.querySelector('ul');
    toc.classList.add('toc');
    toc.insertAdjacentHTML('afterbegin', '<li class="mainlink"><a href="#main">回上層目錄</a></li>');

    el.insertAdjacentHTML('beforeend', templates.utils());

    /*
    const secs = Array.from(el.querySelectorAll('section'))
                    .filter(sec => sec.id)
                    .map(sec => {
                        return {
                            id: sec.id,
                            name: sec.querySelector('h2').textContent,
                        };
                    });
    */
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

function fixLocalPath(el)
{
    if(!el) return;

    el.querySelectorAll('img').forEach(img => img.src = _fixLocalPath(img.src));
    el.querySelectorAll('object').forEach(obj => obj.data = _fixLocalPath(obj.data));
}

function _fixLocalPath(url){
    if(!_opt || !_opt.host || !_opt.subpath) return;

    if(url.startsWith(_opt.host)){
        const path = url.substring(_opt.host.length);
        return `${_opt.host}/${_opt.subpath}${path}`
    }
    return url;
}

function renderAnchor(el)
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

function renderImage(el)
{
    if(!el) return;

    el.querySelectorAll('img').forEach(img => {

        /*
        //alt is used to specify the size 
        if(img.alt.match(/[0-9]+x[0-9]+/)){
            const [width, height] = img.alt.split('x');
            img.removeAttribute('alt');
            img.width = width;
            img.height = height;
        }

        //use <object> to load svg file
        if(img.src.toLowerCase().endsWith('.svg')){
            img.outerHTML = (img.width && img.height)?
                        templates.svgObject2({src: img.src, width: img.width, height: img.height}):
                        templates.svgObject({src: img.src});
        }
        */

        //check if alt is specified size
        let width, height;
        if(img.alt.match(/[0-9]+x[0-9]+/)){
            [width, height] = img.alt.split('x');
            img.removeAttribute('alt');
        }

        //is svg image
        if(img.src.toLowerCase().endsWith('.svg')){
            img.outerHTML = (width && height)?
                        templates.svgObject2({src: img.src, width, height}):
                        templates.svgObject({src: img.src});
        }
        //normal iamge
        else if(width && height){
            img.width = width;
            img.height = height;
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
    return false;
}


function renderRecBrief(el)
{
    if(!el) return;

    el.querySelectorAll('li').forEach(li => {

        let html = li.innerHTML
                    .replace(/{(.*?)}/g, extendWeather)
                    .replace(/(D\d+ )/, extendTrkDay);

        //trkseg-path =========
        let begin = html.indexOf('-&gt;');
        if(begin > 0){
            //range
            begin = html.lastIndexOf(' ', begin) + 1;  //if not found, set to index 0
            let end = html.indexOf(' ', begin)
            if(end < 0) end = html.length;

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
        li.querySelectorAll('em').forEach(extendAltitude);
    });
}

function extendAltitude(em)
{
    if (!isNaN(em.textContent))
        em.classList.add('alt');
        //em.outerHTML = `<span class="alt">${em.textContent}</span>`;
}

function extendTrkDay(orig, day){
    return `<span class="trkseg-day">${day}</span> `;
}

function extendWeather(orig, value){
    const key = Weather_name.getKey(value);
    if(!key)
        return orig;
    return `<i class="fa-solid fa-${key}" title="${value}"></i>`;
}

function extendVehicle(el){
    if(!el) return;

    el.querySelectorAll('li').forEach(li => {
        li.innerHTML = li.innerHTML.replace(/{(.*?)}/g, (orig, value) => {
            return `<span class="vehicle">${value}</span>`;
        });
    });
}
