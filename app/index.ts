'use strict';

import './css/main.css';
import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'
import * as templates from './templates';
import * as utils from './utils'
import { loadCourse } from './main';

async function showView()
{
    const view = window.location.hash;

    if(view === '#main')
        return showIndex();
    if(view.startsWith("#course"))
        return showCourse(getParam(view));
    if(document.getElementById(view.substring(1)))  // normal anchor
        return;

    //console.debug(`Unrecognized view: ${view}`);
    throw Error(`Unrecognized view: ${view}`);
}

function getParam(s){
    const i = s.indexOf('-');
    return  (i < 0)? "": decodeURI(s.substring(i+1));
}

let _courses;
async function showIndex()
{
    try{
        //fetch
        const resp = await fetch('/api/list');
        if(!resp.ok)
            throw new Error(`fail to fetch the list`);

        _courses = await resp.json();
        const data = groupCoursesByYear(_courses);
        document.body.innerHTML = templates.main(data);
    }
    catch(err){
        console.error(err);
    }
}

// [...] => [ {year: yyyy, courses:[...]}...]
function groupCoursesByYear(courses){

    const asc = false;
    const order = (v: number) => asc? v: -v;
    const {isNumber, groupItems, dictToArray} = utils;

    let data = groupItems(courses, c => c.date.slice(0, 4)); //group by years
    data = dictToArray(data, 'year', 'courses');

    // sort year
    data.sort(({ year: y1 }, { year: y2 }) => {
        if (isNumber(y1) && !isNumber(y2)) return -1;
        if (!isNumber(y1) && isNumber(y2)) return 1;
        return order(y1.localeCompare(y2));   //sort only if year is number
    });

    // sort date for each yer
    data.forEach(({courses}) => {
        courses.sort(({date:d1}, {date:d2}) => order(d1.localeCompare(d2)));
    });

    return data;
}

function showCourse(name){
    document.body.innerHTML = templates.course();
    const course = _courses.find(c => c.name === name);
    loadCourse(course);
}
         
(async () => {
    window.addEventListener('hashchange', showView);
    showView().catch(err => window.location.hash = '#main');
})();
