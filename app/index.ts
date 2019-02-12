'use strict';

import './css/main.css';
import './css/font-awesome.css';
import * as templates from './templates';
import * as utils from './utils'
import { loadRec } from './trk';
import trekInfo from './data/trek-info';

async function showView()
{
    const [view, param] = window.location.hash.split('-', 2);
    switch(view){
        case '#main':
            return showIndex();
        case '#trek':
            return showTrek(param);
        default:
            throw Error(`Unrecognized view: ${view}`);
    }
}

function showIndex()
{
    const treks = utils.groupItems(trekInfo, trek => trek.date.slice(0, 4)); //group by years
    document.body.innerHTML = templates.main({treks});
}

function showTrek(id){
    document.body.innerHTML = templates.trek();
    loadRec(id);
}
         
(async () => {
    window.addEventListener('hashchange', showView);
    showView().catch(err => window.location.hash = '#main');
})();