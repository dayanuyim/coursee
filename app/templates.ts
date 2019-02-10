import * as Handlebars from '../node_modules/handlebars/dist/handlebars.js';

Handlebars.registerHelper('fmtTime', function(moment) {
    return moment.format('YYYY-MM-DD HH:mm:ss');
});

Handlebars.registerHelper('fmtDate', function(date) {
    return date;
    //return `${date.getFullYear()}__${date.getDate()}`;
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
            <span class="title"><i class="fa fa-map-o"></i>羅東傳藝中心</span>
        </li>
    </ul>
    </section>

    <section id="trk"><a name="trk"></a>
    <h3>Trekking</h3>


    <h4>2018</h4><ul>
        <li><time class="trk-date">2018_1006</time>
            <span class="trk-days">5</span>
            <label class="trk-title">南湖北稜</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
            <span class="trk-keepon"><a href="https://www.keepon.com.tw/thread-eb566224-0dd1-e811-80dc-901b0e54a4e6.html"></a></span>
        </li>

        <li><time class="trk-date">2018_0404</time>
            <span class="trk-days">3</span>
            <label class="trk-title">扁柏神殿</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
        </li>

        <li><time class="trk-date">2018_0217</time>
            <span class="trk-days">10</span>
            <label class="trk-title">大小鬼湖</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
            <span class="trk-keepon"><a href="https://www.keepon.com.tw/thread-178894b0-38db-e811-80dc-901b0e54a4e6.html"></a></span>
        </li>
    </ul>

    <h4>2017</h4><ul>
        <li><time class="trk-date">2017_0529</time>
            <label class="trk-title">大屯溪古道、小觀音山西峰</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2017_0304</time>
            <label class="trk-title">八連溪古道</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2017_0212</time>
            <label class="trk-title">淡水無極天元宮、向天山</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2017_0130</time>
            <span class="trk-days">5</span>
            <label class="trk-title">嵐山工作站</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
        </li>

        <li><time class="trk-date">2017_0101</time>
            <label class="trk-title">中正山、大屯西峰</label>
            <span class="trk-gpx"></span>
        </li>
    </ul>

    <h4>2016</h4><ul>
        <li><time class="trk-date">2016_1204</time>
            <label class="trk-title">大屯溪古道、竿尾崙</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_1112</time>
            <label class="trk-title">灣潭古道、北勢溪古道</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_1104</time>
            <span class="trk-days">3</span>
            <label class="trk-title">多望溪-加羅神社</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0924</time>
            <label class="trk-title">西勢坑古道、暖東峽谷</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0813</time>
            <span class="trk-days">2</span>
            <label class="trk-title">木炭古道</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0730</time>
            <span class="trk-days">2</span>
            <label class="trk-title">羅馬縱走</label>
        </li>

        <li><time class="trk-date">2016_0717</time>
            <label class="trk-title">三貂嶺瀑布群、五分寮山</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0703</time>
            <label class="trk-title">姆指山、劍頭山、糶米古道</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0626</time>
            <label class="trk-title">西勢水庫、暖東峽谷</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0619</time>
            <label class="trk-title">炮子崙瀑布、茶山古道</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0612-2</time>
            <label class="trk-title">南邦寮古道、尾寮古道南段</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0612-1</time>
            <label class="trk-title">土庫岳</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0610</time>
            <label class="trk-title">南港後山</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0605</time>
            <label class="trk-title">內雙溪古道、瑪礁古道</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
        </li>

        <li><time class="trk-date">2016_0529</time>
            <label class="trk-title">麻竹寮山</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
        </li>

        <li><time class="trk-date">2016_0515</time>
            <label class="trk-title">新山夢湖</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2016_0430</time>
            <span class="trk-days">3</span>
            <label class="trk-title">香菇橋上平岩山縱走多加屯山</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
        </li>

        <li><time class="trk-date">2016_0402</time>
            <span class="trk-days">3</span>
            <label class="trk-title">佐得寒、塔雅府、桃山</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
            <span class="trk-keepon"><a href="http://www.keepon.com.tw/thread-bb758562-a1ff-e511-80c1-901b0e54a4e6.html"></a></span>
       </li>

        <li><time class="trk-date">2016_0327</time>
            <label class="trk-title">龍船岩、白石湖山、大崙尾山</label>
            <span class="trk-gpx"></span></li>

        <li><time class="trk-date">2016_0320</time>
            <label class="trk-title">鯉魚山、龍船岩</label>
            <span class="trk-gpx"></span></li>

        <li><time class="trk-date">2016_0313</time>
            <label class="trk-title">象山、南港山</label>
            <span class="trk-gpx"></span></li>

        <li><time class="trk-date">2016_0228</time>
            <label class="trk-title">鳶山縱走</label>
            <span class="trk-gpx"></span></li>
    </ul>

    <h4>2015</h4><ul>
        <li><time class="trk-date">2015_1101</time>
            <span class="trk-days">7</span>
            <label class="trk-title">雪山西稜</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span></li>

        <li><time class="trk-date">2015_0905</time>
            <span class="trk-days">2</span>
            <label class="trk-title">小腳ㄚ會師-合歡主北線</label>
            <span class="trk-gpx"></span></li>

        <li><time class="trk-date">2015_0704</time>
            <label class="trk-title">福山溯札孔溪2K</label>
            <span class="trk-gpx"></span></li>

        <li><time class="trk-date">2015_0501</time>
            <span class="trk-days">3</span>
            <label class="trk-title">神魔縱走南湖北山</label>
            <span class="trk-gpx"></span></li>

        <li><time class="trk-date">2015_0403</time>
            <span class="trk-days">4</span>
            <label class="trk-title">雪白山縱走唐穗山</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
        </li>

        <li><time class="trk-date">2015_0101</time>
            <span class="trk-days">4</span>
            <label class="trk-title">鎮金邊</label>
            <span class="trk-gpx"></span></li>
    </ul>

    <h4>2014</h4><ul>
        <li><time class="trk-date">2014_1005</time>
            <span class="trk-days">6</span>
            <label class="trk-title">能高安東軍</label>
            <span class="trk-gpx"></span></li>

        <li><time class="trk-date">2014_0906</time>
            <span class="trk-days">3</span>
            <label class="trk-title">神魔塚(未盡)</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span>
            <span class="trk-keepon"><a href="https://www.keepon.com.tw/thread-fd71d6d2-1ad8-e411-93ec-000e04b74954.html"></a></span></li>

        <li><time class="trk-date">2014_0829</time>
            <span class="trk-days">3</span>
            <label class="trk-title">模拳松</label>
            <span class="trk-gpx"></span>
            <span class="trk-facebook"><a href="https://www.facebook.com/events/1432360940363327/"></a></span>
        </li>

        <li><time class="trk-date">2014_0802</time>
            <span class="trk-days">2</span>
            <label class="trk-title">東模拳松</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2014_0712</time>
            <span class="trk-days">2</span>
            <label class="trk-title">蕃社跡山(安全下溪路)</label>
            <span class="trk-gpx"></span>
            <span class="trk-keepon"><a href="https://www.keepon.com.tw/thread-44390ba3-1ad8-e411-93ec-000e04b74954.html"></a></span>
        </li>

        <li><time class="trk-date">2014_0501</time>
            <span class="trk-days">4</span>
            <label class="trk-title">戒茂斯上嘉明妹池</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2014_0315</time>
            <span class="trk-days">2</span>
            <label class="trk-title">司馬庫斯古道上雪白出唐穗</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2014_0228</time>
            <span class="trk-days">3</span>
            <label class="trk-title">雪白、鴛鴦湖、唐穗</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2014_0215</time>
            <span class="trk-days">2</span>
            <label class="trk-title">舊武塔國小</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2014_0125</time>
            <span class="trk-days">2</span>
            <label class="trk-title">向天湖縱走加里山、出紅毛山</label>
            <span class="trk-gpx"></span>
        </li>

        <li><time class="trk-date">2014_0118</time>
            <span class="trk-days">2</span>
            <label class="trk-title">加里山下風美溪</label>
            <span class="trk-gpx"></span></li>

        <li><time class="trk-date">2014_0104</time>
            <label class="trk-title">巫山東麓</label>
            <span class="trk-gpx"></span></li>

    </ul>

    <h4>2013</h4><ul>
        <li><time class="trk-date">2013_0126</time>
            <span class="trk-days">2</span>
            <label class="trk-title">拉樸山、波露山、阿玉山</label>
            <span class="trk-gpx"></span></li>

    </ul>
    </section>

    <section id="trk_plan"><a name="trk_plan"></a>
    <h3>Trekking Plan</h3><ul>
        <li><time class="trk-date">plan1</time>
            <label class="trk-title">大小鬼湖</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span></li>

        <li><time class="trk-date">plan3</time>
            <label class="trk-title">中央山脈中段：室呂木、干卓萬、七彩湖</label>
            <span class="trk-gpx"></span>
            <span class="trk-rec"></span></li>
    </ul>
    </section>

    <hr>
    <footer>
        <p>&copy; 2019</p>
    </footer>
`);

export const trekItem = Handlebars.compile(`
    <time class="trk-date">{{fmtDate date}}</time>
    <span class="trk-days trk-days-{{days}}">{{days}}</span>
    <label class="trk-title"><a href="#trek/{{id}}">{{title}}</a></label>
    <span class="trk-gpx"><a href="data/treks/{{id}}.gpx"><i class="fa fa-map-marker"></i></a></span>
    <span class="trk-rec"><a href="data/treks/{{id}}.md"><i class='fa fa-pencil-square-o'></i></a></span>
    {{#if keepon}}
        <span class="trk-keepon"><a href="{{keepon}}"><i class='fa fa-map-signs'></i></a></span>
    {{/if}}
    {{#if facebook}}
        <span class="trk-facebook"><a href="{{facebook}}"><i class="fa fa-facebook-square"></i></a></span>
    {{/if}}
`);

export const trek = Handlebars.compile(`
    <div id="download">
    下載:
    <a id="download_trk"><i class="fa fa-map-marker"></i>航跡</a>&nbsp; 
    <a id="download_rec"><i class="fa fa-pencil-square-o"></i>記錄</a>
    </div>

    <section id="container">
    <section id="rec">
        <div class="rec-content">[Record loading...]</div>
    </section>
        
    <section id="map">
        <div id="gmap">[The Map to display]</div>
    </section>
    </section>
`);