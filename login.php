<?php
	$db_hostname = 'localhost';
	$db_database = 'DBFlyer';
	$db_username = 'root';
	$db_password = 'FrfCjg14';
	
	function mysql_fix_string($string)
	{
		if(get_magic_quotes_gpc()) $string = stripslashes($string);
		return mysql_real_escape_string($string);
	}
?>