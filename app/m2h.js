import * as templates from './templates';
import { htmlToElement} from './dom-utils';
import BiMap from 'bidirectional-map';

const Sec_name = new BiMap({
    todo: "待辦事項",
    weather:  "天氣預報",
    doc: "文件",
    mapx: "地圖",
    'trk-plan': "預計行程",
    'trk-facto': "實際行程",
    'trk-rec': "行程記錄",
    epilogue: "後記",
    info: "行程資訊",
    transport: "交通",
    lodge: "住宿",
    'trk-ref': "行程參考",
});

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

export function markdownElement(markdown){

    const md = require('markdown-it')()
                .use(require('markdown-it-checkbox'));
                /*
                .use(require('markdown-it-anchor').default, {
                    level: 2,
                    // slugify: string => string,
                    permalink: false,
                    // renderPermalink: (slug, opts, state, permalink) => {},
                    permalinkClass: 'header-anchor',
                    permalinkSymbol: '¶',
                    permalinkBefore: true,
                });
                */

    let html = md.render(markdown);
    html = `<div>${html}</div>`;  //wrap to single element
    //html = renderRecord(html);
    const  el = htmlToElement(html);

    renderHeader(el);
    renderSection(el);
    renderNavigation(el);
    fixLocalPath(el);
    renderImage(el);
    extendMap(el.querySelector('section#mapx'));
    renderRecBrief(el.querySelector('section#trk-plan h2+ul'));
    renderRecBrief(el.querySelector('section#trk-facto h2+ul'));
    extendVehicle(el.querySelector('section#transport'));
    //renderOthers(el);
    return el;
}

function renderRecord(html){
    return html.replace(/<pre><code>/g, "<article>").replace(/<\/code><\/pre>/g, "</article>")
}

function renderHeader(el){
    const header = el.querySelector('h1');
    const [title, date] = header.textContent.split(/[()]/);
    header.outerHTML = `<header><h1>${title}</h1><time>${date}</time></header>`;   // move to template
}


function renderSection(el, level=2){
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
            sec_html += templates.section({id: Sec_name.getKey(child.textContent)});
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
    const secs = Array.from(el.querySelectorAll('section'))
                    .filter(sec => sec.id)
                    .map(sec => {
                        return {
                            id: sec.id,
                            name: sec.querySelector('h2').textContent,
                        };
                    });
    el.insertAdjacentHTML('afterbegin', templates.toc(secs));
}

function renderOthers(el)
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
    const images = el.querySelectorAll('img');
    if(images.length <= 0)
        return;

    const host = `${window.location.protocol}//${window.location.host}`;
    const title = el.querySelector('header h1').textContent;
    const date = el.querySelector('header time').textContent;
    const subdir = `data/${date}-${title}`;

    images.forEach(img => {
        if(img.src.startsWith(host)){
            const path = img.src.substring(host.length+1);
            img.src = `${host}/${subdir}/${path}`
        }
    });
}

function renderImage(el)
{
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
    el.innerHTML = el.innerHTML.replace(/{map:(.*?)}/g, (orig, mapid) => {
        console.log(orig, mapid);
        if(mapid == 'trekkr') return templates.map_trekkr();
        //other maps...
        return orig;
    });
}

function renderRecBrief(el)
{
    if(!el) return;

    el.querySelectorAll('li code').forEach(code => {
        code.outerHTML = `<time>${code.textContent}</time>`;
    });

    // `xxxx` => <time>xxxx</time>
    // {yyyy} => <span class="alt">yyyy</span>
    el.querySelectorAll('li').forEach(li => {
        const trk = li.innerHTML;
        let sp = trk.search(/ D\d+ /);
        if(sp < 0)
            return console.error(`Not valid trk line: ${trk}`)
        const sp2 = trk.indexOf(' ', sp+1);

        //split to 3 segments
        const weather = trk.substring(0, sp)
                        .replace(/{(.*?)}/, extendWeather);
        const day = trk.substring(sp+1, sp2);
        const path = trk.substring(sp2).split('-&gt;').map(loc => {
            loc = loc.trim()
                .replace('code>', 'time>')                             //time
                .replace(/{(\d+)}/, extendAltitude);    //altitude
            return `<span>${loc}</span>`
        }).join('➤');

        //re-format
        li.classList.add('trkseg');
        li.innerHTML = `${weather} <span class="trkseg-day">${day}</span> <span class="trkseg-path">${path}</span>`;
    });
}

function extendWeather(orig, value){
    const key = Weather_name.getKey(value);
    if(!key)
        return orig;
    return `<i class="fa-solid fa-${key}"></i>`
}

function extendAltitude(orig, value){
    //beacuse regex already check the value is a number 
    return `<span class="alt">${value}</span>`;
}


function extendVehicle(el){
    el.querySelectorAll('li').forEach(li => {
        li.innerHTML = li.innerHTML.replace(/{(.*?)}/g, (orig, value) => {
            return `<span class="vehicle">${value}</span>`;
        });
    });
}
