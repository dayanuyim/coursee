'use strict';

import './css/main.css';
import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'
import * as templates from './templates';
import * as utils from './utils'
import { loadRec } from './trk';

async function showView()
{
    const view = window.location.hash;

    if(view === '#main')
        return showIndex();
    if(view.startsWith("#trek"))
        return showTrek(getParam(view));
    if(document.getElementById(view.substring(1)))  // normal anchor
        return;

    //console.debug(`Unrecognized view: ${view}`);
    throw Error(`Unrecognized view: ${view}`);
}

function getParam(s){
    const i = s.indexOf('-');
    return  (i < 0)? "": s.substring(i+1);
}

function showIndex()
{
    const treks = utils.groupItems(require('./data.json'), trek => trek.date.slice(0, 4)); //group by years
    document.body.innerHTML = templates.main({treks});
}

function showTrek(name){
    document.body.innerHTML = templates.trek();
    loadRec(name);
}
         
(async () => {
    window.addEventListener('hashchange', showView);
    showView().catch(err => window.location.hash = '#main');
})();