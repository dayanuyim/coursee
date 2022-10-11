import { fireOnlyIfSingleClick } from '../dom-utils';
import Cookies from 'js-cookie';

function setElemClass(el, cls, enabled){
    if(enabled)
        el.classList.add(cls);
    else
        el.classList.remove(cls);
}

window.toggleMap = function(){
    const mapobj = document.getElementById('mapobj');
    mapobj.classList.toggle('hide');
    if(!mapobj.getAttribute('data')){
      mapobj.setAttribute('data', "https://dayanuyim.github.io/maps/");
      mapobj.focus();
    }
}

window.toggleSec = function(target){
    fireOnlyIfSingleClick(()=>target.classList.toggle('collapse'));
}

window.toggleSecs = function(target){
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

window.displayPhoto = function(el){
    //const el = document.querySelector('input[name="photo-display"]:checked');
    const disp = el.value;

    const figures = document.body.querySelectorAll('table figure');
    figures.forEach(fig => {
        if(disp == "none"){
            fig.classList.add('hide');
            return;
        }

        fig.classList.remove('hide');

        const td = fig.closest('td');
        const tr = td.closest('tr');
        if(disp == "side" && td.cellIndex == 1){
            tr.previousElementSibling.insertAdjacentElement('beforeend', td);
        }
        else if(disp == "line" && td.cellIndex == 2){
            tr.nextElementSibling.insertAdjacentElement('beforeend', td);
        }
    });
}

window.toggleTrksegGrid = function(target){
    const trkseg = target.closest('.trkseg');
    if(trkseg)
        trkseg.classList.toggle('grid');
}

window.toggleTrksegChart = function (target){
    const trkseg = target.closest('.trkseg');
    if(trkseg)
        trkseg.classList.toggle('chart');
}

window.toggleNavCollapse = function(target){
    const nav = target.closest('.nav');
    if(!nav) return;
    // reset the position by top and left
    const rect = nav.getBoundingClientRect();
    /*
    nav.style.left = `${rect.x}px`;
    nav.style.top = `${rect.y}px`;
    nav.style.bottom = 'unset';
    nav.style.right = 'unset';
    */
    nav.style.left = 'unset';
    nav.style.top = 'unset';
    nav.style.bottom = `${window.innerHeight - rect.bottom}px`;
    nav.style.right = `${window.innerWidth - rect.right}px`;

    nav.classList.toggle('collapse');

    Cookies.set("coursee-nav-collapse", nav.classList.contains('collapse'), {sameSite: 'strict'});
}

window.toggleEdit = function(target){
    const container = target.closest('#container');
    if(container)
        container.classList.toggle('edit');
}

window.selectMode = function(target, mode){
    const container = target.closest('#container');
    if(!container) return;

    //check for each mode
    for(const m of ['view', 'edit', 'both']){
        const selected = (m === mode);
        const button = document.getElementById(`toolbar-${m}`);
        button.disabled = selected;  //disable if selected
        setElemClass(button, 'switch-on', selected);
        setElemClass(container, m, selected);
    }

    Cookies.set("coursee-layout-mode", mode, {sameSite: 'strict'});
}

window.setEditorVim = (target) => {
    target.classList.toggle('switch-on');
    const enabled = target.classList.contains('switch-on');
    _setEditorVim(enabled);

    Cookies.set("coursee-editor-vim", enabled, {sameSite: 'strict'});
}

window.setSyncScroll = function(target){
    //data
    target.classList.toggle('switch-on');
    const enabled = target.classList.contains('switch-on');
    //ui
    target.innerHTML = enabled ? '<i class="fa-solid fa-link"></i>':
                                 '<i class="fa-solid fa-link-slash"></i>';
    //action
    _setSyncScroll(enabled);
    //cookie
    Cookies.set("coursee-sync-scroll", enabled, {sameSite: 'strict'});
}
