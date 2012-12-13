
$(function(){

var _namespace = namespace("DBFlyer");

// Add the Slist class
_namespace.composer = function(globs) {

  var _globs = globs;

  var _mx,_my;//mouse position
  var _hitx,_hity;//where mouse is in relation to composer
  
  var OBJ = {
    mouse_downed: false,//set to true after a section has a mousedown event right on it.  make false after the mouseup
    padding: 6,
    selected: false
  };

  OBJ.resize = function(){

    var slist = _globs.slist;
    var slist_box = _globs.slist.footprint();

    OBJ.x = 0;OBJ.y = 0;
    OBJ.width = _globs.cell_size*(_globs.win_quads_wide*4);
    OBJ.height = _globs.margin.y;

    OBJ.height -= 10-(slist_box.y+_globs.border);//make room for the slist

    //adjust because 0,0 is actually the top left of the grid and not top left of the canvas
    OBJ.y -= _globs.border+_globs.margin.y;

  }

  OBJ.resize();

  function _set_mouse_coord_vars(){
    _mx = _globs.input.x();
    _my = _globs.input.y();
    
    _hitx = _mx-OBJ.x;
    _hity = _my-OBJ.y;
  }

  //finds whether a section was hit, also finds which part of the section, also lets section respond to a hit
  function _hit_the_composer(event){

    if(_hitx < 0 || _hity < 0 || _hitx > OBJ.width || _hity > OBJ.height){
      _hitx = -1;
      _hity = -1;
      return false;
    } else {
      return true;
    }
    
  }


  OBJ.draw = function(){

    var ctx = _globs.context;

    //border
    ctx.strokeStyle = "#e0e0ff";
    ctx.fillStyle = "#f0f0f5";
    ctx.lineWidth = 1;
    roundRect(ctx, OBJ.x+0.5,OBJ.y+0.5, OBJ.width, OBJ.height, 10);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.fill();

/*
    //show where the click was
    if(_hitx >= 0 && _hity >= 0){
      //title
      ctx.fillStyle = "#000000";
      ctx.font = "12px Verdana";
      ctx.textAlign = "center"
      ctx.textBaseline = "middle";
      ctx.fillText(_hitx+":"+_hity+" "+OBJ.frame,OBJ.x+Math.floor(OBJ.width/2)+0.5,OBJ.y+Math.floor(OBJ.height/2)+0.5);
    }
*/

    OBJ.frame++;
    
  }
  
  OBJ.unfocus = function(){

    OBJ.selected = false;
  }


  //main handler of clicks
  //will send out click notifications to objects on the grid
  function mouseup_handler(was_click){

    if(OBJ.mouse_downed){
      _set_mouse_coord_vars();

      //notify 
      //notify 
      //notify 

      OBJ.mouse_downed = false;

      OBJ.selected = true;

      _globs.refresh();

      return true;//input consumed

    }
    return false;//return to to signal that it has consummed the input and it shouldn't be propagated

    
  }

  
  function mousedown_handler(){

    _set_mouse_coord_vars();

    var ctx = _globs.context;

    if(_hit_the_composer("down")){
      OBJ.mouse_downed = true;//if we've clicked on it then it's the focus
      _globs.refresh();

      return true;//input consumed

    }
    return false;//return to to signal that it has consummed the input and it shouldn't be propegated
    
  }
  
  function move_handler(x,y){
  
    if(OBJ.mouse_downed){
      _set_mouse_coord_vars();

      _globs.refresh();

      return true;//input consumed

    }
    return false;//return to to signal that it has consummed the input and it shouldn't be propegated
    
  }//end move handler
  
  _globs.input.add_mouseup_handler("DBFlyer.composer",2,mouseup_handler);
  _globs.input.add_mousedown_handler("DBFlyer.composer",2,mousedown_handler);
  _globs.input.add_move_handler("DBFlyer.composer",2,move_handler);


  // return the object
  return OBJ;
  
};


});