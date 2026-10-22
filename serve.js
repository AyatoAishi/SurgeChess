// Tiny static server: node serve.js  ->  http://localhost:5173
const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname,port=process.env.PORT||5173;
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.json':'application/json','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
  const f=path.join(root,p);if(!f.startsWith(root)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('not found');}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(d);});
}).listen(port,()=>console.log('Surge Chess running at http://localhost:'+port));
