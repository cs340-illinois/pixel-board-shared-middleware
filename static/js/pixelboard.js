var _settings = undefined;
var _canvas = undefined;
var _sio = undefined;

// Fetch the settings:
fetch("/settings")
.then((response) => response.json())
.then((settings) => {
  _settings = settings;
  initBoard();
})

// Initialize the canvas:
let initBoard = function() {
  _canvas = document.createElement("canvas");
  _canvas.height = _settings.height * 3;
  _canvas.width = _settings.width * 3;
  _canvas.id = "canvas"
  _canvas.getContext("2d").scale(3, 3);

  document.getElementById("pixelboard").appendChild(_canvas);

  // Load the current board edits onto this instance of the canvas:
  fetch("/pixels")
  .then((response) => response.json())
  .then((data) => {
    let ctx = _canvas.getContext("2d");
    let pixels = data.pixels;
    console.log(pixels);

    for (let y = 0; y < pixels.length; y++) {
      for (let x = 0; x < pixels[y].length; x++) {
        const paletteIndex = pixels[y][x];
        const color = _settings.palette[paletteIndex];

        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Future updates are via SocketIO
    _sio = io(`ws://${window.location.host}`) //Initialized WS client

    // Automatically updates pixel data upon receiving message from server
    _sio.on('pixel update', function(msg){
      const x = msg['col'];
      const y = msg['row'];
      const color_idx = msg['color'];

      const color = _settings.palette[color_idx];

      let ctx = _canvas.getContext("2d");
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    })

    // hoover 
    const canvas = document.getElementById('canvas')
    function getCursorPosition(canvas, event) {
      var elemLeft = canvas.offsetLeft + canvas.clientLeft;
      var elemTop = canvas.offsetTop + canvas.clientTop;
      x = parseInt((event.pageX - elemLeft) / 3);
      y = parseInt((event.pageY - elemTop) / 3);
      console.log("x: " + x + " y: " + y)
      return [x,y]
    }   
    canvas.addEventListener('mousemove', function(e) {
      e.preventDefault();
      var [x,y] = getCursorPosition(canvas, e);
      const hidden = document.getElementById('mouse_over');
      hidden.style.visibility = 'visible';
      var tmpx = e.clientX;
      var tmpy = e.clientY;
      hidden.style.position = "absolute";
      hidden.style.left = `${tmpx}px`;
      hidden.style.top = `${tmpy}px`;
      
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordX:x,coordY:y })
      };
      fetch('/getPixelAuthor', requestOptions)
      .then((response) => response.json())
      .then((data) => {
        console.log(data.PixelAuthor);
        hidden.innerHTML = data.PixelAuthor;
      })
    })
    canvas.addEventListener('mouseout', (event) => {
      const hidden = document.getElementById('mouse_over');
      function delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
      }
      delay(1000).then(() => {hidden.style.visibility = 'hidden';});
    });
  })
};

