
$(function(){

var _namespace = namespace("DBFlyer");

// Add the Slist class
_namespace.slist = function(globs) {

  var _globs = globs;

  var _mx,_my;//mouse position
  var _hitx,_hity;//where mouse is in relation to slist
  
  var OBJ = {
    mouse_downed: false,//set to true after a section has a mousedown event right on it.  make false after the mouseup
    hit_section: -1,//set to section that is picked
    padding: 6,
    selected: false
  };

  OBJ.resize = function(){

    var slist_height = 36;
    var grid_width = _globs.cell_size*(_globs.win_quads_wide*4);
    var slist_width = grid_width-_globs.border*2;

    OBJ.x = Math.floor((grid_width-slist_width)/2);
    OBJ.y = -(slist_height+20);
    OBJ.width = slist_width;
    OBJ.height = slist_height;
    OBJ.input_height = OBJ.height-OBJ.padding*2;

    if(OBJ.tab_footprint !== undefined){
      OBJ.tab_footprint();
    }

  }

  OBJ.resize();

  //object for a single tab.  holds the sections,width,offset,speed
  function input_tab(order,name,title,sections) {
      this.order = order;
      this.name = name;//identifier in the code
      this.title = title;//what will be shown in the tab
      //this.x,this.tab_width -- set by the slit to place the tab at the top
      this.sections = [];//each input has a section
      this.set_to = function(sections){
        this.width = 0;//for convenience, it's the total widths of all sections
        this.offset = 0;//offset that inputs is from the center
        this.speed = 0;//left/right speed of inputs.  it's to add a bit of physics
        for(var i in sections){
          this.width += sections[i].width;
        }
        this.sections = sections;
      }
      this.add_section = function(section){
        this.sections.push(section);
        this.width += section.width;
      }

      if(sections !== undefined){
        this.set_to(sections);
      }

      //save the width of the title in this.title_width
      var ctx = _globs.context;
      ctx.font = "12px Verdana";
      var metrics = ctx.measureText(this.title);
      this.title_width = metrics.width;

  };

  OBJ.tabs = {
    db: new input_tab(1,"db","Database Listing"),
    tables: new input_tab(2,"tables","Tables"),
    table: new input_tab(4,"table","Table Info"),
    join: new input_tab(5,"join","Join Info"),
    comment: new input_tab(6,"comment","Comment Info")
  };
  OBJ.tabs_shown_sorted = [];
  OBJ.tab_titles = {};
  OBJ.tab_inner = 4;//space to left and right of tab text
  OBJ.tab_up = 5;//push the tab upward
  OBJ.tab_height = 12+2*2+OBJ.tab_up;//12 for font size, 2*2 for padding

  OBJ.frame = 0;//mostly for debugging to keep track of the number of times a redraw happens

  //OBJ.picked_database -- when a database is picked, this keeps the name of the database picked
  //OBJ.picked_table -- when a table is picked, this keeps the name of the table

  //OBJ.active_tab
  //  "db" -- starts as this so we can choose which database to load
  //  "tables" -- once a database is picked and loaded, we select a table to either place in the graph or add to a select
  //  "join" -- set the fields for the to and from tables that join
  //OBJ.last_tab -- last input type

  function _set_mouse_coord_vars(){
    _mx = _globs.input.x();
    _my = _globs.input.y();
    
    _hitx = _mx-OBJ.x;
    _hity = _my-OBJ.y-OBJ.padding;
  }

  //finds whether a section was hit, also finds which part of the section, also lets section respond to a hit
  function _hit_the_slist(event){

    if(OBJ.active_tab !== undefined){
      //what to do? what to do? what to do ?
      var tab = OBJ.tabs[OBJ.active_tab];
      var left_of_section = Math.round((OBJ.width-tab.width)/2+tab.offset);

      //look through all sections
      var tab = OBJ.tabs[OBJ.active_tab];
      for(var i in tab.sections){
        if(tab.sections[i].hit(event,_hitx-left_of_section,_hity)){
          OBJ.hit_section = i;
          return true;
        }
        left_of_section += tab.sections[i].width;
      }
    }

    //out of bounds (below,left,right). if it's out of bounds (above) then it still might be hitting a tab
    var no_hit = true;
    if(_hitx > OBJ.width || _hitx < 0 || _hity > OBJ.height){
    } else {
      if(_hity < -(OBJ.padding+OBJ.tab_height)){//can't even hit a tab
      } else {
        for(var i in OBJ.tabs){
          if(OBJ.tabs[i].x !== undefined){//might not be computed yet
            if(_hitx >= OBJ.tabs[i].x && _hitx < OBJ.tabs[i].x+OBJ.tabs[i].tab_width){
              OBJ.active_tab = i;
              no_hit = false;
              break;
            }
          }
        }
      }
    }
    if(no_hit){
      _hitx = -1;
      _hity = -1;
      return false;
    } else {
      return true;
    }
    
  }

  OBJ.tab_footprint = function(){

    //draw the cute little tabs at the top
    var tab_spacing = 4;//space between tabs
    var total_tab_width = 0;
    var num_tabs = 0;
    for(var i in OBJ.tabs){
      if(OBJ.tabs[i].sections.length > 0){//has to have some sections
        total_tab_width += OBJ.tabs[i].title_width+OBJ.tab_inner*2+tab_spacing;//8 for some breathing room
        num_tabs++;
      }
    }
    if(num_tabs > 0){total_tab_width -= tab_spacing;}//spacings = num_tabs-1

    var left_of_tab = Math.round((OBJ.width-total_tab_width)/2);

    var tab_ids = Object.keys(OBJ.tabs);

    OBJ.tabs_shown_sorted = [];

    for(var i in tab_ids.sort(function(a,b){return OBJ.tabs[a].order - OBJ.tabs[b].order})){
      var tab_id = tab_ids[i];
      if(OBJ.tabs[tab_id].sections.length > 0){//has to have some sections

        OBJ.tabs_shown_sorted.push(tab_id);

        var tab_width = OBJ.tabs[tab_id].title_width+OBJ.tab_inner*2;

        OBJ.tabs[tab_id].x = left_of_tab;
        OBJ.tabs[tab_id].tab_width = tab_width;

        left_of_tab += tab_width+tab_spacing;
      }
    }
  }

  OBJ.draw = function(){
  
    var ctx = _globs.context;

    //border
    ctx.strokeStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 1;
    roundRect(ctx, OBJ.x+0.5,OBJ.y+0.5, OBJ.width, OBJ.height, 4);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.fill();

    //show where the click was
    if(_hitx >= 0 && _hity >= 0){
      //title
      ctx.fillStyle = "#000000";
      ctx.font = "12px Verdana";
      ctx.textAlign = "center"
      ctx.textBaseline = "middle";
      ctx.fillText(_hitx+":"+_hity+" "+OBJ.frame,OBJ.x+Math.floor(OBJ.width/2)+0.5,OBJ.y+Math.floor(OBJ.height/2)+0.5);
    }


    //draw the actual tab at the top
    function draw_tab(i,active_tab){

      //tab border
      ctx.strokeStyle = "#000000";
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = (active_tab && OBJ.selected) ? 20 : 1;
      //if(i == OBJ.active_tab){ctx.lineWidth = 2;}else{ctx.lineWidth = 1;}

      roundTab(
        ctx,
        OBJ.x,OBJ.y-OBJ.tab_height,OBJ.width,OBJ.height+OBJ.tab_height,//x,y,width,height of total square surrounding window and tab
        OBJ.tabs[i].x,OBJ.tabs[i].tab_width,OBJ.tab_height,//offset to the right from the window that the tab is,width of tab,height of the tab
        4//rounded border radius
      );
      ctx.globalAlpha = 1.0;
      ctx.stroke();
      ctx.fill();

      //tab title
      ctx.fillStyle = "#000000";
      ctx.font = "12px Verdana";
      ctx.textAlign = "left"
      ctx.textBaseline = "bottom";
      ctx.fillText(OBJ.tabs[i].title,OBJ.x+OBJ.tabs[i].x+OBJ.tab_inner+0.5,OBJ.y-OBJ.tab_up+0.5);

    }

    for(var i in OBJ.tabs_shown_sorted){
      var tab_id = OBJ.tabs_shown_sorted[i];
      if(OBJ.tabs[tab_id].sections.length > 0){//has to have some sections
        if(tab_id != OBJ.active_tab){//active tab is saved for last so it will be drawn on top
          draw_tab(tab_id,false);
        }
      }
    }


    if(OBJ.active_tab !== undefined){

      //draw the actual active tab at the top so it be on top
      draw_tab(OBJ.active_tab,true);

      //draw the active tab's insides
      ctx.save();

      var tab = OBJ.tabs[OBJ.active_tab];
      var left_of_section = Math.round((OBJ.width-tab.width)/2+tab.offset);
      ctx.translate(OBJ.x+left_of_section,OBJ.y+OBJ.padding);

      //draw the sections
      for(var i in OBJ.tabs[OBJ.active_tab].sections){
        OBJ.tabs[OBJ.active_tab].sections[i].draw(ctx);
        ctx.translate(OBJ.tabs[OBJ.active_tab].sections[i].width,0);
      }

      ctx.restore();

    }

    OBJ.frame++;
    
  }
  
  OBJ.unfocus = function(){
    for(var i in OBJ.tabs){
      for(var j in OBJ.tabs[i].sections){
        var sec = OBJ.tabs[i].sections[j];
        if(sec.reset !== undefined){
          sec.reset();
        }
      }
    }
    OBJ.selected = false;
  }

  OBJ.start_input_type = function(type,tab_data) {

    var current_tab = OBJ.active_tab;

    //  "db" -- starts as this so we can choose which database to load
    if(type == "db"){

      function set_db_tab(dbs){
        if(dbs !== undefined){
          _globs.db_interface.set_databases(dbs);
        }
        if(_globs.db_interface["databases"].length > 0){
          OBJ.tabs["db"].set_to([//add an input for selecting the database to load
            new _namespace.input_title(_globs,{title: "Pick a database to load",height: OBJ.input_height,callback: function(){alert('hi');}}),
            new _namespace.input_dropdown(_globs,{
              title: "Pick database to load",show_title: true,
              data: _globs.db_interface["databases"],
              height: OBJ.input_height,
              callback: function(picked_database){
                if(picked_database != undefined){// > 0){
                  OBJ.picked_database = picked_database;
                  //after the db_interface loads, it changes the tab input to pick a table to place
                  _globs.db_interface.load(function(){OBJ.start_input_type("tables")});
                }
                _globs.refresh();
              }
            })
          ]);
        } else {
          OBJ.tabs["db"].set_to([//no databases found
            new _namespace.input_title(_globs,{title: "No databases found",height: OBJ.input_height,callback: function(){alert('hi');}})
          ]);
        }
        OBJ.tab_footprint();
        OBJ.active_tab = "db";
        _globs.refresh();
      }
 
      //load all the names of the databases if they haven't already been loaded
      if(_globs.db_interface["databases"].length == 0){
        _globs.db_interface.call(set_db_tab,{mode: "databases"});
      } else {
        set_db_tab();
      }

    }

    //  "tables" -- once a database is picked and loaded, we select a table to either place in the graph or add to a select
    if(type == "tables"){

      var tables = _globs.db_interface["objects"][OBJ.picked_database];

      //collect tables that haven't been placed
      var all_table_names = Object.keys(tables.table_ids);
      var table_names = [];
      for(var i in all_table_names){
        if(tables.table_ids[all_table_names[i]] < 0){//== -1 then it hasn't been placed
          table_names.push( all_table_names[i]);
        }
      }


      var tabs = [];
      if(table_names.length > 0){
        var all_placed = (OBJ.all_tables_placed !== undefined && OBJ.all_tables_placed);
        if(!all_placed && OBJ.active_tab == "tables"){
          OBJ.tabs["tables"].sections[1].set_data(table_names);//just update the options
        } else {
          tabs = [
            new _namespace.input_title(_globs,{title: "Pick a table:",height: OBJ.input_height,callback: function(){alert('hi');}}),
            new _namespace.input_dropdown(_globs,{
              data: table_names,
              height: OBJ.input_height,
              callback: function (picked_table){

                OBJ.picked_table = picked_table;
                var shift_down = 0;
                while(shift_down < 12*4){
                  var _new_table = new _namespace.table(_globs,{cx:_globs.grid.window.x*4,cy:_globs.grid.window.y*4+shift_down,name: picked_table});
                  if(_new_table.error == undefined || !_new_table.error){

                    //save on creation
                    _new_table.save_to_db(function(){OBJ.start_input_type("tables");_globs.refresh();});
                    _globs.grid.add_obj(_new_table);

                    _globs.refresh();

                    break;//success
                  }
                  shift_down++;
                }

                //now just sit there and show the table that was picked
                _globs.refresh();
              }
            })
          ];
          OBJ.all_tables_placed = false;
          OBJ.active_tab = "tables";
          OBJ.tabs["tables"].set_to(tabs);
          OBJ.tab_footprint();
        }
        OBJ.tabs["tables"].sections[1].reset();//no picked options yet

      } else {
        var tabs = [];
        tabs = [
          new _namespace.input_title(_globs,{title: "All tables placed",height: OBJ.input_height,callback: function(){alert('hi');}})
        ];
        OBJ.all_tables_placed = true;
        OBJ.active_tab = "tables";
        OBJ.tabs["tables"].set_to(tabs);
        OBJ.tab_footprint();
      }
      _globs.refresh();
    }

    if(type == "join"){
      var tabs = [];
      var fields = _globs.db_interface["fields"][OBJ.picked_database];
      var start_fields = fields[OBJ.tab_data.link.start];
      var start_fields = fields[OBJ.tab_data.link.end];
fields[_globs.db_interface["objects"][OBJ.picked_database];

      OBJ.tab_data = tab_data;//the join object
      tabs = [
        new _namespace.input_title(_globs,{title: "This is the shit:"+OBJ.tab_data.db_id,height: OBJ.input_height,callback: function(){alert('hi');}})
      ];
      OBJ.all_tables_placed = true;
      OBJ.active_tab = "join";
      OBJ.tabs["join"].set_to(tabs);
      OBJ.tab_footprint();
    }

    //keep track of the last active tab
    //current_tab is the tab active before starting the selected input type    
    if(current_tab != OBJ.active_tab){
      OBJ.last_tab = current_tab;
    }

  }

  OBJ.clear_input_type = function(clear_tab){
    var tab = (clear_tab === undefined) ? OBJ.input_tab : clear_tab;
    if(OBJ.active_tab !== undefined && OBJ.active_tab == tab){
      OBJ.tabs[tab].set_to([]);
      OBJ.tab_footprint();
      if(tab == OBJ.active_tab){
        if(OBJ.last_tab !== undefined){
          OBJ.active_tab = OBJ.last_tab;
          OBJ.last_tab = undefined;//we don't keep a history so unset it
        }
      }
    }
  }

  OBJ.start_input_type("db");//load the initial information

  //main handler of clicks
  //will send out click notifications to objects on the grid
  function mouseup_handler(was_click){

    if(OBJ.mouse_downed){
      _set_mouse_coord_vars();

      //notify 

      if(OBJ.active_tab !== undefined){
        var tab = OBJ.tabs[OBJ.active_tab];
        var left_of_section = Math.round((OBJ.width-tab.width)/2+tab.offset);

        //look through all sections
        var tab = OBJ.tabs[OBJ.active_tab];
        for(var i in tab.sections){
          if(i == OBJ.hit_section && tab.sections[i].hit("up",_hitx-left_of_section,_hity)){
            break;
          }
          left_of_section += tab.sections[i].width;
        }
//        tab.sections[OBJ.hit_section].toggled = false;
      }

      OBJ.mouse_downed = false;

      OBJ.selected = true;

      _globs.refresh();

      return true;//input consumed

    }
    return false;//return to to signal that it has consummed the input and it shouldn't be propegated

    
  }

  function mousewheel_handler(x,y,delta){

     _set_mouse_coord_vars();

    if(OBJ.active_tab !== undefined){

      var tab = OBJ.tabs[OBJ.active_tab];
      var left_of_section = Math.round((OBJ.width-tab.width)/2+tab.offset);

      //look through all sections
      var tab = OBJ.tabs[OBJ.active_tab];
      for(var i in tab.sections){
        if(i == OBJ.hit_section && tab.sections[i].wheel(_hitx-left_of_section,_hity,delta)){
          break;
        }
        left_of_section += tab.sections[i].width;
      }

      _globs.refresh();
      
    }
  }
  
  function mousedown_handler(){

    _set_mouse_coord_vars();

    var ctx = _globs.context;

    if(_hit_the_slist("down")){
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
  
  _globs.input.add_mousewheel_handler("DBFlyer.slist",2,mousewheel_handler);
  _globs.input.add_mouseup_handler("DBFlyer.slist",2,mouseup_handler);
  _globs.input.add_mousedown_handler("DBFlyer.slist",2,mousedown_handler);
  _globs.input.add_move_handler("DBFlyer.slist",2,move_handler);


  // return the object
  return OBJ;
  
};


});