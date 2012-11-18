<?php

  //header("Content-type: application/json");

  require_once 'login.php';

  if(!isset($_GET['mode'])){
    echo "0,\"missing mode\"]";
    exit();
  }

  $mode = $_GET['mode'];

  $jarray = array();
  
  $mysqli = new mysqli($db_hostname, $db_username, $db_password);

  if(mysqli_connect_errno()) {
    echo "[0,\"Connect failed: %s" . mysqli_connect_error() . "\"]";
    exit();
  }

  //we almost always need the database we're targeting
  $mysqli->select_db($db_database) or trigger_error("Unable to select database: " . $db_database, E_USER_ERROR);

  if(isset($_GET['database'])){
    $database = $_GET['database'];
    $query = "select id from table_schema where name = '" . $database . "'";
    $result = $mysqli->query($query);
    if($result->num_rows > 0){
      $row = $result->fetch_row();
      $table_schema_id = $row[0];
    }
  }
  
  switch($mode){
  
    case 'databases':

      $query = "SHOW DATABASES";

      if ($result = $mysqli->query($query)) {

          /* fetch object array */
          while ($row = $result->fetch_row()) {
              $jarray[] = $row[0];
          }

          /* free result set */
          $result->close();
      }

    break;

    case 'database_data':

//error_log("database data in the house " . $_GET['database']);

      $table_ids = array();
      $grid_info = array();

      //get the list of tables that are in this database
      //get the field information for every table in this database
      $mysqli->select_db($database) or trigger_error("Unable to select database: " . $database, E_USER_ERROR);

      //get the tables that are actually in the database
      $query = "show tables";
      $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);

      if($result->num_rows > 0){
        while($row = $result->fetch_row()) {
          $table_ids[stripslashes($row[0])] = -1;//haven't found the id yet.  we just know that it can have one
        }
      }

      //get the grid information for this database
      //this includes the tables and the joins and the comments and everything else (who knows?)
      $mysqli->select_db($db_database) or trigger_error("Unable to select database: " . $db_database, E_USER_ERROR);


      //get id for the table_schema (database) if it hasn't been saved yet
      if(!isset($table_schema_id) || !is_numeric($table_schema_id)){
        $query = "SHOW TABLE STATUS where name = 'table_schema'";
        $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);
        if($result->num_rows > 0) {
          $row = $result->fetch_assoc();
          $table_schema_id = $row['Auto_increment'];
        }
        $query = "INSERT into table_schema (name) values ('" . $database . "')";
        $result = $mysqli->query($query) or trigger_error('Insert failed: ' . $mysqli->error, E_USER_ERROR);
      }

      $go_fields = "go.id,go.type,go.x,go.y,go.width,go.height";
  
      //get the grid joins
      $query = "
        select
          gj.leads,gj.lead_start,
          gj.table_from_id,gj.field_from_id,gj.table_to_id,gj.field_to_id,
        $go_fields
        from grid_join gj,grid_object go
        where go.id = gj.grid_object_id
        and go.table_schema_id = " . $table_schema_id;
      $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);
      if($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
          $grid_info[stripslashes($row['id'])] = $row;
        }
      }

      //get the grid tables
      $query = "select gt.name,$go_fields from grid_table gt,grid_object go where go.id = gt.grid_object_id and go.table_schema_id = " . $table_schema_id;
      $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);
      if($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
          $table_ids[$row['name']] = $row['id'];//set the real grid_object_id
          $grid_info[stripslashes($row['id'])] = $row;
        }
      }

      //get the grid comments
      $query = "select gc.comment,$go_fields from grid_comment gc,grid_object go where go.id = gc.grid_object_id and go.table_schema_id = " . $table_schema_id;
      $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);
      if($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
          $grid_info[stripslashes($row['id'])] = $row;
        }
      }

      $jarray = array("table_ids" => $table_ids,"grid_info" => $grid_info);

    break;

    case 'table_data':

      $table = $_GET["table"];

      //get the field names of the table
      $query = "SHOW COLUMNS FROM ".$table;

      $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);
      if($result->num_rows > 0) {
        while($row = $result->fetch_array()) {
          if(!array_key_exists($table,$jarray)){
            $jarray[$table] = array();
          }
          foreach(array('Field','Type','Null') as &$field){
            $jarray[$table][strtolower($field)] = stripslashes($row[$field]);
          }
        }
      }

    break;

    case 'delete_object':

      $jarray = [];
      $res = delete_object($_GET['id']);
      array_splice($jarray,count($jarray),0,$res);

    break;

    case 'save_object':

      $type = strtoupper($_GET['type']);

