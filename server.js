'use strict';
const nconf = require('nconf');
const pkg = require('./package.json');
const {URL} = require('url');
const path = require('path');
const fs = require('fs');
const express = require('express');
const expressSession = require('express-session');
const cors = require('cors');

function tryLoadObject(path){
    try{
        return require(path);
    }
    catch(e){
        const {red} = require('colors/safe');
        console.warn(red(`[WARN] load json file '${path}' error: ${e.message}`));
        return {};
    }
}

// config =============================
nconf
  .argv()
  .env('__')
  .defaults({NODE_ENV: 'development'});
  //.add('defaults2', { type: 'literal', store: {
     //conf: path.join(__dirname, `${nconf.get('NODE_ENV')}.config.json`)
  //}})
  //.file(nconf.get('conf'));

const node_env = nconf.get('NODE_ENV');
const is_dev = node_env === 'development';
console.log(`NODE_ENV ${node_env}`);

// multiple files are not support by nconf, so merge them by myself, be careful priority
//nconf
//  .file(path.join(__dirname, `${node_env}.local.config.json`))
//  .file(path.join(__dirname, `${node_env}.config.json`));
nconf.defaults({
    ...tryLoadObject(`./${node_env}.config.json`),
    ...tryLoadObject(`./${node_env}.local.config.json`),
});

const service = new URL(nconf.get('serviceUrl'));
const isHttps = service.protocol === 'https:';
const servicePort = service.port || (isHttps? 8443 : 8080);
const wwwroot = nconf.get('data-path').replaceAll(/\/|\\/g, path.sep);  //normalize to platform-specific path

// Express =============================
const logFormatter = () => {
    const morgan = require('morgan');
    const moment = require('moment-timezone');
    morgan.token('date', (req, res, tz) => {
        return moment().tz(tz).format(nconf.get('log:dateFormat'));
    });

    const {red, green, yellow} = require('colors/safe');
    return morgan(eval('`' + nconf.get('log:format') + '`'));
};

const app = express();
app.use(logFormatter());
app.use(cors({
  origin: nconf.get('cors:origin'),
}));
app.set('json spaces', 2);

app.get('/api/version', (req, res) => res.status(200).json(pkg.version));

if(nconf.get('redis')){
  const RedisStore = require('connect-redis')(expressSession);
  app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: nconf.get('redis:secret'),
    store: new RedisStore({
      host: nconf.get('redis:host'),
      port: nconf.get('redis:port'),
    }),
  }));
}
else {
  const FileStore = require('session-file-store')(expressSession);
  app.use(expressSession({
    resave: false,
    saveUninitialized: true,
    secret: 'unguessable',
    store: new FileStore(),
  }));
}


// Serve webpack assets.
if (is_dev) {
  const webpack = require('webpack');
  const webpackMiddleware = require('webpack-dev-middleware');
  const webpackConfig = require('./webpack.config.js');
  app.use(webpackMiddleware(webpack(webpackConfig), {
    publicPath: '/',
    stats: {colors: true},
  }));
} else {
  app.use(express.static('dist'));
}

// import lib router
//app.use('/api', require('./lib/theater.js')());

//@name should be the format of 'YYYYMMDD-title[-days]'
function parseCourseName(name){
  //date
  const date = `${name.substring(0, 4)}-${name.substring(4, 6)}-${name.substring(6, 8)}`.toUpperCase();
  if(date.length != 10 || (date != 'YYYY-MM-DD' && !Date.parse(date)))
    return null;

  if(name.charAt(8) !== '-')
    return null;

  //days
  const has_days = /-\d+$/.exec(name);
  const days = (has_days && has_days.index > 8)? name.substring(has_days.index+1): '';

  //title
  const title = name.substring(9, has_days? has_days.index: name.length);
  if(!title)  //not allow empty
    return null;

  return { date, days, title };
}

function parseCourseDir(dir){
  if(!fs.lstatSync(dir).isDirectory())
    return null;

  const name = path.basename(dir);
  const tokens = parseCourseName(name);
  if(!tokens)
    return null;

  const fexist = (fname) => fs.existsSync(`${dir}/${fname}`)? fname: null;

  return Object.assign(tokens, {
    name,
    gpx: fexist('course.gpx'),
    txt: fexist('course.md'),
    dup: fexist('course-dup.md'),
  });
}

function getDataList(dir){
  return fs.readdirSync(dir)
    .map(file => parseCourseDir(path.join(dir, file)))
    .filter(v => v);
}

function getfpath(...paths){
  const fpath = path.join(wwwroot, ...paths);  // NOTE: join() return a platform-specific string,
  if (!fpath.startsWith(wwwroot))              //       so wwwroot should be normalized to platform-specific path too.
    return console.error(`error: file path ${fpath} is out of data path ${wwwroot}`);
  return fpath
}

app.get('/api/list', function(req, res){
  res.status(200).json(getDataList(nconf.get('data-path')));
});

// get file
app.use('/data', express.static(nconf.get('data-path')));

// upload file
app.put('/data/*path', express.json(), function(req, res, next){
  const relpath = Array.isArray(req.params.path)?
                    req.params.path.join('/'):
                    req.params.path;

  const fpath = getfpath(relpath);
  if (!fpath)
    return res.status(400).json({done: false, error: 'bad request path'});

  const text = req.body.text;
  console.log(`save path [${fpath}]: data: ${text.length}: [${text.substring(0, 15)}...]`);

  fs.writeFile(fpath, text, function(error, data){
    if(error) return res.status(500).json({done: false, error});
    res.status(200).json({done: true});
  });
});

// Duplicate a file.
//   from /a/path/to/file.ext
//     to /a/path/to/file-dup.ext
app.get('/dup/data/*path', function(req, res){
  const force = req.query.force === '1';
  const relpath = Array.isArray(req.params.path)?
                    req.params.path.join('/'):
                    req.params.path;
  const relpaths = path.parse(relpath);

  const srcpath = getfpath(relpath);
  const dstpath = getfpath(relpaths.dir, `${relpaths.name}-dup${relpaths.ext}`);
  if (!srcpath || !dstpath)
    return res.status(400).json({ done: false, error: 'bad request path' });

  const mode = force ? 0 : fs.constants.COPYFILE_EXCL;  // overwrite (default): exclusive
  fs.copyFile(srcpath, dstpath, mode, (err)=>{
    if(!err)                  return res.status(200).json({done: true});
    if(err.code === 'EEXIST') return res.status(403).json({done: false, error: 'target file already exists'});
    if(err.code === 'ENOENT') return res.status(404).json({done: false, error: 'source file not found'});
    console.error(err);
    res.status(500).json({done: false, error: 'internal server error'});
  });
});



// Startup Server
if(isHttps){
  const https = require('https');
  const httpsOptions = {
    key: fs.readFileSync(nconf.get('security:key')),
    cert: fs.readFileSync(nconf.get('security:cert'))
  };
  https.createServer(httpsOptions, app)
      .listen(servicePort, service.host, () => console.log(`Security Server on ${service}:${servicePort}`));
}
else{
  app.listen(servicePort, service.host, () => console.log(`Server on ${service}:${servicePort}`));
}
