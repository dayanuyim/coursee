import { fireOnlyIfSingleClick } from '../dom-utils';
import Cookies from 'js-cookie';

window.toggleMap = function(target){
    const url = "https://dayanuyim.github.io/maps/";  //TODO: get url by mapid

    const mapobj = target.parentNode.querySelector('.mapobj');  //nextElementSibling
    mapobj.classList.toggle('hide');
    if(mapobj.getAttribute('data') !== url)
        mapobj.setAttribute('data', url);
    mapobj.focus();
}

window.toggleSec = function(target){
    fireOnlyIfSingleClick(()=>target.classList.toggle('collapse'));
}

window.toggleSecs = function(target){
    const cls = 'collapse';
    const enabled = target.classList.toggle(cls);
    document.body.querySelectorAll('.sec-toggle').forEach(el => el.classList.toggle(cls, enabled));
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
    if(nav){
        const enabled = nav.classList.toggle('collapse');
        target.innerHTML = enabled ? '<i class="fa-solid fa-angles-up"></i>':
                                     '<i class="fa-solid fa-angles-down"></i>';
        Cookies.set("coursee-nav-collapse", enabled, {sameSite: 'strict'});
    }
}

window.selectMode = function(mode){
    //buttons status, 'radio buttons' behavior
    for(const m of ['view', 'edit', 'both']){
        const selected = (m === mode);
        const button = document.getElementById(`toolbar-${m}`);
        button.disabled = selected;  //disable if selected
        button.classList.toggle('switch-on', selected);
    }

    //contianer status
    const container = document.getElementById('container');
    container.classList.toggle('editable', mode != 'view');
    container.classList.toggle('viewable', mode != 'edit');

    resetBoundary();

    //cookie
    Cookies.set("coursee-layout-mode", mode, {sameSite: 'strict'});
}

//ref: tuneBoundary()
function resetBoundary()
{
    const resetLeft = el => el.style.removeProperty('left');
    const resetWidth = el => el.style.removeProperty('width');

    resetWidth(document.getElementById('editor-content'));
    resetWidth(document.getElementById('editor-status'));
    resetLeft(document.getElementById('toolbar-sync'));
    resetLeft(document.getElementById('viewer'));
    resetWidth(document.getElementById('viewer-content'));
}


window.setEditorVim = (target) => {
    const enabled = target.classList.toggle('switch-on');
    _setEditorVim(enabled);
    Cookies.set("coursee-editor-vim", enabled, {sameSite: 'strict'});
}

window.setSyncScroll = function(target){
    //ui
    const enabled = target.classList.toggle('switch-on');
    target.innerHTML = enabled ? '<i class="fa-solid fa-link"></i>':
                                 '<i class="fa-solid fa-link-slash"></i>';
    //action
    _setSyncScroll(enabled);
    //cookie
    Cookies.set("coursee-sync-scroll", enabled, {sameSite: 'strict'});
}

window.showModal = function(id){
    const modal = document.querySelector(`#${id}.modal`);

    modal.classList.remove("hide");

    //set event to hide modal
    if(!modal.onclick){
        modal.onclick = e => {
            if(e.target.classList.contains("modal") || e.target.classList.contains("modal-container")) //not body
                modal.classList.add("hide");
        }
    }
}
