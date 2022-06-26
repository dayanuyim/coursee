  function toggleMap(){
    const mapobj = document.getElementById('mapobj');
    mapobj.classList.toggle('hide');
    if(!mapobj.getAttribute('data')){
      mapobj.setAttribute('data', "https://dayanuyim.github.io/maps/");
      mapobj.focus();
    }
  }

function toggleSec(target){
    const sec = target.closest('section')
    sec.querySelector('.sec-content').classList.toggle('hide');
    sec.querySelector('.sec-toggle').classList.toggle('collapse');
}

function collapseSecs(){
    document.querySelectorAll('.sec-content').forEach(e => e.classList.add('hide'));
    document.querySelectorAll('.sec-toggle').forEach(e => e.classList.add('collapse'));
}

function expandSecs(){
    document.querySelectorAll('.sec-content').forEach(e => e.classList.remove('hide'));
    document.querySelectorAll('.sec-toggle').forEach(e => e.classList.remove('collapse'));
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
window.collapseSecs = collapseSecs;
window.expandSecs = expandSecs;