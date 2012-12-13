$(function(){

var _namespace = namespace("DBFlyer");

// Add the DB_Interface class
_namespace.db_interface = function(globs) {
  
  var _globs = globs; 

  var ajax_load = $("<div style='margin:350px auto;width: 32px;'><img src='img/load.gif' alt='loading...' /></div>");

  var OBJ = {

    ajax_load: ajax_load,
    call_stack: [],

    db_interface_script: "db_interface.php",
    databases: [],
    objects: [],
    fields: [],
    joins: []
  };

  OBJ.set_databases = function(databases){
    OBJ.databases = databases.slice();
  }

  OBJ.set_database_objects = function(database,objects){
    if($.inArray(database,OBJ.databases) != -1){
      if(objects === undefined){//if object is null then delete existing one
        delete OBJ.objects[database];
      } else {
        OBJ.objects[database] = objects;//a list of objects
      }
    } else {
      alert("no database " + database + " in database info");
    }
  }

  OBJ.set_table_fields = function(database,table,fields){
    if($.inArray(database,OBJ.databases) != -1){
      if(OBJ.fields === undefined){OBJ.fields = [];}
      if(OBJ.fields[database] === undefined){OBJ.fields[database] = [];}
      if(OBJ.fields[database][table] === undefined){OBJ.fields[database][table] = [];}//autovivification
      if(fields === undefined){//if fields is null then delete existing one
        delete OBJ.fields[database][table];
      } else {
        OBJ.fields[database][table] = fields;//a list of field objects
      }
    } else {
      alert("no database " + database + " in database info");
    }
  }

  OBJ.set_database_joins = function(database,joins){
    if($.inArray(database,OBJ.databases) != -1){
      if(joins === undefined){//if tables is null then delete existing one
        delete OBJ.joins[database];
      } else {
        OBJ.joins[database] = tables;//a list of join objects
      }
    } else {
      alert("no database " + database + " in database info");
    }
  }

  OBJ.call = function(callback,data){

    function ajax_call(){
      $.ajax({
        url: OBJ.db_interface_script,
        async: true,
        dataType: 'json',
        data: OBJ.call_stack[0].data,
        success: function(json) {

          var o = OBJ.objects[_globs.slist.picked_database];
		  var d = OBJ.call_stack[0].data;
		  
          if(d.mode == "save_object"){
            if(d.name !== undefined){
              o.table_ids[d.name] = json.id;
            }
            if(o.grid_info[json.id] === undefined){o.grid_info[json.id] = {};}
            for(var i in json){
              if(i == "leads"){
                o.grid_info[json.id][i] = eval(json[i]);
              } else {
                o.grid_info[json.id][i] = json[i];
              }
            }
          }
          if(d.mode == "delete_object"){
            if(o.grid_info[d.id] !== undefined){
              var gi = o.grid_info[d.id];
              if(gi.type.match(/TABLE/i) && o.table_ids[gi.name] !== undefined){
                o.table_ids[gi.name] = -1;
              }
              delete o.grid_info[d.id];
            }
          }

          if(OBJ.call_stack[0].callback !== undefined){OBJ.call_stack[0].callback(json);}

          OBJ.call_stack.shift();//remove this call

          if(OBJ.call_stack.length == 0){
            OBJ.ajax_load.remove();
          } else {
            ajax_call();
          }

        }
      });
    }
    
    OBJ.call_stack.push({callback:callback,data:data});

    if(OBJ.call_stack.length == 1){//start up the chain
      $("#text_overlay").append(OBJ.ajax_load);//notify that it's processing
      ajax_call();//rev up the chain
    }

  }


  OBJ.load = function(callback){

    function db_info_loaded(objects){
      OBJ.set_database_objects(_globs.slist.picked_database,objects);//add it to db_info

      //reset the grid
      _globs.grid.reset();

      //load all the objects
      var obj_added = false;
      for(var id in objects.grid_info){
        var obj = objects.grid_info[id];
        var new_obj;
        if(obj.type == "TABLE"){
          //makes its own width even though it is provided. should i allow it to be set here?
          new_obj = new _namespace.table(_globs,{cx:parseInt(obj.x),cy:parseInt(obj.y),db_id: id,name: obj.name});
        }
        if(obj.type == "JOIN"){
          new_obj = new _namespace.join(_globs,{cx:parseInt(obj.x),cy:parseInt(obj.y),db_id: id,
            leads: eval(obj.leads),
            lead_start: eval(obj.lead_start),
            table_from_id: obj.table_from_id,
            field_from: obj.field_from,
            table_to_id: obj.table_to_id,
            field_to: obj.field_to
          });
        }
        if(obj.type == "COMMENT"){
        }
        if(new_obj.error != undefined && new_obj.error){
          alert("Error creating a new object in the grid:" + new_obj.error);
        } else {
          _globs.grid.add_obj(new_obj);
          obj_added = true;
        }
      }

      if(obj_added){
        _globs.refresh();
      }

      if(callback !== undefined){callback();}
    }

    OBJ.call(db_info_loaded,{mode: "database_data", database: _globs.slist.picked_database});//load in all the objects for this database              

  }

  OBJ.load_table_fields = function(tables,callback){
    function db_info_loaded(objects){
      for(var table_name in objects){
          OBJ.set_table_fields(_globs.slist.picked_database,table_name,objects[table_name]);
      }
      if(callback !== undefined){callback();}
    }

    OBJ.call(db_info_loaded,{mode: "table_data", database: _globs.slist.picked_database, tables: tables});
  }

  return OBJ;
}

});