import { fireOnlyIfSingleClick } from '../dom-utils';

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
    if(nav){
        // reset the position by top and left
        const rect = nav.getBoundingClientRect();
        nav.style.left = `${rect.x}px`;
        nav.style.top = `${rect.y}px`;
        nav.style.bottom = 'unset';
        nav.style.right = 'unset';

        nav.classList.toggle('collapse');
    }
}

window.toggleEdit = function(target){
    const container = target.closest('#container');
    if(container)
        container.classList.toggle('edit');
}

window.selectMode = function(target, mode){
    const container = target.closest('#container');
    if(!container) return;
    container.classList.remove('view');
    container.classList.remove('edit');
    container.classList.remove('both');
    container.classList.add(mode);

    document.getElementById('toolbar-view').disabled = (mode === 'view');
    document.getElementById('toolbar-edit').disabled = (mode === 'edit');
    document.getElementById('toolbar-both').disabled = (mode === 'both');
}
