'use strict';

import './css/main.css';
import '@fortawesome/fontawesome-free/js/fontawesome'
import '@fortawesome/fontawesome-free/js/solid'
import '@fortawesome/fontawesome-free/js/regular'
import '@fortawesome/fontawesome-free/js/brands'
import * as templates from './templates';
import * as utils from './utils'
import { loadCourse } from './course';

async function showView()
{
    const to_course_name = (s) => decodeURI(s.substring(s.indexOf('-')+1));

    const view = window.location.hash;
    if(view === '#main')
        return showIndex();
    if(view.startsWith("#course-"))
        return showCourse(to_course_name(view));
    if(view.startsWith("#dup-"))
        return showCourse(to_course_name(view));
    if(view.startsWith("#"))
        return document.getElementById(view.substring(1));  // normal anchor

    //console.debug(`Unrecognized view: ${view}`);
    throw Error(`Unrecognized view: ${view}`);
}

// reutrn:
//   params[0] is the original string
//   parans[1..n-1] are tokens split by dash
function getParams(s){
    s = decodeURI(s);
    const params = s.split('-');
    params.unshift(s);
    return params;
}

// Note: not cache courses anymore, a dup may be created in the server side
let _courses;
async function getCourses(){
    //if(!_courses){
        const resp = await fetch('/api/list');
        if(!resp.ok)
            throw new Error(`fail to fetch the list`);
        _courses = await resp.json();
    //}
    return _courses;
}

async function showIndex()
{
    try{
        const courses = await getCourses();
        const data = groupCoursesByYear(courses);
        document.body.innerHTML = templates.index(data);
        initCourseInfoModal();
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

async function showCourse(name){
    const courses = await getCourses();
    const course = courses.find(c => c.name === name);
    if(!course)
        throw new Error(`Course '${name}' not found`);

    document.body.innerHTML = templates.course();
    loadCourse(course);
}
         
function initCourseInfoModal() {
    const opEl   = document.getElementById('course-info-op')   as HTMLInputElement;
    const origEl = document.getElementById('course-info-orig') as HTMLInputElement;
    const dateEl = document.getElementById("course-info-date") as HTMLInputElement;
    const nameEl = document.getElementById("course-info-name") as HTMLInputElement;
    const daysEl = document.getElementById("course-info-days") as HTMLInputElement;
    const submitEl = document.getElementById("course-info-submit") as HTMLInputElement;

    const DEBOUNCE_DELAY = 500; // ms

    function debounce(fn, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
      };
    }

    function isValidDate(str) {
      if (str === "YYYYMMDD") return true;
      if (!/^\d{8}$/.test(str)) return false;

      const y = +str.slice(0, 4);
      const m = +str.slice(4, 6);
      const d = +str.slice(6, 8);

      const date = new Date(y, m - 1, d);
      return date.getFullYear() === y &&
             date.getMonth() === m - 1 &&
             date.getDate() === d;
    }

    function validateDate() {
      return isValidDate(dateEl.value.trim());
    }

    function validateName() {
      return nameEl.value.trim().length > 0;
    }

    function validateDays() {
      const val = Number(daysEl.value);
      return Number.isInteger(val) && val >= 1;
    }

    function applyValidation(el, isValid) {
      clearValidation(el);
      el.classList.toggle("valid", isValid);
      el.classList.toggle("invalid", !isValid);
    }

    function clearValidation(el){
      el.classList.remove("valid", "invalid");
    }

    function checkAllValid() {
      const allValid =
        validateDate() &&
        validateName() &&
        validateDays();

      submitEl.disabled = !allValid;
    }

    function handleValidate(el, validator) {
      /*
      // 空值時：不顯示顏色，但仍視為 invalid
      const value = el.value.trim();
      if (value === "") {
        el.classList.remove("valid", "invalid");
        submitEl.disabled = true;
        return;
      }
      */  
      const isValid = validator();
      applyValidation(el, isValid);
      checkAllValid();
    }

    // 建立 debounce handler
    const debouncedDate = debounce(() => handleValidate(dateEl, validateDate), DEBOUNCE_DELAY);
    const debouncedName = debounce(() => handleValidate(nameEl, validateName), DEBOUNCE_DELAY);
    const debouncedDays = debounce(() => handleValidate(daysEl, validateDays), DEBOUNCE_DELAY);

    // input 事件（輸入時觸發 debounce）
    dateEl.addEventListener("input", () => {
      clearValidation(dateEl);
      debouncedDate();
    });

    nameEl.addEventListener("input", () => {
      clearValidation(nameEl);
      debouncedName();
    });

    daysEl.addEventListener("input", () => {
      clearValidation(daysEl);
      debouncedDays();
    });

    submitEl.addEventListener("click", async ()=>{
        const op = opEl.value.trim();
        const orig = origEl.value.trim();
        const name = [
            dateEl.value.trim(),
            nameEl.value.trim(),
            Number(daysEl.value) > 1? daysEl.value: undefined,
        ].filter(e => e)
         .join("-");

         try{
            console.log(`${op} '${orig} to ${name}`)
            const resp = await postJson(`/course/${orig}/${op}`, {name});
            if(!resp.ok)
                return alert(await resp.text());
            location.reload();
         }
         catch(err){
            alert(err);
         }
    });

    //function action(data) {
    //  console.log("送出資料:", data);
    //}
}

function action(data) {
    console.log("送出資料:", data);
    // 這裡放你的處理邏輯
}

async function postJson(url, data){
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    return resp;
}


/*
async function cloneCourse(name){
    try {
        showModal('course-name');
        //get the new name
        await postJson(`/course/${name}/clone`, {
            name: name + "-2",
        });
    }
    catch (err) {
        console.error(`clone the course ${name}`, err);
    }
}
*/

(async () => {
    window.addEventListener('hashchange', showView);
    showView().catch(err => window.location.hash = '#main');
})();
