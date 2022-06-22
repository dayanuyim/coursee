import { htmlToElement} from './dom-utils';

export function markdownElement(markdown){

    const md = require('markdown-it')();

    let html = md.render(markdown);
    html = `<div>${html}</div>`;  //wrap to single element
    html = renderRecord(html);
    const  el = htmlToElement(html);
    console.log(el);
    renderSection(el);
    renderHeader(el);
    renderOthers(el);
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

/*
//workable but not accurate method:
function renderSection(html){
    return html.replace(/<h2>/g, "</section><section><h2>");
}
*/

function renderSection(el){
    //collect into groups according to H2
    const groups = [];
    for(let i = 0; i < el.children.length; ++i){
        const child = el.children[i];

        if(child.tagName == "H2") //new group
            groups.push([]);

        if(groups.length > 0)     //save to the latest group
            groups[groups.length-1].push(child);
    }

    // create sections
    el.insertAdjacentHTML('beforeend', '<section></section>'.repeat(groups.length));
    const secs = Array.from(el.querySelectorAll('section')).slice(-groups.length);   //ensure the last n sections

    // move elments into sections according to @groups
    for(let i = 0; i < groups.length; ++i){
        for(let j = 0; j < groups[i].length; ++j){
            secs[i].appendChild(groups[i][j]);
        }
    }

    //set section id
    secs.forEach(sec => sec.id = secId(sec.querySelector('h2').textContent));
}

function secId(txt){
    switch(txt.trim()){
        case "待辦事項": return "todo";
        case "天氣預報": return "weather";
        case "文件": return "doc";
        default: return "";
    }
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


