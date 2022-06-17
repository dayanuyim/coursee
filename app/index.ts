'use strict';

import './css/main.css';
import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'
import * as templates from './templates';
import * as utils from './utils'
import { loadRec } from './trk';
import trekInfo from './trek-info';

async function showView()
{
    const [view, param] = getView(window.location.hash);
    switch(view){
        case '#main':
            return showIndex();
        case '#trek':
            return showTrek(param);
        default:
            throw Error(`Unrecognized view: ${view}`);
    }
}

function getView(s){
    const i = s.indexOf('-');
    return  (i < 0)? [s, null]: [s.slice(0,i), s.slice(i+1)];
}

function showIndex()
{
    const treks = utils.groupItems(trekInfo, trek => trek.date.slice(0, 4)); //group by years
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