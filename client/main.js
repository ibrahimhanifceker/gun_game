var socket = io();

document.addEventListener('contextmenu', e => e.preventDefault());

const img=new Image();
img.src='/client/images/hand_drawn_grass.png';

var canvas=document.getElementById('gameBox');
canvas.height=window.innerHeight;
canvas.width=window.innerWidth;
var ctx=canvas.getContext('2d');
let mx=Math.floor(canvas.width/2),my=Math.floor(canvas.height/2);

socket.emit('screen',{x:mx,y:my});

var angle=0,realX,realY;

function getAngle(x,y){
    if(x==0){
        if(y>0){
            return Math.PI/2;
        }
        if(y<0){
            return 3*Math.PI/2;
        }
    }
    let slope=y/x;
    if(x>0 && y>=0){
        return Math.atan(slope);
    }
    else if(x>0 && y<0){
        return Math.atan(slope)+2*Math.PI;
    }
    else{
        return Math.atan(slope)+Math.PI;
    }
}
canvas.addEventListener('mousemove',function(event){
    let difX=event.clientX-mx,difY=my-event.clientY;
    angle=getAngle(difX,difY);
    socket.emit('angle',angle);
});

document.addEventListener('keydown',function(event){
    if(event.keyCode==87){
        socket.emit('Key',{key:'up',pressed:true});
    }
    else if(event.keyCode==65){
        socket.emit('Key',{key:'left',pressed:true});
    }
    else if(event.keyCode==83){
        socket.emit('Key',{key:'down',pressed:true});
    }
    else if(event.keyCode==68){
        socket.emit('Key',{key:'right',pressed:true});
    }
});

document.addEventListener('keyup',function(event){
    if(event.keyCode==87){
        socket.emit('Key',{key:'up',pressed:false});
    }
    else if(event.keyCode==65){
        socket.emit('Key',{key:'left',pressed:false});
    }
    else if(event.keyCode==83){
        socket.emit('Key',{key:'down',pressed:false});
    }
    else if(event.keyCode==68){
        socket.emit('Key',{key:'right',pressed:false});
    }
});

canvas.addEventListener('mousedown',function(){
    socket.emit('bullet',{x:realX+mx+50*Math.cos(angle),y:realY+my-50*Math.sin(angle),angle:angle});
});

socket.on('location',function(data){
    realX=data.x;
    realY=data.y;
    //console.log(realX+" "+realY);
});

socket.on('updateMap',function(Objects){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const pattern = ctx.createPattern(img, 'repeat');
    const shiftX = -realX;
    const shiftY = -realY;
    ctx.save();
    ctx.translate(shiftX, shiftY);
    ctx.fillStyle = pattern;
    ctx.fillRect(Math.max(-shiftX,0), Math.max(-shiftY,0), 5000 + shiftX, 3000 + shiftY);
    ctx.restore();
    for(var i in Objects){
        let object=Objects[i];
        if(object.type=='player'){
            ctx.beginPath();
            ctx.arc(object.x-realX,object.y-realY,30,0,2*Math.PI);
            ctx.fillStyle='grey';
            ctx.strokeStyle='black';
            ctx.fill();
            ctx.lineWidth=3;
            ctx.stroke();
            ctx.beginPath();
            ctx.lineWidth=10;
            ctx.moveTo(object.x-realX+30*Math.cos(object.angle),object.y-realY-30*Math.sin(object.angle));
            ctx.lineTo(object.x-realX+45*Math.cos(object.angle),object.y-realY-45*Math.sin(object.angle));
            ctx.stroke();
        }
        else if(object.type=='bullet'){
            ctx.beginPath();
            ctx.moveTo(object.x-realX,object.y-realY);
            ctx.lineWidth=10;
            ctx.strokeStyle='red';
            ctx.lineTo(object.x-realX+15*Math.cos(object.angle),object.y-realY-15*Math.sin(object.angle));
            ctx.stroke();
        }
    }
    ctx.beginPath();
    ctx.moveTo(-realX,-realY);
    ctx.lineTo(5000-realX,-realY);
    ctx.strokeStyle='black';
    ctx.lineWidth=20;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-realX,-realY);
    ctx.lineTo(-realX,3000-realY);
    ctx.strokeStyle='black';
    ctx.lineWidth=20;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5000-realX,-realY);
    ctx.lineTo(5000-realX,3000-realY);
    ctx.strokeStyle='black';
    ctx.lineWidth=20;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-realX,3000-realY);
    ctx.lineTo(5000-realX,3000-realY);
    ctx.strokeStyle='black';
    ctx.lineWidth=20;
    ctx.stroke();
});