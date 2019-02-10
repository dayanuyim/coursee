'use strict';

import './css/main.css';
import './css/font-awesome.css';
import * as templates from './templates';
//import * as fs from 'fs';
import { loadRec } from './trk';
import trekInfo from './data/trek-info';

async function showView()
{
    const [view, ...params] = window.location.hash.split('/');
    switch(view){
        case '#main':
            return showIndex();
        case '#trek':
            return showTrek(params[0]);
        default:
            throw Error(`Unrecognized view: ${view}`);
    }
}

function groupItems(arr, getKeyFun)
{
    const group = {};
    arr.forEach(item => {
        const key =  getKeyFun(item);
        if(!(key in group))
            group[key] = [];
        group[key].push(item);
    });
    return group;
}

function showIndex()
{
    const treks = groupItems(trekInfo, trek => trek.date.slice(0, 4)); //group by years
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