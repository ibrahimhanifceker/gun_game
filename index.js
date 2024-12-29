var express = require('express');
var app = express();
var  serv = require('http').Server(app);

app.get('/', function(req,res){
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 1453);

console.log('Server Started');

var Sockets={};
var Objects={};
var bullet_speed=10,player_speed=3;

var io = require('socket.io')(serv,{});

io.sockets.on('connection',function(socket){
    socket.id=Math.random();
    console.log("connected"+socket.id);
    Sockets[socket.id]=socket;
    socket.x=Math.random()*4800-500;
    socket.realX=socket.x;
    socket.y=Math.random()*2800-300;
    socket.realY=socket.y;
    socket.up=socket.down=socket.left=socket.right=false;
    socket.speed=player_speed;
    Objects[socket.id]={
        x:socket.x,
        y:socket.y,
        speed:socket.speed,
        angle:0,
        type:'player'
    };
    socket.on('disconnect',function(){
        delete Sockets[socket.id];
        for(let i in Objects){
            let object=Objects[i];
            if(object.type=='bullet'){
                if(object.id==socket.id){
                    delete Objects[i];
                }
            }
        }
        delete Objects[socket.id];
    });
    socket.on('screen',function(data){
        socket.x+=data.x;
        socket.y+=data.y;
        Objects[socket.id].x=socket.x;
        Objects[socket.id].y=socket.y;
    });
    socket.on('angle',function(data){
        if(!(String(socket.id) in Objects)){
            return;
        }
        Objects[socket.id].angle=data;
    });
    socket.on('Key',function(data){
        if(data.key=='up'){
            socket.up=data.pressed;
        }
        if(data.key=='down'){
            socket.down=data.pressed;
        }
        if(data.key=='left'){
            socket.left=data.pressed;
        }
        if(data.key=='right'){
            socket.right=data.pressed;
        }
    });
    socket.on('bullet',function(data){
        if(!(String(socket.id) in Objects)){
            return;
        }
        let Bullet=data;
        Bullet.type='bullet';
        Bullet.id=socket.id;
        Objects[Math.random()]=Bullet;
    });
});

setInterval(function(){
    for(var i in Objects){
        let object=Objects[i];
        let del=false;
        if(object.type=='bullet'){
            let x=object.x+15*Math.cos(object.angle)+5*Math.sin(object.angle);
            let y=object.y-15*Math.sin(object.angle)+5*Math.cos(object.angle);
            if(x<10 || x>4990 || y<10 || y>2990){
                del=true;
            }
            x=object.x+15*Math.cos(object.angle)-5*Math.sin(object.angle);
            y=object.y-15*Math.sin(object.angle)-5*Math.cos(object.angle);
            if(x<10 || x>4990 || y<10 || y>2990){
                del=true;
            }
        }
        if(del){
            delete Objects[i];
        }
    }
    for(let i in Objects){
        let object=Objects[i];
        if(object.type=='bullet'){
            object.x+=bullet_speed*Math.cos(object.angle);
            object.y-=bullet_speed*Math.sin(object.angle);
        }
        Objects[i]=object;
    }
    for(let i in Sockets){
        let socket=Sockets[i];
        if(!(String(socket.id) in Objects)){
            continue;
        }
        if(socket.up){
            socket.y-=socket.speed;
            socket.realY-=socket.speed;
            Objects[socket.id].y=socket.y;
        }
        if(socket.down){
            socket.y+=socket.speed;
            socket.realY+=socket.speed;
            Objects[socket.id].y=socket.y;
        }
        if(socket.left){
            socket.x-=socket.speed;
            socket.realX-=socket.speed;
            Objects[socket.id].x=socket.x;
        }
        if(socket.right){
            socket.x+=socket.speed;
            socket.realX+=socket.speed;
            Objects[socket.id].x=socket.x;
        }
        socket.emit('location',{x:socket.realX,y:socket.realY});
    }
    for(let i in Sockets){
        let socket=Sockets[i];
        socket.emit('updateMap',Objects);
    }
},10);
