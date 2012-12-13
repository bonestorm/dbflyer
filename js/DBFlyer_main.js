

/*

*/

var DBFlyer;

$(function(){

var _namespace = namespace("DBFlyer");

$.ajaxSetup ({  
  cache: false  
});  

var count = 0;

var context;
var canvas_obj = $('#canvasOne');
var overlay_obj = $('#text_overlay');

//once it's all loaded, create the main appliction object
window.addEventListener("load", eventWindowLoaded, false);
function eventWindowLoaded () {

  //this gets the whole application started
  DBFlyer = new _namespace.main();

  //to resize the canvas element when the browser window is resized
  $(window).resize(function() {DBFlyer.window_resize_start();});

}



function canvasSupport () {return Modernizr.canvas;}

_namespace.main = function () {

  if(!canvasSupport()) {return;}


  var OBJ = {shiftKey: false};
  OBJ.canvas_obj = canvas_obj;
  OBJ.overlay_obj = overlay_obj;
  var theCanvas = OBJ.canvas_obj.get(0);//("canvasOne");

  context = theCanvas.getContext("2d");
    
  var _cursor;
  
  OBJ.change_cursor = function(new_style){
    if(_cursor != new_style){
      $("#canvasOne")[0].style.cursor = new_style;
      _cursor = new_style;
    }
  }
  OBJ.change_cursor("auto");

  //log("Drawing Canvas",theCanvas,this);

  OBJ.resize = function(width,height){

    var new_dims = {width:0, height: 0};//this is passed back so the resize of the actual canvas element can be made

    var fluff_width = globs.border*2+globs.margin.x;
    var fluff_height = globs.border*2+globs.margin.y;

    var quad_size = globs.cell_size*4;

    var grid_width = width-fluff_width;
    var grid_height = height-fluff_height;
    var qwidth = Math.floor(grid_width/quad_size);
    var qheight = Math.floor(grid_height/quad_size);
    new_dims.width = qwidth*quad_size+fluff_width;
    new_dims.height = qheight*quad_size+fluff_height;
    globs.width = globs.cell_size*4*qwidth;
    globs.height = globs.cell_size*4*qheight;
    globs.win_quads_wide = qwidth;
    globs.win_quads_high = qheight;
    //the limits for the window position (min limit is 0)
    globs.over_wide = globs.quads_wide-globs.win_quads_wide;
    globs.over_high = globs.quads_high-globs.win_quads_high;

    if(globs.grid !== undefined){globs.grid.resize(qwidth,qheight);}
    if(globs.slist !== undefined){globs.slist.resize(new_dims.width);}
    if(globs.help !== undefined){globs.help.resize(new_dims.width);}
    if(globs.composer !== undefined){globs.composer.resize(new_dims.width);}

    return new_dims;

  }

  OBJ.resize_to_browser = function(){
    return OBJ.resize(window.innerWidth,window.innerHeight);
  }

  OBJ.window_resizing = false;

  function window_resize(){
    var new_dims = OBJ.resize_to_browser();
    canvas_obj.attr("width",new_dims.width+"px");
    canvas_obj.attr("height",new_dims.height+"px");
    overlay_obj.css("width",new_dims.width+"px");
    overlay_obj.css("height",new_dims.height+"px");
    OBJ.refresh();
    OBJ.window_resizing = false;
  }
  OBJ.window_resize_start = function(){
    if(!OBJ.window_resizing){
      OBJ.window_resizing = true;
      setTimeout(window_resize,1000);
    }
  }


  //application globals
  //passed to most objects
  var globs = {
//  background_color: "#f0F5FF",
    grid_background_color: "#ffFfFF",
    background_color: "#f0f5ff",
    rgba_background_color: "rgba(240,245,255",
    cell_size: 16,
    quads_wide: 16*4,quads_high: 12*4,//number of cells wide and high the whole grid is
    border: 50,//border width around the grid
    margin: {x:0,y:300},//top and left empty space
    context: context//2d canvas context
  };

  //to get initial dimensions needed for main object creation
  OBJ.resize_to_browser();

  //document should have the same background color as the canvas (maybe just make canvas transparent?)
  $("body").css("background-color",globs.background_color);

  //simple interface to the database
  var _db_interface = new _namespace.db_interface(globs);
  globs.db_interface = _db_interface;

  //to access the divs that are put on top of the canvas for purpose of displaying text.  many classes should access
  var _text_overlay = new _namespace.text_overlay(globs);
  globs.text_overlay = _text_overlay;
 
  var _input = new _namespace.input(globs);
  globs.input = _input;//most object in the application need access to the mouse
  
  var _menu = new _namespace.menu(globs);
  globs.menu = _menu;
  
  var _help = new _namespace.help(globs);
  globs.help = _help;


  var _slist = new _namespace.slist(globs);
  globs.slist = _slist;

  //composer is initialized after slist so composer can adjust its size based on the slist's size
  var _composer = new _namespace.composer(globs);
  globs.composer = _composer;


  var _grid = new _namespace.grid(globs);
  globs.grid = _grid;


  _menu.add_handler('new_join',_grid.new_join);//add the handler for making a new link

  
  function drawScreen() {
    
    globs.context.save();
    globs.context.setTransform(1,0,0,1,globs.border+globs.margin.x,globs.border+globs.margin.y);//simple translation
    
    globs.context.globalAlpha = 1.0;
    context.clearRect(
      -globs.border-globs.margin.x,-globs.border-globs.margin.y,
      globs.width+globs.border*2,globs.margin.y+globs.height+globs.border*2
    );
    
    _grid.draw();

    _composer.draw();

    _slist.draw();
    
    //if(_menu.display){
    //  _menu.draw();
    //}
    if(_help.active){
      _help.draw();
    }

    globs.context.restore();
    //log(count);
    count++
  }

  //other objects should be able to redraw the screen
  //could possibly add something so a call to refresh will start a timer and all refreshes for a bit will be ignored
  globs.refresh = drawScreen;
  OBJ.refresh = globs.refresh;


  //sets all the dimension variables, sizes the canvas element, and then redraws the screen
  window_resize();

  
  //main handles getting key pressed from the user
  //for high level functions
  function keydown_handler(e){
  
    OBJ.shiftKey = e.shiftKey;//keep the status of the shift key in main
    OBJ.ctrlKey = e.ctrlKey;
    OBJ.altKey = e.altKey;
    //log("keydown, shift:"+OBJ.shiftKey+" ctrl:"+OBJ.ctrlKey+" alt:"+OBJ.altKey);

    globs.grid.update_cursor();
    
    if(e.keyCode == 27){//escape, to unselect everything
      globs.grid.clear_selected();
      globs.refresh();
    }
    
    if(e.keyCode == 46){//delete, delete selected objects
      globs.grid.delete_selected();
      globs.refresh();
    }
    
    if(e.keyCode == 71){//'g' for toggle showing the grid
      globs.grid.show_grid = (globs.grid.show_grid ? false : true);
      globs.refresh();
      return;
    }
    
    if(e.keyCode == 72 || (e.shiftKey && e.keyCode == 191)){//'h' or '?'
      _help.start_help();
      return;
    }

    if(e.keyCode == 77){//'m' for map
      return;
    }
    //if(e.keyCode = 69){//'e' for excelsior
    if(e.keyCode == 81){//'q' for query
      return;
    }
    
  }
  
  function keyup_handler(e){
    OBJ.shiftKey = e.shiftKey;
    OBJ.ctrlKey = e.ctrlKey;
    OBJ.altKey = e.altKey;
    //log("keyup, shift:"+OBJ.shiftKey+" ctrl:"+OBJ.ctrlKey+" alt:"+OBJ.altKey);
    globs.grid.update_cursor();
  }
  
  //bind the keyboard handler
  $(document).bind("keydown.NAMESPACE",keydown_handler);
  $(document).bind("keyup.NAMESPACE",keyup_handler);

  //disable right click menu
  $(document).bind("contextmenu", function(e) {
    if(!globs.grid.is_out_of_bounds(e.pageX,e.pagetY)){
      e.preventDefault();
    }
  });

  //the main application object only allows a 'do' function to be called for high level functions
  OBJ.do = function(func){//the interface from the DBFlyer app to the outside world
    switch(func) {
      case "help":
        _help.start_help();
      break;
    }
  }
  
  //OBJ.canvas_obj.css('cursor','crosshair');
  //document.getElementById('canvasOne').style.cursor='crosshair';
  
  globs.main = OBJ;
  return OBJ;
  
};

});
