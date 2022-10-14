import * as Handlebars from '../node_modules/handlebars/dist/handlebars.js';

Handlebars.registerHelper('defVal', function (value, defValue) {
    let out = value || defValue;
    return out;
    //return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('fmtTitle', function (date, days, title) {
    let out = date.replaceAll('-', '');
    if(title) out += `-${title}`;
    if(days) out += `-${days}`;
    return out;
    //return new Handlebars.SafeString(out);
});

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
    <!--
    <nav><ul>
        <li><a href="#index">Index</a></li>
    </ul></nav>
    -->

    <section id="index"><a name="index"></a>

    {{#eachYear treks}}
    <h4>{{year}}</h4>
    <ul>
        {{#each ytreks}}
        <li>
            <time class="trk-date">{{fmtDate date}}</time>
            <span class="trk-days trk-days-{{defVal days 1}}">{{defVal days 1}}</span>
            <label class="trk-title"><a href="#trek-{{fmtTitle date days title}}">{{title}}</a></label>
            <span class="trk-gpx"><a href="data/{{date}}-{{title}}/course.gpx"><i class="fa-solid fa-location-dot"></i></a></span>
            <span class="trk-rec"><a href="data/{{date}}-{{title}}/course.md"><i class="fa-regular fa-pen-to-square"></i></a></span>
        </li>
        {{/each}}
    </ul>
    {{/eachYear}}

    </section>

    <hr>
    <footer>
        <p>&copy; 2022</p>
    </footer>
`);

export const trek = Handlebars.compile(`
    <div id="download" style="display: none">
    下載:
    <a id="download-trk"><i class="fa-solid fa-location-dot"></i>航跡</a>&nbsp;
    <a id="download-rec"><i class="fa-regular fa-pen-to-square"></i>記錄</a>
    </div>

    <div id="container">

        <div id="toolbar">
            <span class="btn-group">
               <button class="switch" id="toolbar-edit" onclick="selectMode('edit')" title="編輯模式"><i class="fa-solid fa-pen-to-square"></i></button><!--
            --><button class="switch" id="toolbar-both" onclick="selectMode('both')" title="並排模式"><i class="fa-solid fa-table-columns"></i></button><!--
            --><button class="switch" id="toolbar-view" onclick="selectMode('view')" title="瀏覽模式"><i class="fa-solid fa-eye"></i></button>
            </span>
            <button class="switch" id="toolbar-sync" onclick="setSyncScroll(this)" title="同步捲動"><i class="fa-solid fa-link-slash"></i></span></button>
        </div>

        <div id="editor">
            <div id="editor-content"></div>
            <div id="editor-status"></div>
            <div id="editor-settings">
                <button id="editor-vim" onclick="setEditorVim(this)" title="VI模式"><i class="fa-brands fa-vimeo-v"></i></button>
            </div>
        </div>

        <div id="viewer" tabindex="0""edge">
            <div id="viewer-boundary"></div>
            <div id="viewer-content" tabindex="1">[Record Loading...]</div>
        </div>
            
        <!--
        <div id="map" class="">
            <div id="map-content">[The Map to Display]</div>
        </div>
        -->
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

export const navCollapse = Handlebars.compile(`
    <button id="nav-collapse" onclick="toggleNavCollapse(this)"></button>
`);

export const navPageBack = Handlebars.compile(`
    <li class="mainlink"><a href="#main">回上層目錄</a></li>
`);

export const navUtils = Handlebars.compile(`
  <ul class="nav-utils">
    <!--
    <li><button type="button" onclick="saveMarkdown()">Save MD</button></li>
    -->
    <li><i class="fa-solid fa-image"></i>
        <input type="radio" id="photo-display-line" name="photo-display" value="line" onchange="displayPhoto(this)" checked><label for="photo-display-line">逐行</label>
        <input type="radio" id="photo-display-side" name="photo-display" value="side" onchange="displayPhoto(this)"        ><label for="photo-display-side">並排</label>
        <input type="radio" id="photo-display-none" name="photo-display" value="none" onchange="displayPhoto(this)"        ><label for="photo-display-none">隱藏</label>
    </li>
  </ul>
`);

export const svgObject = Handlebars.compile(`
    <object data="{{src}}" type="image/svg+xml">Failed to Load SVG</object>
`);

export const svgObject2 = Handlebars.compile(`
    <object data="{{src}}" type="image/svg+xml" width="{{width}}" height="{{height}}" >Failed to Load SVG</object>
`);

export const map_trekkr = Handlebars.compile(`
    <button onclick="toggleMap()">線上地圖</button>
    <!--<embed class="hide" id="mapobj" src="" width="100%" height="600" ></embed>-->
    <object class="hide" id="mapobj" type="text/html" data="" width="100%" height="600">
      不支援嵌入，請連至<a href="https://dayanuyim.github.io/maps/">Trekkr</a>
    </object>
`);

export const trksegUtils = Handlebars.compile(`
    <ul class="trkseg-utils hide">
        <li><button class="trkseg-util-grid" title="堆疊" onclick="toggleTrksegGrid(this)"><i class="fa-solid fa-layer-group"></i></button></li>
        <li><button class="trkseg-util-chart" title="行進圖" onclick="toggleTrksegChart(this)"><i class="fa-solid fa-chart-line"></i></button></li>
    </ul>
`);

// trkseg-path-arrow is a placeholder to insert arrow symbole from css
export const trksegPath = Handlebars.compile(`
    <span class="trkseg-path">
    {{#each locs}}<!--
     -->{{#unless @first}}<span class="trkseg-path-arrow"></span>{{/unless}}<!--
     --><span class="trkseg-path-loc">{{{this}}}</span><!--
 -->{{/each}}
    </span>
`);
