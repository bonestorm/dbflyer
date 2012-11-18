
$(function(){

var _namespace = namespace("DBFlyer");
    
// Add the db_info class
_namespace.db_info = function(globs) {

  var _globs = globs;

  var OBJ = {
    databases: [],
    tables: [],
    fields: [],
    joins: []
  };

  OBJ.set_databases = function(databases){
    OBJ.databases = databases.slice();
  }

  OBJ.set_database_tables = function(database,tables){
    if($.inArray(database,OBJ.databases) != -1){
      if(tables === undefined){//if tables is null then delete existing one
        delete OBJ.tables[database];
      } else {
        OBJ.tables[database] = tables;//a list of table objects
      }
    } else {
      alert("no database " + database + " in database info");
    }
  }

  OBJ.set_table_fields = function(database,table,fields){
    if($.inArray(database,OBJ.databases) != -1){
      if(OBJ.tables[database] !== undefined){
        if(OBJ.tables[database][table] !== undefined){
          if(OBJ.fields[database] === undefined){OBJ.fields[database] = [];}//autovivification
          if(OBJ.fields[database][table] === undefined){OBJ.fields[database][table] = [];}//autovivification
          if(fields === undefined){//if fields is null then delete existing one
            delete OBJ.fields[database][table];
          } else {
            OBJ.fields[database][table] = fields;//a list of field objects
          }
        } else {
          alert("no table " + table + " in database " + database);
        }
      } else {
        alert("no tables in database " + database);
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

  // return the object
  return OBJ;
  
};


});

