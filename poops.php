<?php

require_once 'login.php';

$mysqli = new mysqli($db_hostname, $db_username, $db_password);

$a = 1;
$b = 2;

Sum();
echo $b;
$mysqli->close();

function Sum()
{
    global $mysqli;

      $query = "SHOW DATABASES";

      if ($result = $mysqli->query($query)) {

          /* fetch object array */
          while ($row = $result->fetch_row()) {
              $jarray[] = $row[0];
          }

          /* free result set */
          $result->close();
      }

} 

?>