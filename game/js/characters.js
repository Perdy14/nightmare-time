// ========== PERSONAJES REALISTAS ==========
function drawBot(c,id,x,y,s,alpha){
  c.save();c.translate(x,y);c.scale(s,s);c.globalAlpha=alpha||1;
  switch(id){
    case'finn':dFinn(c);break;case'jake':dJake(c);break;
    case'chicle':dChicle(c);break;case'rey':dRey(c);break;
  }
  c.restore();
}

function dFinn(c){
  c.fillStyle='rgba(0,0,0,0.4)';c.beginPath();c.ellipse(0,92,20,6,0,0,Math.PI*2);c.fill();
  // Piernas con volumen
  c.fillStyle='#e8ddd0';
  c.beginPath();c.moveTo(-11,60);c.lineTo(-11,84);c.quadraticCurveTo(-11,88,-7,88);
  c.lineTo(-3,88);c.lineTo(-3,60);c.closePath();c.fill();
  c.beginPath();c.moveTo(3,60);c.lineTo(3,84);c.quadraticCurveTo(3,88,7,88);
  c.lineTo(11,88);c.lineTo(11,60);c.closePath();c.fill();
  // Zapatos
  c.fillStyle='#111';
  c.beginPath();c.ellipse(-7,89,8,5,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(7,89,8,5,0,0,Math.PI*2);c.fill();
  // Shorts
  c.fillStyle='#1a6040';c.fillRect(-14,48,28,15);
  c.fillStyle='#155535';c.fillRect(-14,48,28,3);
  // Cuerpo - camiseta azul con gradiente
  var bg=c.createLinearGradient(-16,5,16,5);
  bg.addColorStop(0,'#0d3a6a');bg.addColorStop(0.5,'#1a5a9a');bg.addColorStop(1,'#0d3a6a');
  c.fillStyle=bg;
  c.beginPath();c.moveTo(-15,8);c.lineTo(-16,48);c.lineTo(16,48);c.lineTo(15,8);
  c.quadraticCurveTo(0,3,-15,8);c.closePath();c.fill();
  c.fillStyle='#e8ddd0';c.fillRect(-4,2,8,8); // cuello
  // Brazos
  c.fillStyle='#e8ddd0';
  c.beginPath();c.moveTo(-16,10);c.quadraticCurveTo(-24,25,-22,42);c.lineTo(-18,42);c.quadraticCurveTo(-18,25,-14,10);c.closePath();c.fill();
  c.beginPath();c.moveTo(16,10);c.quadraticCurveTo(24,25,22,42);c.lineTo(18,42);c.quadraticCurveTo(18,25,14,10);c.closePath();c.fill();
  // Gorro blanco
  var hg=c.createRadialGradient(0,-16,5,0,-16,22);
  hg.addColorStop(0,'#ffffff');hg.addColorStop(1,'#ddd');
  c.fillStyle=hg;c.beginPath();c.arc(0,-16,21,0,Math.PI*2);c.fill();
  c.fillStyle='#f5f5f5';
  c.beginPath();c.arc(-15,-32,9,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(15,-32,9,0,Math.PI*2);c.fill();
  // Cara
  var fg=c.createRadialGradient(0,-10,3,0,-10,14);
  fg.addColorStop(0,'#ffe8c0');fg.addColorStop(1,'#f0d0a0');
  c.fillStyle=fg;c.beginPath();c.arc(0,-10,14,0,Math.PI*2);c.fill();
  // Ojos rojos brillantes
  c.fillStyle='#1a0000';
  c.beginPath();c.ellipse(-5,-13,5,4.5,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(5,-13,5,4.5,0,0,Math.PI*2);c.fill();
  c.fillStyle='#cc0000';c.shadowColor='#ff0000';c.shadowBlur=15;
  c.beginPath();c.arc(-5,-13,3.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(5,-13,3.5,0,Math.PI*2);c.fill();c.shadowBlur=0;
  c.fillStyle='#000';c.beginPath();c.arc(-5,-13,1.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(5,-13,1.5,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(255,200,200,0.6)';c.beginPath();c.arc(-4,-14,1,0,Math.PI*2);c.fill();
  // Boca con dientes
  c.strokeStyle='#4a0000';c.lineWidth=1.5;c.beginPath();c.arc(0,-3,7,0.15,Math.PI-0.15);c.stroke();
  c.fillStyle='#ddd';for(var i=-3;i<=3;i++)c.fillRect(-6+i*2,-3,1.5,2.5);
  // Espada corrupta
  c.fillStyle='#4a0080';c.fillRect(22,-15,5,55);
  c.fillStyle='#ffd700';c.fillRect(19,-18,11,5);
  // Venas de corrupción
  c.strokeStyle='rgba(120,0,180,0.5)';c.lineWidth=1;
  c.beginPath();c.moveTo(-8,10);c.bezierCurveTo(-10,20,-12,30,-14,45);c.stroke();
  c.beginPath();c.moveTo(8,10);c.bezierCurveTo(10,22,12,32,14,46);c.stroke();
}

function dJake(c){
  c.fillStyle='rgba(0,0,0,0.4)';c.beginPath();c.ellipse(0,68,24,6,0,0,Math.PI*2);c.fill();
  // Patas con articulaciones
  c.fillStyle='#cc9500';
  c.beginPath();c.moveTo(-18,38);c.quadraticCurveTo(-20,50,-18,62);c.lineTo(-14,62);c.quadraticCurveTo(-14,50,-14,38);c.closePath();c.fill();
  c.beginPath();c.moveTo(-6,38);c.quadraticCurveTo(-8,48,-6,58);c.lineTo(-2,58);c.quadraticCurveTo(-2,48,-2,38);c.closePath();c.fill();
  c.beginPath();c.moveTo(4,38);c.quadraticCurveTo(2,48,4,60);c.lineTo(8,60);c.quadraticCurveTo(8,48,8,38);c.closePath();c.fill();
  c.beginPath();c.moveTo(14,38);c.quadraticCurveTo(12,50,14,62);c.lineTo(18,62);c.quadraticCurveTo(18,50,18,38);c.closePath();c.fill();
  // Cuerpo con volumen
  var bg=c.createRadialGradient(0,20,5,0,20,25);
  bg.addColorStop(0,'#eebb00');bg.addColorStop(1,'#bb8800');
  c.fillStyle=bg;c.beginPath();c.ellipse(0,22,26,20,0,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(255,220,100,0.3)';c.beginPath();c.ellipse(0,25,14,12,0,0,Math.PI*2);c.fill();
  // Cabeza
  var hg=c.createRadialGradient(-2,-12,3,-2,-12,20);
  hg.addColorStop(0,'#ffcc00');hg.addColorStop(1,'#cc9500');
  c.fillStyle=hg;c.beginPath();c.arc(0,-12,20,0,Math.PI*2);c.fill();
  // Hocico
  c.fillStyle='#ffdd55';c.beginPath();c.ellipse(0,-4,11,8,0,0,Math.PI*2);c.fill();
  c.fillStyle='#332200';c.beginPath();c.ellipse(0,-8,4,3,0,0,Math.PI*2);c.fill();
  // Orejas
  c.fillStyle='#cc9500';
  c.beginPath();c.ellipse(-15,-28,6,13,-0.3,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(15,-28,6,13,0.3,0,Math.PI*2);c.fill();
  // Ojos perturbadores
  c.fillStyle='#111';c.beginPath();c.ellipse(-8,-16,7,6.5,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(8,-16,7,6.5,0,0,Math.PI*2);c.fill();
  c.fillStyle='#ffee00';c.shadowColor='#ffee00';c.shadowBlur=10;
  c.beginPath();c.arc(-8,-16,3.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(8,-16,3.5,0,Math.PI*2);c.fill();c.shadowBlur=0;
  c.fillStyle='#000';c.beginPath();c.arc(-8,-16,1.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(8,-16,1.5,0,Math.PI*2);c.fill();
  // Sonrisa enorme con dientes
  c.fillStyle='#1a0000';c.beginPath();c.arc(0,-2,13,0.05,Math.PI-0.05);c.closePath();c.fill();
  c.fillStyle='#fff';for(var i=-5;i<=5;i++)c.fillRect(-11+(i+5)*2.1,-2,2,i%2===0?4:3);
  c.fillStyle='#cc3333';c.beginPath();c.ellipse(0,4,5,3,0,0,Math.PI*2);c.fill();
  // Cola retorcida
  c.strokeStyle='#cc9500';c.lineWidth=5;c.lineCap='round';
  c.beginPath();c.moveTo(-26,22);c.bezierCurveTo(-35,10,-38,-5,-32,-15);c.stroke();
  c.lineCap='butt';
  // Manchas corrupción
  c.fillStyle='rgba(80,40,0,0.3)';c.beginPath();c.arc(12,25,7,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(-10,30,5,0,Math.PI*2);c.fill();
}

function dChicle(c){
  c.fillStyle='rgba(0,0,0,0.4)';c.beginPath();c.ellipse(0,85,18,5,0,0,Math.PI*2);c.fill();
  // Cuerpo derretido con gradiente
  var bg=c.createLinearGradient(0,-25,0,80);
  bg.addColorStop(0,'#ee44aa');bg.addColorStop(0.5,'#cc2288');bg.addColorStop(1,'#881155');
  c.fillStyle=bg;
  c.beginPath();c.moveTo(-20,80);c.quadraticCurveTo(-22,40,-18,10);
  c.quadraticCurveTo(-10,-20,0,-25);c.quadraticCurveTo(10,-20,18,10);
  c.quadraticCurveTo(22,40,20,80);c.closePath();c.fill();
  // Burbujas de chicle
  c.fillStyle='rgba(255,100,200,0.2)';
  c.beginPath();c.arc(-8,20,6,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(6,40,5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(-4,55,4,0,Math.PI*2);c.fill();
  // Goteo realista
  c.fillStyle='#aa2266';
  for(var i=-2;i<=2;i++){
    c.beginPath();c.ellipse(i*8,82+Math.abs(i)*4,3,8+Math.abs(i)*3,0,0,Math.PI*2);c.fill();
  }
  // Corona con joyas
  c.fillStyle='#ffd700';
  c.beginPath();c.moveTo(-13,-28);c.lineTo(-11,-44);c.lineTo(-6,-33);c.lineTo(0,-48);
  c.lineTo(6,-33);c.lineTo(11,-44);c.lineTo(13,-28);c.closePath();c.fill();
  c.fillStyle='rgba(150,100,0,0.3)';c.fillRect(-13,-28,26,4);
  c.fillStyle='#ff0088';c.shadowColor='#ff0088';c.shadowBlur=8;
  c.beginPath();c.arc(0,-35,4,0,Math.PI*2);c.fill();c.shadowBlur=0;
  c.fillStyle='#00ffcc';c.beginPath();c.arc(-7,-33,2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(7,-33,2,0,Math.PI*2);c.fill();
  // Cara rosada
  var fg=c.createRadialGradient(0,-8,3,0,-8,14);
  fg.addColorStop(0,'#ffddee');fg.addColorStop(1,'#ffbbcc');
  c.fillStyle=fg;c.beginPath();c.arc(0,-8,14,0,Math.PI*2);c.fill();
  // Ojos asimétricos
  c.fillStyle='#fff';c.beginPath();c.ellipse(-5,-11,5.5,5,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(5,-9,4.5,4,0.2,0,Math.PI*2);c.fill();
  c.fillStyle='#220033';c.beginPath();c.arc(-5,-11,3.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(5,-9,3,0,Math.PI*2);c.fill();
  c.fillStyle='#ff00ff';c.shadowColor='#ff00ff';c.shadowBlur=8;
  c.beginPath();c.arc(-5,-11,2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(5,-9,1.5,0,Math.PI*2);c.fill();c.shadowBlur=0;
  // Boca derretida
  c.strokeStyle='#660033';c.lineWidth=2;
  c.beginPath();c.moveTo(-8,1);c.bezierCurveTo(-4,8,4,6,8,0);c.stroke();
  c.fillStyle='#cc2288';c.beginPath();c.ellipse(0,6,3,5,0,0,Math.PI*2);c.fill();
}

function dRey(c){
  c.fillStyle='rgba(0,0,0,0.4)';c.beginPath();c.ellipse(0,90,20,6,0,0,Math.PI*2);c.fill();
  // Túnica con gradiente
  var tg=c.createLinearGradient(0,15,0,90);
  tg.addColorStop(0,'#1a4080');tg.addColorStop(1,'#0a2050');
  c.fillStyle=tg;
  c.beginPath();c.moveTo(-18,18);c.lineTo(-26,88);c.lineTo(26,88);c.lineTo(18,18);c.closePath();c.fill();
  // Pliegues
  c.strokeStyle='rgba(0,20,60,0.4)';c.lineWidth=1;
  c.beginPath();c.moveTo(-10,20);c.quadraticCurveTo(-12,50,-15,85);c.stroke();
  c.beginPath();c.moveTo(8,22);c.quadraticCurveTo(10,50,12,85);c.stroke();
  // Cuerpo
  var bg=c.createRadialGradient(0,8,5,0,8,20);
  bg.addColorStop(0,'#5599dd');bg.addColorStop(1,'#3377bb');
  c.fillStyle=bg;c.beginPath();c.ellipse(0,8,17,21,0,0,Math.PI*2);c.fill();
  // Cabeza
  var hg=c.createRadialGradient(-2,-20,3,-2,-20,18);
  hg.addColorStop(0,'#77aadd');hg.addColorStop(1,'#5588bb');
  c.fillStyle=hg;c.beginPath();c.arc(0,-20,17,0,Math.PI*2);c.fill();
  // Corona
  c.fillStyle='#ffd700';
  c.beginPath();c.moveTo(-12,-35);c.lineTo(-10,-50);c.lineTo(-5,-40);c.lineTo(0,-54);
  c.lineTo(5,-40);c.lineTo(10,-50);c.lineTo(12,-35);c.closePath();c.fill();
  c.fillStyle='#ff0000';c.shadowColor='#ff0000';c.shadowBlur=8;
  c.beginPath();c.arc(0,-42,4,0,Math.PI*2);c.fill();c.shadowBlur=0;
  c.fillStyle='#00aaff';c.beginPath();c.arc(-6,-38,2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(6,-38,2,0,Math.PI*2);c.fill();
  // Nariz larga
  c.fillStyle='#6699cc';
  c.beginPath();c.moveTo(0,-18);c.quadraticCurveTo(-5,-5,-4,2);c.lineTo(4,2);c.quadraticCurveTo(5,-5,0,-18);c.closePath();c.fill();
  // Ojos desquiciados
  c.fillStyle='#fff';c.beginPath();c.ellipse(-7,-23,5,5.5,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(7,-23,5,5.5,0,0,Math.PI*2);c.fill();
  c.fillStyle='#00ccff';c.shadowColor='#00ccff';c.shadowBlur=10;
  c.beginPath();c.arc(-7,-23,2.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(7,-23,2.5,0,Math.PI*2);c.fill();c.shadowBlur=0;
  c.fillStyle='#003';c.beginPath();c.arc(-7,-23,1,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(7,-23,1,0,Math.PI*2);c.fill();
  // Barba larga
  c.fillStyle='#ddeeff';
  c.beginPath();c.moveTo(-11,-10);c.quadraticCurveTo(-9,10,-6,30);
  c.quadraticCurveTo(-3,35,0,32);c.quadraticCurveTo(3,35,6,30);
  c.quadraticCurveTo(9,10,11,-10);c.closePath();c.fill();
  c.strokeStyle='rgba(180,200,220,0.4)';c.lineWidth=0.7;
  c.beginPath();c.moveTo(-5,-5);c.lineTo(-4,25);c.stroke();
  c.beginPath();c.moveTo(0,-3);c.lineTo(0,28);c.stroke();
  c.beginPath();c.moveTo(5,-5);c.lineTo(4,25);c.stroke();
  // Manos
  c.fillStyle='#5599dd';c.beginPath();c.arc(-22,30,8,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(22,30,8,0,Math.PI*2);c.fill();
  // Bola de hielo con brillo
  var ig=c.createRadialGradient(22,20,2,22,20,14);
  ig.addColorStop(0,'rgba(200,240,255,0.8)');ig.addColorStop(0.5,'rgba(100,200,255,0.5)');ig.addColorStop(1,'rgba(50,150,255,0.2)');
  c.fillStyle=ig;c.beginPath();c.arc(22,20,13,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(150,230,255,0.6)';c.lineWidth=1.5;
  c.beginPath();c.arc(22,20,13,0,Math.PI*2);c.stroke();
  c.strokeStyle='rgba(200,240,255,0.4)';c.lineWidth=0.5;
  c.beginPath();c.moveTo(18,15);c.lineTo(22,22);c.lineTo(26,17);c.stroke();
}
