var gameTurns = [];
var currentDisplayed = 0;
var turn = 0;
var socket = io.connect(window.location.hostname);
var c;
var ctx;

window.onload = function() {
  c=document.getElementById('game');
  ctx=c.getContext('2d');
}

socket.on('message', function(data) {
  if(data === 'new') {
    resetGame();
  }
});
socket.on('game', function(data) {
  console.log(data);
  gameTurns.push(data);
  $('#turns').append('<li turn='+turn+'>'+turn+'</li>');
  showTurn(data);
  $('li.selected').removeClass('selected');
  $('li[turn='+turn+']').addClass('selected');
  currentDisplayed = turn;
  turn++;
});
socket.on('bots', function(data) {
  $('#botlist1').html('');
  $('#botlist2').html('');
  data.forEach(function(bot) {
    $('#botlist1').append('<option value='+bot.index+'>'+bot.name+'</option>');
    $('#botlist2').append('<option value='+bot.index+'>'+bot.name+'</option>');
  });
});

$(document).on('click', 'li', function(e) {
  console.log('li clicked');
  var i = ~~$(this).attr('turn');
  showTurn(gameTurns[i]);
  currentDisplayed = i;
  $('li.selected').removeClass('selected');
  $('li[turn='+i+']').addClass('selected');
});
$(document).keydown(function(e) {
  if (e.keyCode === 37) {
    currentDisplayed--;
  }
  else if(e.keyCode === 39) {
    currentDisplayed++;
  }
  if(currentDisplayed < 0) currentDisplayed = 0;
  else if(currentDisplayed >= gameTurns.length && gameTurns.length) currentDisplayed = gameTurns.length-1;
  showTurn(gameTurns[currentDisplayed]);
  $('li.selected').removeClass('selected');
  $('li[turn='+currentDisplayed+']').addClass('selected');
});
$(document).on('click', '#newgame', function(e) {
  var bot1 = $('#botlist1').val() || 0;
  var bot2 = $('#botlist2').val() || 0;
  socket.emit('start', {bot1:bot1,bot2:bot2});
});
$(document).on('click', '#newbot', function(e) {
  var botUrl = $('#bot-url').val();
  $('#bot-url').val('');
  var botLang = $('#bot-lang').val();
  socket.emit('newbot', {url:botUrl, lang:botLang});
});

function resetGame() {
  gameTurns = [];
  currentDisplayed = 0;
  turn = 0;
  $('#turns li').remove();
  ctx.clearRect (0, 0, c.width, c.height);
}

function showTurn(state) {
  console.log(state.grid);
  ctx.clearRect (0, 0, c.width, c.height);
  ctx.strokeStyle = 'lightgrey';
  var coordWidth = c.width/state.cols;
  for(var i=1; i<state.cols; i++) {
    var x = i*coordWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, c.height);
    ctx.stroke();
  }

  var coordHeight = c.height/state.rows;
  for(var i=1; i<state.rows; i++) {
    var y = i*coordHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(c.width, y);
    ctx.stroke();
  }
  if(!state.p1.spawnDisabled) {
    var p1Spawn = indexToCoord(state, state.p1.spawn);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.rect(p1Spawn.x*coordWidth, p1Spawn.y*coordHeight, coordWidth, coordHeight);
    ctx.fill();
  }
  if(!state.p2.spawnDisabled) {
    var p2Spawn = indexToCoord(state, state.p2.spawn);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 255, 0.25)';
    ctx.rect(p2Spawn.x*coordWidth, p2Spawn.y*coordHeight, coordWidth, coordHeight);
    ctx.fill();
  }

  for(var i=0; i<state.grid.length; i++) {
    var gridId = state.grid[i];
    if(gridId !== '.') {
      var coord = indexToCoord(state, i);
      var x = coord.x*coordWidth + coordWidth/2;
      var y = coord.y*coordHeight + coordHeight/2;

      switch(gridId) {
        case 'a':
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.arc(x, y, coordWidth/2-2, 0, 2*Math.PI);
          ctx.fill();
          break;
        case 'b':
          ctx.fillStyle = 'blue';
          ctx.beginPath();
          ctx.arc(x, y, coordWidth/2-2, 0, 2*Math.PI);
          ctx.fill();
          break;
        case '*':
          ctx.fillStyle = 'brown';
          ctx.beginPath();
          ctx.arc(x, y, coordWidth/4, 0, 2*Math.PI);
          ctx.fill();
          break;
        case 'x':
          ctx.fillStyle = 'grey';
          ctx.beginPath();
          ctx.arc(x, y, coordWidth/2-2, 0, 2*Math.PI);
          ctx.fill();
          ctx.strokeStyle = 'black';
          ctx.beginPath();
          ctx.moveTo(x-coordWidth/4, y-coordWidth/4);
          ctx.lineTo(x+coordWidth/4, y+coordWidth/4);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x-coordWidth/4, y+coordWidth/4);
          ctx.lineTo(x+coordWidth/4, y-coordWidth/4);
          ctx.stroke();
          break;
        default:
          console.log(gridId);
      }
    }
  }
}

function indexToCoord(state, index) {
  var x = index%state.cols;
  var y = ~~(index/state.cols);
  return {x:x, y:y};
}