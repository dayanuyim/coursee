import * as Handlebars from '../node_modules/handlebars/dist/handlebars.js';

Handlebars.registerHelper('fmtDate', function(date) {
    return date;
    //return `${date.getFullYear()}__${date.getDate()}`;
});

Handlebars.registerHelper('fmtRecTime', function(time) {
    return time.format('HHmm');
});

Handlebars.registerHelper('timeStr', function(time) {
    //return time.format('YYYY-MM-DDTHH:mm:ss+08:00');
    return time.format();
});

Handlebars.registerHelper('eachYear', function(obj, options) {
    return Object.keys(obj)
        .sort((a, b) => {
            const x = isNaN(+a)? 2100: +a;     //not number -> plan for future, like 2100
            const y = isNaN(+b)? 2100: +b;
            return y - x;  //revert
        })
        .reduce((acc, key) => acc + options.fn({year: key, ytreks: obj[key]}), "");
});

export const main = Handlebars.compile(`
    <nav><ul>
        <li><a href="#app">Applications</a></li>
        <li><a href="#travel">Travel</a></li>
        <li><a href="#trk">Trekking</a></li>
        <li><a href="#trk_plan">Trakking Plan</a></li>
    </ul></nav>

    <section id="app"><a name="app"></a>
    <h3>Personal Applications</h3><dl>
        <dt><a href="https://github.com/dayanuyim/GisEditor/blob/master/README.md">GisEditor</a></dt>
        <dd>A map browsing adapter to WMTS, written in Python, running in Windows/Linux.</dd>
    </dl>
    </section>

    <section id="travel"><a name="travel"></a>
    <h3>Travel</h3>
    <h4>2016</h4><ul>
        <li><time class="trk-date">2016_0416</time>
            <span class="title"><i class="fa-regular fa-map"></i>羅東傳藝中心</span>
        </li>
    </ul>
    </section>

    <section id="trk"><a name="trk"></a>
    <h3>Trekking</h3>

    {{#eachYear treks}}
    <h4>{{year}}</h4>
    <ul>
        {{#each ytreks}}
        <li>
            <time class="trk-date">{{fmtDate date}}</time>
            <span class="trk-days trk-days-{{days}}">{{days}}</span>
            <label class="trk-title"><a href="#trek-{{date}}-{{title}}">{{title}}</a></label>
            <span class="trk-gpx"><a href="data/{{date}}-{{title}}/course.gpx"><i class="fa-solid fa-location-dot"></i></a></span>
            <span class="trk-rec"><a href="data/{{date}}-{{title}}/course.md"><i class="fa-regular fa-pen-to-square"></i></a></span>
            {{#if keepon}}
                <span class="trk-keepon"><a href="{{keepon}}"><i class='fa-solid fa-signs-post'></i></a></span>
            {{/if}}
            {{#if facebook}}
                <span class="trk-facebook"><a href="{{facebook}}"><i class="fa-brands fa-facebook-square"></i></a></span>
            {{/if}}
        </li>
        {{/each}}
    </ul>
    {{/eachYear}}

    </section>

    <hr>
    <footer>
        <p>&copy; 2019</p>
    </footer>
`);

export const trek = Handlebars.compile(`
    <div id="download">
    下載:
    <a id="download-trk"><i class="fa-solid fa-location-dot"></i>航跡</a>&nbsp;
    <a id="download-rec"><i class="fa-regular fa-pen-to-square"></i>記錄</a>
    </div>

    <div id="container">
        <div id="rec" class="">
            <div class="rec-content">[Record Loading...]</div>
        </div>
            
        <div id="map" class="">
            <div id="map-content">[The Map to Display]</div>
        </div>
    </div>
`);

export const toTimestamp = Handlebars.compile(`
    <div class="rec-timestamp">
        <time datetime="{{timeStr time1}}">{{fmtRecTime time1}}</time> {{content}}
    </div>
`);

export const toTimestamp2 = Handlebars.compile(`
    <div class="rec-timestamp">
        <time datetime="{{timeStr time1}}">{{fmtRecTime time1}}</time> {{delimiter}}
        <time datetime="{{timeStr time2}}">{{fmtRecTime time2}}</time> {{content}}
    </div>
`);

export const toTimethru = Handlebars.compile(`
    <div class="rec-timethru">{{content}}</div>
`);


export const section = Handlebars.compile(`
    <section id="{{id}}">
      <button class="sec-toggle" onclick="toggleSec(this)" ondblclick="toggleSecs(this)"></button>
    </section>
`);

export const utils = Handlebars.compile(`
  <ul class="utils">
    <li><button type="button" onclick="saveMarkdown()">Save MD</button></li>
  </ul>
`);

export const svgObject = Handlebars.compile(`
    <object data="{{src}}" type="image/svg+xml">Failed to Load SVG</object>
`);

export const svgObject2 = Handlebars.compile(`
    <object data="{{src}}" type="image/svg+xml" width="{{width}}" height="{{height}}">Failed to Load SVG</object>
`);

export const map_trekkr = Handlebars.compile(`
    <button onclick="toggleMap()">線上地圖</button>
    <!--<embed class="hide" id="mapobj" src="" width="100%" height="600" ></embed>-->
    <object class="hide" id="mapobj" type="text/html" data="" width="100%" height="600">
      不支援嵌入，請連至<a href="https://dayanuyim.github.io/maps/">Trekkr</a>
    </object>
`);
