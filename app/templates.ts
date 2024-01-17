import * as Handlebars from '../node_modules/handlebars/dist/handlebars.js';
import { markdownHtml } from './m2h';


Handlebars.registerHelper('breaklines', function(text) {
    text = Handlebars.Utils.escapeExpression(text);
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
    return new Handlebars.SafeString(text);
});

Handlebars.registerHelper('defVal', function (value, defValue) {
    let out = value || defValue;
    return out;
    //return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('fmtName', function ({date, days, title}) {
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

export const main = Handlebars.compile(`
    <!--
    <nav><ul>
        <li><a href="#index">Index</a></li>
    </ul></nav>
    -->

    <section id="index"><a name="index"></a>

    {{#each this}}
    <h4>{{year}}</h4>
    <ul>
        {{#each courses}}
        <li>
            <time class="trk-date">{{fmtDate date}}</time>
            <span class="trk-days trk-days-{{defVal days 1}}">{{defVal days 1}}</span>
            <label class="trk-title"><a href="#trek-{{fmtName this}}">{{title}}</a></label>
            <span class="trk-gpx"><a href="data/{{fmtName this}}/course.gpx"><i class="fa-solid fa-location-dot"></i></a></span>
            <span class="trk-rec"><a href="data/{{fmtName this}}/course.md"><i class="fa-regular fa-pen-to-square"></i></a></span>
        </li>
        {{/each}}
    </ul>
    {{/each}}

    </section>

    <hr>
    <footer>
        <p>&copy; 2023</p>
    </footer>
`);

Handlebars.registerHelper('dialect', function(kinds) {

    let html = '';
    for(const kind of kinds){
        const cls = (kind == "b")? "basic":
                    (kind == "e")? "ext":
                    (kind == "c")? "custom": "na";
        html += `<i class="dialect dialect-${cls}"></i>`;
    }

    return new Handlebars.SafeString(html);
});

Handlebars.registerHelper('mdhtml', function(md) {
    return new Handlebars.SafeString(markdownHtml(md));
});

export const tip = Handlebars.compile(`
    {{#each this}}
    <table class="tip-tbl">
        <thead>
            <tr>
                <th></th>
                <th>MARKDOWN</th>
                <th>HTML</th>
            </tr>
        </thead>
        <tbody>
            {{#each this}}
            <tr>
                <td>{{dialect dialect}}</td>
                <td>{{breaklines text}}</td>
                <td>{{mdhtml text}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/each}}

    <div class="tip-legend">
        <span>{{dialect "b"}} Basic</span>
        <span>{{dialect "e"}} Extension</span>
        <span>{{dialect "c"}} Customed Extension</span>
    </div>
`);

function arraySplit(arr, grp_size)
{
    const grps = [];
    for(let i = 0; i < arr.length; i += grp_size)
        grps.push(arr.slice(i, i + grp_size));
    return grps;
}

Handlebars.registerHelper('tip', function() {
    const host = `${window.location.protocol}//${window.location.host}`
    const ctx = [
        [
            { dialect: "b", text: "標題1\n=====" },
            { dialect: "b", text: "標題2\n-----" },
            { dialect: "b", text: "# 標題1" },
            { dialect: "b", text: "## 標題2" },
            { dialect: "b", text: "###### 標題6" },
            { dialect: "b", text: "1. 有序清單" },
            { dialect: "b", text: "- 無序清單" },
            { dialect: "e", text: "- [x] 待辦事項" },
        ], [
            { dialect: "b", text: "> 引用" },
            { dialect: "b", text: "*斜體*" },
            { dialect: "b", text: "**粗體**" },
            { dialect: "b", text: "***斜粗體***" },
            { dialect: "b", text: "~~刪除線~~" },
            { dialect: "b", text: "`# 程式碼`" },
            { dialect: "e", text: "上標 1^st^" },
            { dialect: "e", text: "下標 H~2~O" },
            { dialect: "e", text: "++底線/插入++" },
            { dialect: "e", text: "==標記==" },
        ], [
            { dialect: "c", text: 'A-(5min)->B'},
            { dialect: "c", text: "日期 2023-01-01" },
            { dialect: "c", text: "時間 `0630`" },
            { dialect: "c", text: "時間 `0630~0700`" },
            { dialect: "c", text: "時間 `5m`" },
            { dialect: "c", text: "高度 *3952*" },
            { dialect: "c", text: "{變} {晴} {風} {陰} {霧} {雨} {雷} {雪}" },
            { dialect: "c", text: "{map:trekkr:ref.gpx}" },
        ], [
            { dialect: "b", text: `[連結](${host}/favicon.png "title")` },
            { dialect: "be", text: `![圖片](${host}/favicon.png "title" =16x)` },
        ],
    ];

    //ctx = arraySplit(ctx, 12);
    return new Handlebars.SafeString(tip(ctx));
});

export const trek = Handlebars.compile(`
    <div id="download" style="display: none">
    下載:
    <a id="download-trk"><i class="fa-solid fa-location-dot"></i>航跡</a>&nbsp;
    <a id="download-rec"><i class="fa-regular fa-pen-to-square"></i>記錄</a>
    </div>

    <div id="container">

        <div id="toolbar">
            <span class="toolbar-left">
                <button class="btn-push" id="toolbar-main" title="回主目錄"><a href="#main"><img src="/favicon.png" width="16px"></a></button>
                <span class="btn-group">
                    <button class="btn-switch" id="toolbar-edit" onclick="selectMode('edit')" title="編輯模式"><i class="fa-solid fa-pen-to-square"></i></button><!--
                 --><button class="btn-switch" id="toolbar-both" onclick="selectMode('both')" title="並排模式"><i class="fa-solid fa-table-columns"></i></button><!--
                 --><button class="btn-switch" id="toolbar-view" onclick="selectMode('view')" title="瀏覽模式"><i class="fa-solid fa-eye"></i></button>
                </span>
                <button class="btn-push" id="toolbar-tip" onclick="showModal('tip')" title="語法提示"><i class="fa-solid fa-circle-question"></i></button>
                <button class="btn-push" id="toolbar-import-wpts" onclick="importWpts()" title="匯入航點"><i class="fa-solid fa-location-dot"></i><i class="fa-solid fa-pen"></i></button>
            </span>
            <span class="toolbar-center">
                <button class="btn-switch" id="toolbar-sync" onclick="setSyncScroll(this)" title="同步捲動"><i class="fa-solid fa-link-slash"></i></span></button>
            </span>
            <span class="toolbar-right">
            </span>
        </div>

        <div id="tip" class="modal hide">
            <div class="modal-container">
                <div class="modal-body">{{tip}}</div>
            </div>
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
    <button id="nav-collapse" onclick="toggleNavCollapse(this)"><i class="fa-solid fa-angles-{{#if collapsed}}up{{else}}down{{/if}}"></i></button>
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
    <div>
        <button onclick="toggleMap(this,'{{gpx}}')">線上地圖</button>
        <a href="https://dayanuyim.github.io/maps/?gpx={{gpx}}" target="_blank"><i class="fa-solid fa-up-right-from-square"></i> 新視窗開啟</a>
        <!--<embed class="mapobj hide" src="" width="100%" height="600" ></embed>-->
        <object class="mapobj hide" type="text/html" data="" width="100%" height="600">不支援嵌入</object>
    </div>
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
