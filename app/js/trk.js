import { fireOnlyIfSingleClick } from '../dom-utils';

function toggleMap(){
    const mapobj = document.getElementById('mapobj');
    mapobj.classList.toggle('hide');
    if(!mapobj.getAttribute('data')){
      mapobj.setAttribute('data', "https://dayanuyim.github.io/maps/");
      mapobj.focus();
    }
}

function toggleSec(target){
    fireOnlyIfSingleClick(()=>target.classList.toggle('collapse'));
}

function toggleSecs(target){
    const cls = 'collapse';

    const toggle = target.classList.contains(cls)?
            el => el.classList.remove(cls):
            el => el.classList.add(cls);
    document.body.querySelectorAll('.sec-toggle').forEach(toggle);
}
function saveMarkdown(){
    const date = document.body.querySelector('header time').getAttribute('datetime');
    const hdr = document.body.querySelector('header h1').innerHTML;
    const filename = `${date}_${hdr}.md`;

    const txt = htmlToMarkdown();
    console.log(txt);
    //download(htmlToMarkdown(), filename, 'text/markdown');
}

window.toggleMap = toggleMap;
window.toggleSec = toggleSec;
window.toggleSecs = toggleSecs;