/*
      //a select to see if it already exists
      $query = "
        SELECT grid_object.id as grid_object_id from table_schema,grid_object,grid_table
        where table_schema.id = grid_object.table_schema_id
        and grid_object.id = grid_table.grid_object_id
        and grid_table.name = '$name'
      ";
      $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);
      if($result->num_rows > 0){
        //if it exists, get the id and delete it
        //it would be nice to do an update instead of a delete/insert every time but this is easier
        $row = $result->fetch_assoc();
        $grid_object_id = $row['grid_object_id'];

*/

      if(!isset($_GET['id'])){
        //get the auto increment for the id
        $query = "SHOW TABLE STATUS where name = 'grid_object'";
        $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);
        if($result->num_rows > 0) {
          $row = $result->fetch_assoc();
          $grid_object_id = $row['Auto_increment'];
        }
      } else {
        $grid_object_id = $_GET['id'];
        delete_object($grid_object_id);
      }

      $x = $_GET['x'];
      $y = $_GET['y'];
      $width = isset($_GET['width']) ? $_GET['width'] : 1;//width in cells
      if(isset($_GET['height'])){
        $height = $_GET['height'];
      } else {
        $height = 1;//for now all tables are a height of 1 cell
      }

      $query = "INSERT INTO grid_object (id,table_schema_id,type,x,y,width,height) values ($grid_object_id,$table_schema_id,'$type',$x,$y,$width,$height)";
      $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);

      if($type == "TABLE"){

        $name = $_GET['name'];

        $query = "INSERT INTO grid_table (grid_object_id,name) values ($grid_object_id,'$name')";
        $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);

        $jarray = array("id" => $grid_object_id,"type" => "table","name" => $name,"x" => $x,"y" => $y,"width" => $width,"height" => $height);
      }
      if($type == "JOIN"){

        $valid_join = true;
        $join_fields = array('table_from_id','field_from_id','table_to_id','field_to_id','leads','lead_start');
        foreach($join_fields as $field){
          if(!isset($_GET[$field])){
            if($field == "leads" || $field == "lead_start"){
              $valid_join = false;
              break;
            } else {
              $$field = "NULL";
            }
          } else {
            $$field = $_GET[$field];
          }
        }

        if($valid_join){
          $query = "INSERT INTO grid_join (grid_object_id,".implode(",",$join_fields).") values ($grid_object_id,$table_from_id,$field_from_id,$table_to_id,$field_to_id,'$leads','$lead_start')";
          $result = $mysqli->query($query) or trigger_error('Query ('.$query.') failed: ' . $mysqli->error, E_USER_ERROR);

          $jarray = array("id" => $grid_object_id,"type" => "join","x" => $x,"y" => $y);
        }
      }


    break;


  }
  
  $mysqli->close();

  //sleep(2);
  if(count($jarray) == 0){
    $jarray[] = 0;
  }

  echo json_encode($jarray);
  //error_log("encoded: " . json_encode($jarray));

  function delete_object($id){

    global $mysqli;//poops

    $res = [];

    //a select to see if it already exists
    $query = "
      SELECT grid_object.id as grid_object_id,grid_object.type
      from table_schema,grid_object
      where table_schema.id = grid_object.table_schema_id
      and grid_object.id = $id
    ";
    $sel_result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);
    if($sel_result->num_rows > 0){

      $jarray = array();

      while($row = $sel_result->fetch_assoc()) {

        $type = strtolower($row['type']);

        //if($type == "join"){
        //  $query = "DELETE from join_lead where grid_object_id = $row[grid_object_id]";
        //  $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);
        //}

        $query = "DELETE from grid_$type where grid_object_id = $row[grid_object_id]";
        $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);

        $query = "DELETE from grid_object where id = $row[grid_object_id]";
        $result = $mysqli->query($query) or trigger_error('Query failed: ' . $mysqli->error, E_USER_ERROR);

//      $msqli->affected_rows;
        array_push($res,$row['grid_object_id']);

      }

    }

    return $res;

  }

?>