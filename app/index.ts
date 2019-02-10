'use strict';

import './css/main.css';
import './css/font-awesome.css';
import * as templates from './templates';
import { loadRec } from './trk';

function getText(elem){
    if(!elem) return null;
    return elem.innerHTML;
}

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

function showIndex()
{
    document.body.innerHTML = templates.main();
    //add link to Title
    document.querySelectorAll(".trk-title").forEach(elem => {
        const item = (<HTMLElement>elem).closest('li');
        const title = getText(item.querySelector('.trk-title'));
        const days = getText(item.querySelector('.trk-days')) || 1;
        const date = getText(item.querySelector('.trk-date'));
        const facebook = getText(item.querySelector('.trk-facebook'));
        const keepon = getText(item.querySelector('.trk-keepon'));
        const id = `${date}_${title}`;
        item.innerHTML = templates.trekItem({ id, title, date, days, facebook, keepon });
    });
}

function showTrek(id){
    document.body.innerHTML = templates.trek();
    loadRec(id);
}
         
(async () => {

    window.addEventListener('hashchange', showView);
    showView().catch(err => window.location.hash = '#main');
})();