// ========== PERSONAJES ULTRA REALISTAS ==========
function drawBot(c,id,x,y,s,alpha){
  c.save();c.translate(x,y);c.scale(s,s);c.globalAlpha=alpha||1;
  switch(id){
    case'finn':dFinn(c);break;case'jake':dJake(c);break;
    case'chicle':dChicle(c);break;case'rey':dRey(c);break;
  }
  c.restore();
}

function dFinn(c){
  // Sombra proyectada
  c.fillStyle='rgba(0,0,0,0.5)';
  c.beginPath();c.ellipse(0,95,22,7,0,0,Math.PI*2);c.fill();
  
  // === PIERNAS con musculatura ===
  var lg=c.createLinearGradient(-12,58,12,58);
  lg.addColorStop(0,'#d4c8b8');lg.addColorStop(0.5,'#efe0d0');lg.addColorStop(1,'#d4c8b8');
  c.fillStyle=lg;
  // Pierna izq
  c.beginPath();c.moveTo(-12,58);c.quadraticCurveTo(-13,70,-12,82);
  c.quadraticCurveTo(-11,88,-6,90);c.lineTo(-2,90);c.lineTo(-2,58);c.closePath();c.fill();
  // Pierna der
  c.beginPath();c.moveTo(2,58);c.quadraticCurveTo(3,70,2,82);
  c.quadraticCurveTo(3,88,6,90);c.lineTo(12,90);c.lineTo(12,58);c.closePath();c.fill();
  
  // Zapatos detallados
  c.fillStyle='#0a0a0a';
  c.beginPath();c.moveTo(-14,87);c.quadraticCurveTo(-15,93,-8,94);
  c.lineTo(0,94);c.lineTo(0,87);c.closePath();c.fill();
  c.beginPath();c.moveTo(2,87);c.quadraticCurveTo(1,93,8,94);
  c.lineTo(14,94);c.lineTo(14,87);c.closePath();c.fill();
  // Suela
  c.fillStyle='#1a1a1a';c.fillRect(-14,93,14,2);c.fillRect(2,93,12,2);
  
  // === SHORTS con textura ===
  var sg=c.createLinearGradient(-15,46,15,46);
  sg.addColorStop(0,'#145530');sg.addColorStop(0.5,'#1a7040');sg.addColorStop(1,'#145530');
  c.fillStyle=sg;
  c.beginPath();c.moveTo(-15,46);c.lineTo(-15,62);c.lineTo(-2,62);c.lineTo(-2,46);c.closePath();c.fill();
  c.beginPath();c.moveTo(2,46);c.lineTo(2,62);c.lineTo(15,62);c.lineTo(15,46);c.closePath();c.fill();
  // Cinturón
  c.fillStyle='#0a2a15';c.fillRect(-15,46,30,4);
  
  // === CUERPO - camiseta con pliegues ===
  var bg=c.createLinearGradient(-18,5,18,5);
  bg.addColorStop(0,'#0a3060');bg.addColorStop(0.3,'#1a5a9a');bg.addColorStop(0.7,'#1a5a9a');bg.addColorStop(1,'#0a3060');
  c.fillStyle=bg;
  c.beginPath();c.moveTo(-16,6);c.quadraticCurveTo(-17,25,-16,48);
  c.lineTo(16,48);c.quadraticCurveTo(17,25,16,6);c.quadraticCurveTo(0,2,-16,6);c.closePath();c.fill();
  // Pliegues de tela
  c.strokeStyle='rgba(0,20,50,0.3)';c.lineWidth=0.8;
  c.beginPath();c.moveTo(-8,15);c.quadraticCurveTo(-6,30,-9,45);c.stroke();
  c.beginPath();c.moveTo(6,12);c.quadraticCurveTo(8,28,5,45);c.stroke();
  c.beginPath();c.moveTo(0,8);c.quadraticCurveTo(-1,25,1,44);c.stroke();
  // Cuello
  c.fillStyle='#efe0d0';c.beginPath();c.ellipse(0,5,5,4,0,0,Math.PI*2);c.fill();
  
  // === BRAZOS con articulaciones ===
  c.fillStyle='#e8d8c5';
  c.beginPath();c.moveTo(-17,8);c.quadraticCurveTo(-26,20,-24,38);
  c.quadraticCurveTo(-23,42,-20,42);c.lineTo(-18,42);c.quadraticCurveTo(-17,20,-15,8);c.closePath();c.fill();
  c.beginPath();c.moveTo(17,8);c.quadraticCurveTo(26,20,24,38);
  c.quadraticCurveTo(23,42,20,42);c.lineTo(18,42);c.quadraticCurveTo(17,20,15,8);c.closePath();c.fill();
  // Manos
  c.fillStyle='#e0d0b8';
  c.beginPath();c.arc(-21,44,5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(21,44,5,0,Math.PI*2);c.fill();
  
  // === GORRO con textura de tela ===
  var hg=c.createRadialGradient(0,-18,3,0,-18,24);
  hg.addColorStop(0,'#ffffff');hg.addColorStop(0.7,'#f0f0f0');hg.addColorStop(1,'#d8d8d8');
  c.fillStyle=hg;c.beginPath();c.arc(0,-18,23,0,Math.PI*2);c.fill();
  // Costura del gorro
  c.strokeStyle='rgba(180,180,180,0.4)';c.lineWidth=0.5;
  c.beginPath();c.arc(0,-18,23,0.3,Math.PI-0.3);c.stroke();
  // Orejas del gorro
  c.fillStyle='#f8f8f8';
  c.beginPath();c.ellipse(-16,-36,10,12,-0.2,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(16,-36,10,12,0.2,0,Math.PI*2);c.fill();
  // Interior orejas
  c.fillStyle='#e8e8e8';
  c.beginPath();c.ellipse(-16,-36,6,8,-0.2,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(16,-36,6,8,0.2,0,Math.PI*2);c.fill();
  
  // === CARA con piel realista ===
  var fg=c.createRadialGradient(-1,-12,2,-1,-12,15);
  fg.addColorStop(0,'#ffe8c8');fg.addColorStop(0.6,'#f5d8a8');fg.addColorStop(1,'#e0c090');
  c.fillStyle=fg;c.beginPath();c.arc(0,-12,15,0,Math.PI*2);c.fill();
  // Mejillas
  c.fillStyle='rgba(200,100,80,0.1)';
  c.beginPath();c.arc(-8,-8,5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(8,-8,5,0,Math.PI*2);c.fill();
  
  // === OJOS CORRUPTOS con detalle ===
  // Cuencas oscuras
  c.fillStyle='rgba(30,0,0,0.3)';
  c.beginPath();c.ellipse(-6,-14,7,6,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(6,-14,7,6,0,0,Math.PI*2);c.fill();
  // Esclerótica oscura
  c.fillStyle='#1a0000';
  c.beginPath();c.ellipse(-6,-14,5.5,5,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(6,-14,5.5,5,0,0,Math.PI*2);c.fill();
  // Iris rojo con gradiente
  var ig=c.createRadialGradient(-6,-14,1,-6,-14,4);
  ig.addColorStop(0,'#ff2200');ig.addColorStop(1,'#880000');
  c.fillStyle=ig;c.shadowColor='#ff0000';c.shadowBlur=18;
  c.beginPath();c.arc(-6,-14,3.8,0,Math.PI*2);c.fill();
  ig=c.createRadialGradient(6,-14,1,6,-14,4);
  ig.addColorStop(0,'#ff2200');ig.addColorStop(1,'#880000');
  c.fillStyle=ig;
  c.beginPath();c.arc(6,-14,3.8,0,Math.PI*2);c.fill();
  c.shadowBlur=0;
  // Pupilas
  c.fillStyle='#000';
  c.beginPath();c.arc(-6,-14,1.8,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(6,-14,1.8,0,Math.PI*2);c.fill();
  // Brillos
  c.fillStyle='rgba(255,180,180,0.7)';
  c.beginPath();c.arc(-5,-15,1.2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(7,-15,1.2,0,Math.PI*2);c.fill();
  
  // === BOCA siniestra ===
  c.fillStyle='#1a0000';
  c.beginPath();c.arc(0,-4,8,0.1,Math.PI-0.1);c.closePath();c.fill();
  // Dientes
  c.fillStyle='#ddd';
  for(var i=-3;i<=3;i++){c.fillRect(-7+i*2.2,-4,1.8,3);}
  // Encías
  c.fillStyle='#4a0000';c.fillRect(-7,-4,14,1.5);
  
  // === ESPADA CORRUPTA detallada ===
  // Hoja con gradiente
  var sw=c.createLinearGradient(22,-18,27,-18);
  sw.addColorStop(0,'#3a0060');sw.addColorStop(0.5,'#6a10aa');sw.addColorStop(1,'#3a0060');
  c.fillStyle=sw;
  c.beginPath();c.moveTo(24,-18);c.lineTo(22,40);c.lineTo(24,44);c.lineTo(26,40);c.lineTo(28,-18);c.closePath();c.fill();
  // Filo brillante
  c.strokeStyle='rgba(180,100,255,0.4)';c.lineWidth=0.5;
  c.beginPath();c.moveTo(23,-18);c.lineTo(23,42);c.stroke();
  // Empuñadura
  c.fillStyle='#ffd700';c.fillRect(19,-20,12,5);
  c.fillStyle='#aa8800';c.fillRect(19,-22,12,3);
  // Gema en empuñadura
  c.fillStyle='#ff0066';c.beginPath();c.arc(25,-19,2.5,0,Math.PI*2);c.fill();
  // Mango
  c.fillStyle='#2a1a00';c.fillRect(23,-28,4,10);
  
  // === CORRUPCIÓN - venas pulsantes ===
  c.strokeStyle='rgba(120,0,200,0.6)';c.lineWidth=1.2;
  c.beginPath();c.moveTo(-10,8);c.bezierCurveTo(-12,18,-14,28,-16,45);c.stroke();
  c.beginPath();c.moveTo(10,8);c.bezierCurveTo(12,20,14,32,16,48);c.stroke();
  c.beginPath();c.moveTo(-3,10);c.bezierCurveTo(-5,22,-2,34,-6,48);c.stroke();
  c.beginPath();c.moveTo(3,12);c.bezierCurveTo(5,24,2,36,5,50);c.stroke();
  // Grietas en la cara
  c.strokeStyle='rgba(80,0,120,0.4)';c.lineWidth=0.8;
  c.beginPath();c.moveTo(-2,-5);c.lineTo(-4,2);c.lineTo(-3,8);c.stroke();
  c.beginPath();c.moveTo(8,-10);c.lineTo(10,-5);c.stroke();
}

function dJake(c){
  c.fillStyle='rgba(0,0,0,0.5)';c.beginPath();c.ellipse(0,70,26,7,0,0,Math.PI*2);c.fill();
  // Patas con articulaciones y pelo
  var pg=c.createLinearGradient(0,38,0,65);
  pg.addColorStop(0,'#ddaa00');pg.addColorStop(1,'#aa7700');
  c.fillStyle=pg;
  c.beginPath();c.moveTo(-20,36);c.quadraticCurveTo(-22,50,-20,64);c.lineTo(-14,64);c.quadraticCurveTo(-14,50,-14,36);c.closePath();c.fill();
  c.beginPath();c.moveTo(-7,36);c.quadraticCurveTo(-9,48,-7,60);c.lineTo(-1,60);c.quadraticCurveTo(-1,48,-1,36);c.closePath();c.fill();
  c.beginPath();c.moveTo(3,36);c.quadraticCurveTo(1,48,3,62);c.lineTo(9,62);c.quadraticCurveTo(9,48,9,36);c.closePath();c.fill();
  c.beginPath();c.moveTo(14,36);c.quadraticCurveTo(12,50,14,64);c.lineTo(20,64);c.quadraticCurveTo(20,50,20,36);c.closePath();c.fill();
  // Garras
  c.fillStyle='#554400';
  for(var i=-2;i<=2;i++){c.beginPath();c.ellipse(-17+i*1.5,66,1.5,2,0,0,Math.PI*2);c.fill();}
  for(var i=-2;i<=2;i++){c.beginPath();c.ellipse(17+i*1.5,66,1.5,2,0,0,Math.PI*2);c.fill();}
  
  // Cuerpo con pelaje
  var bg=c.createRadialGradient(0,18,5,0,18,28);
  bg.addColorStop(0,'#ffcc00');bg.addColorStop(0.7,'#ddaa00');bg.addColorStop(1,'#aa8000');
  c.fillStyle=bg;c.beginPath();c.ellipse(0,20,28,22,0,0,Math.PI*2);c.fill();
  // Textura de pelo
  c.strokeStyle='rgba(150,100,0,0.2)';c.lineWidth=0.5;
  for(var i=0;i<12;i++){
    var a=i*Math.PI/6;
    c.beginPath();c.moveTo(Math.cos(a)*15,18+Math.sin(a)*12);
    c.lineTo(Math.cos(a)*25,18+Math.sin(a)*20);c.stroke();
  }
  // Panza
  c.fillStyle='rgba(255,230,120,0.3)';c.beginPath();c.ellipse(0,24,16,14,0,0,Math.PI*2);c.fill();
  
  // Cabeza
  var hg=c.createRadialGradient(-1,-14,3,-1,-14,22);
  hg.addColorStop(0,'#ffdd22');hg.addColorStop(0.7,'#ddaa00');hg.addColorStop(1,'#bb8800');
  c.fillStyle=hg;c.beginPath();c.arc(0,-14,22,0,Math.PI*2);c.fill();
  // Hocico con volumen
  var mg=c.createRadialGradient(0,-5,2,0,-5,12);
  mg.addColorStop(0,'#ffee66');mg.addColorStop(1,'#ddbb33');
  c.fillStyle=mg;c.beginPath();c.ellipse(0,-5,12,9,0,0,Math.PI*2);c.fill();
  // Nariz
  c.fillStyle='#221100';c.beginPath();c.ellipse(0,-10,5,3.5,0,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(60,30,0,0.5)';c.beginPath();c.ellipse(0,-10,4,2.5,0,0,Math.PI*2);c.fill();
  // Brillo nariz
  c.fillStyle='rgba(255,255,255,0.2)';c.beginPath();c.arc(-1,-11,1.5,0,Math.PI*2);c.fill();
  
  // Orejas con interior
  c.fillStyle='#cc9500';
  c.beginPath();c.ellipse(-16,-32,7,14,-0.3,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(16,-32,7,14,0.3,0,Math.PI*2);c.fill();
  c.fillStyle='#aa7700';
  c.beginPath();c.ellipse(-16,-32,4,9,-0.3,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(16,-32,4,9,0.3,0,Math.PI*2);c.fill();
  
  // Ojos perturbadores con detalle
  c.fillStyle='#080800';
  c.beginPath();c.ellipse(-9,-18,8,7.5,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(9,-18,8,7.5,0,0,Math.PI*2);c.fill();
  var eg=c.createRadialGradient(-9,-18,1,-9,-18,4);
  eg.addColorStop(0,'#ffff44');eg.addColorStop(1,'#ccaa00');
  c.fillStyle=eg;c.shadowColor='#ffff00';c.shadowBlur=12;
  c.beginPath();c.arc(-9,-18,4,0,Math.PI*2);c.fill();
  eg=c.createRadialGradient(9,-18,1,9,-18,4);
  eg.addColorStop(0,'#ffff44');eg.addColorStop(1,'#ccaa00');
  c.fillStyle=eg;c.beginPath();c.arc(9,-18,4,0,Math.PI*2);c.fill();
  c.shadowBlur=0;
  c.fillStyle='#000';c.beginPath();c.arc(-9,-18,2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(9,-18,2,0,Math.PI*2);c.fill();
  
  // Sonrisa enorme con dientes y encías
  c.fillStyle='#1a0000';c.beginPath();c.arc(0,-3,14,0.05,Math.PI-0.05);c.closePath();c.fill();
  c.fillStyle='#4a0000';c.fillRect(-13,-3,26,2); // encía superior
  c.fillStyle='#eee';
  for(var i=-5;i<=5;i++){var th=i%2===0?5:4;c.fillRect(-12+(i+5)*2.3,-1,2,th);}
  c.fillStyle='#cc2222';c.beginPath();c.ellipse(0,5,6,4,0,0,Math.PI*2);c.fill();
  // Saliva
  c.fillStyle='rgba(200,200,255,0.2)';c.beginPath();c.ellipse(3,8,2,3,0.3,0,Math.PI*2);c.fill();
  
  // Cola retorcida con pelo
  c.strokeStyle='#cc9500';c.lineWidth=6;c.lineCap='round';
  c.beginPath();c.moveTo(-28,20);c.bezierCurveTo(-38,8,-40,-8,-34,-18);c.stroke();
  c.strokeStyle='#aa7700';c.lineWidth=3;
  c.beginPath();c.moveTo(-34,-18);c.quadraticCurveTo(-30,-22,-32,-28);c.stroke();
  c.lineCap='butt';
}

function dChicle(c){
  c.fillStyle='rgba(0,0,0,0.5)';c.beginPath();c.ellipse(0,88,20,6,0,0,Math.PI*2);c.fill();
  // Cuerpo derretido con múltiples capas
  var bg=c.createLinearGradient(0,-28,0,85);
  bg.addColorStop(0,'#ff55bb');bg.addColorStop(0.3,'#dd3399');bg.addColorStop(0.7,'#aa1166');bg.addColorStop(1,'#771144');
  c.fillStyle=bg;
  c.beginPath();c.moveTo(-22,82);c.bezierCurveTo(-24,50,-20,20,-15,0);
  c.quadraticCurveTo(-8,-25,0,-28);c.quadraticCurveTo(8,-25,15,0);
  c.bezierCurveTo(20,20,24,50,22,82);c.closePath();c.fill();
  // Textura orgánica
  c.fillStyle='rgba(255,120,200,0.15)';
  c.beginPath();c.arc(-8,15,8,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(6,35,7,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(-5,55,6,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(8,65,5,0,Math.PI*2);c.fill();
  // Goteo realista con gravedad
  c.fillStyle='#992255';
  for(var i=-3;i<=3;i++){
    var len=8+Math.abs(i)*5+Math.abs(i*i)*1.5;
    c.beginPath();c.moveTo(i*6-2,80);c.quadraticCurveTo(i*6-1,80+len*0.7,i*6,80+len);
    c.quadraticCurveTo(i*6+1,80+len*0.7,i*6+2,80);c.closePath();c.fill();
  }
  // Corona detallada con desgaste
  c.fillStyle='#eec800';
  c.beginPath();c.moveTo(-14,-30);c.lineTo(-12,-48);c.lineTo(-7,-36);c.lineTo(-2,-50);
  c.lineTo(2,-36);c.lineTo(7,-48);c.lineTo(12,-36);c.lineTo(14,-30);c.closePath();c.fill();
  // Sombra en corona
  c.fillStyle='rgba(100,80,0,0.3)';c.fillRect(-14,-30,28,5);
  // Joyas
  c.fillStyle='#ff0088';c.shadowColor='#ff0088';c.shadowBlur=6;
  c.beginPath();c.arc(0,-38,4,0,Math.PI*2);c.fill();c.shadowBlur=0;
  c.fillStyle='#00eebb';c.beginPath();c.arc(-8,-35,2.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(8,-35,2.5,0,Math.PI*2);c.fill();
  c.fillStyle='#aaaaff';c.beginPath();c.arc(-4,-44,2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(4,-44,2,0,Math.PI*2);c.fill();
  
  // Cara con piel de chicle
  var fg=c.createRadialGradient(0,-10,3,0,-10,16);
  fg.addColorStop(0,'#ffddee');fg.addColorStop(0.5,'#ffccdd');fg.addColorStop(1,'#eebbcc');
  c.fillStyle=fg;c.beginPath();c.arc(0,-10,15,0,Math.PI*2);c.fill();
  // Derretimiento facial
  c.fillStyle='rgba(200,50,120,0.15)';
  c.beginPath();c.ellipse(8,-5,6,8,0.3,0,Math.PI*2);c.fill();
  
  // Ojos asimétricos detallados
  c.fillStyle='#fff';c.beginPath();c.ellipse(-6,-13,6,5.5,0,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(6,-10,5,4.5,0.2,0,Math.PI*2);c.fill();
  // Iris
  var ig=c.createRadialGradient(-6,-13,1,-6,-13,3.5);
  ig.addColorStop(0,'#ff44ff');ig.addColorStop(1,'#880088');
  c.fillStyle=ig;c.shadowColor='#ff00ff';c.shadowBlur=10;
  c.beginPath();c.arc(-6,-13,3.5,0,Math.PI*2);c.fill();
  ig=c.createRadialGradient(6,-10,1,6,-10,3);
  ig.addColorStop(0,'#ff44ff');ig.addColorStop(1,'#880088');
  c.fillStyle=ig;c.beginPath();c.arc(6,-10,3,0,Math.PI*2);c.fill();
  c.shadowBlur=0;
  c.fillStyle='#110011';c.beginPath();c.arc(-6,-13,1.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(6,-10,1.2,0,Math.PI*2);c.fill();
  // Brillos
  c.fillStyle='rgba(255,255,255,0.5)';c.beginPath();c.arc(-5,-14,1,0,Math.PI*2);c.fill();
  
  // Boca derretida con detalle
  c.fillStyle='#660033';
  c.beginPath();c.moveTo(-9,0);c.bezierCurveTo(-5,8,5,6,9,-1);c.lineTo(9,2);
  c.bezierCurveTo(5,10,-5,12,-9,4);c.closePath();c.fill();
  // Goteo de boca
  c.fillStyle='#cc2288';
  c.beginPath();c.ellipse(-2,8,3,6,0.1,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(4,10,2,4,-0.1,0,Math.PI*2);c.fill();
}

function dRey(c){
  c.fillStyle='rgba(0,0,0,0.5)';c.beginPath();c.ellipse(0,92,22,7,0,0,Math.PI*2);c.fill();
  // Túnica con gradiente y pliegues
  var tg=c.createLinearGradient(-26,15,-26,90);
  tg.addColorStop(0,'#1a4590');tg.addColorStop(0.5,'#0f3070');tg.addColorStop(1,'#081a40');
  c.fillStyle=tg;
  c.beginPath();c.moveTo(-20,16);c.bezierCurveTo(-22,40,-24,65,-28,90);
  c.lineTo(28,90);c.bezierCurveTo(24,65,22,40,20,16);c.closePath();c.fill();
  // Pliegues de túnica
  c.strokeStyle='rgba(0,15,50,0.4)';c.lineWidth=1;
  c.beginPath();c.moveTo(-12,20);c.bezierCurveTo(-14,45,-16,65,-18,88);c.stroke();
  c.beginPath();c.moveTo(0,22);c.bezierCurveTo(-1,50,1,70,0,88);c.stroke();
  c.beginPath();c.moveTo(10,20);c.bezierCurveTo(12,45,14,65,16,88);c.stroke();
  // Borde dorado
  c.strokeStyle='rgba(200,150,0,0.3)';c.lineWidth=1.5;
  c.beginPath();c.moveTo(-28,88);c.lineTo(28,88);c.stroke();
  
  // Cuerpo
  var bg=c.createRadialGradient(0,6,4,0,6,22);
  bg.addColorStop(0,'#66aadd');bg.addColorStop(1,'#3377aa');
  c.fillStyle=bg;c.beginPath();c.ellipse(0,6,18,22,0,0,Math.PI*2);c.fill();
  
  // Cabeza azul con volumen
  var hg=c.createRadialGradient(-2,-22,3,-2,-22,19);
  hg.addColorStop(0,'#88bbee');hg.addColorStop(0.7,'#6699cc');hg.addColorStop(1,'#4477aa');
  c.fillStyle=hg;c.beginPath();c.arc(0,-22,18,0,Math.PI*2);c.fill();
  
  // Corona ultra detallada
  c.fillStyle='#ffd700';
  c.beginPath();c.moveTo(-13,-38);c.lineTo(-11,-54);c.lineTo(-6,-43);c.lineTo(-2,-56);
  c.lineTo(2,-43);c.lineTo(6,-54);c.lineTo(11,-43);c.lineTo(13,-38);c.closePath();c.fill();
  c.fillStyle='rgba(180,130,0,0.4)';c.fillRect(-13,-38,26,4);
  // Gema roja central
  c.fillStyle='#ff0000';c.shadowColor='#ff0000';c.shadowBlur=10;
  c.beginPath();c.arc(0,-46,4.5,0,Math.PI*2);c.fill();c.shadowBlur=0;
  // Gemas azules
  c.fillStyle='#00aaff';c.beginPath();c.arc(-7,-41,2.5,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(7,-41,2.5,0,Math.PI*2);c.fill();
  
  // Nariz larga con volumen
  c.fillStyle='#6699cc';
  c.beginPath();c.moveTo(0,-20);c.bezierCurveTo(-3,-12,-5,-4,-4,2);
  c.lineTo(4,2);c.bezierCurveTo(5,-4,3,-12,0,-20);c.closePath();c.fill();
  c.fillStyle='rgba(100,160,210,0.3)';
  c.beginPath();c.moveTo(1,-18);c.lineTo(2,-8);c.lineTo(3,0);c.lineTo(1,0);c.closePath();c.fill();
  
  // Ojos desquiciados
  c.fillStyle='#fff';c.beginPath();c.ellipse(-7,-25,5.5,6,-0.1,0,Math.PI*2);c.fill();
  c.beginPath();c.ellipse(7,-25,5.5,6,0.1,0,Math.PI*2);c.fill();
  var eg=c.createRadialGradient(-7,-25,1,-7,-25,3);
  eg.addColorStop(0,'#44eeff');eg.addColorStop(1,'#0088aa');
  c.fillStyle=eg;c.shadowColor='#00ccff';c.shadowBlur=12;
  c.beginPath();c.arc(-7,-25,3,0,Math.PI*2);c.fill();
  eg=c.createRadialGradient(7,-25,1,7,-25,3);
  eg.addColorStop(0,'#44eeff');eg.addColorStop(1,'#0088aa');
  c.fillStyle=eg;c.beginPath();c.arc(7,-25,3,0,Math.PI*2);c.fill();
  c.shadowBlur=0;
  c.fillStyle='#002';c.beginPath();c.arc(-7,-25,1.2,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(7,-25,1.2,0,Math.PI*2);c.fill();
  c.fillStyle='rgba(200,240,255,0.5)';c.beginPath();c.arc(-6,-26,1,0,Math.PI*2);c.fill();
  
  // Barba larga con mechones
  c.fillStyle='#ddeeff';
  c.beginPath();c.moveTo(-12,-12);c.bezierCurveTo(-10,5,-8,20,-6,35);
  c.quadraticCurveTo(-3,38,0,36);c.quadraticCurveTo(3,38,6,35);
  c.bezierCurveTo(8,20,10,5,12,-12);c.closePath();c.fill();
  c.strokeStyle='rgba(170,190,210,0.3)';c.lineWidth=0.6;
  for(var i=-3;i<=3;i++){c.beginPath();c.moveTo(i*2,-8);c.lineTo(i*1.8,30);c.stroke();}
  
  // Manos con dedos
  c.fillStyle='#5599dd';
  c.beginPath();c.arc(-24,32,9,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(24,32,9,0,Math.PI*2);c.fill();
  c.fillStyle='#4488cc';
  for(var i=0;i<4;i++){c.beginPath();c.ellipse(24+Math.cos(i*0.6-0.6)*11,32+Math.sin(i*0.6-0.6)*11,3,2.5,i*0.3,0,Math.PI*2);c.fill();}
  
  // Bola de hielo ultra detallada
  var ig2=c.createRadialGradient(24,22,2,24,22,16);
  ig2.addColorStop(0,'rgba(220,250,255,0.9)');ig2.addColorStop(0.3,'rgba(150,220,255,0.6)');
  ig2.addColorStop(0.7,'rgba(80,180,255,0.4)');ig2.addColorStop(1,'rgba(30,100,200,0.2)');
  c.fillStyle=ig2;c.beginPath();c.arc(24,22,15,0,Math.PI*2);c.fill();
  c.strokeStyle='rgba(150,230,255,0.5)';c.lineWidth=1.5;c.beginPath();c.arc(24,22,15,0,Math.PI*2);c.stroke();
  // Cristales internos
  c.strokeStyle='rgba(200,240,255,0.4)';c.lineWidth=0.8;
  c.beginPath();c.moveTo(18,16);c.lineTo(24,24);c.lineTo(30,18);c.stroke();
  c.beginPath();c.moveTo(20,26);c.lineTo(26,22);c.lineTo(28,28);c.stroke();
  // Brillo
  c.fillStyle='rgba(255,255,255,0.4)';c.beginPath();c.arc(20,17,3,0,Math.PI*2);c.fill();
  
  // Escarcha alrededor
  c.strokeStyle='rgba(100,200,255,0.15)';c.lineWidth=1;
  c.beginPath();c.arc(0,20,48,0,Math.PI*2);c.stroke();
}
