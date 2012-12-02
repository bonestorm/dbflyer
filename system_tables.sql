

CREATE DATABASE IF NOT EXISTS `DBFlyer`
  DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
USE DBFlyer;

--tables for showing tables and relations in a graph (grid)
--tables for showing tables and relations in a graph (grid)
--tables for showing tables and relations in a graph (grid)

CREATE TABLE IF NOT EXISTS table_schema (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(64), -- name of the database
  PRIMARY KEY(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grid_object (
  id INT NOT NULL AUTO_INCREMENT,
  table_schema_id INT NOT NULL,
  type enum('TABLE','JOIN','COMMENT') NOT NULL,
  x SMALLINT NOT NULL,y SMALLINT NOT NULL,
  width SMALLINT NOT NULL,height SMALLINT NOT NULL,
  PRIMARY KEY(id),
  FOREIGN KEY (table_schema_id) REFERENCES table_schema(id)
) ENGINE=InnoDB;

--for grid objects that are JOINs
CREATE TABLE IF NOT EXISTS grid_join (
  grid_object_id INT NOT NULL,
  leads TEXT,lead_start TEXT,
  table_from_id INT,field_from TEXT,
  table_to_id INT,field_to TEXT,
  FOREIGN KEY (grid_object_id) REFERENCES grid_object(id)
) ENGINE=InnoDB;

--for the leads on the grid join
-- ISN'T USED ANYMORE
CREATE TABLE IF NOT EXISTS join_lead (
  grid_object_id INT NOT NULL,
  side enum('LEFT','RIGHT') NOT NULL,
  num SMALLINT NOT NULL,
  x SMALLINT NOT NULL,y SMALLINT NOT NULL,
  PRIMARY KEY(grid_object_id,side,num),
  FOREIGN KEY (grid_object_id) REFERENCES grid_join(grid_object_id)
) ENGINE=InnoDB;


--for grid objects that are TABLEs
CREATE TABLE IF NOT EXISTS grid_table (
  grid_object_id INT NOT NULL AUTO_INCREMENT,
  name  VARCHAR(64),
  FOREIGN KEY (grid_object_id) REFERENCES grid_object(id)
) ENGINE=InnoDB;

--for grid objects that are COMMENTs
CREATE TABLE IF NOT EXISTS grid_comment (
  grid_object_id INT NOT NULL AUTO_INCREMENT,
  "comment"  TEXT,
  FOREIGN KEY (grid_object_id) REFERENCES grid_object(id)
) ENGINE=InnoDB;


--tables for composing a select query
--tables for composing a select query
--tables for composing a select query

--CREATE TABLE select_table (


--test data

insert into grid_object (id,table_schema,type,x,y,width,height) values (,,,,,,);

insert into grid_join (grid_object_id,table_from_id,field_from_id,table_to_id,field_to_id) values (,,,,);

insert into grid_table (grid_object_id,name) values (,);

insert into grid_comment (grid_object_id,comment

